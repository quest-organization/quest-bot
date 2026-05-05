import process from 'node:process';
import { ShardingManager } from 'discord.js';

const manager = new ShardingManager('./dist/index.js', {
	token: process.env.DISCORD_TOKEN,
	totalShards: 2
});

manager.on('shardCreate', (shard) => {
	console.log(`Launched shard ${shard.id}`);
});

void manager.spawn();
