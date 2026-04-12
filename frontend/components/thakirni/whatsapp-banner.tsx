"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useLanguage } from "@/components/language-provider";

export function WhatsAppBanner() {
  const { t } = useLanguage();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem("wa_banner_dismissed")) return;
    const supabase = createClient();
    (async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;
        const { data } = await supabase
          .from("whatsapp_connections")
          .select("id")
          .eq("user_id", user.id)
          .eq("status", "active")
          .limit(1)
          .maybeSingle();
        if (data?.id) setShow(true);
      } catch {}
    })();
  }, []);

  const handleDismiss = () => {
    sessionStorage.setItem("wa_banner_dismissed", "1");
    setShow(false);
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
          className="flex items-center justify-between gap-3 px-5 py-3 rounded-2xl bg-[#25D366]/10 border border-[#25D366]/30 mb-6 animate-pulse-glow shadow-card backdrop-blur-sm"
        >
          <div className="flex items-center gap-3">
            <span className="relative flex shrink-0">
              <span className="animate-ping absolute inline-flex h-2.5 w-2.5 rounded-full bg-[#25D366] opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#25D366]" />
            </span>
            <span className="text-sm font-semibold text-[#1a7c45] dark:text-[#4ade80]">
              {t(
                "📱 شيّك واتساب — أرسلنا لك رسالة تجريبية",
                "📱 Check WhatsApp — we sent you a test message"
              )}
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link href="/vault/settings/whatsapp">
              <motion.span
                whileHover={{ scale: 1.03 }}
                className="text-xs font-bold text-[#1a7c45] dark:text-[#4ade80] underline cursor-pointer"
              >
                {t("إعدادات", "Settings")}
              </motion.span>
            </Link>
            <button
              onClick={handleDismiss}
              className="p-1 rounded-full hover:bg-[#25D366]/20 transition-colors"
              aria-label="Dismiss"
            >
              <X className="w-3.5 h-3.5 text-[#1a7c45] dark:text-[#4ade80]" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
