"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DURATION, EASE, useReducedMotion } from "@/lib/motion";

export interface ImageItem {
  src: string;
  alt: string;
}

interface PhoneCarouselProps {
  images: ImageItem[];
  /** Applied to the device frame itself (sizing/shadow overrides) — mirrors
   * `PhoneMockup`'s `className` contract so the two are drop-in swappable. */
  className?: string;
  /** Auto-advance interval in ms. Pass 0 to disable autoplay entirely. */
  interval?: number;
  sizes?: string;
  /** Eagerly load the current image — use for above-the-fold placements. */
  priority?: boolean;
}

/**
 * Auto-rotating iPhone mockup carousel. Reuses the exact device-frame chrome
 * from `@/components/shared/phone-mockup` (gradient bezel, notch, side
 * buttons) so it reads as the same physical device everywhere on the site,
 * but stacks multiple screenshots that crossfade in place with prev/next/
 * pause controls — unlike `PhoneMockup`, which only ever shows one static
 * image. Respects `prefers-reduced-motion`: autoplay starts paused and the
 * crossfade is skipped in favor of an instant swap (apple-design §14).
 * `className`/`priority` mirror `PhoneMockup`'s contract (applied to the
 * frame itself) so either component can be swapped in for the other.
 */
export function PhoneCarousel({
  images,
  className,
  interval = 4500,
  sizes,
  priority,
}: PhoneCarouselProps) {
  const prefersReducedMotion = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(!prefersReducedMotion);

  const goTo = useCallback(
    (next: number) => {
      setIndex(((next % images.length) + images.length) % images.length);
    },
    [images.length],
  );

  useEffect(() => {
    if (!isPlaying || interval <= 0 || images.length <= 1) return;
    const id = window.setInterval(() => {
      setIndex((current) => (current + 1) % images.length);
    }, interval);
    return () => window.clearInterval(id);
  }, [isPlaying, interval, images.length]);

  if (images.length === 0) return null;

  const current = images[index];

  return (
    <div className="flex flex-col items-center gap-6">
      <div className={cn("relative mx-auto aspect-[9/19.5] w-full max-w-[300px]", className)}>
        {/* Frame */}
        <div className="absolute inset-0 rounded-[2.6rem] bg-gradient-to-b from-[#3a3a3d] to-[#1a1a1c] p-[3px] shadow-2xl shadow-black/50">
          <div className="h-full w-full rounded-[2.5rem] bg-black p-2">
            <div className="relative h-full w-full overflow-hidden rounded-[2rem] bg-black">
              {prefersReducedMotion ? (
                <Image
                  src={current.src}
                  alt={current.alt}
                  fill
                  priority={priority}
                  sizes={sizes ?? "(max-width: 768px) 60vw, 300px"}
                  className="object-cover object-top"
                />
              ) : (
                <AnimatePresence mode="sync" initial={false}>
                  <motion.div
                    key={current.src}
                    className="absolute inset-0"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: DURATION.slow, ease: EASE.standard }}
                  >
                    <Image
                      src={current.src}
                      alt={current.alt}
                      fill
                      priority={priority}
                      sizes={sizes ?? "(max-width: 768px) 60vw, 300px"}
                      className="object-cover object-top"
                    />
                  </motion.div>
                </AnimatePresence>
              )}
              {/* Dynamic-island style notch */}
              <div className="absolute top-2 left-1/2 h-5 w-24 -translate-x-1/2 rounded-full bg-black" />
            </div>
          </div>
        </div>
        {/* Side buttons */}
        <div className="absolute top-24 -left-[3px] h-8 w-[3px] rounded-l-sm bg-[#2a2a2d]" />
        <div className="absolute top-36 -left-[3px] h-14 w-[3px] rounded-l-sm bg-[#2a2a2d]" />
        <div className="absolute top-28 -right-[3px] h-16 w-[3px] rounded-r-sm bg-[#2a2a2d]" />
      </div>

      {images.length > 1 && (
        <div
          className="flex items-center gap-3"
          role="group"
          aria-label="Carousel controls"
        >
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => goTo(index - 1)}
            aria-label="Previous screen"
          >
            <ChevronLeft />
          </Button>

          <div className="flex items-center gap-1.5" role="tablist" aria-label="Slides">
            {images.map((image, i) => (
              <button
                key={image.src}
                type="button"
                role="tab"
                aria-selected={i === index}
                aria-label={`Show ${image.alt}`}
                onClick={() => goTo(i)}
                className={cn(
                  "size-1.5 rounded-full transition-[background-color,transform] duration-(--duration-micro)",
                  i === index
                    ? "scale-125 bg-primary"
                    : "bg-muted-foreground/30 hover:bg-muted-foreground/50",
                )}
              />
            ))}
          </div>

          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => setIsPlaying((playing) => !playing)}
            aria-label={isPlaying ? "Pause carousel" : "Play carousel"}
          >
            {isPlaying ? <Pause /> : <Play />}
          </Button>

          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => goTo(index + 1)}
            aria-label="Next screen"
          >
            <ChevronRight />
          </Button>
        </div>
      )}
    </div>
  );
}
