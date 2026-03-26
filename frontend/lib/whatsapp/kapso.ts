import { WhatsAppClient } from '@kapso/whatsapp-cloud-api'

function getClient() {
    return new WhatsAppClient({
        baseUrl: 'https://api.kapso.ai/meta/whatsapp',
        kapsoApiKey: process.env.KAPSO_API_KEY!
    })
}

export async function sendWhatsAppMessage(phone: string, text: string): Promise<void> {
    const result = await getClient().messages.sendText({
        phoneNumberId: process.env.KAPSO_PHONE_NUMBER_ID!,
        to: phone,
        body: text,
    })
    console.log(`[Kapso] sendText to ${phone}:`, JSON.stringify(result))
}

export async function downloadKapsoMedia(mediaUrl: string): Promise<Buffer> {
    const res = await fetch(mediaUrl, {
        headers: { "Authorization": `Bearer ${process.env.KAPSO_API_KEY}` },
    })
    if (!res.ok) throw new Error(`[Kapso] media download failed: ${res.status}`)
    return Buffer.from(await res.arrayBuffer())
}
