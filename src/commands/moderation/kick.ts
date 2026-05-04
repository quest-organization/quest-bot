import { Command } from '@sapphire/framework';
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  GuildMember,
  MessageFlags,
  PermissionsBitField
} from 'discord.js';
import { emojis } from '#utils/emoji.js';

export class KickCommand extends Command {
  public constructor(context: Command.LoaderContext, options: Command.Options) {
    super(context, { ...options });
  }

  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand((builder) =>
      builder
        .setName('kick')
        .setDescription('Kick someone from the discord server.')
        .addUserOption((option) =>
          option.setName('member').setDescription('Select a member to kick').setRequired(true)
        )
        .addStringOption((option) =>
          option.setName('reason').setDescription('Provide a reason for their kick')
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

    if (!member.permissions.has(PermissionsBitField.Flags.KickMembers)) {
      await interaction.reply({
        content: `${emojis.rightArrow2} You do not have permission to kick members.`,
        flags: MessageFlags.Ephemeral
      });
      return;
    }

    const targetMember = interaction.options.getMember('member');
    const reason = interaction.options.getString('reason') ?? 'No reason provided';

    if (!targetMember) {
      await interaction.reply({
        content: `${emojis.rightArrow2} That user is not in this server.`,
        flags: MessageFlags.Ephemeral
      });
      return;
    }

    if (targetMember.id === interaction.user.id) {
      await interaction.reply({
        content: `${emojis.rightArrow2} You cannot kick yourself.`,
        flags: MessageFlags.Ephemeral
      });
      return;
    }

    if (targetMember.id === interaction.guild.ownerId) {
      await interaction.reply({
        content: `${emojis.rightArrow2} You cannot kick the server owner.`,
        flags: MessageFlags.Ephemeral
      });
      return;
    }

    if (!targetMember.kickable) {
      await interaction.reply({
        content: `${emojis.rightArrow2} I cannot kick this user.`,
        flags: MessageFlags.Ephemeral
      });
      return;
    }

    const confirm = new ButtonBuilder()
      .setCustomId('confirm')
      .setLabel('Confirm Kick')
      .setStyle(ButtonStyle.Danger);

    const cancel = new ButtonBuilder()
      .setCustomId('cancel')
      .setLabel('Cancel')
      .setStyle(ButtonStyle.Secondary);

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(cancel, confirm);

    const response = await interaction.reply({
      content: `${emojis.rightArrow1} Are you sure you want to kick <@${targetMember.user.id}> with reason: ${reason}?`,
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
          await interaction.guild.members.kick(targetMember);
          await targetMember
            .send(`You have been kicked from **${interaction.guild.name}**.\nReason: ${reason}`)
            .catch(() => {});
          await confirmation.update({
            content: `${emojis.rightArrow2} <@${targetMember.user.id}> has been kicked with reason: ${reason}\nYou must have had a real ick towards that person.`,
            components: []
          });
        } catch (err) {
          console.error(err);
          await confirmation.update({
            content: `${emojis.rightArrow2} Failed to kick <@${targetMember.user.id}> with reason: ${reason}\nYou must have had a real ick towards that person.`,
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