import { Command } from '@sapphire/framework';
import { MessageFlags } from 'discord.js';
import { createAutoRole, getAutoRole, getAutoRoles, removeAutoRole } from '#lib/autorole.js';
import { LimitError } from '#lib/limits.js';
import { emojis } from '#utils/emoji.js';

export class AutoRoleCommand extends Command {
  public constructor(context: Command.LoaderContext, options: Command.Options) {
    super(context, { ...options });
  }

  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand((builder) =>
      builder
        .setName('autorole')
        .setDescription('Automatically assign roles to new members!')
        .addSubcommand((sub) =>
          sub
            .setName('add')
            .setDescription('Create a new auto role.')
            .addRoleOption((option) =>
              option.setName('role').setDescription('The role to assign to new members').setRequired(true)
            )
            .addBooleanOption((option) =>
              option.setName('bot_role').setDescription('Whether this role should be assigned to bots').setRequired(true)
            )
        )
        .addSubcommand((sub) =>
          sub
            .setName('remove')
            .setDescription('Remove an auto role.')
            .addStringOption((option) =>
              option
                .setName('role')
                .setDescription('The auto role to remove')
                .setAutocomplete(true)
                .setRequired(true)
            )
        )
        .addSubcommand((sub) =>
            sub
                .setName('list')
                .setDescription('List all auto roles.')
        )
    );
  }

  public override async autocompleteRun(interaction: Command.AutocompleteInteraction) {
    if (!interaction.guildId) {
      await interaction.respond([]);
      return;
    }

    const focusedOption = interaction.options.getFocused(true);

    if (interaction.options.getSubcommand() !== 'remove' || focusedOption.name !== 'role') {
      await interaction.respond([]);
      return;
    }

    const autoRoles = await getAutoRoles(interaction.guildId);
    const choices = autoRoles.slice(0, 25).map((autoRole) => ({
      name: interaction.guild?.roles.cache.get(autoRole.roleId)?.name ?? autoRole.roleId,
      value: autoRole.id
    }));

    await interaction.respond(choices);
  }

  public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
    if (!interaction.inCachedGuild()) {
      await interaction.reply({
        content: `${emojis.rightArrow2} This command can only be used in a server.`,
        flags: MessageFlags.Ephemeral
      });
      return;
    }

    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'add') {
      const role = interaction.options.getRole('role', true);
      const botRole = interaction.options.getBoolean('bot_role', true);

      try {
        await createAutoRole(interaction.guildId, interaction.guild.name, role.id, botRole);
        await interaction.reply({
          content: `${emojis.rightArrow2} Added auto role ${role} (Bot Role: ${botRole}).`,
          flags: MessageFlags.Ephemeral
        });
      } catch (err) {
        console.error(err);
        if (err instanceof LimitError) {
          await interaction.reply({
            content: `${emojis.rightArrow2} ${err.message}`,
            flags: MessageFlags.Ephemeral
          });
          return;
        }

        await interaction.reply({
          content: `${emojis.rightArrow2} That role is already an auto role in this server.`,
          flags: MessageFlags.Ephemeral
        });
      }
    }

    if (subcommand === 'remove') {
      const autoRoleId = interaction.options.getString('id', true);
      const autoRole = await getAutoRole(autoRoleId);

      if (!autoRole) {
        await interaction.reply({
          content: `${emojis.rightArrow2} That auto role no longer exists.`,
          flags: MessageFlags.Ephemeral
        });
        return;
      }

      await removeAutoRole(autoRole.id);
      await interaction.reply({
        content: `${emojis.rightArrow2} Removed auto role for <@&${autoRole.roleId}>.`,
        flags: MessageFlags.Ephemeral
      });
    }

    if (subcommand === 'list') {
        const autoRoles = await getAutoRoles(interaction.guildId);
        if (autoRoles.length === 0) {
            await interaction.reply({
                content: `${emojis.rightArrow2} There are no auto roles set up in this server.`,
                flags: MessageFlags.Ephemeral
            });
            return;
        }

        const autoRoleList = autoRoles.map(autoRole => {
            const role = interaction.guild?.roles.cache.get(autoRole.roleId);
            const roleName = role ? role.name : `Unknown Role (${autoRole.roleId})`;
            const botRoleText = autoRole.botRole ? ' (Bot Role)' : '';
            return `${emojis.rightArrow1} ${roleName}${botRoleText}`;
        }).join('\n');

        await interaction.reply({
            content: `**Auto Roles:**\n${autoRoleList}`,
            flags: MessageFlags.Ephemeral
        });
    }
  }
}