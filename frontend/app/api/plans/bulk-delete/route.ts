import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { parseBody, isValidUUID } from "@/lib/validate"

export async function DELETE(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const [body, parseErr] = await parseBody<{ ids?: unknown[] }>(req, 65_536)
  if (parseErr) return parseErr

  const { ids } = body
  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: "No IDs provided" }, { status: 400 })
  }
  if (ids.length > 500) {
    return NextResponse.json({ error: "Too many IDs in a single request (max 500)" }, { status: 400 })
  }

  const validIds = ids.filter((id): id is string => typeof id === "string" && isValidUUID(id))
  if (validIds.length === 0) {
    return NextResponse.json({ error: "No valid IDs provided" }, { status: 400 })
  }

  const { error: deleteError } = await supabase
    .from("plans")
    .delete()
    .in("id", validIds)
    .eq("user_id", user.id)

  if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 })
  return NextResponse.json({ deleted: validIds.length })
}
