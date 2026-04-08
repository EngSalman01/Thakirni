"use client";

import Link from "next/link";
import { useLanguage } from "@/components/language-provider";
import { BrandLogo } from "@/components/thakirni/brand-logo";

export function LandingFooter() {
  const { t, isArabic } = useLanguage();

  const productLinks = [
    { href: "/#features",  ar: "المميزات",      en: "Features" },
    { href: "/pricing",    ar: "الأسعار",        en: "Pricing" },
    { href: "/enterprise", ar: "للمؤسسات",       en: "Enterprise" },
    { href: "/help",       ar: "مركز المساعدة",  en: "Help Center" },
  ];

  const companyLinks = [
    { href: "/about",   ar: "من نحن",          en: "About Us" },
    { href: "/privacy", ar: "سياسة الخصوصية", en: "Privacy Policy" },
    { href: "/terms",   ar: "الشروط والأحكام", en: "Terms" },
    { href: "/contact", ar: "تواصل معنا",       en: "Contact" },
  ];

  return (
    <footer
      dir={isArabic ? "rtl" : "ltr"}
      className="bg-[#0E0B07] text-slate-400 py-12 sm:py-20 border-t border-white/[0.07]"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 sm:gap-12 mb-10 sm:mb-16">
          {/* Brand */}
          <div className="md:col-span-2">
            <BrandLogo variant="full" className="h-8 w-auto mb-5 opacity-90" />
            <p className="max-w-xs mb-8 text-slate-500 leading-relaxed text-sm">
              {t(
                "مساعدك الذكي الشخصي. يذكر كل شي عنك.",
                "Your AI personal assistant. Remembers everything, so you don't have to."
              )}
            </p>
            <div className="flex gap-3">
              {/* WhatsApp */}
              <a
                href="https://wa.me/?text=جرّب%20ذكرني%20%F0%9F%A7%A0%20https%3A%2F%2Fthakirni.com"
                target="_blank" rel="noopener noreferrer"
                aria-label="Share on WhatsApp"
                className="w-9 h-9 rounded-xl bg-white/[0.06] flex items-center justify-center hover:bg-[#25d366] hover:scale-110 transition-all duration-200"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-white">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
              </a>
              {/* Twitter / X */}
              <a
                href="https://twitter.com/intent/tweet?text=جرّب%20ذكرني%20%F0%9F%A7%A0%20مساعدك%20الذكي%20الشخصي&url=https%3A%2F%2Fthakirni.com"
                target="_blank" rel="noopener noreferrer"
                aria-label="Share on X (Twitter)"
                className="w-9 h-9 rounded-xl bg-white/[0.06] flex items-center justify-center hover:bg-black hover:scale-110 transition-all duration-200 text-xs font-bold text-white"
              >
                𝕏
              </a>
              {/* LinkedIn */}
              <a
                href="https://www.linkedin.com/sharing/share-offsite/?url=https%3A%2F%2Fthakirni.com"
                target="_blank" rel="noopener noreferrer"
                aria-label="Share on LinkedIn"
                className="w-9 h-9 rounded-xl bg-white/[0.06] flex items-center justify-center hover:bg-[#0077b5] hover:scale-110 transition-all duration-200"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-white">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Product links */}
          <div>
            <h5 className="text-white font-semibold mb-5 text-sm tracking-wide">
              {t("المنتج", "Product")}
            </h5>
            <ul className="space-y-3.5">
              {productLinks.map(({ href, ar, en }) => (
                <li key={en}>
                  <Link
                    href={href}
                    className="text-sm text-slate-500 hover:text-amber-400 transition-colors duration-150"
                  >
                    {t(ar, en)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company links */}
          <div>
            <h5 className="text-white font-semibold mb-5 text-sm tracking-wide">
              {t("الشركة", "Company")}
            </h5>
            <ul className="space-y-3.5">
              {companyLinks.map(({ href, ar, en }) => (
                <li key={en}>
                  <Link
                    href={href}
                    className="text-sm text-slate-500 hover:text-amber-400 transition-colors duration-150"
                  >
                    {t(ar, en)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-white/[0.06] flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-slate-600">
            {t("© 2026 ذكرني. جميع الحقوق محفوظة.", "© 2026 Thakirni. All rights reserved.")}
          </p>
          <div className="flex gap-6 text-xs text-slate-600">
            <Link href="/privacy" className="hover:text-amber-400 transition-colors underline-offset-4 hover:underline decoration-amber-500/40">
              {t("سياسة الخصوصية", "Privacy Policy")}
            </Link>
            <Link href="/terms" className="hover:text-amber-400 transition-colors underline-offset-4 hover:underline decoration-amber-500/40">
              {t("الشروط", "Terms")}
            </Link>
            <Link href="/contact" className="hover:text-amber-400 transition-colors underline-offset-4 hover:underline decoration-amber-500/40">
              {t("تواصل معنا", "Contact")}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
