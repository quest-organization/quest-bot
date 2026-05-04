import { Command } from '@sapphire/framework';
import { emojis } from '#utils/emoji.js';

export class BotCommand extends Command {
  public constructor(context: Command.LoaderContext, options: Command.Options) {
    super(context, { ...options });
  }

  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand((builder) =>
      builder.setName('bot').setDescription('Get a link to add the bot to your server!')
    );
  }

  public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
    await interaction.reply(`${emojis.rightArrow1} https://questfoundation.dev/bot/invite`);
  }
}