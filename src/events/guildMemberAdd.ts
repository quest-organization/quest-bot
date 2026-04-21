import { Events } from 'discord.js';
import type { Event } from './index.js';
import { enforceMute } from '#lib/mutes.js';
import { sendWelcome } from '#lib/welcomeModule.js';

export default {
    name: Events.GuildMemberAdd,
    once: false,
    async execute(member) {
        await enforceMute(member.guild, member.id).catch((err) => console.error(err));
        await sendWelcome(member).catch((err) => console.error(err));
    },
} satisfies Event<Events.GuildMemberAdd>;
