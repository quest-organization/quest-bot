import type { Command } from '../index.js';
import { StringSelectMenuBuilder, ChannelSelectMenuBuilder, StringSelectMenuOptionBuilder, ActionRowBuilder, PermissionFlagsBits, MessageFlags, ChannelType } from 'discord.js';
import { emojis } from '#utils/emoji.js';
import { getSettings, updateSettings } from '#lib/settings.js';

export default {
    data: {
        name: 'settings',
        description: 'Configure the settings for this server.',
        default_member_permissions: PermissionFlagsBits.ManageGuild.toString(),
        dm_permission: false,
    },
    async execute(interaction) {
        const settingMenu = new StringSelectMenuBuilder()
            .setCustomId('settingOption')
            .setPlaceholder('Select the setting to modify')
            .addOptions(
                new StringSelectMenuOptionBuilder()
                    .setLabel('Welcome Message')
                    .setDescription('Send a message when a user joins the server.')
                    .setValue('welcome'),
            );

        const response = await interaction.reply({
            components: [new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(settingMenu)],
            flags: MessageFlags.Ephemeral,
            withResponse: true,
        });

        const collectorFilter = (i: { user: { id: string } }) => i.user.id === interaction.user.id;

        try {
            const settingChoice = await response.resource!.message!.awaitMessageComponent({
                filter: collectorFilter,
                time: 60_000,
            });

            if (!settingChoice.isStringSelectMenu()) return;

            if (settingChoice.values[0] === 'welcome') {
                const guildId = interaction.guildId;
                const guild = interaction.guild;

                if (!guildId || !guild) {
                    await settingChoice.update({
                        content: `${emojis.rightArrow2} This command can only be used in a server.`,
                        components: [],
                    });
                    return;
                }

                const settings = await getSettings(guildId, guild.name);

                const currentChannelName = settings.welcomeChannelId
                    ? guild.channels.cache.get(settings.welcomeChannelId)?.name
                    : null;

                const toggleMenu = new StringSelectMenuBuilder()
                    .setCustomId('welcomeToggle')
                    .setPlaceholder(`Currently: ${settings.welcomePeople ? 'Enabled' : 'Disabled'}`)
                    .addOptions(
                        new StringSelectMenuOptionBuilder()
                            .setLabel('Enable')
                            .setDescription('Send a message when a user joins the server.')
                            .setValue('enable'),
                        new StringSelectMenuOptionBuilder()
                            .setLabel('Disable')
                            .setDescription('Do not send a message when a user joins the server.')
                            .setValue('disable'),
                    );

                const channelMenu = new ChannelSelectMenuBuilder()
                    .setCustomId('welcomeChannel')
                    .setPlaceholder(currentChannelName ? `#${currentChannelName}` : 'Select a channel for welcome messages')
                    .setChannelTypes(ChannelType.GuildText);

                await settingChoice.update({
                    content: `${emojis.rightArrow1} **Welcome** module:`,
                    components: [
                        new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(toggleMenu),
                        new ActionRowBuilder<ChannelSelectMenuBuilder>().addComponents(channelMenu),
                    ],
                });

                const collector = settingChoice.message.createMessageComponentCollector({
                    filter: collectorFilter,
                    time: 60_000,
                });

                collector.on('collect', async (i) => {
                    if (i.customId === 'welcomeToggle' && i.isStringSelectMenu()) {
                        const enable = i.values[0] === 'enable';
                        await updateSettings(guildId, guild.name, { welcomePeople: enable });
                        await i.reply({
                            content: `${emojis.rightArrow2} Welcome module **${enable ? 'enabled' : 'disabled'}**.`,
                            flags: MessageFlags.Ephemeral,
                        });
                    } else if (i.customId === 'welcomeChannel' && i.isChannelSelectMenu()) {
                        const channelId = i.values[0];
                        await updateSettings(guildId, guild.name, { welcomeChannelId: channelId });
                        await i.reply({
                            content: `${emojis.rightArrow2} Welcome channel set to <#${channelId}>.`,
                            flags: MessageFlags.Ephemeral,
                        });
                    }
                });

                collector.on('end', async () => {
                    await interaction.editReply({
                        content: `${emojis.rightArrow2} Closed.`,
                        components: [],
                    });
                });
            }
        } catch (err) {
            console.error(err);
            await interaction.editReply({
                content: `${emojis.rightArrow2} No response within a minute or errored.`,
                components: [],
            });
        }
    },
} satisfies Command;
