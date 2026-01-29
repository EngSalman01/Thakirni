"use client"

import Link from "next/link"
import { Heart } from "lucide-react"

export function LandingFooter() {
  return (
    <footer className="py-12 border-t border-foreground/10">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-8 mb-12">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gold to-gold-light flex items-center justify-center">
                <span className="text-background font-bold text-xl">ذ</span>
              </div>
              <span className="text-xl font-bold text-foreground">ذكرني</span>
            </Link>
            <p className="text-foreground/60 max-w-sm mb-4">
              المنصة الأولى في المملكة العربية السعودية لحفظ وتخليد ذكرى أحبائنا الراحلين
            </p>
            <p className="font-english text-sm text-foreground/40" dir="ltr">
              The first digital legacy vault in Saudi Arabia
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-bold text-foreground mb-4">روابط سريعة</h4>
            <ul className="space-y-2">
              <li><Link href="#" className="text-foreground/60 hover:text-gold transition-colors">المميزات</Link></li>
              <li><Link href="#" className="text-foreground/60 hover:text-gold transition-colors">الأسعار</Link></li>
              <li><Link href="#" className="text-foreground/60 hover:text-gold transition-colors">الأسئلة الشائعة</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-foreground mb-4">تواصل معنا</h4>
            <ul className="space-y-2">
              <li><Link href="#" className="text-foreground/60 hover:text-gold transition-colors">الدعم الفني</Link></li>
              <li><Link href="#" className="text-foreground/60 hover:text-gold transition-colors">الشراكات</Link></li>
              <li><Link href="#" className="text-foreground/60 hover:text-gold transition-colors">الوظائف</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="pt-8 border-t border-foreground/10 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-foreground/50 text-sm">
            © ٢٠٢٦ ذكرني. جميع الحقوق محفوظة.
          </p>
          <p className="flex items-center gap-1 text-foreground/50 text-sm">
            صنع بـ <Heart className="w-4 h-4 text-gold fill-gold" /> في المملكة العربية السعودية
          </p>
        </div>
      </div>
    </footer>
  )
}
