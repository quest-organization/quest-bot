// QuestBot: A free and open-source Discord Bot.
// Copyright(C) 2026 Vantern
// SPDX-License-Identifier: AGPL-3.0-or-later

import { Prisma, prisma } from '@questbot/database';
import { type ShardInfo, shardOwns } from '#utils/sharding.js';

export function isValidDate(day: number, month: number): boolean {
	if (month < 1 || month > 12) return false;
	return day >= 1 && day <= new Date(Date.UTC(2024, month, 0)).getUTCDate();
}

export async function setBirthday(userId: string, day: number, month: number) {
	return prisma.birthday.upsert({
		where: { userId },
		create: { userId, day, month },
		update: { day, month },
	});
}

export async function removeBirthday(userId: string) {
	return prisma.birthday.deleteMany({ where: { userId } });
}

export async function getBirthday(userId: string) {
	return prisma.birthday.findUnique({ where: { userId } });
}

function isLeapYear(year: number): boolean {
	return new Date(Date.UTC(year, 1, 29)).getUTCMonth() === 1;
}

export async function getBirthdaysOn(day: number, month: number, shard?: ShardInfo) {
	// announce feb 29 birthdays on march 1st outside leap years
	const includeLeapDay = day === 1 && month === 3 && !isLeapYear(new Date().getUTCFullYear());

	return prisma.$queryRaw<Prisma.BirthdayModel[]>`
		SELECT * FROM "birthdays"
		WHERE (("day" = ${day} AND "month" = ${month}) OR (${includeLeapDay} AND "day" = 29 AND "month" = 2))
			AND ${shard ? shardOwns(Prisma.sql`"userId"::bigint`, shard) : Prisma.sql`TRUE`}
	`;
}

export async function getAnnouncingGuilds(shard: ShardInfo) {
	return prisma.$queryRaw<{ id: string; channelId: string }[]>`
		SELECT id, "settings"->>'birthdayChannelId' AS "channelId"
		FROM "server"
		WHERE "settings"->>'birthdayEnabled' = 'true'
			AND "settings"->>'birthdayChannelId' IS NOT NULL
			AND ${shardOwns(Prisma.sql`id::bigint`, shard)}
	`;
}
