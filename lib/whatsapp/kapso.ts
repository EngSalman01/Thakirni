// ── Kapso WhatsApp Client ─────────────────────────────────────────────────────
// Docs: https://kapso.ai/docs

const KAPSO_API_URL = "https://api.kapso.ai/v1"

export async function sendWhatsAppMessage(
    phone: string,
    text: string,
): Promise<void> {
    const res = await fetch(`${KAPSO_API_URL}/messages`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${process.env.KAPSO_API_KEY}`,
        },
        body: JSON.stringify({
            phone_number_id: process.env.KAPSO_PHONE_NUMBER_ID,
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