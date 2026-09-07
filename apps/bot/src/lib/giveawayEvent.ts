// QuestBot: A free and open-source Discord Bot.
// Copyright(C) 2026 Vantern
// SPDX-License-Identifier: AGPL-3.0-or-later

import { Prisma, prisma } from '@questbot/database';
import type { Client } from 'discord.js';
import { getChannel } from '#utils/getChannel.js';
import { getShardInfo, type ShardInfo, shardOwns } from '#utils/sharding.js';
import { buildGiveawayEmbed, type FinishGiveawayResult, finishGiveaway } from './giveaways.js';
import { logger } from './logger.js';
import { createShardQueue } from './queue.js';

interface GiveawayJob {
	id: string;
}

let queue: ReturnType<typeof createShardQueue<GiveawayJob>> | undefined;

export function giveawayScheduler(client: Client): void {
	queue = createShardQueue<GiveawayJob>('giveaways', client, async (job) => {
		await endGiveaway(client, job.data.id);
	});

	reconcile(getShardInfo(client)).catch((err) => logger.error(err));
}

async function reconcile(shard: ShardInfo): Promise<void> {
	const pending = await prisma.$queryRaw<Prisma.GiveawayModel[]>`
		SELECT * FROM "giveaways"
		WHERE "ended" = false
			AND ${shardOwns(Prisma.sql`"guildId"::bigint`, shard)}
	`;

	for (const giveaway of pending) {
		await scheduleGiveawayEnd(giveaway);
	}
}

export async function scheduleGiveawayEnd(giveaway: { id: string; endsAt: Date }): Promise<void> {
	if (!queue) return;

	await unscheduleGiveawayEnd(giveaway.id);

	const delay = Math.max(0, giveaway.endsAt.getTime() - Date.now());
	await queue.add(
		'end',
		{ id: giveaway.id },
		{ jobId: giveaway.id, delay, removeOnComplete: true, removeOnFail: true },
	);
}

export async function unscheduleGiveawayEnd(giveawayId: string): Promise<void> {
	const job = await queue?.getJob(giveawayId);
	await job?.remove().catch(() => {});
}

export async function endGiveaway(client: Client, giveawayId: string): Promise<FinishGiveawayResult> {
	await unscheduleGiveawayEnd(giveawayId);

	const result = await finishGiveaway(giveawayId);
	if (result.status !== 'ended') return result;

	const ended = result.giveaway;
	const channel = await getChannel(client.channels, ended.channelId);

	if (channel?.isSendable()) {
		if (ended.messageId) {
			const message = await channel.messages.fetch(ended.messageId).catch(() => null);
			if (message) {
				await message.edit({ embeds: [buildGiveawayEmbed(ended)], components: [] }).catch(() => {});
			}
		}

		if (ended.winnerIds.length) {
			await channel
				.send({
					content: `Congratulations ${ended.winnerIds.map((id) => `<@${id}>`).join(', ')}! You've won **${ended.prize}**!`,
					allowedMentions: { users: ended.winnerIds },
					...(ended.messageId ? { reply: { messageReference: ended.messageId } } : {}),
				})
				.catch((err) => logger.error(err));
		} else {
			await channel
				.send({
					content: `The giveaway for **${ended.prize}** ended with no entries.`,
					allowedMentions: { parse: [] },
				})
				.catch((err) => logger.error(err));
		}
	}

	return result;
}
