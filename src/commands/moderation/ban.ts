import type { Command } from '../index.js';
import { ButtonBuilder, ButtonStyle, ActionRowBuilder, ApplicationCommandOptionType, PermissionsBitField, GuildMember } from 'discord.js';
import { emojis } from '#utils/emoji.js';

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
            }
        ]
	},
	async execute(interaction) {
        const member = interaction.member as GuildMember;
        
        if (!member.permissions.has(PermissionsBitField.Flags.BanMembers)) {
            return
        }

		const target = interaction.options.getUser('target', true);
		const reason = interaction.options.getString('reason') ?? 'No reason provided';

        if (target.id === interaction.user.id) {
            await interaction.reply({ content: `${emojis.rightArrow2} You cannot ban yourself.`, ephemeral: true });
            return;
        }

        if (target.id === interaction.guild?.ownerId) {
            await interaction.reply({ content: `${emojis.rightArrow2} You cannot ban the server owner.`, ephemeral: true });
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
			content: `${emojis.rightArrow1} Are you sure you want to ban ${target} for reason: ${reason}?`,
			components: [row],
            withResponse: true,
		});
        
        const collectorFilter = (i: { user: { id: string; }; }) => i.user.id === interaction.user.id;
        try {
            const confirmation = await response.resource!.message!.awaitMessageComponent({ filter: collectorFilter, time: 60_000 });
            
            if (confirmation.customId === 'confirm') {
                await interaction.guild!.members.ban(target);
                await confirmation.update({ content: `${emojis.rightArrow2} ${target.username} has been banned for reason: ${reason}`, components: [] });
            } else if (confirmation.customId === 'cancel') {
                await confirmation.update({ content: `${emojis.rightArrow2} Cancelled.`, components: [] });
            }
        } catch {
            await interaction.editReply({ content: `${emojis.rightArrow2} No response within a minute or errored.`, components: [] });
        }
	},
} satisfies Command;
