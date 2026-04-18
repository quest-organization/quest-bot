import { Prisma } from "#prisma/client.js";
import { prisma } from "./prisma.js";

export type ServerSettings = {
    autoRole: boolean;
    autoRoleRoles: string;
    autoRoleBotRoles: string;
};

export const DefaultSettings: ServerSettings = {
    autoRole: false,
    autoRoleRoles: "",
    autoRoleBotRoles: "",
}

export async function getSettings(guildId: string, guildName: string): Promise<ServerSettings> {
  const row = await prisma.server.upsert({
    where: { id: guildId },
    create: { id: guildId, name: guildName, settings: DefaultSettings as Prisma.InputJsonValue },
    update: { name: guildName },
  });
  return { ...DefaultSettings, ...(row.settings as Partial<ServerSettings>) };
}

export async function updateSettings(
  guildId: string,
  guildName: string,
  patch: Partial<ServerSettings>,
): Promise<ServerSettings> {
  const current = await getSettings(guildId, guildName);
  const next = { ...current, ...patch };
  await prisma.server.update({
    where: { id: guildId },
    data: { name: guildName, settings: next as Prisma.InputJsonValue },
  });
  return next;
}
