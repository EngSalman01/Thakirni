"use client";

import { useEffect } from "react";
import Link from "next/link";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function VaultError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center", padding: "0 16px" }}>
      <div className="text-center max-w-md w-full">
        {/* Icon */}
        <div
          className="text-[5rem] leading-none select-none mb-6"
          aria-hidden="true"
        >
          ⚠️
        </div>

        {/* Card */}
        <div className="card" style={{ padding: "2rem" }}>
          <h1 className="text-2xl font-bold mb-1" style={{ color: "var(--tx)" }}>
            خطأ في الخزينة
          </h1>
          <p className="text-sm mb-1" style={{ color: "var(--tx2)" }}>Vault Error</p>
          <p className="text-sm mt-3 mb-8" style={{ color: "var(--tx2)" }}>
            نعتذر، حدث خطأ غير متوقع في الخزينة
            <br />
            <span style={{ color: "var(--tx2)" }}>
              An unexpected error occurred in the vault
            </span>
          </p>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={reset}
              className="btn btn-primary"
            >
              حاول مجدداً / Try Again
            </button>

            <Link
              href="/vault"
              className="btn btn-sec"
            >
              العودة للخزينة / Back to Vault
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
