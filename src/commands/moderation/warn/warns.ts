import { Command } from '@sapphire/framework';
import { GuildMember, MessageFlags, PermissionsBitField } from 'discord.js';
import { getWarns } from '#lib/warns.js';
import { emojis } from '#utils/emoji.js';

export class WarnsCommand extends Command {
  public constructor(context: Command.LoaderContext, options: Command.Options) {
    super(context, { ...options });
  }

  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand((builder) =>
      builder
        .setName('warns')
        .setDescription('View (someones) warns.')
        .addUserOption((option) =>
          option.setName('member').setDescription('Member to view warns of')
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
    const targetOption = interaction.options.getMember('member') as GuildMember;

    if (targetOption && targetOption.id !== interaction.user.id) {
      if (!member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
        await interaction.reply({
          content: `${emojis.rightArrow2} You do not have permission to view other members' warns.`,
          flags: MessageFlags.Ephemeral
        });
        return;
      }
    }

    const targetMember = targetOption ?? member;
    const active = await getWarns(interaction.guild.id, targetMember.id);

    if (active.length === 0) {
      await interaction.reply({
        content: `${emojis.rightArrow2} <@${targetMember.user.id}> has no active warns.`,
        flags: MessageFlags.Ephemeral
      });
      return;
    }

    const lines = active.slice(0, 10).map((warn) => {
      const expires = warn.expiresAt
        ? `<t:${Math.floor(warn.expiresAt.getTime() / 1000)}:R>`
        : 'Never';
      return `${emojis.rightArrow2} **${warn.reason ?? 'No reason provided'}** by <@${warn.moderatorId}>\n<t:${Math.floor(warn.createdAt.getTime() / 1000)}:R> Expires: ${expires} \`${warn.id}\``;
    });

    const content = `${emojis.rightArrow1} ${active.length} active warn(s) for <@${targetMember.user.id}>:\n${lines.join('\n')}`;

    await interaction.reply({ content });
  }
}