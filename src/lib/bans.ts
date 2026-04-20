import { prisma } from "./prisma.js";
import { Guild, PermissionFlagsBits, Client } from 'discord.js';

export async function createBan(
    guildId: string,
    guildName: string,
    userId: string,
    expiresAt: Date | null,
    reason?: string,
) {
    return prisma.$transaction(async (tx) => {
        await tx.server.upsert({
            where: { id: guildId },
            create: { id: guildId, name: guildName },
            update: { name: guildName },
        });
        return tx.ban.upsert({
            where: { guildId_userId: { guildId, userId } },
            create: { guildId, userId, expiresAt, reason },
            update: { expiresAt, reason },
        });
    });
}

export async function clearBans(guildId: string, userId: string) {
    return prisma.ban.deleteMany({
        where: { guildId, userId },
    });
}

export async function getBan(guildId: string, userId: string) {
    return prisma.ban.findUnique({
        where: { guildId_userId: { guildId, userId } },
    });
}

export async function getBans() {
    return prisma.ban.findMany({
        where: {
            OR: [
                { expiresAt: null },
                { expiresAt: { gt: new Date() } },
            ],
        },
    });
}

export async function applyBan(guild: Guild, userId: string, reason?: string): Promise<boolean> {
    const me = guild.members.me;
    if (!me?.permissions.has(PermissionFlagsBits.BanMembers)) return false;

    try {
        await guild.bans.create(userId, { reason: reason ?? undefined });
        return true;
    } catch {
        return false;
    }
}

export async function removeBan(guild: Guild, userId: string): Promise<boolean> {
    const me = guild.members.me;
    if (!me?.permissions.has(PermissionFlagsBits.BanMembers)) return false;

    try {
        await guild.bans.remove(userId);
    } catch {}
    
    await clearBans(guild.id, userId);
    return true;
}

export async function enforceBan(guild: Guild, userId: string): Promise<boolean> {
    const ban = await getBan(guild.id, userId);
    if (!ban) return false;

    if (ban.expiresAt !== null && ban.expiresAt <= new Date()) {
        return removeBan(guild, userId);
    }

    return false;
}

export async function purgeExpiredBans(client: Client) {
    const expired = await prisma.ban.findMany({
        where: {
            expiresAt: { not: null, lte: new Date() },
        },
    });

    for (const ban of expired) {
        const guild = client.guilds.cache.get(ban.guildId);
        if (guild) {
            await removeBan(guild, ban.userId);
        } else {
            await prisma.ban.delete({ where: { id: ban.id } }).catch(() => {});
        }
    }
}
