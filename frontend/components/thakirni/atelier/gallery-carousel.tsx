"use client"

/**
 * GalleryCarousel — horizontal scroll-snap carousel with left/right arrows,
 * a live "n / N" counter, and optional caption. Matches the Obsidian Assembly
 * "Places" and "Objects" scrollers.
 *
 * Uses native scroll-snap for smoothness + zero-dependency behavior; arrows
 * translate by the visible slide width. Also exposes a snap-position dot row.
 *
 * The slot-based API lets consumers put any content inside each slide — images,
 * videos, mini-cards, or text callouts.
 */

import * as React from "react"
import { cn } from "@/lib/utils"

export type GallerySlide = {
  id: string
  /** Content of the slide — image, video, or rich block. */
  content: React.ReactNode
  /** Optional caption rendered under the slide. */
  caption?: React.ReactNode
  /** Optional label used in the counter (e.g., "Riyadh / Vault 01"). */
  label?: string
}

export type GalleryCarouselProps = {
  slides: GallerySlide[]
  /** How many slides are visible at once on desktop. */
  perView?: 1 | 2 | 3
  /** Aspect ratio tuple for each slide's media. */
  aspect?: "4/5" | "3/4" | "1/1" | "16/10" | "16/9"
  /** Fire when the visible index changes (useful for analytics). */
  onIndexChange?: (index: number) => void
  /** Optional class applied to the outer wrapper. */
  className?: string
}

const aspectMap: Record<NonNullable<GalleryCarouselProps["aspect"]>, string> = {
  "4/5": "aspect-[4/5]",
  "3/4": "aspect-[3/4]",
  "1/1": "aspect-square",
  "16/10": "aspect-[16/10]",
  "16/9": "aspect-video",
}

export function GalleryCarousel({
  slides,
  perView = 1,
  aspect = "4/5",
  onIndexChange,
  className,
}: GalleryCarouselProps) {
  const scrollRef = React.useRef<HTMLDivElement | null>(null)
  const [index, setIndex] = React.useState(0)

  // Width of a single slide = track width / perView. Memoized by resize.
  const slideWidth = React.useRef(0)
  React.useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const compute = () => {
      slideWidth.current = el.clientWidth / perView
    }
    compute()
    const ro = new ResizeObserver(compute)
    ro.observe(el)
    return () => ro.disconnect()
  }, [perView])

  // Track scroll position → active index. Throttled via rAF.
  React.useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    let raf = 0
    const onScroll = () => {
      if (raf) return
      raf = requestAnimationFrame(() => {
        raf = 0
        if (!slideWidth.current) return
        const next = Math.round(el.scrollLeft / slideWidth.current)
        setIndex((prev) => {
          if (next !== prev) onIndexChange?.(next)
          return next
        })
      })
    }
    el.addEventListener("scroll", onScroll, { passive: true })
    return () => {
      el.removeEventListener("scroll", onScroll)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [onIndexChange])

  const go = (dir: -1 | 1) => {
    const el = scrollRef.current
    if (!el) return
    el.scrollBy({
      left: dir * slideWidth.current,
      behavior: "smooth",
    })
  }

  const goTo = (i: number) => {
    const el = scrollRef.current
    if (!el) return
    el.scrollTo({ left: i * slideWidth.current, behavior: "smooth" })
  }

  const total = slides.length
  const current = slides[index]

  return (
    <div className={cn("relative w-full", className)}>
      <div
        ref={scrollRef}
        className={cn(
          "no-scrollbar flex snap-x snap-mandatory overflow-x-auto",
          "scroll-smooth gap-[var(--atelier-gutter)]",
          "-mx-[var(--atelier-gutter)] px-[var(--atelier-gutter)]",
        )}
        role="region"
        aria-label="Gallery"
      >
        {slides.map((s) => (
          <div
            key={s.id}
            className={cn(
              "shrink-0 snap-start",
              perView === 1 && "w-full",
              perView === 2 && "w-full md:w-[calc((100%-var(--atelier-gutter))/2)]",
              perView === 3 &&
                "w-full md:w-[calc((100%-var(--atelier-gutter))/2)] lg:w-[calc((100%-2*var(--atelier-gutter))/3)]",
            )}
          >
            <div
              className={cn(
                "relative w-full overflow-hidden rounded-[var(--atelier-radius-md)]",
                "bg-[var(--atelier-surface)] border border-[var(--atelier-border)]",
                aspectMap[aspect],
              )}
            >
              {s.content}
            </div>
            {s.caption && (
              <div className="mt-4 atelier-body text-[var(--atelier-text-muted)]">
                {s.caption}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Controls row */}
      <div className="mt-8 flex items-center justify-between gap-6">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => go(-1)}
            aria-label="Previous slide"
            className="atelier-arrow-btn"
            disabled={index === 0}
          >
            <span aria-hidden>←</span>
          </button>
          <button
            type="button"
            onClick={() => go(1)}
            aria-label="Next slide"
            className="atelier-arrow-btn"
            disabled={index === total - 1}
          >
            <span aria-hidden>→</span>
          </button>
        </div>

        <div className="flex items-baseline gap-3 atelier-eyebrow">
          <span className="tabular-nums text-[var(--c-parchment)]">
            {String(index + 1).padStart(2, "0")}
          </span>
          <span aria-hidden className="text-[var(--atelier-text-subtle)]">
            /
          </span>
          <span className="tabular-nums text-[var(--atelier-text-subtle)]">
            {String(total).padStart(2, "0")}
          </span>
          {current?.label && (
            <>
              <span
                aria-hidden
                className="mx-2 inline-block h-[2px] w-4 bg-[var(--c-ember)] align-middle"
              />
              <span className="text-[var(--atelier-text-muted)]">{current.label}</span>
            </>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {slides.map((s, i) => (
            <button
              key={s.id}
              type="button"
              aria-label={`Go to slide ${i + 1}`}
              onClick={() => goTo(i)}
              className={cn(
                "h-[2px] rounded-full transition-all duration-[var(--atelier-dur-2)]",
                i === index
                  ? "w-6 bg-[var(--c-ember)]"
                  : "w-3 bg-[var(--atelier-border-strong)] hover:bg-[var(--atelier-text-muted)]",
              )}
            />
          ))}
        </div>
      </div>

      <style jsx>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          scrollbar-width: none;
        }
        :global(.atelier-arrow-btn) {
          width: 44px;
          height: 44px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 9999px;
          border: 1px solid var(--atelier-border-strong);
          color: var(--atelier-text-muted);
          background: transparent;
          transition: all var(--atelier-dur-2) var(--atelier-ease-editorial);
        }
        :global(.atelier-arrow-btn):hover:not(:disabled) {
          color: var(--c-parchment);
          border-color: var(--c-parchment);
          transform: translateY(-1px);
        }
        :global(.atelier-arrow-btn):disabled {
          opacity: 0.35;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  )
}
