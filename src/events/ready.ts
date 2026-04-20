import { ActivityType, Events } from 'discord.js';
import type { Event } from './index.js';
import { enforceMute, getActiveMutes } from '#lib/mutes.js'
import { heartbeat } from '#utils/heartbeat.js';
import { purgeExpiredWarns } from '#lib/warns.js';
import { reminderScheduler } from '#lib/reminderEvent.js';

export default {
	name: Events.ClientReady,
	once: true,
	async execute(client) {
		console.log(`Ready! Logged in as ${client.user.tag}`);
		
		heartbeat(client);
		
		reminderScheduler(client);
		purgeExpiredWarns().catch(err => console.error('[cleanup] purge failed:', err));
		
		client.user.setPresence({
            activities: [{
                name: 'custom',
                type: ActivityType.Custom,
                state: 'Upd: /reminder!',
            }],
            status: 'online',
        });
		
		const mutes = await getActiveMutes();
		for (const mute of mutes) {
			const guild = client.guilds.cache.get(mute.guildId);
			if (guild) await enforceMute(guild, mute.userId);
		}
		
		setInterval(async () => {
			await purgeExpiredWarns();
			const mutes = await getActiveMutes();
			for (const mute of mutes) {
				const guild = client.guilds.cache.get(mute.guildId);
				if (guild) await enforceMute(guild, mute.userId);
			}
		}, 6 * 60 * 60 * 1000);
	},
} satisfies Event<Events.ClientReady>;
