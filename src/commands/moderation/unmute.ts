import type { Command } from '../index.js';
import { ButtonBuilder, ButtonStyle, ActionRowBuilder, ApplicationCommandOptionType, PermissionsBitField, GuildMember, MessageFlags } from 'discord.js';
import { emojis } from '#utils/emoji.js';
import { removeMute } from '#lib/mutes.js';

export default {
    data: {
        name: 'unmute',
        description: 'Unmute someone in the discord server.',
        options: [
            {
                type: ApplicationCommandOptionType.User,
                name: "target",
                description: "Select a user to unmute",
                required: true
            },
            {
                type: ApplicationCommandOptionType.String,
                name: "reason",
                description: "Provide a reason for their unmute"
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
            await interaction.reply({ content: `${emojis.rightArrow2} You do not have permission to unmute members.`, flags: MessageFlags.Ephemeral });
            return
        }

        const targetMember = interaction.options.getMember('target') as GuildMember
        const reason = interaction.options.getString('reason') ?? 'No reason provided';

        if (!targetMember) {
            await interaction.reply({ content: `${emojis.rightArrow2} That user is not in this server.`, flags: MessageFlags.Ephemeral });
            return;
        }
        
        if (!targetMember.moderatable){
            await interaction.reply({ content: `${emojis.rightArrow2} I cannot unmute this user.`, flags: MessageFlags.Ephemeral });
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
            content: `${emojis.rightArrow1} Are you sure you want to unmute <@${targetMember.user.id}> with reason: ${reason}?`,
            components: [row],
            withResponse: true,
        });
        
        const collectorFilter = (i: { user: { id: string; }; }) => i.user.id === interaction.user.id;
        try {
            const confirmation = await response.resource!.message!.awaitMessageComponent({ filter: collectorFilter, time: 60_000 });
            
            if (confirmation.customId === 'confirm') {
                await removeMute(interaction.guild.id, targetMember.id);
                targetMember.timeout(null, reason)
                await confirmation.update({ content: `${emojis.rightArrow2} <@${targetMember.user.id}> has been unmuted with reason: ${reason}`, components: [] });
                
                setTimeout(() => {
                    interaction.deleteReply().catch(() => {});
                }, 3000);
            } else if (confirmation.customId === 'cancel') {
                await confirmation.update({ content: `${emojis.rightArrow2} Cancelled.`, components: [] });
                
                setTimeout(() => {
                    interaction.deleteReply().catch(() => {});
                }, 3000);
            }
        } catch {
            await interaction.editReply({ content: `${emojis.rightArrow2} No response within a minute or errored.`, components: [] });
        }
    },
} satisfies Command;
