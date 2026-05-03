import type { Command } from './index.js';
import { emojis } from '#utils/emoji.js';

export default {
	data: {
		name: 'ping',
		description: `Return the bot's latency.`,
	},
	async execute(interaction) {
		await interaction.deferReply();
		
		const reply = await interaction.fetchReply();
		
		const ping = reply.createdTimestamp - interaction.createdTimestamp;
		
		interaction.editReply(`${emojis.rightArrow1} Client: ${ping}ms\n${emojis.rightArrow1} Websocket: ${interaction.client.ws.ping}ms`)
	},
} satisfies Command;
