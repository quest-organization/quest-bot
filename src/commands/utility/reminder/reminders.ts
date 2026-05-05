import { Command } from '@sapphire/framework';
import { MessageFlags } from 'discord.js';
import { getReminders } from '#lib/reminders.js';
import { emojis } from '#utils/emoji.js';

export class RemindersCommand extends Command {
  public constructor(context: Command.LoaderContext, options: Command.Options) {
    super(context, { ...options });
  }

  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand((builder) =>
      builder.setName('reminders').setDescription('List your current reminders.')
    );
  }

  public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
    const reminders = interaction.inCachedGuild()
      ? await getReminders(interaction.user.id, interaction.guild.id)
      : await getReminders(interaction.user.id);

    if (reminders.length === 0) {
      await interaction.reply({
        content: `${emojis.rightArrow2} You have no active reminders${interaction.inCachedGuild() ? ' in this server' : ''}.`,
        flags: MessageFlags.Ephemeral
      });
      return;
    }

    const lines = reminders.map((r) => {
      const unix = Math.floor(r.remindAt.getTime() / 1000);
      return `<t:${unix}:R> | ${r.message}\n \`${r.id}\``;
    });

    await interaction.reply({
      content: `${emojis.rightArrow2} Your reminders:\n${lines.join('\n')}`,
      flags: MessageFlags.Ephemeral
    });
  }
}