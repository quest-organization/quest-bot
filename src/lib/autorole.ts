import { prisma } from './prisma.js';

export async function createAutoRole(
    guildId: string,
    guildName: string,
    roleId: string,
    botRole?: boolean
) {
    if (guildId && guildName) {
        await prisma.server.upsert({
            where: { id: guildId },
            create: { id: guildId, name: guildName },
            update: { name: guildName }
        });

        return prisma.autoRole.create({
            data: { guildId, roleId, botRole }
        });
    }

    return prisma.autoRole.create({
        data: { guildId, roleId, botRole }
    });
}

export async function getAutoRoles(guildId: string) {
    return prisma.autoRole.findMany({
        where: { guildId },
        orderBy: { createdAt: 'asc' }
    });
}

export async function removeAutoRole(autoRoleId: string) {
    return prisma.autoRole.delete({ where: { id: autoRoleId } });
}

export async function clearAutoRoles(guildId: string) {
    return prisma.autoRole.deleteMany({ where: { guildId } });
}

export async function getAutoRole(autoRoleId: string) {
    return prisma.autoRole.findUnique({ where: { id: autoRoleId } });
}