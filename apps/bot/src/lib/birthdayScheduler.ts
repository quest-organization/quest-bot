// QuestBot: A free and open-source Discord Bot.
// Copyright(C) 2026 Vantern
// SPDX-License-Identifier: AGPL-3.0-or-later

import type { Client, Guild } from 'discord.js';
import { getChannel } from '#utils/getChannel.js';
import { getShardInfo, type ShardInfo } from '#utils/sharding.js';
import { getAnnouncingGuilds, getBirthdaysOn } from './birthdays.js';
import { logger } from './logger.js';
import { createShardQueue } from './queue.js';

const MEMBER_FETCH_LIMIT = 100;

export function initBirthdayScheduler(client: Client): void {
	const queue = createShardQueue('birthdays', client, async () => {
		await announceBirthdays(client, getShardInfo(client));
	});

	queue
		.upsertJobScheduler('daily-birthdays', { pattern: '0 12 * * *', tz: 'UTC' }, { name: 'announce' }) // 12:00 pm utc daily
		.catch((err) => logger.error(err));
}

export async function announceBirthdays(client: Client, shard: ShardInfo): Promise<void> {
	const today = new Date();
	const day = today.getUTCDate();
	const month = today.getUTCMonth() + 1;

	await announceInGuilds(client, shard, day, month);
	await dmBirthdayPeople(client, shard, day, month);
}

async function announceInGuilds(client: Client, shard: ShardInfo, day: number, month: number): Promise<void> {
	const birthdays = await getBirthdaysOn(day, month);
	if (birthdays.length === 0) return;

	const userIds = birthdays.map((birthday) => birthday.userId);

	for (const { id, channelId } of await getAnnouncingGuilds(shard)) {
		const guild = client.guilds.cache.get(id);
		if (!guild) continue;

		const memberIds = await fetchMembers(guild, userIds);
		if (memberIds.length === 0) continue;

		const channel = await getChannel(guild.channels, channelId);
		if (!channel?.isSendable()) continue;

		for (const userId of memberIds) {
			await channel
				.send({
					content: `🎂 Happy birthday <@${userId}>!`,
					allowedMentions: { users: [userId] },
				})
				.catch((err) => logger.error(err));
		}
	}
}

async function fetchMembers(guild: Guild, userIds: string[]): Promise<string[]> {
	const found: string[] = [];

	for (let i = 0; i < userIds.length; i += MEMBER_FETCH_LIMIT) {
		const members = await guild.members.fetch({ user: userIds.slice(i, i + MEMBER_FETCH_LIMIT) }).catch(() => null);

		if (members) found.push(...members.keys());
	}

	return found;
}

async function dmBirthdayPeople(client: Client, shard: ShardInfo, day: number, month: number): Promise<void> {
	for (const birthday of await getBirthdaysOn(day, month, shard)) {
		const user = await client.users.fetch(birthday.userId).catch(() => null);

		await user?.send({ content: '🎂 Happy birthday! Hope you have a great day.' }).catch(() => {});
	}
}
