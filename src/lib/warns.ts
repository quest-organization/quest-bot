import { prisma } from "./prisma.js";

export async function createWarn(
    guildId: string,
    userId: string,
    moderatorId: string,
    reason: string,
    expiresAt: Date | null = null,
) {
    return prisma.warn.create({
        data: { guildId, userId, moderatorId, reason, expiresAt },
    });
}

export async function getActiveWarns(guildId: string, userId: string) {
    return prisma.warn.findMany({
        where: {
            guildId,
            userId,
            OR: [
                { expiresAt: null },
                { expiresAt: { gt: new Date() } },
            ],
        },
        orderBy: { createdAt: 'desc' },
    });
}

export async function getAllWarns(guildId: string, userId: string) {
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
