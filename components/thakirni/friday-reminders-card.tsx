"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Moon, Users, MessageSquare } from "lucide-react"

export function FridayRemindersCard() {
  const [isEnabled, setIsEnabled] = useState(true)
  const [sendToFamily, setSendToFamily] = useState(true)

  return (
    <Card className="glass-card overflow-hidden">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg text-card-foreground flex items-center gap-2">
          <Moon className="w-5 h-5 text-gold" />
          تذكير الجمعة
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-gold/5 rounded-xl p-4 border border-gold/20"
        >
          <p className="text-sm text-card-foreground/80 mb-1">الآية المقترحة لهذا الأسبوع:</p>
          <p className="text-card-foreground font-medium leading-relaxed">
            {"\"إِنَّا لِلَّهِ وَإِنَّا إِلَيْهِ رَاجِعُونَ\""}
          </p>
          <p className="text-xs text-card-foreground/50 mt-2">سورة البقرة - الآية ١٥٦</p>
        </motion.div>

        <div className="space-y-3">
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-3">
              <MessageSquare className="w-4 h-4 text-card-foreground/60" />
              <span className="text-sm text-card-foreground">إرسال تلقائي كل جمعة</span>
            </div>
            <Switch 
              checked={isEnabled} 
              onCheckedChange={setIsEnabled}
              className="data-[state=checked]:bg-gold"
            />
          </div>
          
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-3">
              <Users className="w-4 h-4 text-card-foreground/60" />
              <span className="text-sm text-card-foreground">إرسال لمجموعة العائلة</span>
            </div>
            <Switch 
              checked={sendToFamily} 
              onCheckedChange={setSendToFamily}
              className="data-[state=checked]:bg-gold"
            />
          </div>
        </div>

        <div className="pt-2 border-t border-border">
          <p className="text-xs text-card-foreground/50">
            آخر إرسال: الجمعة ٢٤ يناير ٢٠٢٦
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
