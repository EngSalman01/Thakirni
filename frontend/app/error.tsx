"use client";

import { useEffect } from "react";
import Link from "next/link";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="text-center max-w-md w-full">
        {/* Icon */}
        <div
          className="text-[5rem] leading-none select-none mb-6"
          aria-hidden="true"
        >
          ⚠️
        </div>

        {/* Card */}
        <div className="bg-slate-50 dark:bg-white/[0.03] rounded-2xl p-8 shadow-sm border border-stone-200">
          <h1 className="text-2xl font-bold text-slate-800 mb-1">
            حدث خطأ ما
          </h1>
          <p className="text-sm text-slate-400 mb-1">Something went wrong</p>
          <p className="text-slate-500 text-sm mt-3 mb-8">
            نعتذر، حدث خطأ غير متوقع
            <br />
            <span className="text-slate-400">
              An unexpected error occurred
            </span>
          </p>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={reset}
              className="inline-flex items-center justify-center px-6 py-2.5 rounded-xl text-sm font-medium text-white transition-opacity hover:opacity-90"
              style={{
                background: "linear-gradient(135deg, #D97706 0%, #F59E0B 100%)",
              }}
            >
              حاول مجدداً / Try Again
            </button>

            <Link
              href="/"
              className="inline-flex items-center justify-center px-6 py-2.5 rounded-xl text-sm font-medium text-amber-600 dark:text-amber-400 bg-white border border-amber-600/30 transition-colors hover:bg-amber-600/5"
            >
              العودة للرئيسية / Go Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
