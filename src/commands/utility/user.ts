import type { Command } from '../index.js';
import { emojis } from '#utils/emoji.js';

export default {
	data: {
		name: 'user',
		description: 'Provides information about the user.',
	},
	async execute(interaction) {
		await interaction.reply(`${emojis.rightArrow2} This command was run by **${interaction.user.username}**.`);
	},
} satisfies Command;
