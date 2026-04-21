import type { GuildMember } from 'discord.js';
import { getSettings } from '#lib/settings.js';
import { emojis } from '#utils/emoji.js';

export async function sendWelcome(member: GuildMember): Promise<void> {
    const settings = await getSettings(member.guild.id, member.guild.name);
    if (!settings.welcomePeople || !settings.welcomeChannelId) return;

    const channel = await member.guild.channels.fetch(settings.welcomeChannelId).catch(err => console.error(err));
    if (!channel?.isTextBased() || !channel.isSendable()) return;

    await channel.send(`${emojis.rightArrow1} Welcome to **${member.guild.name}**, <@${member.user.id}>!`);
}
