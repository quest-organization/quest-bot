import process from 'node:process';
import { fileURLToPath } from 'node:url';
import {
  ApplicationCommandRegistries,
  RegisterBehavior,
  SapphireClient
} from '@sapphire/framework';
import { ActivityType, GatewayIntentBits } from 'discord.js';

ApplicationCommandRegistries.setDefaultBehaviorWhenNotIdentical(
  RegisterBehavior.BulkOverwrite
);

const client = new SapphireClient({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
  presence: {
    activities: [
      {
        name: '/autorole',
        type: ActivityType.Listening,
        state: 'New Feature'
      }
    ],
    status: 'online'
  },
  baseUserDirectory: fileURLToPath(new URL('.', import.meta.url))
});

void client.login(process.env.DISCORD_TOKEN);
