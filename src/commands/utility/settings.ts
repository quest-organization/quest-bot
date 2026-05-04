import { Command } from '@sapphire/framework';
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelSelectMenuBuilder,
  ChannelType,
  type Guild,
  InteractionContextType,
  MessageFlags,
  PermissionFlagsBits,
  RoleSelectMenuBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder
} from 'discord.js';
import { getSettings, type ServerSettings, updateSettings } from '#lib/settings.js';
import { emojis } from '#utils/emoji.js';

const staleInteractionErrorCodes = new Set([10_015, 50_027, 10062]);

function isStaleInteractionError(error: unknown): error is { code: number } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof error.code === 'number' &&
    staleInteractionErrorCodes.has(error.code)
  );
}

function buildWelcomePanel(settings: ServerSettings, guild: Guild, status?: string) {
  const currentChannelName = settings.welcomeChannelId
    ? guild.channels.cache.get(settings.welcomeChannelId)?.name
    : null;

  const toggleMenu = new StringSelectMenuBuilder()
    .setCustomId('welcomeToggle')
    .setPlaceholder(`${settings.welcomePeople ? 'Enabled' : 'Disabled'}`)
    .addOptions(
      new StringSelectMenuOptionBuilder()
        .setLabel('Enable')
        .setDescription('Send a message when a user joins the server.')
        .setValue('enable'),
      new StringSelectMenuOptionBuilder()
        .setLabel('Disable')
        .setDescription("Don't send a message when a user joins the server.")
        .setValue('disable')
    );

  const channelMenu = new ChannelSelectMenuBuilder()
    .setCustomId('welcomeChannel')
    .setPlaceholder(
      currentChannelName ? `#${currentChannelName}` : 'Select a channel for welcome messages'
    )
    .setChannelTypes(ChannelType.GuildText);

  return {
    content: status
      ? `${emojis.rightArrow1} **Welcome** module:\n${emojis.rightArrow2} ${status}`
      : `${emojis.rightArrow1} **Welcome** module:`,
    components: [
      new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(toggleMenu),
      new ActionRowBuilder<ChannelSelectMenuBuilder>().addComponents(channelMenu)
    ]
  };
}

function buildTicketPanel(settings: ServerSettings, guild: Guild, status?: string) {
  const currentCategoryName = settings.ticketCategoryId
    ? guild.channels.cache.get(settings.ticketCategoryId)?.name
    : null;

  const categoryMenu = new ChannelSelectMenuBuilder()
    .setCustomId('ticketCategory')
    .setPlaceholder(currentCategoryName ?? 'Select a category for tickets')
    .setChannelTypes(ChannelType.GuildCategory);

  const removeButton = new ButtonBuilder()
    .setCustomId('ticketCategoryRemove')
    .setLabel('Remove Category')
    .setStyle(ButtonStyle.Danger)
    .setDisabled(!settings.ticketCategoryId);
  
  const currentStaffRole = settings.staffRole
    ? guild.roles.cache.get(settings.staffRole)?.name
    : null;
  
  const staffRole = new RoleSelectMenuBuilder()
    .setCustomId('staffRole')
    .setPlaceholder(currentStaffRole ?? 'Select a ticket staff role');

  const removeStaffRoleButton = new ButtonBuilder()
    .setCustomId('removeStaffRole')
    .setLabel('Remove Staff Role')
    .setStyle(ButtonStyle.Danger)
    .setDisabled(!settings.staffRole);

  return {
    content: status
      ? `${emojis.rightArrow1} **Tickets** module:\n${emojis.rightArrow2} ${status}`
      : `${emojis.rightArrow1} **Tickets** module:`,
    components: [
      new ActionRowBuilder<ChannelSelectMenuBuilder>().addComponents(categoryMenu),
      new ActionRowBuilder<ButtonBuilder>().addComponents(removeButton),
      new ActionRowBuilder<RoleSelectMenuBuilder>().addComponents(staffRole),
      new ActionRowBuilder<ButtonBuilder>().addComponents(removeStaffRoleButton)
    ]
  };
}

async function normalizeTicketSettings(guildId: string, guild: Guild, settings: ServerSettings) {
  if (!settings.ticketCategoryId) return settings;

  const ticketCategory =
    guild.channels.cache.get(settings.ticketCategoryId) ??
    (await guild.channels.fetch(settings.ticketCategoryId).catch(() => null));

  if (ticketCategory?.type === ChannelType.GuildCategory) return settings;

  return updateSettings(guildId, guild.name, { ticketCategoryId: null });
}

export class SettingsCommand extends Command {
  public constructor(context: Command.LoaderContext, options: Command.Options) {
    super(context, { ...options });
  }

  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand((builder) =>
      builder
        .setName('settings')
        .setDescription("Configure the bot's settings for this server.")
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .setContexts(InteractionContextType.Guild)
    );
  }

  public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
    const safeEditReply = async (
      options: Parameters<Command.ChatInputCommandInteraction['editReply']>[0]
    ) => {
      try {
        await interaction.editReply(options);
      } catch (error) {
        if (isStaleInteractionError(error)) return;
        throw error;
      }
    };

    const settingMenu = new StringSelectMenuBuilder()
      .setCustomId('settingOption')
      .setPlaceholder('Select a setting to modify')
      .addOptions(
        new StringSelectMenuOptionBuilder()
          .setLabel('Welcome Message')
          .setDescription('Send a message when a user joins the server.')
          .setValue('welcome'),
        new StringSelectMenuOptionBuilder()
          .setLabel('Tickets')
          .setDescription('Configure where tickets are created.')
          .setValue('tickets')
      );

    const response = await interaction.reply({
      components: [new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(settingMenu)],
      flags: MessageFlags.Ephemeral,
      withResponse: true
    });

    const collectorFilter = (i: { user: { id: string } }) => i.user.id === interaction.user.id;

    try {
      const settingChoice = await response.resource!.message!.awaitMessageComponent({
        filter: collectorFilter,
        time: 60_000
      });

      if (!settingChoice.isStringSelectMenu()) return;

      const guildId = interaction.guildId;
      const guild = interaction.guild;

      if (!guildId || !guild) {
        await settingChoice.update({
          content: `${emojis.rightArrow2} This command can only be used in a server.`,
          components: []
        });
        return;
      }

      const settings = await normalizeTicketSettings(
        guildId,
        guild,
        await getSettings(guildId, guild.name)
      );

      if (settingChoice.values[0] === 'welcome') {
        await settingChoice.update(buildWelcomePanel(settings, guild));
      } else if (settingChoice.values[0] === 'tickets') {
        await settingChoice.update(buildTicketPanel(settings, guild));
      } else {
        return;
      }

      const collector = settingChoice.message.createMessageComponentCollector({
        filter: collectorFilter,
        time: 60_000
      });

      collector.on('collect', async (i) => {
        if (i.customId === 'welcomeToggle' && i.isStringSelectMenu()) {
          const enable = i.values[0] === 'enable';
          const next = await updateSettings(guildId, guild.name, { welcomePeople: enable });

          await i.update(
            buildWelcomePanel(next, guild, `Welcome module **${enable ? 'enabled' : 'disabled'}**.`)
          );
        } else if (i.customId === 'welcomeChannel' && i.isChannelSelectMenu()) {
          const channelId = i.values[0];
          const next = await updateSettings(guildId, guild.name, { welcomeChannelId: channelId });

          await i.update(buildWelcomePanel(next, guild, `Welcome channel set to <#${channelId}>.`));
        } else if (i.customId === 'ticketCategory' && i.isChannelSelectMenu()) {
          const categoryId = i.values[0];
          const next = await updateSettings(guildId, guild.name, { ticketCategoryId: categoryId });

          await i.update(buildTicketPanel(next, guild, `Ticket category set to <#${categoryId}>.`));
        } else if (i.customId === 'ticketCategoryRemove' && i.isButton()) {
          const next = await updateSettings(guildId, guild.name, { ticketCategoryId: null });

          await i.update(buildTicketPanel(next, guild, 'Ticket category removed.'));
        } else if (i.customId === 'staffRole' && i.isRoleSelectMenu()) {
          const roleId = i.values[0];
          const next = await updateSettings(guildId, guild.name, { staffRole: roleId });

          await i.update(buildTicketPanel(next, guild, `Ticket staff role set to <@&${roleId}>.`));
        } else if (i.customId === 'removeStaffRole' && i.isButton()) {
          const next = await updateSettings(guildId, guild.name, { staffRole: null });

          await i.update(buildTicketPanel(next, guild, 'Ticket staff role removed.'));
        }
      });

      collector.on('end', async () => {
        await safeEditReply({
          content: `${emojis.rightArrow2} Closed.`,
          components: []
        });
      });
    } catch (err) {
      console.error(err);
      await safeEditReply({
        content: `${emojis.rightArrow2} No response within a minute or errored.`,
        components: []
      });
    }
  }
}
