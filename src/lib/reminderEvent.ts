import type { Client } from 'discord.js';
import { emojis } from '#utils/emoji.js';
import { getDueReminders, removeReminder } from './reminders.js';

export function reminderScheduler(client: Client) {
    const checkReminders = async () => {
        try {
            const due = await getDueReminders();
            
            for (const reminder of due) {
                try {
                    if (reminder.channelId){
                        const channel = await client.channels.fetch(reminder.channelId).catch(() => null);
                        
                        if (channel?.isSendable()) {
                            await channel.send({
                                content: `${emojis.rightArrow2} <@${reminder.userId}> reminder: ${reminder.message ?? 'No reason provided'}`,}
                            );
                        }
                    } else {
                        await dmUser(client, reminder.userId, reminder.message);
                    }
                    
                    await removeReminder(reminder.id);
                } catch (err) {
                    console.error(err);
                }
                
            }
        } catch (err) {
            console.error(err)
        }
    }
    checkReminders();
    setInterval(checkReminders, 30_000);
}

async function dmUser(client: Client, userId: string, message: string ){
    const user = await client.users.fetch(userId).catch(() => null);
    if (!user) return;
    
    await user.send({
        content: `${emojis.rightArrow2} <@${userId}> reminder: ${message}`,
    }).catch(() => {});
}
