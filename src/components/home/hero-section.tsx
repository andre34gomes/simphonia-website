"use client";

import { ArrowRight, Sparkles } from "lucide-react";
import { motion } from "motion/react";
import { ButtonLink } from "@/components/ui/button";
import { StoreBadges } from "@/components/shared/store-badges";
import { PhoneProductPreview } from "@/components/home/phone-product-preview";
import { SPRING } from "@/lib/motion";
import { cn } from "@/lib/utils";

const stats = [
  { value: "200+", label: "Countries & regions" },
  { value: "21", label: "Languages supported" },
  { value: "<60s", label: "To activate" },
];

function HeroTrust({ className }: { className?: string }) {
  return (
    <div className={cn("mt-8", className)}>
      <StoreBadges className="justify-center lg:justify-start" />

      <dl className="mx-auto mt-12 grid max-w-xl grid-cols-3 gap-4 border-t border-border/60 pt-8 text-left lg:mx-0 sm:gap-6">
        {stats.map((stat) => (
          <div key={stat.label}>
            <dt className="text-2xl font-semibold text-foreground sm:text-3xl">
              {stat.value}
            </dt>
            <dd className="mt-1 text-xs text-muted-foreground sm:text-sm">
              {stat.label}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export function HeroSection() {
  return (
    <section className="relative isolate overflow-hidden">
      {/* Ambient glow */}
      <div
        className="pointer-events-none absolute inset-x-0 -top-40 -z-10 h-[660px] bg-[radial-gradient(ellipse_at_top,_var(--primary)_0%,_transparent_60%)] opacity-[0.12]"
        aria-hidden="true"
      />

      <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8 lg:py-24">
        <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.72fr)]">
          {/* Transform-only entrance keeps the above-the-fold copy LCP-eligible. */}
          <motion.div
            className="text-center lg:text-left"
            initial={{ y: 24, scale: 0.99 }}
            animate={{ y: 0, scale: 1 }}
            transition={SPRING.critical}
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-medium text-primary">
              <Sparkles className="size-3.5" aria-hidden="true" />
              Now live across 200+ destinations
            </div>

            <h1 className="mt-6 max-w-2xl text-4xl font-semibold tracking-tight text-balance text-foreground sm:text-5xl lg:text-6xl">
              Global connectivity,
              <span className="block bg-gradient-to-r from-[#f0d060] via-primary to-[#b8941f] bg-clip-text text-transparent">
                ready before you land.
              </span>
            </h1>

            <p className="mx-auto mt-6 max-w-xl text-lg text-pretty text-muted-foreground lg:mx-0">
              Simphonia gives modern travelers instant eSIM access in over 200
              countries — transparent pricing, AI-powered support, and secure
              checkout, all from one beautifully designed app.
            </p>

            <div className="mt-10 flex flex-wrap items-center justify-center gap-4 lg:justify-start">
              <ButtonLink variant="cta" size="cta" href="/download">
                Get the App
                <ArrowRight data-icon="inline-end" />
              </ButtonLink>
              <ButtonLink variant="ctaOutline" size="cta" href="/how-it-works">
                See how it works
              </ButtonLink>
            </div>

            <HeroTrust className="hidden lg:block" />
          </motion.div>

          <motion.div
            className="flex justify-center lg:justify-end"
            initial={{ y: 32, scale: 0.96 }}
            animate={{ y: 0, scale: 1 }}
            transition={SPRING.critical}
          >
            <PhoneProductPreview plan="regional" showMetrics />
          </motion.div>

          <HeroTrust className="lg:hidden" />
        </div>
      </div>
    </section>
  );
}
