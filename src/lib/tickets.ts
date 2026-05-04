import { prisma } from "./prisma.js";

export async function createTicket(
    guildId: string,
    guildName: string,
    userId: string,
    reason: string,
) {
    return prisma.$transaction(async (tx) => {
        await tx.server.upsert({
            where: { id: guildId },
            create: { id: guildId, name: guildName },
            update: { name: guildName },
        });

        const server = await tx.server.update({
            where: { id: guildId },
            data: {
                nextTicketNumber: {
                    increment: 1,
                },
            },
            select: {
                nextTicketNumber: true,
            },
        });

        return tx.ticket.create({
            data: {
                guildId,
                ticketNumber: server.nextTicketNumber - 1,
                userId,
                reason,
            },
        });
    });
}

export async function setTicketChannelId(ticketId: string, channelId: string) {
    return prisma.ticket.update({
        where: { id: ticketId },
        data: { channelId },
    });
}

export async function getTickets(guildId: string, userId: string) {
    return prisma.ticket.findMany({
        where: { guildId, userId },
        orderBy: { createdAt: 'desc' },
    });
}

export async function removeTicket(ticketId: string) {
    return prisma.ticket.delete({ where: { id: ticketId } });
}

export async function clearTickets(guildId: string, userId: string) {
    return prisma.ticket.deleteMany({ where: { guildId, userId } });
}

export async function getTicket(ticketId: string, guildId: string) {
    const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket || ticket.guildId !== guildId) return null;
    return ticket;
}

export async function getTicketId(guildId: string, channelId: string) {
  return prisma.ticket.findFirst({
    where: { guildId, channelId }
  });
}
