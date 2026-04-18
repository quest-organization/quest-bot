import { URL } from 'node:url';
import { Events, MessageFlags } from 'discord.js';
import { loadCommands } from '../util/loaders.js';
import type { Event } from './index.js';

const commands = await loadCommands(new URL('../commands/', import.meta.url));

const DEV_IDS = new Set(
	(process.env['DEVIDS'] ?? '')
		.split(',')
		.map((id) => id.trim())
		.filter(Boolean),
);

const DEV_MODE = process.env['DEV'] === 'true'

export default {
	name: Events.InteractionCreate,
	async execute(interaction) {
		if (!interaction.isChatInputCommand()) return;
		
		if (DEV_MODE && !DEV_IDS.has(interaction.user.id)) {
			await interaction.reply({
				content: 'Please use the Official Quest Bot.\n\nThis bot is currently undergoing testing by a developer.',
				flags: MessageFlags.Ephemeral,
			});
			return;
		}
		

		const command = commands.get(interaction.commandName);

		if (!command) {
			throw new Error(`Command '${interaction.commandName}' not found.`);
		}
		
		await command.execute(interaction);

	},
} satisfies Event<Events.InteractionCreate>;
