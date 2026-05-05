import { prisma } from './prisma.js';
import { LIMITS_ENABLED, LimitError } from './limits.js';

export async function createAutoRole(
    guildId: string,
    guildName: string,
    roleId: string,
    botRole?: boolean
) {
    if (LIMITS_ENABLED) {
        const autoRoleCount = await prisma.autoRole.count({ where: { guildId } });

        if (autoRoleCount >= 5) {
            throw new LimitError('A guild can only have up to 5 auto roles.');
        }
    }

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