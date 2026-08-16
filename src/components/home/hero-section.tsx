"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PhoneMockup } from "@/components/shared/phone-mockup";
import { StoreBadges } from "@/components/shared/store-badges";

const stats = [
  { value: "200+", label: "Countries & regions" },
  { value: "21", label: "Languages supported" },
  { value: "<60s", label: "To activate" },
];

export function HeroSection() {
  return (
    <section className="relative overflow-hidden">
      {/* Ambient glow */}
      <div
        className="pointer-events-none absolute inset-x-0 -top-40 -z-10 h-[560px] bg-[radial-gradient(ellipse_at_top,_var(--primary)_0%,_transparent_60%)] opacity-[0.12]"
        aria-hidden="true"
      />

      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-16 px-6 py-20 lg:grid-cols-2 lg:gap-12 lg:px-8 lg:py-28">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-medium text-primary">
            <Sparkles className="size-3.5" />
            Now live across 200+ destinations
          </div>

          <h1 className="mt-6 text-4xl font-semibold tracking-tight text-balance text-foreground sm:text-5xl lg:text-6xl">
            Global connectivity,
            <span className="block bg-gradient-to-r from-[#f0d060] via-primary to-[#b8941f] bg-clip-text text-transparent">
              activated instantly.
            </span>
          </h1>

          <p className="mt-6 max-w-xl text-lg text-pretty text-muted-foreground">
            Simphonia gives modern travelers instant eSIM access in over 200
            countries — transparent pricing, AI-powered support, and secure
            checkout, all from one beautifully designed app.
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Button
              size="lg"
              className="h-12 px-6 text-base"
              render={<Link href="/download" />}
              nativeButton={false}
            >
              Get the App
              <ArrowRight data-icon="inline-end" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="h-12 px-6 text-base"
              render={<Link href="/how-it-works" />}
              nativeButton={false}
            >
              See how it works
            </Button>
          </div>

          <StoreBadges className="mt-8" />

          <dl className="mt-14 grid grid-cols-3 gap-6 border-t border-border/60 pt-8">
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
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, ease: "easeOut", delay: 0.15 }}
          className="relative mx-auto flex w-full max-w-md items-center justify-center"
        >
          <div className="absolute -right-6 top-10 hidden w-[42%] rotate-6 opacity-70 blur-[1px] sm:block lg:-right-2">
            <PhoneMockup
              src="/screenshots/global-tab.png"
              alt="Simphonia global data plans"
              className="max-w-none"
            />
          </div>
          <div className="absolute -left-8 bottom-4 hidden w-[40%] -rotate-6 opacity-60 blur-[1px] sm:block lg:-left-4">
            <PhoneMockup
              src="/screenshots/profile-light.png"
              alt="Simphonia profile screen"
              className="max-w-none"
            />
          </div>
          <PhoneMockup
            src="/screenshots/home-dark.png"
            alt="Simphonia home screen showing the world at night"
            priority
            className="relative z-10 max-w-[280px] drop-shadow-2xl"
          />
        </motion.div>
      </div>
    </section>
  );
}
