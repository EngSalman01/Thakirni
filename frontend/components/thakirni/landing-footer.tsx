"use client";

import Link from "next/link";
import { useLanguage } from "@/components/language-provider";

export function LandingFooter() {
  const { t } = useLanguage();

  const productLinks = [
    { href: "#features", ar: "المميزات", en: "Features" },
    { href: "#", ar: "التكاملات", en: "Integrations" },
    { href: "/pricing", ar: "الأسعار", en: "Pricing" },
    { href: "/help", ar: "مركز المساعدة", en: "Help Center" },
  ];

  const companyLinks = [
    { href: "/about",   ar: "من نحن",          en: "About Us" },
    { href: "/privacy", ar: "سياسة الخصوصية", en: "Privacy Policy" },
    { href: "/terms",   ar: "الشروط والأحكام", en: "Terms" },
    { href: "/contact", ar: "تواصل معنا",       en: "Contact" },
  ];

  return (
    <footer className="bg-slate-900 text-slate-400 py-20 border-t border-slate-800/50">
      <div className="max-w-7xl mx-auto px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="text-2xl font-bold tracking-tighter text-white font-headline mb-6 gradient-text">
              Thakirni
            </div>
            <p className="max-w-xs mb-8 text-slate-500 leading-relaxed">
              {t(
                "مساعدك الذكي الشخصي. يذكر كل شي عنك.",
                "Your AI personal assistant. Remembers everything, so you don't have to."
              )}
            </p>
            <div className="flex gap-4">
              {[{ icon: "🌐", href: "#" }, { icon: "𝕏", href: "#" }].map(({ icon, href }) => (
                <a
                  key={icon}
                  href={href}
                  className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-[#2552ca] hover:scale-110 transition-all text-sm"
                >
                  {icon}
                </a>
              ))}
            </div>
          </div>

          {/* Product links */}
          <div>
            <h5 className="text-white font-bold mb-6 font-headline">
              {t("المنتج", "Product")}
            </h5>
            <ul className="space-y-4">
              {productLinks.map(({ href, ar, en }) => (
                <li key={en}>
                  <Link href={href} className="hover:text-[#2552ca] transition-colors">
                    {t(ar, en)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company links */}
          <div>
            <h5 className="text-white font-bold mb-6 font-headline">
              {t("الشركة", "Company")}
            </h5>
            <ul className="space-y-4">
              {companyLinks.map(({ href, ar, en }) => (
                <li key={en}>
                  <Link href={href} className="hover:text-[#2552ca] transition-colors">
                    {t(ar, en)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-slate-800/30 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-sm">
            {t("© 2026 ذكرني. جميع الحقوق محفوظة.", "© 2026 Thakirni. All rights reserved.")}
          </p>
          <div className="flex gap-8 text-sm">
            <Link href="/privacy" className="hover:underline underline-offset-4 decoration-[#2552ca]">
              {t("سياسة الخصوصية", "Privacy Policy")}
            </Link>
            <Link href="/terms" className="hover:underline underline-offset-4 decoration-[#2552ca]">
              {t("الشروط", "Terms")}
            </Link>
            <Link href="/contact" className="hover:underline underline-offset-4 decoration-[#2552ca]">
              {t("تواصل معنا", "Contact")}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
