import { Command } from '@sapphire/framework';
import { emojis } from '#utils/emoji.js';

export class UserCommand extends Command {
  public constructor(context: Command.LoaderContext, options: Command.Options) {
    super(context, { ...options });
  }

  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand((builder) =>
      builder.setName('user').setDescription('Provides information about the user.')
    );
  }

  public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
    await interaction.reply(
      `${emojis.rightArrow2} This command was run by **${interaction.user.username}**.`
    );
  }
}