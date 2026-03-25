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
    <div className="min-h-screen bg-[#fbf9f8] flex items-center justify-center px-4">
      <div className="text-center max-w-md w-full">
        {/* Icon */}
        <div
          className="text-[5rem] leading-none select-none mb-6"
          aria-hidden="true"
        >
          ⚠️
        </div>

        {/* Card */}
        <div className="bg-[#f6f3f2] rounded-2xl p-8 shadow-sm border border-stone-200">
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
                background: "linear-gradient(135deg, #2552ca 0%, #ad1d7f 100%)",
              }}
            >
              حاول مجدداً / Try Again
            </button>

            <Link
              href="/"
              className="inline-flex items-center justify-center px-6 py-2.5 rounded-xl text-sm font-medium text-[#2552ca] bg-white border border-[#2552ca]/30 transition-colors hover:bg-[#2552ca]/5"
            >
              العودة للرئيسية / Go Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
