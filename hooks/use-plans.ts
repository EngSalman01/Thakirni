"use client"

import { useState, useEffect, useCallback } from "react"
import type { Plan } from "@/lib/types"
import { createClient } from "@/lib/supabase/client"

interface UsePlansReturn {
  plans: Plan[]
  isLoading: boolean
  error: Error | null
  addPlan: (plan: Omit<Plan, "id" | "created_at" | "updated_at" | "user_id">) => Promise<void>
  updatePlanStatus: (id: string, status: Plan["status"]) => Promise<void>
  deletePlan: (id: string) => Promise<void>
  refetch: () => Promise<void>
  // Helper to get stats
  stats: {
    pendingTasks: number
    pendingGroceries: number
    todayReminders: number
    upcomingMeetings: number
  }
  nextUp: Plan[]
}

export function usePlans(): UsePlansReturn {
  const [plans, setPlans] = useState<Plan[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  
  const supabase = createClient()

  const fetchPlans = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        setPlans([])
        return
      }

      const { data, error } = await supabase
        .from('plans')
        .select('*')
        .eq('user_id', user.id)
        .order('reminder_date', { ascending: true })
      
      if (error) throw error
      
      setPlans(data as Plan[] || [])
    } catch (err) {
      console.error("Error fetching plans:", err)
      setError(err instanceof Error ? err : new Error("Failed to fetch plans"))
    } finally {
      setIsLoading(false)
    }
  }, [])

  const addPlan = async (plan: Omit<Plan, "id" | "created_at" | "updated_at" | "user_id">) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("User not authenticated")

      const newPlan = {
        ...plan,
        user_id: user.id,
      }
      
      const { data, error } = await supabase
        .from('plans')
        .insert(newPlan)
        .select()
        .single()

      if (error) throw error
      
      setPlans(prev => [...prev, data as Plan])
    } catch (err) {
      console.error("Error adding plan:", err)
      throw err instanceof Error ? err : new Error("Failed to add plan")
    }
  }

  const updatePlanStatus = async (id: string, status: Plan["status"]) => {
    try {
      const { error } = await supabase
        .from('plans')
        .update({ status })
        .eq('id', id)

      if (error) throw error

      setPlans(prev => prev.map(p => p.id === id ? { ...p, status } : p))
    } catch (err) {
      console.error("Error updating plan:", err)
      throw err instanceof Error ? err : new Error("Failed to update plan")
    }
  }

  const deletePlan = async (id: string) => {
    try {
      const { error } = await supabase
        .from('plans')
        .delete()
        .eq('id', id)

      if (error) throw error

      setPlans(prev => prev.filter(p => p.id !== id))
    } catch (err) {
      console.error("Error deleting plan:", err)
      throw err instanceof Error ? err : new Error("Failed to delete plan")
    }
  }

  useEffect(() => {
    fetchPlans()
  }, [fetchPlans])

  // Calculate stats
  // Note: We might need to handle dates more carefully depending on timezone
  const today = new Date().toISOString().split('T')[0]
  
  const stats = {
    pendingTasks: plans.filter(p => p.category === 'task' && p.status === 'pending').length,
    pendingGroceries: plans.filter(p => p.category === 'grocery' && p.status === 'pending').length,
    upcomingMeetings: plans.filter(p => p.category === 'meeting' && p.status === 'pending').length,
    todayReminders: plans.filter(p => {
        if (!p.reminder_date) return false
        // Simple string comparison for now, assuming ISO dates
        return p.reminder_date.startsWith(today)
    }).length
  }

  // Get next 3 upcoming items (tasks or meetings)
  const nextUp = plans
    .filter(p => p.status === 'pending' && (p.category === 'task' || p.category === 'meeting'))
    .sort((a, b) => {
      // Sort by date if available, otherwise push to end
      if (a.reminder_date && b.reminder_date) return a.reminder_date.localeCompare(b.reminder_date)
      if (a.reminder_date) return -1
      if (b.reminder_date) return 1
      return 0
    })
    .slice(0, 3)

  return {
    plans,
    isLoading,
    error,
    addPlan,
    updatePlanStatus,
    deletePlan,
    refetch: fetchPlans,
    stats,
    nextUp
  }
}
