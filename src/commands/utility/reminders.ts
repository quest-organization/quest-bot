import type { Command } from '../index.js';
import { MessageFlags } from 'discord.js';
import { emojis } from '#utils/emoji.js';
import { getReminders } from '#lib/reminders.js';

export default {
    data: {
        name: 'reminders',
        description: 'List your current reminders.',
    },
    async execute(interaction) {
        const reminders = interaction.inCachedGuild()
            ? await getReminders(interaction.user.id, interaction.guild.id)
            : await getReminders(interaction.user.id);

        if (reminders.length === 0) {
            await interaction.reply({
                content: `${emojis.rightArrow2} You have no active reminders${interaction.inCachedGuild() ? ' in this server' : ''}.`,
                flags: MessageFlags.Ephemeral,
            });
            return;
        }

        const lines = reminders.map((r) => {
            const unix = Math.floor(r.remindAt.getTime() / 1000);
            return `<t:${unix}:R> | ${r.message}\n \`${r.id}\``;
        });

        await interaction.reply({
            content: `${emojis.rightArrow2} Your reminders:\n${lines.join('\n')}`,
            flags: MessageFlags.Ephemeral,
        });
    },
} satisfies Command;
