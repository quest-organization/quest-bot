import { InteractionHandler, InteractionHandlerTypes } from '@sapphire/framework';
import { ChannelType, MessageFlags, PermissionFlagsBits } from 'discord.js';
import type { ButtonInteraction } from 'discord.js';
import { getSettings, updateSettings } from '#lib/settings.js';

export class ButtonHandler extends InteractionHandler {
  public constructor(ctx: InteractionHandler.LoaderContext, options: InteractionHandler.Options) {
    super(ctx, {
      ...options,
      interactionHandlerType: InteractionHandlerTypes.Button
    });
  }

  public override parse(interaction: ButtonInteraction) {
    if (interaction.customId !== 'create-ticket') return this.none();

    return this.some();
  }

  public async run(interaction: ButtonInteraction) {
    if (!interaction.inGuild()) {
      await interaction.reply({
        content: 'This button can only be used in a server.',
        flags: MessageFlags.Ephemeral
      });
      return;
    }

    if (!interaction.guild) {
      await interaction.reply({
        content: 'Failed to create ticket.',
        flags: MessageFlags.Ephemeral
      });
      return;
    }

    const settings = await getSettings(interaction.guild.id, interaction.guild.name);
    let parent: string | undefined;

    if (settings.ticketCategoryId) {
      const ticketCategory =
        interaction.guild.channels.cache.get(settings.ticketCategoryId) ??
        (await interaction.guild.channels.fetch(settings.ticketCategoryId).catch(() => null));

      if (ticketCategory?.type === ChannelType.GuildCategory) {
        parent = ticketCategory.id;
      } else {
        await updateSettings(interaction.guild.id, interaction.guild.name, { ticketCategoryId: null });
      }
    }

    const channel = await interaction.guild.channels.create({
      name: `ticket-${interaction.user.username}`,
      type: ChannelType.GuildText,
      parent,
      permissionOverwrites: [
        {
          id: interaction.guild.id,
          deny: [PermissionFlagsBits.ViewChannel]
        },
        {
          id: interaction.user.id,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ReadMessageHistory
          ]
        },
        {
          id: interaction.client.user.id,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ReadMessageHistory,
            PermissionFlagsBits.ManageChannels
          ]
        }
      ]
    });

    await interaction.reply({
      content: 'Created a ticket!',
      flags: MessageFlags.Ephemeral
    });

    await channel.send({
      content: `<@${interaction.user.id}>, your ticket has been created!`
    });
  }
}
