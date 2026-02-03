"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { VaultSidebar } from "@/components/thakirni/vault-sidebar"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { 
  Heart, Plus, Search, ImageIcon, Mic, FileText, 
  Calendar, MoreVertical, Download, Share2
} from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { LanguageToggle } from "@/components/language-toggle"
import { toast } from "sonner"

interface Memory {
  id: string
  title: string
  description?: string
  type: "photo" | "voice" | "text"
  date: string
  hijriDate: string
}

const mockMemories: Memory[] = [
  { id: "1", title: "رحلة العائلة للرياض", type: "photo", date: "2025-12-15", hijriDate: "١٤٤٧/٦/١٣" },
  { id: "2", title: "رسالة صوتية من جدي", type: "voice", date: "2024-06-10", hijriDate: "١٤٤٥/١٢/٣" },
  { id: "3", title: "قصة عن أبي", type: "text", date: "2025-01-20", hijriDate: "١٤٤٦/٧/١٩" },
  { id: "4", title: "صور حفل التخرج", type: "photo", date: "2025-05-30", hijriDate: "١٤٤٦/١١/٢" },
  { id: "5", title: "ذكريات رمضان", type: "photo", date: "2025-03-10", hijriDate: "١٤٤٦/٩/١٠" },
  { id: "6", title: "نصيحة من جدتي", type: "voice", date: "2024-08-15", hijriDate: "١٤٤٦/٢/١٠" },
]

const typeIcons = {
  photo: ImageIcon,
  voice: Mic,
  text: FileText,
}

const typeLabels = {
  photo: "صور",
  voice: "صوت",
  text: "نص",
}

export default function TributesPage() {
  const [memories, setMemories] = useState<Memory[]>(mockMemories)
  const [searchQuery, setSearchQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState<"all" | "photo" | "voice" | "text">("all")

  const filteredMemories = memories.filter(memory => {
    const matchesSearch = memory.title.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType = typeFilter === "all" || memory.type === typeFilter
    return matchesSearch && matchesType
  })

  return (
    <div className="min-h-screen bg-background">
      <VaultSidebar />
      
      <main className="me-64 p-8">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div>
            <h1 className="text-2xl font-bold text-foreground">ذكرياتي</h1>
            <p className="text-muted-foreground">احفظ ذكرياتك الثمينة للأبد</p>
          </div>
          <div className="flex items-center gap-2">
            <LanguageToggle />
            <ThemeToggle />
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              ذكرى جديدة
            </Button>
          </div>
        </motion.div>

        {/* Search and Filters */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col sm:flex-row gap-4 mb-6"
        >
          <div className="relative flex-1">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="ابحث عن ذكرى..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="ps-10"
            />
          </div>
          <div className="flex gap-2">
            {(["all", "photo", "voice", "text"] as const).map((f) => (
              <Button
                key={f}
                variant={typeFilter === f ? "default" : "outline"}
                size="sm"
                onClick={() => setTypeFilter(f)}
                className={typeFilter !== f ? "bg-transparent" : ""}
              >
                {f === "all" ? "الكل" : typeLabels[f]}
              </Button>
            ))}
          </div>
        </motion.div>

        {/* Memories Grid */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
        >
          {filteredMemories.map((memory, i) => {
            const Icon = typeIcons[memory.type]
            return (
              <motion.div
                key={memory.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.05 * i }}
                whileHover={{ scale: 1.02 }}
                className="group cursor-pointer"
              >
                <Card className="aspect-square relative overflow-hidden border">
                  <div className="absolute inset-0 bg-muted flex items-center justify-center">
                    <Icon className="w-12 h-12 text-muted-foreground" />
                  </div>
                  
                  {/* Overlay on hover */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                    <h3 className="text-white font-medium text-sm truncate">{memory.title}</h3>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-white/70 text-xs">{memory.hijriDate}</span>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="w-6 h-6 text-white hover:bg-white/20">
                          <Share2 className="w-3 h-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="w-6 h-6 text-white hover:bg-white/20">
                          <Download className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Type badge */}
                  <div className="absolute top-2 start-2 px-2 py-1 rounded-full bg-background/80 backdrop-blur-sm text-xs flex items-center gap-1">
                    <Icon className="w-3 h-3" />
                    {typeLabels[memory.type]}
                  </div>
                </Card>
              </motion.div>
            )
          })}
        </motion.div>

        {filteredMemories.length === 0 && (
          <div className="text-center py-12">
            <Heart className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">لا توجد ذكريات</p>
          </div>
        )}
      </main>
    </div>
  )
}
