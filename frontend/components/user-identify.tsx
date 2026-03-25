"use client"
import { useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { identifyUser } from "@/lib/analytics"

export function UserIdentify() {
  useEffect(() => {
    createClient().auth.getUser().then(({ data: { user } }) => {
      if (user) identifyUser(user.id, user.email)
    })
  }, [])
  return null
}
