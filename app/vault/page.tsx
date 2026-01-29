"use client"

import React from "react"
import dynamic from "next/dynamic"
import { useState, useCallback } from "react"
import { motion } from "framer-motion"
import { VaultSidebar } from "@/components/thakirni/vault-sidebar"
import { Button } from "@/components/ui/button"

// Dynamic import to prevent SSR issues with AI SDK
const AIChat = dynamic(() => import("@/components/thakirni/ai-chat").then(mod => ({ default: mod.AIChat })), {
  ssr: false,
  loading: () => (
    <div className="h-[600px] bg-card rounded-xl border border-border flex items-center justify-center">
      <div className="text-muted-foreground">جاري تحميل المحادثة...</div>
    </div>
  )
})
import { Switch } from "@/components/ui/switch"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  Bell, Calendar, Clock, CheckCircle, Plus, Upload, 
  ImageIcon, Mic, FileText, MessageSquare
} from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { LanguageToggle } from "@/components/language-toggle"
import { useMemories } from "@/hooks/use-memories"

export default function VaultPage() {
  const { memories, isLoading } = useMemories()
  const [fridayReminder, setFridayReminder] = useState(true)
  const [isDragOver, setIsDragOver] = useState(false)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    // Handle file drop - will integrate with storage later
    Array.from(e.dataTransfer.files)
  }, [])

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Sidebar */}
      <VaultSidebar />
      
      {/* Main content */}
      <main className="me-64 p-8">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div>
            <h1 className="text-2xl font-bold text-foreground">مرحباً بك في ذكرني</h1>
            <p className="text-muted-foreground">ذاكرتك الثانية لحفظ كل اللحظات</p>
          </div>
          <div className="flex items-center gap-2">
            <LanguageToggle />
            <ThemeToggle />
            <Button variant="outline" size="icon" className="bg-transparent relative">
              <Bell className="w-5 h-5" />
              <span className="absolute -top-1 -end-1 w-2 h-2 bg-primary rounded-full" />
            </Button>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8"
        >
          {[
            { label: "ذكرياتي", value: memories.length.toString(), icon: ImageIcon, color: "text-primary" },
            { label: "تذكيرات اليوم", value: "٢", icon: Clock, color: "text-blue-500" },
            { label: "الجدول الزمني", value: "٨", icon: Calendar, color: "text-green-500" },
            { label: "رسائل صوتية", value: "٣", icon: Mic, color: "text-amber-500" },
          ].map((stat, i) => (
            <div key={i} className="bg-card rounded-xl p-4 border border-border hover:border-primary/50 transition-colors cursor-pointer">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg bg-muted flex items-center justify-center ${stat.color}`}>
                  <stat.icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            </div>
          ))}
        </motion.div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Main Content - Memory Stream */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2 bg-card rounded-xl border border-border p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-primary" />
                ذكرياتي الأخيرة
              </h2>
              <Button size="sm" className="gap-2">
                <Plus className="w-4 h-4" />
                ذكرى جديدة
              </Button>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Skeleton key={i} className="aspect-square rounded-lg" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {memories.slice(0, 6).map((memory, i) => (
                  <motion.div
                    key={memory.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.1 }}
                    className="relative group aspect-square rounded-lg bg-muted overflow-hidden cursor-pointer"
                  >
                    <div className="absolute inset-0 flex items-center justify-center">
                      {memory.type === "photo" && <ImageIcon className="w-8 h-8 text-muted-foreground" />}
                      {memory.type === "voice" && <Mic className="w-8 h-8 text-muted-foreground" />}
                      {memory.type === "text" && <FileText className="w-8 h-8 text-muted-foreground" />}
                    </div>
                    <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                      <p className="text-xs text-white truncate">{memory.title}</p>
                      <p className="text-xs text-white/70">{memory.hijriDate}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Side Cards */}
          <div className="space-y-6">
            {/* Friday Reminders */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-card rounded-xl border border-border p-6"
            >
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-primary" />
                تذكيرات الجمعة
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-foreground">رسالة جمعة مباركة</p>
                    <p className="text-xs text-muted-foreground">إرسال تلقائي لمجموعة العائلة</p>
                  </div>
                  <Switch 
                    checked={fridayReminder} 
                    onCheckedChange={setFridayReminder}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  سيتم إرسال رسالة {"\"جمعة مباركة\""} تلقائياً كل يوم جمعة الساعة ١٠ صباحاً
                </p>
              </div>
            </motion.div>

            {/* Quick Upload */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className={`bg-card rounded-xl border-2 border-dashed p-6 transition-colors ${
                isDragOver ? "border-primary bg-primary/5" : "border-border"
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <div className="text-center">
                <Upload className={`w-10 h-10 mx-auto mb-3 ${isDragOver ? "text-primary" : "text-muted-foreground"}`} />
                <h3 className="text-sm font-medium text-foreground mb-1">رفع سريع</h3>
                <p className="text-xs text-muted-foreground mb-3">
                  اسحب الملفات هنا أو اضغط للاختيار
                </p>
                <Button variant="outline" size="sm" className="bg-transparent">
                  اختر ملفات
                </Button>
              </div>
            </motion.div>
          </div>
        </div>

        {/* AI Chat */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <AIChat />
        </motion.div>
      </main>
    </div>
  )
}
