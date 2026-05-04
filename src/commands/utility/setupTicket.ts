import { Command } from '@sapphire/framework';
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  MessageFlags,
  PermissionFlagsBits
} from 'discord.js';

export class SetupTicketCommand extends Command {
  public constructor(context: Command.LoaderContext, options: Command.Options) {
    super(context, { ...options });
  }

  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand((builder) =>
      builder
        .setName('setup-ticket')
        .setDescription('Post the ticket panel in a channel.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addChannelOption((option) =>
          option
            .setName('channel')
            .setDescription('The channel where the ticket panel should be posted')
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(true)
        )
    );
  }

  public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
    const channel = interaction.options.getChannel('channel', true, [ChannelType.GuildText]);

    const button = new ButtonBuilder()
      .setCustomId('create-ticket')
      .setLabel('Create Ticket')
      .setStyle(ButtonStyle.Success);

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(button);

    await channel.send({
      content: '**Create a ticket by clicking the button below!**',
      components: [row]
    });

    await interaction.reply({
      content: `Ticket panel sent in ${channel}.`,
      flags: MessageFlags.Ephemeral
    });
  }
}
