import type { Command } from '../index.js';
import { ButtonBuilder, ButtonStyle, ActionRowBuilder, ApplicationCommandOptionType, PermissionsBitField, GuildMember, MessageFlags } from 'discord.js';
import { emojis } from '#utils/emoji.js';
import { removeWarn, getWarn } from '#lib/warns.js';

export default {
    data: {
        name: 'unwarn',
        description: 'Unwarn someone in the discord server.',
        options: [
            {
                type: ApplicationCommandOptionType.String,
                name: "id",
                description: "The ID of the warn to remove",
                required: true
            },
            {
                type: ApplicationCommandOptionType.String,
                name: "reason",
                description: "Provide a reason for removing the warn"
            }
            
        ]
    },
    async execute(interaction) {
        if (!interaction.inCachedGuild()) {
            await interaction.reply({ content: `${emojis.rightArrow2} This command can only be used in a server.`, flags: MessageFlags.Ephemeral });
            return;
        }
        
        const member = interaction.member as GuildMember;
        
        if (!member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
            await interaction.reply({ content: `${emojis.rightArrow2} You do not have permission to remove warns.`, flags: MessageFlags.Ephemeral });
            return
        }

        const warnId = interaction.options.getString('id', true);
        const reason = interaction.options.getString('reason') ?? 'No reason provided';
        
        const warn = await getWarn(warnId, interaction.guild.id);
        
        if (!warn) {
            await interaction.reply({ content: `${emojis.rightArrow2} No warn found with that ID in this server.`, flags: MessageFlags.Ephemeral });
            return;
        }
        
        const confirm = new ButtonBuilder()
            .setCustomId('confirm')
            .setLabel('Confirm Unmute')
            .setStyle(ButtonStyle.Danger)
        
        const cancel = new ButtonBuilder()
            .setCustomId('cancel')
            .setLabel('Cancel')
            .setStyle(ButtonStyle.Secondary)
        
        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(cancel, confirm);
        const response = await interaction.reply({
            content: `${emojis.rightArrow1} Are you sure you want to unwarn ${warn.userId} with reason: ${reason}?\n${emojis.rightArrow2} They were warned for: ${warn.reason} <t:${Math.floor(warn.createdAt.getTime() / 1000)}:R>`,
            components: [row],
            withResponse: true,
        });
        
        const collectorFilter = (i: { user: { id: string; }; }) => i.user.id === interaction.user.id;
        try {
            const confirmation = await response.resource!.message!.awaitMessageComponent({ filter: collectorFilter, time: 60_000 });
            
            if (confirmation.customId === 'confirm') {
                await removeWarn(warn.id);
                await confirmation.update({ content: `${emojis.rightArrow2} <@${warn.userId}> has been unwarned with reason: ${reason}`, components: [] });
            } else if (confirmation.customId === 'cancel') {
                await confirmation.update({ content: `${emojis.rightArrow2} Cancelled.`, components: [] });
            }
        } catch {
            await interaction.editReply({ content: `${emojis.rightArrow2} No response within a minute or errored.`, components: [] });
        }
    },
} satisfies Command;
