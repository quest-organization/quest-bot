import type { Command } from '../index.js';
import { ButtonBuilder, ButtonStyle, ActionRowBuilder, ApplicationCommandOptionType, PermissionsBitField, GuildMember, MessageFlags } from 'discord.js';
import { emojis } from '#utils/emoji.js';
import ms, { type StringValue } from 'ms'
import { createWarn } from '#lib/warns.js';

export default {
    data: {
        name: 'warn',
        description: 'Warn someone in the discord server.',
        options: [
            {
                type: ApplicationCommandOptionType.User,
                name: "target",
                description: "Select a user to warn",
                required: true
            },
            {
                type: ApplicationCommandOptionType.String,
                name: "reason",
                description: "Provide a reason for their warn"
            },
            {
                type: ApplicationCommandOptionType.String,
                name: "duration",
                description: "Specify a duration for the warn"
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
            await interaction.reply({ content: `${emojis.rightArrow2} You do not have permission to warn members.`, flags: MessageFlags.Ephemeral });
            return
        }

        const targetMember = interaction.options.getMember('target') as GuildMember
        const reason = interaction.options.getString('reason') ?? 'No reason provided';
        const durationStr = interaction.options.getString('duration') as StringValue
        const duration = durationStr ? ms(durationStr as StringValue) : null;
        const expiresAt = duration ? new Date(Date.now() + duration) : null;
        
        if (durationStr && (typeof duration !== 'number' || isNaN(duration))) {
            await interaction.reply({ content: `${emojis.rightArrow2} Invalid duration format.`, flags: MessageFlags.Ephemeral });
            return;
        }

        if (!targetMember) {
            await interaction.reply({ content: `${emojis.rightArrow2} That user is not in this server.`, flags: MessageFlags.Ephemeral });
            return;
        }

        if (targetMember.id === interaction.user.id) {
            await interaction.reply({ content: `${emojis.rightArrow2} You cannot warn yourself.`, flags: MessageFlags.Ephemeral });
            return;
        }
        
        if (targetMember.id === interaction.guild.ownerId) {
            await interaction.reply({ content: `${emojis.rightArrow2} You cannot warn the server owner.`, flags: MessageFlags.Ephemeral });
            return;
        }
        
        if (!targetMember.moderatable){
            await interaction.reply({ content: `${emojis.rightArrow2} I cannot warn this user.`, flags: MessageFlags.Ephemeral });
            return;
        }

        const confirm = new ButtonBuilder()
            .setCustomId('confirm')
            .setLabel('Confirm Warn')
            .setStyle(ButtonStyle.Danger)
        
        const cancel = new ButtonBuilder()
            .setCustomId('cancel')
            .setLabel('Cancel')
            .setStyle(ButtonStyle.Secondary)
        
        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(cancel, confirm);
        const response = await interaction.reply({
            content: `${emojis.rightArrow1} Are you sure you want to warn <@${targetMember.user.id}> with reason: ${reason}?`,
            components: [row],
            withResponse: true,
        });
        
        const collectorFilter = (i: { user: { id: string; }; }) => i.user.id === interaction.user.id;
        try {
            const confirmation = await response.resource!.message!.awaitMessageComponent({ filter: collectorFilter, time: 60_000 });
            
            if (confirmation.customId === 'confirm') {
                try {
                    await createWarn(interaction.guild.id, interaction.guild.name, targetMember.id, interaction.user.id, reason, expiresAt);
                    await targetMember.send(
                        `You have been warned in **${interaction.guild.name}**.\nReason: ${reason}${expiresAt ? `\nExpires: <t:${Math.floor(expiresAt.getTime() / 1000)}:R>` : ''}`
                    ).catch(() => {});
                    await confirmation.update({ content: `${emojis.rightArrow2} <@${targetMember.id}> has been warned with reason: ${reason}`, components: [] })
                } catch (err) {
                    console.error(err)
                    await confirmation.update({ content: `${emojis.rightArrow2} Failed to warn <@${targetMember.id}>`, components: [] })
                }
            } else if (confirmation.customId === 'cancel') {
                await confirmation.update({ content: `${emojis.rightArrow2} Cancelled.`, components: [] });
            }
        } catch(err) {
            console.error(err)
            await interaction.editReply({ content: `${emojis.rightArrow2} No response within a minute or errored.`, components: [] });
        }
    },
} satisfies Command;
