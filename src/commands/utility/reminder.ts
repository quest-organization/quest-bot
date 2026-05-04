import { Command } from '@sapphire/framework';
import { MessageFlags } from 'discord.js';
import ms, { type StringValue } from 'ms';
import { createReminder, getReminder, removeReminder } from '#lib/reminders.js';
import { emojis } from '#utils/emoji.js';

export class ReminderCommand extends Command {
  public constructor(context: Command.LoaderContext, options: Command.Options) {
    super(context, { ...options });
  }

  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand((builder) =>
      builder
        .setName('reminder')
        .setDescription('Set reminders!')
        .addSubcommand((sub) =>
          sub
            .setName('add')
            .setDescription('Set a new reminder.')
            .addStringOption((option) =>
              option.setName('duration').setDescription('When to remind you').setRequired(true)
            )
            .addStringOption((option) =>
              option.setName('message').setDescription('What to remind you about').setRequired(true)
            )
        )
        .addSubcommand((sub) =>
          sub
            .setName('remove')
            .setDescription('Cancel a reminder.')
            .addStringOption((option) =>
              option.setName('id').setDescription('The reminder ID').setRequired(true)
            )
        )
    );
  }

  public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'add') {
      const durationStr = interaction.options.getString('duration', true);
      const message = interaction.options.getString('message', true);

      const duration = ms(durationStr as StringValue);
      if (typeof duration !== 'number' || isNaN(duration) || duration <= 0) {
        await interaction.reply({
          content: `${emojis.rightArrow2} Invalid duration.`,
          flags: MessageFlags.Ephemeral
        });
        return;
      }

      if (duration > 31_536_000_000) {
        await interaction.reply({
          content: `${emojis.rightArrow2} Reminder cannot be longer than 1 year.`,
          flags: MessageFlags.Ephemeral
        });
        return;
      }

      const remindAt = new Date(Date.now() + duration);

      const reminder = interaction.inCachedGuild()
        ? await createReminder(
            interaction.user.id,
            message,
            remindAt,
            interaction.guild.id,
            interaction.guild.name,
            interaction.channelId
          )
        : await createReminder(interaction.user.id, message, remindAt);

      const unix = Math.floor(remindAt.getTime() / 1000);
      await interaction.reply({
        content: `${emojis.rightArrow2} Reminder set to go off in <t:${unix}:R> message: ${message}\nID: \`${reminder.id}\``
      });

      setTimeout(() => {
        interaction.deleteReply().catch(() => {});
      }, 5000);
      return;
    }

    if (subcommand === 'remove') {
      const id = interaction.options.getString('id', true);
      const reminder = await getReminder(id);

      if (!reminder) {
        await interaction.reply({
          content: `${emojis.rightArrow2} No reminder found.`,
          flags: MessageFlags.Ephemeral
        });
        return;
      }

      if (reminder.userId !== interaction.user.id) {
        await interaction.reply({
          content: `${emojis.rightArrow2} You can't remove other's reminders.`,
          flags: MessageFlags.Ephemeral
        });
        return;
      }

      await removeReminder(id);
      await interaction.reply({
        content: `${emojis.rightArrow2} Reminder removed.`,
        flags: MessageFlags.Ephemeral
      });

      setTimeout(() => {
        interaction.deleteReply().catch(() => {});
      }, 5000);
      return;
    }
  }
}