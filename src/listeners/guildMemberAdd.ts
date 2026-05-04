import { Listener } from '@sapphire/framework';
import { Events, type GuildMember } from 'discord.js';
import { enforceMute } from '#lib/mutes.js';
import { sendWelcome } from '#lib/welcomeModule.js';

export class GuildMemberAddListener extends Listener<typeof Events.GuildMemberAdd> {
  public constructor(context: Listener.LoaderContext, options: Listener.Options) {
    super(context, {
      ...options,
      event: Events.GuildMemberAdd
    });
  }

  public async run(member: GuildMember) {
    await enforceMute(member.guild, member.id).catch((err) => console.error(err));
    await sendWelcome(member).catch((err) => console.error(err));
  }
}