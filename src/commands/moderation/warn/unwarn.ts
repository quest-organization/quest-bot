import { Command } from '@sapphire/framework';
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  GuildMember,
  MessageFlags,
  PermissionsBitField
} from 'discord.js';
import { getWarn, removeWarn } from '#lib/warns.js';
import { emojis } from '#utils/emoji.js';

export class UnwarnCommand extends Command {
  public constructor(context: Command.LoaderContext, options: Command.Options) {
    super(context, { ...options });
  }

  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand((builder) =>
      builder
        .setName('unwarn')
        .setDescription('Unwarn someone in the discord server.')
        .addStringOption((option) =>
          option.setName('id').setDescription('The ID of the warn to remove').setRequired(true)
        )
        .addStringOption((option) =>
          option.setName('reason').setDescription('Provide a reason for removing the warn')
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
        content: `${emojis.rightArrow2} You do not have permission to remove warns.`,
        flags: MessageFlags.Ephemeral
      });
      return;
    }

    const warnId = interaction.options.getString('id', true);
    const reason = interaction.options.getString('reason') ?? 'No reason provided';

    const warn = await getWarn(warnId, interaction.guild.id);

    if (!warn) {
      await interaction.reply({
        content: `${emojis.rightArrow2} No warn found with that ID in this server.`,
        flags: MessageFlags.Ephemeral
      });
      return;
    }

    const confirm = new ButtonBuilder()
      .setCustomId('confirm')
      .setLabel('Confirm Unwarn')
      .setStyle(ButtonStyle.Danger);

    const cancel = new ButtonBuilder()
      .setCustomId('cancel')
      .setLabel('Cancel')
      .setStyle(ButtonStyle.Secondary);

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(cancel, confirm);

    const response = await interaction.reply({
      content: `${emojis.rightArrow1} Are you sure you want to unwarn <@${warn.userId}> with reason: ${reason}?\n${emojis.rightArrow2} They were warned for: ${warn.reason} <t:${Math.floor(warn.createdAt.getTime() / 1000)}:R>`,
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
          await removeWarn(warn.id);
          const user = await interaction.client.users.fetch(warn.userId);
          await user
            .send(
              `Your warn for ${warn.reason} in **${interaction.guild.name}** has been removed.\nReason: ${reason}`
            )
            .catch(() => {});
          await confirmation.update({
            content: `${emojis.rightArrow2} \`${warn.id}\` has been removed from <@${warn.userId}>. Reason: ${reason}`,
            components: []
          });
        } catch (err) {
          console.error(`Failed to remove warn ${warn.id}:`, err);
          await confirmation.update({
            content: `${emojis.rightArrow2} Failed to remove warn \`${warn.id}\` from <@${warn.userId}>.`,
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