import { ActivityType, Events } from 'discord.js';
import type { Event } from './index.js';
import { enforceMute, getActiveMutes } from '#lib/mutes.js'
import { heartbeat } from '#utils/heartbeat.js';
import { purgeExpiredBans } from '#lib/bans.js';
import { reminderScheduler } from '#lib/reminderEvent.js';
import { purgeExpiredWarns } from '#lib/warns.js';

export default {
	name: Events.ClientReady,
	once: true,
	async execute(client) {
		console.log(`Ready! Logged in as ${client.user.tag}`);
		
		heartbeat(client);
		
		reminderScheduler(client);
		
		client.user.setPresence({
            activities: [{
                name: 'custom',
                type: ActivityType.Custom,
                state: 'Upd: /reminder!',
            }],
            status: 'online',
        });
		
		const enforceMutes = async () => {
			const mutes = await getActiveMutes();
			for (const mute of mutes) {
				const guild = client.guilds.cache.get(mute.guildId);
				if (guild) await enforceMute(guild, mute.userId);
			}
		}
		
		
		await enforceMutes();
		purgeExpiredWarns();
		purgeExpiredBans(client);
		
		setInterval(async () => {
			await enforceMutes();
			purgeExpiredWarns().catch(err => console.error(err));
			purgeExpiredBans(client).catch(err => console.error(err));
		}, 30 * 60 * 1000); // 30 min
	},
} satisfies Event<Events.ClientReady>;
