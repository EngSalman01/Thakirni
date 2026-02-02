"use client"

import Link from "next/link"
import { Heart } from "lucide-react"
import { BrandLogo } from "@/components/thakirni/brand-logo"

export function LandingFooter() {
  return (
    <footer className="py-12 border-t border-foreground/10">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-8 mb-12">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center mb-4">
              {/* Reduced from 160x50 to 120x40 */}
              <BrandLogo width={120} height={40} />
            </Link>
            <p className="text-foreground/60 max-w-sm mb-4">
              عقلك الثاني اللي يضبط يومك.. وثّق كل شي أول بأول، وريّح بالك من النسيان.
            </p>
            <p className="font-english text-sm text-foreground/40" dir="ltr">
              Your second brain that sorts your day.. Document everything as it happens, and rest your mind from forgetting.
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
