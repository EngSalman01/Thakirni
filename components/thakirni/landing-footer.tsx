"use client";

import Link from "next/link";
import { Heart } from "lucide-react";
import { BrandLogo } from "@/components/thakirni/brand-logo";
import { useLanguage } from "@/components/language-provider";

export function LandingFooter() {
  const { t } = useLanguage();

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
              {t(
                "عقلك الثاني اللي يضبط يومك.. وثّق كل شي أول بأول، وريّح بالك من النسيان.",
                "Your second brain that sorts your day.. Document everything as it happens, and rest your mind from forgetting.",
              )}
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-bold text-foreground mb-4">
              {t("روابط سريعة", "Quick Links")}
            </h4>
            <ul className="space-y-2">
              <li>
                <Link
                  href="#"
                  className="text-foreground/60 hover:text-gold transition-colors"
                >
                  {t("المميزات", "Features")}
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="text-foreground/60 hover:text-gold transition-colors"
                >
                  {t("الأسعار", "Pricing")}
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="text-foreground/60 hover:text-gold transition-colors"
                >
                  {t("الأسئلة الشائعة", "FAQ")}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-foreground mb-4">
              {t("تواصل معنا", "Contact Us")}
            </h4>
            <ul className="space-y-2">
              <li>
                <Link
                  href="#"
                  className="text-foreground/60 hover:text-gold transition-colors"
                >
                  {t("الدعم الفني", "Support")}
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="text-foreground/60 hover:text-gold transition-colors"
                >
                  {t("الشراكات", "Partnerships")}
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="text-foreground/60 hover:text-gold transition-colors"
                >
                  {t("الوظائف", "Careers")}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="pt-8 border-t border-foreground/10 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-foreground/50 text-sm">
            {t(
              "© ٢٠٢٦ ذكرني. جميع الحقوق محفوظة.",
              "© 2026 Thakirni. All rights reserved.",
            )}
          </p>
          <p className="flex items-center gap-1 text-foreground/50 text-sm">
            {t("صنع بـ", "Made with")}{" "}
            <Heart className="w-4 h-4 text-gold fill-gold" />{" "}
            {t("في المملكة العربية السعودية", "in Saudi Arabia")}
          </p>
        </div>
      </div>
    </footer>
  );
}
