"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { VaultSidebar } from "@/components/thakirni/vault-sidebar"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { 
  Link2, Plus, ExternalLink, Copy, Heart, 
  Droplets, BookOpen, Home, Trash2, QrCode
} from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { LanguageToggle } from "@/components/language-toggle"
import { toast } from "sonner"

interface SadaqahLink {
  id: string
  title: string
  description: string
  url: string
  platform: "ehsan" | "shefa" | "other"
  category: "water" | "education" | "shelter" | "general"
  forPerson?: string
  totalDonations?: number
}

const mockLinks: SadaqahLink[] = [
  { 
    id: "1", 
    title: "صدقة جارية لروح جدي", 
    description: "حفر بئر ماء",
    url: "https://ehsan.sa/donation/123",
    platform: "ehsan",
    category: "water",
    forPerson: "جدي محمد",
    totalDonations: 15000
  },
  { 
    id: "2", 
    title: "كفالة يتيم", 
    description: "كفالة شهرية ليتيم",
    url: "https://ehsan.sa/donation/456",
    platform: "ehsan",
    category: "education",
    forPerson: "جدتي فاطمة",
    totalDonations: 8000
  },
  { 
    id: "3", 
    title: "علاج مريض", 
    description: "مساعدة في علاج مريض",
    url: "https://shefa.sa/case/789",
    platform: "shefa",
    category: "general",
    totalDonations: 25000
  },
]

const platformColors: Record<string, string> = {
  ehsan: "bg-green-500/10 text-green-600 border-green-500/20",
  shefa: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  other: "bg-gray-500/10 text-gray-600 border-gray-500/20",
}

const categoryIcons: Record<string, typeof Droplets> = {
  water: Droplets,
  education: BookOpen,
  shelter: Home,
  general: Heart,
}

const categoryLabels: Record<string, string> = {
  water: "ماء",
  education: "تعليم",
  shelter: "إيواء",
  general: "عام",
}

export default function SadaqahPage() {
  const [links, setLinks] = useState<SadaqahLink[]>(mockLinks)

  const copyLink = (url: string) => {
    navigator.clipboard.writeText(url)
    toast.success("تم نسخ الرابط")
  }

  const deleteLink = (id: string) => {
    setLinks(links.filter(l => l.id !== id))
    toast.success("تم حذف الرابط")
  }

  const totalDonations = links.reduce((sum, link) => sum + (link.totalDonations || 0), 0)

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
            <h1 className="text-2xl font-bold text-foreground">روابط الصدقة</h1>
            <p className="text-muted-foreground">صدقة جارية لأحبائك</p>
          </div>
          <div className="flex items-center gap-2">
            <LanguageToggle />
            <ThemeToggle />
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              رابط جديد
            </Button>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8"
        >
          <Card className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Link2 className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{links.length}</p>
              <p className="text-sm text-muted-foreground">روابط صدقة</p>
            </div>
          </Card>
          <Card className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center">
              <Heart className="w-6 h-6 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{totalDonations.toLocaleString("ar-SA")}</p>
              <p className="text-sm text-muted-foreground">ريال تبرعات</p>
            </div>
          </Card>
          <Card className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <QrCode className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">2</p>
              <p className="text-sm text-muted-foreground">منصات مرتبطة</p>
            </div>
          </Card>
        </motion.div>

        {/* Links Grid */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          {links.map((link, i) => {
            const CategoryIcon = categoryIcons[link.category]
            return (
              <motion.div
                key={link.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * i }}
              >
                <Card className="p-4 border">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 text-xs rounded-full border ${platformColors[link.platform]}`}>
                        {link.platform === "ehsan" ? "إحسان" : link.platform === "shefa" ? "شفاء" : "أخرى"}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <CategoryIcon className="w-3 h-3" />
                        {categoryLabels[link.category]}
                      </span>
                    </div>
                    <Button variant="ghost" size="icon" className="w-8 h-8" onClick={() => deleteLink(link.id)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                  
                  <h3 className="font-semibold text-foreground mb-1">{link.title}</h3>
                  <p className="text-sm text-muted-foreground mb-2">{link.description}</p>
                  
                  {link.forPerson && (
                    <p className="text-xs text-muted-foreground mb-3">
                      لروح: <span className="text-foreground">{link.forPerson}</span>
                    </p>
                  )}
                  
                  {link.totalDonations && (
                    <div className="mb-3 p-2 rounded-lg bg-green-500/5 border border-green-500/20">
                      <p className="text-sm text-green-600">
                        إجمالي التبرعات: <span className="font-bold">{link.totalDonations.toLocaleString("ar-SA")} ريال</span>
                      </p>
                    </div>
                  )}
                  
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1 gap-2 bg-transparent"
                      onClick={() => copyLink(link.url)}
                    >
                      <Copy className="w-4 h-4" />
                      نسخ الرابط
                    </Button>
                    <Button 
                      size="sm" 
                      className="flex-1 gap-2"
                      onClick={() => window.open(link.url, "_blank")}
                    >
                      <ExternalLink className="w-4 h-4" />
                      فتح
                    </Button>
                  </div>
                </Card>
              </motion.div>
            )
          })}
        </motion.div>

        {links.length === 0 && (
          <div className="text-center py-12">
            <Link2 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">لا توجد روابط صدقة</p>
          </div>
        )}
      </main>
    </div>
  )
}
