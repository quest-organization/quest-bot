import type { Command } from '../index.js';
import { ButtonBuilder, ButtonStyle, ActionRowBuilder, ApplicationCommandOptionType, PermissionsBitField, GuildMember, MessageFlags } from 'discord.js';
import { emojis } from '#utils/emoji.js';
import { getBan, removeBan } from '#lib/bans.js';

export default {
    data: {
        name: 'unban',
        description: 'Unban someone from the discord server.',
        options: [
            {
                type: ApplicationCommandOptionType.User,
                name: "target",
                description: "The user to unban",
                required: true
            },
            {
                type: ApplicationCommandOptionType.String,
                name: "reason",
                description: "Provide a reason for their unban"
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
            await interaction.reply({ content: `${emojis.rightArrow2} You do not have permission to unban members.`, flags: MessageFlags.Ephemeral });
            return
        }
        
        const targetMember = interaction.options.getUser('target', true);
		const reason = interaction.options.getString('reason') ?? 'No reason provided';
        
        const discordBan = await interaction.guild.bans.fetch(targetMember.id).catch(() => null);
        const dbBan = await getBan(interaction.guild.id, targetMember.id);

        if (!discordBan && !dbBan) {
            await interaction.reply({
                content: `${emojis.rightArrow2} That user isn't banned.`,
                flags: MessageFlags.Ephemeral,
            });
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
            content: `${emojis.rightArrow1} Are you sure you want to unban <@${targetMember.id}> for reason: ${reason}?`,
            components: [row],
            withResponse: true,
        });
        
        const collectorFilter = (i: { user: { id: string; }; }) => i.user.id === interaction.user.id;
        try {
            const confirmation = await response.resource!.message!.awaitMessageComponent({ filter: collectorFilter, time: 60_000 });
            
            if (confirmation.customId === 'confirm') {
                try {
                    await removeBan(interaction.guild, targetMember.id);
                    await targetMember.send(
                        `You have been unbanned in **${interaction.guild.name}**.\nReason: ${reason}`
                    ).catch(() => {});
                    await confirmation.update({ content: `${emojis.rightArrow2} <@${targetMember.id}> has been unbanned with reason: ${reason}`, components: [] });
                } catch (err) {
                    console.error(err)
                    await confirmation.update({ content: `${emojis.rightArrow2} Failed to unban <@${targetMember.id}> with reason: ${reason}`, components: [] });
                }
                
                setTimeout(() => {
                    interaction.deleteReply().catch(() => {});
                }, 5000);
            } else if (confirmation.customId === 'cancel') {
                await confirmation.update({ content: `${emojis.rightArrow2} Cancelled.`, components: [] });
                
                setTimeout(() => {
                    interaction.deleteReply().catch(() => {});
                }, 5000);
            }
        } catch (err) {
            console.error(err)
            await interaction.editReply({ content: `${emojis.rightArrow2} No response within a minute or errored.`, components: [] });
        }
    },
} satisfies Command;
