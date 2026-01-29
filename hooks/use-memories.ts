"use client"

import { useState, useEffect } from "react"
import type { Memory } from "@/lib/types"

// Mock data - will be replaced with Supabase query later
const mockMemories: Memory[] = [
  {
    id: "1",
    type: "photo",
    hijriDate: "١٥ رجب ١٤٤٥",
    gregorianDate: "2024-01-27",
    contentUrl: "/images/memory-1.jpg",
    title: "أول يوم في المدرسة",
    description: "ذكرى جميلة من أيام الطفولة",
    tags: ["طفولة", "مدرسة"],
    createdAt: "2024-01-27T10:00:00Z",
    updatedAt: "2024-01-27T10:00:00Z",
    userId: "user-1"
  },
  {
    id: "2",
    type: "voice",
    hijriDate: "٢٠ شعبان ١٤٤٥",
    gregorianDate: "2024-03-01",
    contentUrl: "/audio/memory-2.mp3",
    title: "رسالة صوتية من الجد",
    description: "كلمات حكمة من جدي رحمه الله",
    tags: ["عائلة", "حكمة"],
    createdAt: "2024-03-01T14:30:00Z",
    updatedAt: "2024-03-01T14:30:00Z",
    userId: "user-1"
  },
  {
    id: "3",
    type: "text",
    hijriDate: "٥ رمضان ١٤٤٥",
    gregorianDate: "2024-03-15",
    contentUrl: "",
    title: "دعاء الوالدة",
    description: "اللهم ارحمها واغفر لها وأسكنها الفردوس الأعلى",
    tags: ["دعاء", "أم"],
    createdAt: "2024-03-15T18:00:00Z",
    updatedAt: "2024-03-15T18:00:00Z",
    userId: "user-1"
  },
  {
    id: "4",
    type: "photo",
    hijriDate: "١ شوال ١٤٤٥",
    gregorianDate: "2024-04-10",
    contentUrl: "/images/memory-4.jpg",
    title: "عيد الفطر مع العائلة",
    description: "تجمع العائلة في العيد",
    tags: ["عيد", "عائلة"],
    createdAt: "2024-04-10T08:00:00Z",
    updatedAt: "2024-04-10T08:00:00Z",
    userId: "user-1"
  }
]

interface UseMemoriesReturn {
  memories: Memory[]
  isLoading: boolean
  error: Error | null
  addMemory: (memory: Omit<Memory, "id" | "createdAt" | "updatedAt">) => Promise<void>
  deleteMemory: (id: string) => Promise<void>
  refetch: () => Promise<void>
}

export function useMemories(): UseMemoriesReturn {
  const [memories, setMemories] = useState<Memory[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchMemories = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 800))
      
      // TODO: Replace with Supabase query
      // const { data, error } = await supabase
      //   .from('memories')
      //   .select('*')
      //   .order('created_at', { ascending: false })
      
      setMemories(mockMemories)
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to fetch memories"))
    } finally {
      setIsLoading(false)
    }
  }

  const addMemory = async (memory: Omit<Memory, "id" | "createdAt" | "updatedAt">) => {
    try {
      // TODO: Replace with Supabase insert
      const newMemory: Memory = {
        ...memory,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      
      setMemories(prev => [newMemory, ...prev])
    } catch (err) {
      throw err instanceof Error ? err : new Error("Failed to add memory")
    }
  }

  const deleteMemory = async (id: string) => {
    try {
      // TODO: Replace with Supabase delete
      setMemories(prev => prev.filter(m => m.id !== id))
    } catch (err) {
      throw err instanceof Error ? err : new Error("Failed to delete memory")
    }
  }

  useEffect(() => {
    fetchMemories()
  }, [])

  return {
    memories,
    isLoading,
    error,
    addMemory,
    deleteMemory,
    refetch: fetchMemories
  }
}
