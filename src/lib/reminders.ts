import { prisma } from "./prisma.js";

export async function createReminder(
    userId: string,
    message: string,
    remindAt: Date,
    guildId?: string,
    guildName?: string,
    channelId?: string,
) {
    if (guildId && guildName) {
        return prisma.$transaction(async (tx) => {
            await tx.server.upsert({
                where: { id: guildId },
                create: { id: guildId, name: guildName },
                update: { name: guildName },
            });
            return tx.reminder.create({
                data: { guildId, userId, channelId, message, remindAt },
            });
        });
    }
    return prisma.reminder.create({
        data: { userId, channelId, message, remindAt },
    });
}

export async function getReminders(guildId: string, userId: string) {
    return prisma.reminder.findMany({
        where: { guildId, userId },
        orderBy: { remindAt: 'asc' },
    });
}

export async function removeReminder(reminderId: string) {
    return prisma.reminder.delete({ where: { id: reminderId } });
}

export async function clearReminders(guildId: string, userId: string) {
    return prisma.reminder.deleteMany({ where: { guildId, userId } });
}

export async function getReminder(reminderId: string) {
    return prisma.reminder.findUnique({ where: { id: reminderId } });
}

export async function getDueReminders() {
    return prisma.reminder.findMany({
        where: { remindAt: { lte: new Date() } },
    });
}
