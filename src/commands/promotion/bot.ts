import type { Command } from '../index.js';
import { emojis } from '#utils/emoji.js';

export default {
	data: {
		name: 'bot',
		description: `Get a link to add the bot to your server!`,
	},
	async execute(interaction) {
		await interaction.reply(`${emojis.rightArrow1} https://discord.com/oauth2/authorize?client_id=1494686224508522579\n❤️ Thanks!`);
	},
} satisfies Command;
