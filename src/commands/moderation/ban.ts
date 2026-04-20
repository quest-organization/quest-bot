import type { Command } from '../index.js';
import { ButtonBuilder, ButtonStyle, ActionRowBuilder, ApplicationCommandOptionType, PermissionsBitField, GuildMember, MessageFlags } from 'discord.js';
import { emojis } from '#utils/emoji.js';
import ms, { type StringValue } from 'ms'
import { createBan, applyBan } from '#lib/bans.js';

export default {
	data: {
		name: 'ban',
		description: 'Ban someone from the discord server.',
        options: [
            {
                type: ApplicationCommandOptionType.User,
                name: "target",
                description: "Select a user to ban",
                required: true
            },
            {
                type: ApplicationCommandOptionType.String,
                name: "reason",
                description: "Provide a reason for their ban"
            },
            {
                type: ApplicationCommandOptionType.String,
                name: "duration",
                description: "Provide a duration for their ban (if needed)"
            }
        ]
	},
	async execute(interaction) {
        if (!interaction.inCachedGuild()) {
            await interaction.reply({ content: `${emojis.rightArrow2} This command can only be used in a server.`, flags: MessageFlags.Ephemeral });
            return;
        }
        
        const member = interaction.member as GuildMember;
        
        if (!member.permissions.has(PermissionsBitField.Flags.BanMembers)) {
            await interaction.reply({ content: `${emojis.rightArrow2} You do not have permission to ban members.`, flags: MessageFlags.Ephemeral });
            return
        }

		const targetMember = interaction.options.getMember('target') as GuildMember
		const reason = interaction.options.getString('reason') ?? 'No reason provided';
        
        const durationStr = interaction.options.getString('duration') as StringValue
        const duration = durationStr ? ms(durationStr as StringValue) : null;
        const expiresAt = duration ? new Date(Date.now() + duration) : null;
        
        if (!targetMember) {
            await interaction.reply({ content: `${emojis.rightArrow2} That user is not in this server.`, flags: MessageFlags.Ephemeral });
            return;
        }

        if (targetMember.id === interaction.user.id) {
            await interaction.reply({ content: `${emojis.rightArrow2} You cannot ban yourself.`, flags: MessageFlags.Ephemeral });
            return;
        }
        
        if (targetMember.id === interaction.guild.ownerId) {
            await interaction.reply({ content: `${emojis.rightArrow2} You cannot ban the server owner.`, flags: MessageFlags.Ephemeral });
            return;
        }
        
        if (!targetMember.bannable){
            await interaction.reply({ content: `${emojis.rightArrow2} I cannot ban this user.`, flags: MessageFlags.Ephemeral });
            return;
        }

		const confirm = new ButtonBuilder()
            .setCustomId('confirm')
			.setLabel('Confirm Ban')
			.setStyle(ButtonStyle.Danger)
        
        const cancel = new ButtonBuilder()
            .setCustomId('cancel')
			.setLabel('Cancel')
			.setStyle(ButtonStyle.Secondary)
        
        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(cancel, confirm);
        const response = await interaction.reply({
			content: `${emojis.rightArrow1} Are you sure you want to ban <@${targetMember.user.username}> for reason: ${reason}?`,
			components: [row],
            withResponse: true,
		});
        
        const collectorFilter = (i: { user: { id: string; }; }) => i.user.id === interaction.user.id;
        try {
            const confirmation = await response.resource!.message!.awaitMessageComponent({ filter: collectorFilter, time: 60_000 });
            
            if (confirmation.customId === 'confirm') {
                await createBan(interaction.guild.id, interaction.guild.name, targetMember.id, expiresAt, reason);
                const success = await applyBan(interaction.guild, targetMember.id, reason);
                
                if (success) {
                    await confirmation.update({ content: `${emojis.rightArrow2} <@${targetMember.user.username}> has been banned with reason: ${reason}`, components: [] });
                } else {
                    await confirmation.update({ content: `${emojis.rightArrow2} Failed to ban <@${targetMember.user.username}> with reason: ${reason}`, components: [] });
                }
                
                setTimeout(() => {
                    interaction.deleteReply().catch(() => {});
                }, 3000);
            } else if (confirmation.customId === 'cancel') {
                await confirmation.update({ content: `${emojis.rightArrow2} Cancelled.`, components: [] });
                
                setTimeout(() => {
                    interaction.deleteReply().catch(() => {});
                }, 3000);
            }
        } catch (err) {
            console.error(err)
            await interaction.editReply({ content: `${emojis.rightArrow2} No response within a minute or errored.`, components: [] });
        }
	},
} satisfies Command;
