import type { Command } from '../index.js';
import { emojis } from '#utils/emoji.js';

export default {
	data: {
		name: 'bot',
		description: `Get a link to add the bot to your server!`,
	},
	async execute(interaction) {
		await interaction.reply(`${emojis.rightArrow1} https://questfoundation.dev/bot/invite`);
	},
} satisfies Command;
