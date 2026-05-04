import { Command } from '@sapphire/framework';
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  GuildMember,
  MessageFlags,
  PermissionsBitField
} from 'discord.js';
import { removeMute } from '#lib/mutes.js';
import { emojis } from '#utils/emoji.js';

export class UnmuteCommand extends Command {
  public constructor(context: Command.LoaderContext, options: Command.Options) {
    super(context, { ...options });
  }

  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand((builder) =>
      builder
        .setName('unmute')
        .setDescription('Unmute someone in the discord server.')
        .addUserOption((option) =>
          option.setName('member').setDescription('Select a member to unmute').setRequired(true)
        )
        .addStringOption((option) =>
          option.setName('reason').setDescription('Provide a reason for their unmute')
        )
    );
  }

  public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
    if (!interaction.inCachedGuild()) {
      await interaction.reply({
        content: `${emojis.rightArrow2} This command can only be used in a server.`,
        flags: MessageFlags.Ephemeral
      });
      return;
    }

    const member = interaction.member as GuildMember;

    if (!member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
      await interaction.reply({
        content: `${emojis.rightArrow2} You do not have permission to unmute members.`,
        flags: MessageFlags.Ephemeral
      });
      return;
    }

    const targetMember = interaction.options.getMember('member') as GuildMember;
    const reason = interaction.options.getString('reason') ?? 'No reason provided';

    if (!targetMember) {
      await interaction.reply({
        content: `${emojis.rightArrow2} That user is not in this server.`,
        flags: MessageFlags.Ephemeral
      });
      return;
    }

    if (!targetMember.moderatable) {
      await interaction.reply({
        content: `${emojis.rightArrow2} I cannot unmute this user.`,
        flags: MessageFlags.Ephemeral
      });
      return;
    }

    const confirm = new ButtonBuilder()
      .setCustomId('confirm')
      .setLabel('Confirm Unmute')
      .setStyle(ButtonStyle.Danger);

    const cancel = new ButtonBuilder()
      .setCustomId('cancel')
      .setLabel('Cancel')
      .setStyle(ButtonStyle.Secondary);

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(cancel, confirm);

    const response = await interaction.reply({
      content: `${emojis.rightArrow1} Are you sure you want to unmute <@${targetMember.user.id}> with reason: ${reason}?`,
      components: [row],
      withResponse: true
    });

    const collectorFilter = (i: { user: { id: string } }) => i.user.id === interaction.user.id;

    try {
      const confirmation = await response.resource!.message!.awaitMessageComponent({
        filter: collectorFilter,
        time: 60_000
      });

      if (confirmation.customId === 'confirm') {
        try {
          await Promise.all([
            removeMute(interaction.guild.id, targetMember.id),
            targetMember.timeout(null, reason)
          ]);
          await targetMember
            .send(`You have been unmuted in **${interaction.guild.name}**.\nReason: ${reason}`)
            .catch(() => {});
          await confirmation.update({
            content: `${emojis.rightArrow2} <@${targetMember.id}> has been unmuted. Reason: ${reason}`,
            components: []
          });
        } catch (err) {
          console.error(err);
          await confirmation.update({
            content: `${emojis.rightArrow2} Failed to unmute <@${targetMember.id}> with reason: ${reason}`,
            components: []
          });
        }
      } else if (confirmation.customId === 'cancel') {
        await confirmation.update({
          content: `${emojis.rightArrow2} Cancelled.`,
          components: []
        });
      }
    } catch {
      await interaction.editReply({
        content: `${emojis.rightArrow2} No response within a minute or errored.`,
        components: []
      });
    }
  }
}