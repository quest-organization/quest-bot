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
import { createMute, enforceMute } from '#lib/mutes.js';
import { emojis } from '#utils/emoji.js';

export class MuteCommand extends Command {
  public constructor(context: Command.LoaderContext, options: Command.Options) {
    super(context, { ...options });
  }

  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand((builder) =>
      builder
        .setName('mute')
        .setDescription('Mute someone in the discord server.')
        .addUserOption((option) =>
          option.setName('member').setDescription('Select a member to mute').setRequired(true)
        )
        .addStringOption((option) =>
          option.setName('duration').setDescription('Specify a duration for the mute')
        )
        .addStringOption((option) =>
          option.setName('reason').setDescription('Provide a reason for their mute')
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
        content: `${emojis.rightArrow2} You do not have permission to mute members.`,
        flags: MessageFlags.Ephemeral
      });
      return;
    }

    const targetMember = interaction.options.getMember('member') as GuildMember;
    const reason = interaction.options.getString('reason') ?? 'No reason provided';
    const durationStr = interaction.options.getString('duration') as StringValue;
    const duration = durationStr ? ms(durationStr) : null;
    const expiresAt = duration ? new Date(Date.now() + duration) : null;

    if (!targetMember) {
      await interaction.reply({
        content: `${emojis.rightArrow2} That user is not in this server.`,
        flags: MessageFlags.Ephemeral
      });
      return;
    }

    if (durationStr && (typeof duration !== 'number' || isNaN(duration))) {
      await interaction.reply({
        content: `${emojis.rightArrow2} Invalid duration format.`,
        flags: MessageFlags.Ephemeral
      });
      return;
    }

    if (targetMember.id === interaction.user.id) {
      await interaction.reply({
        content: `${emojis.rightArrow2} You cannot mute yourself.`,
        flags: MessageFlags.Ephemeral
      });
      return;
    }

    if (targetMember.id === interaction.guild.ownerId) {
      await interaction.reply({
        content: `${emojis.rightArrow2} You cannot mute the server owner.`,
        flags: MessageFlags.Ephemeral
      });
      return;
    }

    if (!targetMember.moderatable) {
      await interaction.reply({
        content: `${emojis.rightArrow2} I cannot mute this user.`,
        flags: MessageFlags.Ephemeral
      });
      return;
    }

    const confirm = new ButtonBuilder()
      .setCustomId('confirm')
      .setLabel('Confirm Mute')
      .setStyle(ButtonStyle.Danger);

    const cancel = new ButtonBuilder()
      .setCustomId('cancel')
      .setLabel('Cancel')
      .setStyle(ButtonStyle.Secondary);

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(cancel, confirm);

    const response = await interaction.reply({
      content: `${emojis.rightArrow1} Are you sure you want to mute <@${targetMember.user.id}> with reason: ${reason}?`,
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
        await createMute(
          interaction.guild.id,
          interaction.guild.name,
          targetMember.id,
          expiresAt,
          reason
        );

        await targetMember
          .send(
            `You have been muted in **${interaction.guild.name}**.\nReason: ${reason}${
              expiresAt ? `\nExpires: <t:${Math.floor(expiresAt.getTime() / 1000)}:R>` : ''
            }`
          )
          .catch(() => {});

        await enforceMute(interaction.guild, targetMember.id);
        await confirmation.update({
          content: `${emojis.rightArrow2} <@${targetMember.user.id}> has been muted with reason: ${reason}${
            expiresAt ? `\nExpires: <t:${Math.floor(expiresAt.getTime() / 1000)}:R>` : ''
          }`,
          components: []
        });
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