import { Command } from '@sapphire/framework';
import { emojis } from '#utils/emoji.js';

export class PingCommand extends Command {
  public constructor(context: Command.LoaderContext, options: Command.Options) {
    super(context, { ...options });
  }

  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand((builder) =>
      builder.setName('ping').setDescription("Return the bot's latency.")
    );
  }

  public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
    await interaction.deferReply();

    const reply = await interaction.fetchReply();

    const ping = reply.createdTimestamp - interaction.createdTimestamp;
    const shardId = interaction.client.shard?.ids?.[0];
    const shardCount = interaction.client.shard?.count;

    await interaction.editReply(
      `${emojis.rightArrow1} Client: ${ping}ms\n${emojis.rightArrow1} Websocket: ${interaction.client.ws.ping}ms\n${emojis.rightArrow2} Shard #: ${typeof shardId === 'number' ? shardId : 'N/A'}`
    );
  }
}