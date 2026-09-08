// QuestBot: A free and open-source Discord Bot.
// Copyright(C) 2026 Vantern
// SPDX-License-Identifier: AGPL-3.0-or-later

import { Command } from '@sapphire/framework';
import {
	MessageFlags,
	type SlashCommandBuilder,
	type SlashCommandIntegerOption,
	type SlashCommandSubcommandBuilder,
} from 'discord.js';
import { isValidDate, removeBirthday, setBirthday } from '#lib/birthdays.js';
import { getSettings } from '#lib/settings.js';
import { errorEmbed, infoEmbed, successEmbed } from '#utils/embeds.js';
import { emojis } from '#utils/emoji.js';

const MONTH_FORMAT = new Intl.DateTimeFormat('en-GB', { month: 'long', timeZone: 'UTC' });

function monthName(month: number): string {
	return MONTH_FORMAT.format(Date.UTC(2024, month - 1, 1));
}

export class BirthdayCommand extends Command {
	public constructor(context: Command.LoaderContext, options: Command.Options) {
		super(context, { ...options, preconditions: ['devMode'] });
	}

	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand((builder: SlashCommandBuilder) =>
			builder
				.setName('birthday')
				.setDescription(`Let everyone know when it's your birthday!`)
				.addSubcommand((subcommand: SlashCommandSubcommandBuilder) =>
					subcommand
						.setName('set')
						.setDescription('Set your birthday.')
						.addIntegerOption((option: SlashCommandIntegerOption) =>
							option.setName('day').setDescription('Day of the month').setRequired(true).setMinValue(1).setMaxValue(31),
						)
						.addIntegerOption((option: SlashCommandIntegerOption) =>
							option
								.setName('month')
								.setDescription('Month of the year')
								.setRequired(true)
								.setMinValue(1)
								.setMaxValue(12),
						),
				)
				.addSubcommand((subcommand: SlashCommandSubcommandBuilder) =>
					subcommand.setName('remove').setDescription('Remove your birthday.'),
				),
		);
	}

	public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
		if (!interaction.inCachedGuild()) {
			await interaction.reply({
				embeds: [errorEmbed(`${emojis.rightArrow2} This command can only be used in a server.`)],
				flags: MessageFlags.Ephemeral,
			});
			return;
		}

		if (interaction.options.getSubcommand() === 'remove') {
			await removeBirthday(interaction.user.id);

			await interaction.reply({
				embeds: [successEmbed(`${emojis.rightArrow2} Your birthday has been removed.`)],
				flags: MessageFlags.Ephemeral,
			});
			return;
		}

		const day = interaction.options.getInteger('day', true);
		const month = interaction.options.getInteger('month', true);

		if (!isValidDate(day, month)) {
			await interaction.reply({
				embeds: [errorEmbed(`${emojis.rightArrow2} ${monthName(month)} doesn't have a day ${day}.`)],
				flags: MessageFlags.Ephemeral,
			});
			return;
		}

		await setBirthday(interaction.user.id, day, month);

		const settings = await getSettings(interaction.guild.id);
		const note =
			settings.birthdayEnabled && settings.birthdayChannelId
				? `${emojis.rightArrow2} I'll wish you a happy birthday in <#${settings.birthdayChannelId}> and in your DMs.`
				: `${emojis.rightArrow2} Birthday announcements are off in this server, so nothing will be posted here.\n${emojis.rightArrow2} ...but don't worry! I will still wish you a happy birthday in your DMs.`;

		await interaction.reply({
			embeds: [infoEmbed(`${emojis.rightArrow2} Your birthday is set to **${day} ${monthName(month)}**.\n${note}`)],
			flags: MessageFlags.Ephemeral,
		});
	}
}
