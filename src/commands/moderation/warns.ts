import type { Command } from '../index.js';
import { ApplicationCommandOptionType, PermissionsBitField, GuildMember, MessageFlags } from 'discord.js';
import { emojis } from '#utils/emoji.js';
import { getWarns } from '#lib/warns.js';

export default {
    data: {
        name: 'warns',
        description: 'View (someones) warns.',
        options: [
            {
                type: ApplicationCommandOptionType.User,
                name: "target",
                description: "User to view warns of",
            }
            
        ]
    },
    async execute(interaction) {
        if (!interaction.inCachedGuild()) {
            await interaction.reply({ content: `${emojis.rightArrow2} This command can only be used in a server.`, flags: MessageFlags.Ephemeral });
            return;
        }
        
        const member = interaction.member as GuildMember;
        const targetOption = interaction.options.getMember('target') as GuildMember
        
        if (targetOption && targetOption.id !== interaction.user.id) {
            if (!member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
                await interaction.reply({ content: `${emojis.rightArrow2} You do not have permission to view other members' warns.`, flags: MessageFlags.Ephemeral });
                return;
            }
        }
        
        const targetMember = targetOption ?? member;
        const active = await getWarns(interaction.guild.id, targetMember.id);
        
        if (active.length === 0) {
            await interaction.reply({ content: `${emojis.rightArrow2} <@${targetMember.user.id}> has no active warns.`, flags: MessageFlags.Ephemeral });
            return;
        }
        
        const lines = active.slice(0, 10).map(warn => {
            const expires = warn.expiresAt
                ? `<t:${Math.floor(warn.expiresAt.getTime() / 1000)}:R>`
                : 'Never';
            return `${emojis.rightArrow2} **${warn.reason ?? 'No reason provided'}** by <@${warn.moderatorId}>\n<t:${Math.floor(warn.createdAt.getTime() / 1000)}:R> Expires: ${expires} \`${warn.id}\``;
        });
        
        let content = `${emojis.rightArrow1} ${active.length} active warn(s) for <@${targetMember.user.id}>:\n${lines.join('\n')}`;
        
        await interaction.reply({ content });
    },
} satisfies Command;
