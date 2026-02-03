import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { sendTextMessage } from "@/lib/whatsapp"

// Generate 6-digit verification code
function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

// POST: Initiate WhatsApp connection
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { phoneNumber } = await req.json()

    if (!phoneNumber) {
      return NextResponse.json({ error: "Phone number required" }, { status: 400 })
    }

    // Format phone number (ensure it starts with country code)
    let formattedNumber = phoneNumber.replace(/\D/g, "")
    if (!formattedNumber.startsWith("966")) {
      formattedNumber = "966" + formattedNumber.replace(/^0/, "")
    }

    // Generate verification code
    const code = generateCode()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

    // Upsert WhatsApp connection
    const { error: upsertError } = await supabase
      .from("whatsapp_connections")
      .upsert({
        user_id: user.id,
        phone_number: formattedNumber,
        verification_code: code,
        verification_expires_at: expiresAt.toISOString(),
        is_verified: false,
      }, {
        onConflict: "user_id",
      })

    if (upsertError) {
      console.error("[WhatsApp Connect] Upsert error:", upsertError)
      return NextResponse.json({ error: "Database error" }, { status: 500 })
    }

    // Send verification code via WhatsApp
    const sent = await sendTextMessage(
      formattedNumber,
      `🔐 رمز التحقق الخاص بك في ذكرني: *${code}*\n\nصالح لمدة 10 دقائق.`
    )

    if (!sent) {
      return NextResponse.json({ error: "Failed to send message" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[WhatsApp Connect] Error:", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}

// PUT: Verify code
export async function PUT(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { code } = await req.json()

    if (!code) {
      return NextResponse.json({ error: "Code required" }, { status: 400 })
    }

    // Get connection
    const { data: connection } = await supabase
      .from("whatsapp_connections")
      .select("*")
      .eq("user_id", user.id)
      .single()

    if (!connection) {
      return NextResponse.json({ error: "No pending connection" }, { status: 404 })
    }

    // Check if code matches and not expired
    if (connection.verification_code !== code) {
      return NextResponse.json({ error: "Invalid code" }, { status: 400 })
    }

    if (new Date(connection.verification_expires_at) < new Date()) {
      return NextResponse.json({ error: "Code expired" }, { status: 400 })
    }

    // Mark as verified
    await supabase
      .from("whatsapp_connections")
      .update({
        is_verified: true,
        verification_code: null,
        verification_expires_at: null,
      })
      .eq("user_id", user.id)

    // Send welcome message
    await sendTextMessage(
      connection.phone_number,
      "🎉 تم ربط حسابك بنجاح!\n\nيمكنك الآن:\n• إرسال 'ذكرني...' لإنشاء تذكير\n• إرسال 'مهمة...' لإضافة مهمة\n• إرسال اسم منتج لإضافته للتسوق\n\nأرسل 'مساعدة' للمزيد."
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[WhatsApp Verify] Error:", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}

// DELETE: Disconnect WhatsApp
export async function DELETE() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await supabase
      .from("whatsapp_connections")
      .delete()
      .eq("user_id", user.id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[WhatsApp Disconnect] Error:", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}

// GET: Get connection status
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: connection } = await supabase
      .from("whatsapp_connections")
      .select("phone_number, is_verified")
      .eq("user_id", user.id)
      .single()

    return NextResponse.json({
      connected: !!connection?.is_verified,
      phoneNumber: connection?.phone_number,
    })
  } catch (error) {
    console.error("[WhatsApp Status] Error:", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
