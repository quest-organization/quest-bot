import type { Client } from 'discord.js';

export function heartbeat(client: Client) {
    const pushURL = process.env['KUMA_PUSH_URL'];
    if (!pushURL) return;
    
    const push = async () => {
        if (!client.isReady()) return;
        try {
            await fetch(pushURL);
        } catch (err) {
            console.error("Push failed:", err);
        }
    };
    
    push();
    setInterval(push, 60_000);
}
