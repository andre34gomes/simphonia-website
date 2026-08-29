"use client";

import { CheckCircle2, CreditCard, Heart } from "lucide-react";
import { motion } from "motion/react";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/reveal";
import { hoverLift } from "@/lib/motion";

const items = [
  {
    icon: CheckCircle2,
    title: "Clear plan details",
    description: "Data allowance, validity, and price up front — no surprises at checkout.",
  },
  {
    icon: CreditCard,
    title: "Fast, secure checkout",
    description: "Stripe-powered payments with support for major cards and wallets.",
  },
  {
    icon: Heart,
    title: "Save your go-to destinations",
    description: "Favorite countries and plans for one-tap reordering on your next trip.",
  },
];

export function CheckoutShowcase() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-24 lg:px-8">
      <Reveal className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Shop with confidence
        </h2>
        <p className="mt-4 text-lg text-muted-foreground">
          A checkout experience that feels as premium as the app around it.
        </p>
      </Reveal>

      <RevealGroup className="mt-16 grid grid-cols-1 gap-x-8 gap-y-14 sm:grid-cols-3">
        {items.map((item) => (
          <RevealItem key={item.title} className="flex flex-col items-center text-center">
            <motion.div
              {...hoverLift}
              className="flex size-16 items-center justify-center rounded-2xl bg-primary/10"
            >
              <item.icon className="size-7 text-primary" />
            </motion.div>
            <h3 className="mt-6 text-lg font-semibold text-foreground">
              {item.title}
            </h3>
            <p className="mt-2 max-w-xs text-sm text-muted-foreground">
              {item.description}
            </p>
          </RevealItem>
        ))}
      </RevealGroup>
    </section>
  );
}
