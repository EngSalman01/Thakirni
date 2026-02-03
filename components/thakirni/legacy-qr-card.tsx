"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { QrCode, Download, Share2 } from "lucide-react"
import { BrandLogo } from "@/components/thakirni/brand-logo"

export function LegacyQRCard() {
  return (
    <Card className="glass-card overflow-hidden">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg text-card-foreground flex items-center gap-2">
          <QrCode className="w-5 h-5 text-gold" />
          بطاقة تواصل ذكية
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center">
        {/* QR Code placeholder */}
        <div className="w-40 h-40 bg-white rounded-xl p-3 mb-4 shadow-sm">
          <div className="w-full h-full bg-card-foreground/5 rounded-lg flex items-center justify-center relative overflow-hidden">
            {/* Simulated QR pattern */}
            <div className="grid grid-cols-7 gap-1 p-2">
              {Array.from({ length: 49 }).map((_, i) => (
                <div 
                  key={i} 
                  className={`w-3 h-3 rounded-sm ${
                    Math.random() > 0.5 ? 'bg-card-foreground' : 'bg-transparent'
                  }`} 
                />
              ))}
            </div>
            {/* Center logo */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-10 h-10 rounded-lg bg-card/80 backdrop-blur-sm flex items-center justify-center shadow-sm">
                <BrandLogo width={32} height={32} />
              </div>
            </div>
          </div>
        </div>

        <p className="text-sm text-card-foreground/70 text-center mb-4">
          امسح الرمز لإضافتي لجهات الاتصال
        </p>

        <div className="flex gap-2 w-full">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1 border-card-foreground/20 text-card-foreground hover:bg-card-foreground/5 bg-transparent"
          >
            <Share2 className="w-4 h-4 me-2" />
            مشاركة
          </Button>
          <Button 
            size="sm" 
            className="flex-1 bg-gold hover:bg-gold-light text-white"
          >
            <Download className="w-4 h-4 me-2" />
            تحميل
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
