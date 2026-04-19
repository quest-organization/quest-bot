import { Events } from 'discord.js';
import type { Event } from './index.js';
import { enforceMute } from '#lib/mutes.js';

export default {
    name: Events.GuildMemberAdd,
    once: false,
    async execute(member) {
        await enforceMute(member.guild, member.id);
    },
} satisfies Event<Events.GuildMemberAdd>;
