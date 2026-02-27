export interface DiscordMessage {
    content?: string;
    embeds?: {
        title?: string;
        description?: string;
        color?: number;
        fields?: { name: string; value: string; inline?: boolean }[];
        footer?: { text: string };
        timestamp?: string;
    }[];
}

export async function sendDiscordNotification(message: DiscordMessage) {
    const webhookUrl = process.env.DISCORD_WEBHOOK_URL;

    if (!webhookUrl) {
        console.warn('DISCORD_WEBHOOK_URL not set, skipping notification');
        return;
    }

    try {
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ...message,
                username: 'Commission Alert Bot',
                avatar_url: 'https://atharvasherlekar.com/logo.png', // Fallback to logo
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`Discord Webhook failed: ${response.status} ${errorText}`);
        }
    } catch (error) {
        console.error('Error sending Discord notification:', error);
    }
}
