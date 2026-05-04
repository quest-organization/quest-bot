import { InteractionHandler, InteractionHandlerTypes } from '@sapphire/framework';
import { MessageFlags } from 'discord.js';
import type { ButtonInteraction } from 'discord.js';
import { emojis } from '#utils/emoji.js';

export class ButtonHandler extends InteractionHandler {
  public constructor(ctx: InteractionHandler.LoaderContext, options: InteractionHandler.Options) {
    super(ctx, {
      ...options,
      interactionHandlerType: InteractionHandlerTypes.Button
    });
  }

  public override parse(interaction: ButtonInteraction) {
    if (interaction.customId !== 'remove-ticket') return this.none();

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

    const channel = interaction.channel;

    if (!channel || !('deletable' in channel) || !channel.deletable) {
      await interaction.reply({
        content: `${emojis.rightArrow2} I cannot delete this channel.`,
        flags: MessageFlags.Ephemeral
      });
      return;
    }

    await channel.delete(
      `Ticket channel "${channel.name}" (${channel.id}) closed by ${interaction.user.tag} (${interaction.user.id}).`
    );
  }
}
