// QuestBot: A free and open-source Discord Bot.
// Copyright(C) 2026 Vantern
// SPDX-License-Identifier: AGPL-3.0-or-later

import { Prisma } from '@questbot/database';
import type { Client } from 'discord.js';

export interface ShardInfo {
	shardId: number;
	totalShards: number;
}

export function getShardInfo(client: Client): ShardInfo {
	return {
		shardId: client.shard?.ids[0] ?? 0,
		totalShards: client.shard?.count ?? 1,
	};
}

// for the bot wide cleanup that only needs to happen once
export function isPrimaryShard(client: Client): boolean {
	return getShardInfo(client).shardId === 0;
}

export function shardOwns(snowflake: Prisma.Sql, { shardId, totalShards }: ShardInfo): Prisma.Sql {
	return Prisma.sql`(${snowflake} >> 22) % ${totalShards}::bigint = ${shardId}::bigint`;
}
