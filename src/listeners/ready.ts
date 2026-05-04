import { Listener } from '@sapphire/framework';
import { Events, type Client } from 'discord.js';
import { enforceMute, getActiveMutes } from '#lib/mutes.js';
import { heartbeat } from '#utils/heartbeat.js';
import { purgeExpiredBans } from '#lib/bans.js';
import { reminderScheduler } from '#lib/reminderEvent.js';
import { purgeExpiredWarns } from '#lib/warns.js';

export class ReadyListener extends Listener<typeof Events.ClientReady> {
  public constructor(context: Listener.LoaderContext, options: Listener.Options) {
    super(context, {
      ...options,
      once: true,
      event: Events.ClientReady
    });
  }

  public async run(client: Client<true>) {
    console.log(`Ready! Logged in as ${client.user.tag}`);

    heartbeat(client);
    reminderScheduler(client);

    const enforceMutes = async () => {
      const mutes = await getActiveMutes();
      for (const mute of mutes) {
        const guild = client.guilds.cache.get(mute.guildId);
        if (guild) await enforceMute(guild, mute.userId).catch((err) => console.error(err));
      }
    };

    await enforceMutes().catch((err) => console.error(err));
    purgeExpiredWarns().catch((err) => console.error(err));
    purgeExpiredBans(client).catch((err) => console.error(err));

    setInterval(() => {
      purgeExpiredWarns().catch((err) => console.error(err));
      purgeExpiredBans(client).catch((err) => console.error(err));
    }, 60 * 1000); // 1 min

    setInterval(() => {
      enforceMutes().catch((err) => console.error(err));
    }, 30 * 60 * 1000); // 30 min
  }
}