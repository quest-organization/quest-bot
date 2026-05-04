import { Command } from '@sapphire/framework';
import { emojis } from '#utils/emoji.js';
import { MessageFlags } from 'discord.js';

export class HelpCommand extends Command {
  public constructor(context: Command.LoaderContext, options: Command.Options) {
    super(context, { ...options });
  }

  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand((builder) =>
      builder.setName('help').setDescription("Show what the bot is capable of.")
    );
  }

  public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
    const commands = this.container.stores.get('commands');

    const commandList = Array.from(commands.values())
        .sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''))
        .map((cmd) => {
          const description = cmd.applicationCommandRegistry['apiCalls'][0]?.builtData.description ?? cmd.description;

          return `${emojis.rightArrow1} **/${cmd.name}** - ${description}`;
        })
        .join('\n');

    await interaction.reply({
        content: commandList + `\n\n**Status:** https://status.questfoundation.dev/\n**Official Discord Server:** https://discord.gg/F4HYE8frK2\n**Documentation:** https://docs.questfoundation.dev/`,
        flags: MessageFlags.SuppressEmbeds | MessageFlags.Ephemeral
    });
  }
}