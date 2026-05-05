import process from 'node:process';
import { ShardingManager } from 'discord.js';

const shardCountEnv = process.env.SHARD_COUNT;
let totalShards: number | 'auto' | undefined;
if (shardCountEnv) {
	if (shardCountEnv === 'auto') totalShards = 'auto';
	else {
		const parsed = Number(shardCountEnv);
		if (Number.isInteger(parsed) && parsed > 0) totalShards = parsed;
	}
}

if (totalShards !== undefined) {
	console.log(`Shard count: ${shardCountEnv}`);
} else {
	console.log('No shard count provided using what Discord recommends.');
}

const manager = new ShardingManager('./dist/index.js', {
	token: process.env.DISCORD_TOKEN,
	...(totalShards ? { totalShards } : {})
});

manager.on('shardCreate', (shard) => {
	console.log(`Launched shard ${shard.id}`);
});

void manager.spawn();
