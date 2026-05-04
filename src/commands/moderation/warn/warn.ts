import { Command } from '@sapphire/framework';
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  GuildMember,
  MessageFlags,
  PermissionsBitField
} from 'discord.js';
import ms, { type StringValue } from 'ms';
import { createWarn } from '#lib/warns.js';
import { emojis } from '#utils/emoji.js';

export class WarnCommand extends Command {
  public constructor(context: Command.LoaderContext, options: Command.Options) {
    super(context, { ...options });
  }

  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand((builder) =>
      builder
        .setName('warn')
        .setDescription('Warn someone in the discord server.')
        .addUserOption((option) =>
          option.setName('member').setDescription('Select a member to warn').setRequired(true)
        )
        .addStringOption((option) =>
          option.setName('reason').setDescription('Provide a reason for their warn')
        )
        .addStringOption((option) =>
          option.setName('duration').setDescription('Specify a duration for the warn')
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
        content: `${emojis.rightArrow2} You do not have permission to warn members.`,
        flags: MessageFlags.Ephemeral
      });
      return;
    }

    const targetMember = interaction.options.getMember('member') as GuildMember;
    const reason = interaction.options.getString('reason') ?? 'No reason provided';
    const durationStr = interaction.options.getString('duration') as StringValue;
    const duration = durationStr ? ms(durationStr) : null;
    const expiresAt = duration ? new Date(Date.now() + duration) : null;

    if (durationStr && (typeof duration !== 'number' || isNaN(duration))) {
      await interaction.reply({
        content: `${emojis.rightArrow2} Invalid duration format.`,
        flags: MessageFlags.Ephemeral
      });
      return;
    }

    if (!targetMember) {
      await interaction.reply({
        content: `${emojis.rightArrow2} That user is not in this server.`,
        flags: MessageFlags.Ephemeral
      });
      return;
    }

    if (targetMember.id === interaction.user.id) {
      await interaction.reply({
        content: `${emojis.rightArrow2} You cannot warn yourself.`,
        flags: MessageFlags.Ephemeral
      });
      return;
    }

    if (targetMember.id === interaction.guild.ownerId) {
      await interaction.reply({
        content: `${emojis.rightArrow2} You cannot warn the server owner.`,
        flags: MessageFlags.Ephemeral
      });
      return;
    }

    if (!targetMember.moderatable) {
      await interaction.reply({
        content: `${emojis.rightArrow2} I cannot warn this user.`,
        flags: MessageFlags.Ephemeral
      });
      return;
    }

    const confirm = new ButtonBuilder()
      .setCustomId('confirm')
      .setLabel('Confirm Warn')
      .setStyle(ButtonStyle.Danger);

    const cancel = new ButtonBuilder()
      .setCustomId('cancel')
      .setLabel('Cancel')
      .setStyle(ButtonStyle.Secondary);

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(cancel, confirm);

    const response = await interaction.reply({
      content: `${emojis.rightArrow1} Are you sure you want to warn <@${targetMember.user.id}> with reason: ${reason}?`,
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
          await createWarn(
            interaction.guild.id,
            interaction.guild.name,
            targetMember.id,
            interaction.user.id,
            reason,
            expiresAt
          );
          await targetMember
            .send(
              `You have been warned in **${interaction.guild.name}**.\nReason: ${reason}${
                expiresAt ? `\nExpires: <t:${Math.floor(expiresAt.getTime() / 1000)}:R>` : ''
              }`
            )
            .catch(() => {});
          await confirmation.update({
            content: `${emojis.rightArrow2} <@${targetMember.id}> has been warned with reason: ${reason}`,
            components: []
          });
        } catch (err) {
          console.error(err);
          await confirmation.update({
            content: `${emojis.rightArrow2} Failed to warn <@${targetMember.id}>`,
            components: []
          });
        }
      } else if (confirmation.customId === 'cancel') {
        await confirmation.update({
          content: `${emojis.rightArrow2} Cancelled.`,
          components: []
        });
      }
    } catch (err) {
      console.error(err);
      await interaction.editReply({
        content: `${emojis.rightArrow2} No response within a minute or errored.`,
        components: []
      });
    }
  }
}