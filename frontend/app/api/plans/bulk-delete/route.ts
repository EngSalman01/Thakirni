import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function DELETE(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { ids } = await req.json() as { ids?: string[] }
  if (!ids?.length) return NextResponse.json({ error: "No IDs provided" }, { status: 400 })

  const { error: deleteError } = await supabase
    .from("plans")
    .delete()
    .in("id", ids)
    .eq("user_id", user.id)

  if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 })
  return NextResponse.json({ deleted: ids.length })
}
