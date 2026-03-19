"use client"

import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ImageIcon, Video, FileText } from "lucide-react"

const memories = [
  {
    id: 1,
    type: "image",
    titleAr: "رحلة العمرة",
    dateHijri: "١٥ رمضان ١٤٤٥",
    dateGregorian: "March 2024",
    description: "ذكريات جميلة من رحلة العمرة مع العائلة",
  },
  {
    id: 2,
    type: "video",
    titleAr: "حفل التخرج",
    dateHijri: "٢٠ شوال ١٤٤٤",
    dateGregorian: "May 2023",
    description: "لحظة فخر في حفل تخرج الابن الأكبر",
  },
  {
    id: 3,
    type: "text",
    titleAr: "رسالة للأحفاد",
    dateHijri: "١ محرم ١٤٤٦",
    dateGregorian: "July 2024",
    description: "رسالة مكتوبة تحمل وصايا ونصائح للأجيال القادمة",
  },
  {
    id: 4,
    type: "image",
    titleAr: "عيد الأضحى",
    dateHijri: "١٠ ذو الحجة ١٤٤٤",
    dateGregorian: "June 2023",
    description: "تجمع العائلة في عيد الأضحى المبارك",
  },
]

const iconMap = {
  image: ImageIcon,
  video: Video,
  text: FileText,
}

export function TimelineCard() {
  return (
    <Card className="glass-card col-span-2 row-span-2 overflow-hidden">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl text-card-foreground flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-gold" />
          الجدول الزمني
        </CardTitle>
      </CardHeader>
      <CardContent className="relative">
        {/* Timeline line */}
        <div className="absolute top-0 bottom-0 end-6 w-0.5 bg-border" />
        
        <div className="space-y-6">
          {memories.map((memory, index) => {
            const Icon = iconMap[memory.type as keyof typeof iconMap]
            return (
              <motion.div
                key={memory.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="relative flex gap-4 pe-10"
              >
                {/* Timeline dot */}
                <div className="absolute end-4 top-2 w-4 h-4 rounded-full bg-card border-2 border-gold z-10" />
                
                {/* Content */}
                <div className="flex-1 bg-card-foreground/5 rounded-xl p-4 hover:bg-card-foreground/10 transition-colors cursor-pointer">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-gold/10 flex items-center justify-center">
                        <Icon className="w-4 h-4 text-gold" />
                      </div>
                      <h4 className="font-bold text-card-foreground">{memory.titleAr}</h4>
                    </div>
                  </div>
                  <p className="text-sm text-card-foreground/70 mb-2">{memory.description}</p>
                  <div className="flex items-center gap-2 text-xs text-card-foreground/50">
                    <span>{memory.dateHijri}</span>
                    <span className="font-english" dir="ltr">({memory.dateGregorian})</span>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
