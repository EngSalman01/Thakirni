// ── Kapso WhatsApp Client ─────────────────────────────────────────────────────
// Docs: https://docs.kapso.ai

export async function sendWhatsAppMessage(
    phone: string,
    text: string,
): Promise<void> {
    const phoneNumberId = process.env.KAPSO_PHONE_NUMBER_ID
    const url = `https://api.kapso.ai/meta/whatsapp/v24.0/${phoneNumberId}/messages`

    const res = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${process.env.KAPSO_API_KEY}`,
        },
        body: JSON.stringify({
            messaging_product: "whatsapp",
            to: phone,
            type: "text",
            text: { body: text },
        }),
    })

    if (!res.ok) {
        const err = await res.text()
        throw new Error(`[Kapso] sendMessage failed: ${res.status} ${err}`)
    }
}

export async function downloadKapsoMedia(mediaUrl: string): Promise<Buffer> {
    const res = await fetch(mediaUrl, {
        headers: { "Authorization": `Bearer ${process.env.KAPSO_API_KEY}` },
    })
    if (!res.ok) throw new Error(`[Kapso] media download failed: ${res.status}`)
    return Buffer.from(await res.arrayBuffer())
}