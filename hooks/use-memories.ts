"use client"

import { useState, useEffect, useCallback } from "react"
import type { Memory } from "@/lib/types"
import { createClient } from "@/lib/supabase/client"

interface UseMemoriesReturn {
  memories: Memory[]
  isLoading: boolean
  error: Error | null
  addMemory: (memory: Omit<Memory, "id" | "created_at" | "user_id" | "is_favorite">) => Promise<void>
  deleteMemory: (id: string) => Promise<void>
  refetch: () => Promise<void>
}

export function useMemories(): UseMemoriesReturn {
  const [memories, setMemories] = useState<Memory[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  
  const supabase = createClient()

  const fetchMemories = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        setMemories([])
        return
      }

      const { data, error } = await supabase
        .from('memories')
        .select('*')
        .eq('user_id', user.id) // Security: Ensure we only fetch own memories (RLS handles this too, but good practice)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      
      setMemories(data as Memory[] || [])
    } catch (err) {
      console.error("Error fetching memories:", err)
      setError(err instanceof Error ? err : new Error("Failed to fetch memories"))
    } finally {
      setIsLoading(false)
    }
  }, []) // Empty dependency array as supabase client is stable

  const addMemory = async (memory: Omit<Memory, "id" | "created_at" | "user_id" | "is_favorite">) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("User not authenticated")

      // @ts-ignore
      const newMemory = {
        ...memory,
        user_id: user.id,
        is_favorite: false,
      }
      
      const { data, error } = await supabase
        .from('memories')
        .insert(newMemory)
        .select()
        .single()

      if (error) throw error
      
      setMemories(prev => [data as Memory, ...prev])
    } catch (err) {
      console.error("Error adding memory:", err)
      throw err instanceof Error ? err : new Error("Failed to add memory")
    }
  }

  const deleteMemory = async (id: string) => {
    try {
      const { error } = await supabase
        .from('memories')
        .delete()
        .eq('id', id)

      if (error) throw error

      setMemories(prev => prev.filter(m => m.id !== id))
    } catch (err) {
       console.error("Error deleting memory:", err)
      throw err instanceof Error ? err : new Error("Failed to delete memory")
    }
  }

  useEffect(() => {
    fetchMemories()
  }, [fetchMemories])

  return {
    memories,
    isLoading,
    error,
    addMemory,
    deleteMemory,
    refetch: fetchMemories
  }
}
