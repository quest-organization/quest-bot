import { prisma } from "./prisma.js";

export async function createWarn(
    guildId: string,
    guildName: string,
    userId: string,
    moderatorId: string,
    reason: string,
    expiresAt: Date | null = null,
) {
    return prisma.$transaction(async (tx) => {
        await (tx as any).server.upsert({
            where: { id: guildId },
            create: { id: guildId, name: guildName },
            update: { name: guildName },
        });
        return (tx as any).warn.create({
            data: { guildId, userId, moderatorId, reason, expiresAt },
        });
    });
}

export async function getWarns(guildId: string, userId: string) {
    return prisma.warn.findMany({
        where: { guildId, userId },
        orderBy: { createdAt: 'desc' },
    });
}

export async function removeWarn(warnId: string) {
    return prisma.warn.delete({ where: { id: warnId } });
}

export async function clearWarns(guildId: string, userId: string) {
    return prisma.warn.deleteMany({ where: { guildId, userId } });
}

export async function getWarn(warnId: string, guildId: string) {
    const warn = await prisma.warn.findUnique({ where: { id: warnId } });
    if (!warn || warn.guildId !== guildId) return null;
    return warn;
}

export async function purgeExpiredWarns(gracePeriodDays = 30) {
    const cutoff = new Date(Date.now() - gracePeriodDays * 24 * 60 * 60 * 1000);
    return prisma.warn.deleteMany({
        where: {
            expiresAt: { not: null, lte: cutoff },
        },
    });
}
