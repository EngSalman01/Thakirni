"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useLanguage } from "@/components/language-provider";

export default function NotFound() {
  const { t, isArabic } = useLanguage();

  return (
    <div
      className="min-h-screen bg-[#fbf9f8] flex items-center justify-center px-4"
      dir={isArabic ? "rtl" : "ltr"}
    >
      <motion.div
        className="text-center max-w-md w-full"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        {/* Large 404 with gradient */}
        <motion.div
          className="text-[8rem] font-bold leading-none select-none mb-6"
          style={{
            background: "linear-gradient(135deg, #2552ca 0%, #ad1d7f 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
        >
          404
        </motion.div>

        {/* Card */}
        <motion.div
          className="bg-[#f6f3f2] rounded-2xl p-8 shadow-sm border border-stone-200"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <h1 className="text-2xl font-bold text-slate-800 mb-2">
            {t("الصفحة غير موجودة", "Page Not Found")}
          </h1>
          <p className="text-slate-500 text-sm mb-8">
            {t(
              "يبدو أن هذه الصفحة لا وجود لها",
              "This page doesn't exist"
            )}
          </p>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/"
              className="inline-flex items-center justify-center px-6 py-2.5 rounded-xl text-sm font-medium text-white transition-opacity hover:opacity-90"
              style={{
                background: "linear-gradient(135deg, #2552ca 0%, #ad1d7f 100%)",
              }}
            >
              {t("العودة للرئيسية", "Back to Home")}
            </Link>

            <Link
              href="/vault"
              className="inline-flex items-center justify-center px-6 py-2.5 rounded-xl text-sm font-medium text-[#2552ca] bg-white border border-[#2552ca]/30 transition-colors hover:bg-[#2552ca]/5"
            >
              {t("افتح الخزينة", "Open Vault")}
            </Link>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
