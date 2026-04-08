import Link from "next/link";
import { BrandLogo } from "@/components/thakirni/brand-logo";

export default function MaintenancePage() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
      <div className="text-center max-w-md space-y-6">
        <BrandLogo />

        <div className="bg-slate-50 dark:bg-white/[0.03] rounded-2xl p-8 space-y-4">
          <div className="w-16 h-16 bg-amber-600/10 rounded-2xl flex items-center justify-center mx-auto">
            <svg
              className="w-8 h-8 text-amber-600 dark:text-amber-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z"
              />
            </svg>
          </div>

          <h1 className="text-2xl font-headline font-bold text-slate-900">
            We&apos;re doing maintenance
          </h1>
          <p className="text-slate-500 font-label">
            Thakirni is currently undergoing scheduled maintenance. We&apos;ll be back shortly.
            Thank you for your patience!
          </p>
        </div>

        <p className="text-xs text-slate-400 font-label">
          Are you an admin?{" "}
          <Link href="/auth" className="text-amber-600 dark:text-amber-400 hover:underline">
            Sign in here
          </Link>
        </p>
      </div>
    </div>
  );
}
