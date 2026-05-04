import { InteractionHandler, InteractionHandlerTypes } from '@sapphire/framework';
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } from 'discord.js';
import type { ButtonInteraction } from 'discord.js';
import { emojis } from '#utils/emoji.js';
import { getTicketId, removeTicket } from '#lib/tickets.js';

export class ButtonHandler extends InteractionHandler {
  public constructor(ctx: InteractionHandler.LoaderContext, options: InteractionHandler.Options) {
    super(ctx, {
      ...options,
      interactionHandlerType: InteractionHandlerTypes.Button
    });
  }

  public override parse(interaction: ButtonInteraction) {
    if (
      interaction.customId !== 'remove-ticket' &&
      interaction.customId !== 'confirm-remove-ticket' &&
      interaction.customId !== 'cancel-remove-ticket'
    ) {
      return this.none();
    }

    return this.some();
  }

  public async run(interaction: ButtonInteraction) {
    if (!interaction.inGuild()) {
      await interaction.reply({
        content: `${emojis.rightArrow2} This button can only be used in a server.`,
        flags: MessageFlags.Ephemeral
      });
      return;
    }

    if (!interaction.guild) {
      await interaction.reply({
        content: `${emojis.rightArrow2} Failed to remove ticket.`,
        flags: MessageFlags.Ephemeral
      });
      return;
    }

    if (interaction.customId === 'cancel-remove-ticket') {
      await interaction.update({
        content: `${emojis.rightArrow2} Ticket closure cancelled.`,
        components: []
      });
      return;
    }

    const channel = interaction.channel;

    if (!channel || !('deletable' in channel) || !channel.deletable) {
      await interaction.reply({
        content: `${emojis.rightArrow2} I cannot delete this channel.`,
        flags: MessageFlags.Ephemeral
      });
      return;
    }

    if (interaction.customId === 'remove-ticket') {
      const confirmButton = new ButtonBuilder()
        .setCustomId('confirm-remove-ticket')
        .setLabel('Confirm Close')
        .setStyle(ButtonStyle.Danger);

      const cancelButton = new ButtonBuilder()
        .setCustomId('cancel-remove-ticket')
        .setLabel('Cancel')
        .setStyle(ButtonStyle.Secondary);

      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(confirmButton, cancelButton);

      await interaction.reply({
        content: `${emojis.rightArrow2} Are you sure you want to close this ticket?`,
        components: [row],
        flags: MessageFlags.Ephemeral
      });
      return;
    }

    await interaction.update({
      content: `${emojis.rightArrow2} Closing ticket...`,
      components: []
    });

    const ticket = await getTicketId(interaction.guild.id, channel.id);

    try { 
      if (ticket) {
        await removeTicket(ticket.id);
      }

      await channel.delete(`Ticket closed by ${interaction.user.tag}.`);
    } catch (err) {
        console.log(err);
    }
  }
}
