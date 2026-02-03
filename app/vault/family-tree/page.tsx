"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { VaultSidebar } from "@/components/thakirni/vault-sidebar"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { 
  GitBranch, Plus, Users, User, Heart, Edit2, Trash2, ChevronDown, ChevronUp
} from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { LanguageToggle } from "@/components/language-toggle"
import { toast } from "sonner"

interface FamilyMember {
  id: string
  name: string
  relation: string
  birthDate?: string
  deathDate?: string
  photo?: string
  children?: FamilyMember[]
}

const mockFamilyTree: FamilyMember = {
  id: "1",
  name: "جدي محمد",
  relation: "الجد",
  birthDate: "1930",
  deathDate: "2010",
  children: [
    {
      id: "2",
      name: "أبي أحمد",
      relation: "الأب",
      birthDate: "1960",
      children: [
        { id: "5", name: "أنا", relation: "أنا", birthDate: "1990" },
        { id: "6", name: "أختي فاطمة", relation: "الأخت", birthDate: "1993" },
        { id: "7", name: "أخي علي", relation: "الأخ", birthDate: "1995" },
      ]
    },
    {
      id: "3",
      name: "عمي خالد",
      relation: "العم",
      birthDate: "1965",
      children: [
        { id: "8", name: "ابن عمي سعد", relation: "ابن العم", birthDate: "1992" },
      ]
    },
    {
      id: "4",
      name: "عمتي نورة",
      relation: "العمة",
      birthDate: "1968",
      children: [
        { id: "9", name: "ابنة عمتي هند", relation: "ابنة العمة", birthDate: "1994" },
      ]
    },
  ]
}

function FamilyMemberCard({ member, level = 0 }: { member: FamilyMember; level?: number }) {
  const [expanded, setExpanded] = useState(level < 2)
  const hasChildren = member.children && member.children.length > 0
  
  return (
    <div className="flex flex-col items-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: level * 0.1 }}
      >
        <Card className={`p-4 min-w-[180px] border ${member.deathDate ? "border-muted" : "border-primary/30"}`}>
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${member.deathDate ? "bg-muted" : "bg-primary/10"}`}>
              <User className={`w-6 h-6 ${member.deathDate ? "text-muted-foreground" : "text-primary"}`} />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground">{member.name}</h3>
              <p className="text-xs text-muted-foreground">{member.relation}</p>
              {member.birthDate && (
                <p className="text-xs text-muted-foreground">
                  {member.birthDate}{member.deathDate && ` - ${member.deathDate}`}
                </p>
              )}
            </div>
          </div>
          
          {hasChildren && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full mt-2"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              <span className="ms-1 text-xs">{member.children?.length} {member.children?.length === 1 ? "فرد" : "أفراد"}</span>
            </Button>
          )}
        </Card>
      </motion.div>
      
      {hasChildren && expanded && (
        <>
          <div className="w-px h-6 bg-border" />
          <div className="flex gap-8">
            {member.children?.map((child, i) => (
              <div key={child.id} className="flex flex-col items-center">
                {member.children && member.children.length > 1 && (
                  <div className="flex items-center">
                    {i === 0 && <div className="w-8 h-px bg-transparent" />}
                    <div className="w-8 h-px bg-border" />
                    {i === (member.children?.length || 0) - 1 && <div className="w-8 h-px bg-transparent" />}
                  </div>
                )}
                <div className="w-px h-6 bg-border" />
                <FamilyMemberCard member={child} level={level + 1} />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export default function FamilyTreePage() {
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
            <h1 className="text-2xl font-bold text-foreground">شجرة العائلة</h1>
            <p className="text-muted-foreground">وثّق تاريخ عائلتك للأجيال القادمة</p>
          </div>
          <div className="flex items-center gap-2">
            <LanguageToggle />
            <ThemeToggle />
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              إضافة فرد
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
              <Users className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">9</p>
              <p className="text-sm text-muted-foreground">أفراد العائلة</p>
            </div>
          </Card>
          <Card className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center">
              <User className="w-6 h-6 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">7</p>
              <p className="text-sm text-muted-foreground">على قيد الحياة</p>
            </div>
          </Card>
          <Card className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
              <Heart className="w-6 h-6 text-muted-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">2</p>
              <p className="text-sm text-muted-foreground">متوفون</p>
            </div>
          </Card>
        </motion.div>

        {/* Family Tree */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="overflow-x-auto pb-8"
        >
          <div className="flex justify-center min-w-max py-8">
            <FamilyMemberCard member={mockFamilyTree} />
          </div>
        </motion.div>
      </main>
    </div>
  )
}
