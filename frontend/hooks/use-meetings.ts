import useSWR from "swr"
import { createClient } from "@/lib/supabase/client"

async function fetcher(url: string): Promise<Record<string, unknown>[]> {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return []

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${session.access_token}` },
  })
  if (!res.ok) throw new Error(`Failed to fetch meetings: ${res.status}`)
  const data = await res.json() as { meetings?: Record<string, unknown>[] }
  return data.meetings ?? []
}

export function useMeetings() {
  const { data, error, mutate } = useSWR(
    `/api/meetings`,
    fetcher,
    {
      // Poll every 5s while any meeting is still processing, then stop
      refreshInterval: (meetings) => {
        const list = meetings ?? []
        return list.some((m) => (m as { status?: string }).status === "processing") ? 5000 : 0
      },
    }
  )

  return {
    meetings: data ?? [],
    isLoading: !error && !data,
    isError: !!error,
    mutate,
  }
}
