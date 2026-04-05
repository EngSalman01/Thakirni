"use client"

import { motion, AnimatePresence } from "framer-motion"
import { Trash2, X, CheckSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useLanguage } from "@/components/language-provider"

interface BulkActionBarProps {
  selectedCount: number
  onDelete: () => void
  onClear: () => void
  deleting?: boolean
}

export function BulkActionBar({ selectedCount, onDelete, onClear, deleting }: BulkActionBarProps) {
  const { t } = useLanguage()

  return (
    <AnimatePresence>
      {selectedCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl"
        >
          <CheckSquare className="w-4 h-4 text-[#fd65c2]" />
          <span className="text-sm font-label font-medium">
            {selectedCount} {t("محدد", "selected")}
          </span>
          <div className="w-px h-4 bg-white/20" />
          <Button
            size="sm"
            variant="ghost"
            onClick={onDelete}
            disabled={deleting}
            className="text-red-400 hover:text-red-300 hover:bg-white/10 h-8 px-3 rounded-xl font-label"
          >
            <Trash2 className="w-3.5 h-3.5 me-1.5" />
            {deleting ? t("جار الحذف...", "Deleting...") : t("حذف", "Delete")}
          </Button>
          <button onClick={onClear} className="text-white/50 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
