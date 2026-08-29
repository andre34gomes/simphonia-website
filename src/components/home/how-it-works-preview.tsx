"use client";

import { Search, CreditCard, QrCode, Wifi, ArrowRight } from "lucide-react";
import { motion } from "motion/react";
import { ButtonLink } from "@/components/ui/button";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/reveal";
import { hoverLift } from "@/lib/motion";

const steps = [
  {
    icon: Search,
    title: "Choose your destination",
    description: "Search any of 200+ countries or browse by region.",
  },
  {
    icon: CreditCard,
    title: "Pick a plan & pay securely",
    description: "Transparent pricing, multi-currency, Stripe checkout.",
  },
  {
    icon: QrCode,
    title: "Install your eSIM",
    description: "Scan the QR code or install with a single tap.",
  },
  {
    icon: Wifi,
    title: "Connect instantly",
    description: "You're online in under a minute — no physical SIM.",
  },
];

export function HowItWorksPreview() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-24 lg:px-8">
      <Reveal className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          From checkout to connected in minutes
        </h2>
        <p className="mt-4 text-lg text-muted-foreground">
          No store visits, no waiting for shipping, no cutting your physical
          SIM in half.
        </p>
      </Reveal>

      <RevealGroup className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((step, index) => (
          <RevealItem key={step.title} className="relative">
            <motion.div
              {...hoverLift}
              className="flex size-12 items-center justify-center rounded-2xl border border-primary/30 bg-primary/10 text-primary"
            >
              <step.icon className="size-5" />
            </motion.div>
            <span className="mt-4 block text-xs font-semibold tracking-wide text-primary/70 uppercase">
              Step {index + 1}
            </span>
            <h3 className="mt-2 text-lg font-semibold text-foreground">
              {step.title}
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {step.description}
            </p>
          </RevealItem>
        ))}
      </RevealGroup>

      <Reveal className="mt-14 flex justify-center" delay={0.15}>
        <ButtonLink variant="ctaOutline" size="cta" href="/how-it-works">
          See the full walkthrough
          <ArrowRight data-icon="inline-end" />
        </ButtonLink>
      </Reveal>
    </section>
  );
}
