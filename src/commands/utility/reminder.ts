import type { Command } from '../index.js';
import { ApplicationCommandOptionType, MessageFlags } from 'discord.js';
import { emojis } from '#utils/emoji.js';
import ms, { type StringValue } from 'ms';
import { createReminder, getReminder, removeReminder } from '#lib/reminders.js';

export default {
    data: {
        name: 'reminder',
        description: 'Set reminders!',
        options: [
            {
                type: ApplicationCommandOptionType.Subcommand,
                name: 'add',
                description: 'Set a new reminder.',
                options: [
                    {
                        type: ApplicationCommandOptionType.String,
                        name: 'duration',
                        description: 'When to remind you',
                        required: true,
                    },
                    {
                        type: ApplicationCommandOptionType.String,
                        name: 'message',
                        description: 'What to remind you about',
                        required: true,
                    },
                ],
            },
            {
                type: ApplicationCommandOptionType.Subcommand,
                name: 'remove',
                description: 'Cancel a reminder.',
                options: [
                    {
                        type: ApplicationCommandOptionType.String,
                        name: 'id',
                        description: 'The reminder ID',
                        required: true,
                    },
                ],
            },
        ],
    },
    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'add') {
            
            const durationStr = interaction.options.getString('duration', true);
            const message = interaction.options.getString('message', true);

            const duration = ms(durationStr as StringValue);
            if (typeof duration !== 'number' || isNaN(duration) || duration <= 0) {
                await interaction.reply({
                    content: `${emojis.rightArrow2} Invalid duration.`,
                    flags: MessageFlags.Ephemeral,
                });
                return;
            }

            if (duration > 31536000000 ) {
                await interaction.reply({
                    content: `${emojis.rightArrow2} Reminder cannot be longer than 1 year.`,
                    flags: MessageFlags.Ephemeral,
                });
                return;
            }

            const remindAt = new Date(Date.now() + duration);

            const reminder = interaction.inCachedGuild()
                ? await createReminder(
                    interaction.user.id,
                    message,
                    remindAt,
                    interaction.guild.id,
                    interaction.guild.name,
                    interaction.channelId,
                )
                : await createReminder(interaction.user.id, message, remindAt);

            const unix = Math.floor(remindAt.getTime() / 1000);
            await interaction.reply({
                content: `${emojis.rightArrow2} Reminder set to go off in <t:${unix}:R> message: ${message}\nID: \`${reminder.id}\``,
            });
            
            setTimeout(() => {
                interaction.deleteReply().catch(() => {});
    	    }, 3000);
            return;
        }

        if (subcommand === 'remove') {
            const id = interaction.options.getString('id', true);
            const reminder = await getReminder(id);

            if (!reminder) {
                await interaction.reply({
                    content: `${emojis.rightArrow2} No reminder found.`,
                    flags: MessageFlags.Ephemeral,
                });
                return;
            }

            if (reminder.userId !== interaction.user.id) {
                await interaction.reply({
                    content: `${emojis.rightArrow2} You can't remove other's reminders.`,
                    flags: MessageFlags.Ephemeral,
                });
                return;
            }

            await removeReminder(id);
            await interaction.reply({
                content: `${emojis.rightArrow2} Reminder removed.`,
                flags: MessageFlags.Ephemeral,
            });
            
            setTimeout(() => {
                interaction.deleteReply().catch(() => {});
            }, 3000);
            return;
        }
    },
} satisfies Command;
