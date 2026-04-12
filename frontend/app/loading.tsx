import { Skeleton } from "@/components/ui/skeleton"

export default function GlobalLoading() {
  return (
    <div className="min-h-screen bg-background hero-mesh flex items-center justify-center px-6">
      <div className="w-full max-w-md rounded-[2rem] border border-border/80 bg-card/80 backdrop-blur-xl shadow-card p-6 space-y-5">
        <div className="flex items-center gap-4">
          <div
            className="w-12 h-12 rounded-2xl border-4 border-amber-600/15 border-t-amber-600 animate-spin shrink-0"
            role="status"
            aria-label="Loading"
          />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-5 w-36 rounded-full" />
            <Skeleton className="h-3 w-24 rounded-full" />
          </div>
        </div>

        <div className="space-y-3">
          <Skeleton className="h-24 w-full rounded-[1.5rem]" />
          <div className="grid grid-cols-2 gap-3">
            <Skeleton className="h-20 w-full rounded-[1.25rem]" />
            <Skeleton className="h-20 w-full rounded-[1.25rem]" />
          </div>
        </div>
      </div>
    </div>
  )
}
