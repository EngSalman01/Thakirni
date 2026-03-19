import useSWR from "swr"
import { createClient } from "@/lib/supabase/client"

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001"

async function fetcher(url: string): Promise<Record<string, unknown>[]> {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return []

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${session.access_token}` },
  })
  if (!res.ok) return []
  const data = await res.json() as { meetings?: Record<string, unknown>[] }
  return data.meetings ?? []
}

export function useMeetings() {
  const { data, error, mutate } = useSWR(
    `${API_URL}/api/meetings`,
    fetcher,
    { refreshInterval: 0 }
  )

  return {
    meetings: data ?? [],
    isLoading: !error && !data,
    isError: !!error,
    mutate,
  }
}
