"use client"

import { useEffect, useState } from "react"
import { AnimatePresence } from "framer-motion"
import { DashboardRouter } from "@/components/thakirni/dashboard-router"
import { StudentTemplateModal } from "@/components/thakirni/student-template-modal"
import { createClient } from "@/lib/supabase/client"

export default function VaultPage() {
  const [showStudentModal, setShowStudentModal] = useState(false)
  const [vaultUserId, setVaultUserId] = useState<string | null>(null)

  useEffect(() => {
    // Check if user came from /auth?plan=student
    const pending = localStorage.getItem("pendingStudentPlan")
    if (!pending) return
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setVaultUserId(user.id)
        setShowStudentModal(true)
        localStorage.removeItem("pendingStudentPlan")
      }
    })
  }, [])

  return (
    <>
      <DashboardRouter />
      <AnimatePresence>
        {showStudentModal && vaultUserId && (
          <StudentTemplateModal
            userId={vaultUserId}
            onDone={() => setShowStudentModal(false)}
          />
        )}
      </AnimatePresence>
    </>
  )
}
