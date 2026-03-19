"use client";

import Link from "next/link";
import { Heart } from "lucide-react";
import { useLanguage } from "@/components/language-provider";

export function LandingFooter() {
  const { t } = useLanguage();

  return (
    <footer className="py-20 bg-surface border-t border-outline-variant/30">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-5 gap-8 mb-12">
          {/* Brand */}
          <div className="md:col-span-2">
            <span className="text-2xl font-headline font-bold gradient-text tracking-tight block mb-4">
              Thakirni
            </span>
            <p className="text-on-surface-variant max-w-sm mb-4 leading-relaxed">
              {t(
                "عقلك الثاني اللي يضبط يومك.. وثّق كل شي أول بأول، وريّح بالك من النسيان.",
                "Your second brain that sorts your day.. Document everything as it happens, and rest your mind from forgetting.",
              )}
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-headline font-bold text-on-surface mb-4">
              {t("روابط سريعة", "Quick Links")}
            </h4>
            <ul className="space-y-2">
              {[
                { ar: "المميزات", en: "Features", href: "#features" },
                { ar: "الأسعار", en: "Pricing", href: "/pricing" },
                { ar: "الأسئلة الشائعة", en: "FAQ", href: "#" },
              ].map((link) => (
                <li key={link.en}>
                  <Link
                    href={link.href}
                    className="text-on-surface-variant hover:text-primary transition-colors text-sm"
                  >
                    {t(link.ar, link.en)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-headline font-bold text-on-surface mb-4">
              {t("تواصل معنا", "Contact Us")}
            </h4>
            <ul className="space-y-2">
              {[
                { ar: "الدعم الفني", en: "Support", href: "#" },
                { ar: "الشراكات", en: "Partnerships", href: "#" },
                { ar: "الوظائف", en: "Careers", href: "#" },
              ].map((link) => (
                <li key={link.en}>
                  <Link
                    href={link.href}
                    className="text-on-surface-variant hover:text-primary transition-colors text-sm"
                  >
                    {t(link.ar, link.en)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-headline font-bold text-on-surface mb-4">
              {t("الشروط والسياسات", "Legal")}
            </h4>
            <ul className="space-y-2">
              {[
                { ar: "شروط الاستخدام", en: "Terms of Service", href: "/terms" },
                { ar: "سياسة الخصوصية", en: "Privacy Policy", href: "/privacy" },
                { ar: "سياسة الاسترداد", en: "Refund Policy", href: "/refund" },
              ].map((link) => (
                <li key={link.en}>
                  <Link
                    href={link.href}
                    className="text-on-surface-variant hover:text-primary transition-colors text-sm"
                  >
                    {t(link.ar, link.en)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="pt-8 border-t border-outline-variant/30 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-on-surface-variant text-sm">
            {t(
              "© ٢٠٢٦ ذكرني. جميع الحقوق محفوظة.",
              "© 2026 Thakirni. All rights reserved.",
            )}
          </p>
          <p className="flex items-center gap-1 text-on-surface-variant text-sm">
            {t("صنع بـ", "Made with")}{" "}
            <Heart className="w-4 h-4 text-secondary fill-secondary" />{" "}
            {t("في المملكة العربية السعودية", "in Saudi Arabia")}
          </p>
        </div>
      </div>
    </footer>
  );
}
