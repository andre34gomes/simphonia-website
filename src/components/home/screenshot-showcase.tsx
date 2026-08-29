"use client";

import { Check } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Reveal } from "@/components/motion/reveal";
import {
  PhoneProductPreview,
  type PhonePreviewPlan,
} from "@/components/home/phone-product-preview";

const plans = [
  {
    value: "local" as const,
    label: "Local",
    title: "Local plans for single-country trips",
    description:
      "Landing in one country? Pick a local data plan sized exactly to your trip length and data needs — no overpaying for coverage you won't use.",
    highlights: [
      "Choose coverage for one destination",
      "See data, validity, and price before checkout",
      "Install directly from the app",
    ],
  },
  {
    value: "regional" as const,
    label: "Regional",
    title: "Regional plans for multi-country journeys",
    description:
      "Hopping between neighboring countries? One regional eSIM keeps you online across an entire region without swapping plans at every border.",
    highlights: [
      "Keep the same eSIM across borders",
      "Plan around the route, not each stop",
      "Manage everything in one place",
    ],
  },
  {
    value: "global" as const,
    label: "Global",
    title: "Global plans for round-the-world travel",
    description:
      "For trips that span continents, a single global plan keeps you connected in 200+ destinations — one purchase, worldwide coverage.",
    highlights: [
      "Stay ready for a flexible itinerary",
      "Travel with one global data plan",
      "Get help any time in the app",
    ],
  },
] satisfies Array<{
  value: PhonePreviewPlan;
  label: string;
  title: string;
  description: string;
  highlights: string[];
}>;

export function ScreenshotShowcase() {
  return (
    <section className="border-y border-border/60 bg-card/30 py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <Reveal className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Plans that match how you actually travel
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Every itinerary is different. Simphonia adapts with three ways to
            buy data, browsed right from the app.
          </p>
        </Reveal>

        <Reveal delay={0.1}>
          <Tabs defaultValue="local" className="mt-14 items-center">
            <TabsList
              aria-label="Plan type"
              className="h-11 w-full max-w-md gap-1 bg-muted/60 p-1.5 sm:w-fit"
            >
              {plans.map((plan) => (
                <TabsTrigger
                  key={plan.value}
                  value={plan.value}
                  className="px-5 text-sm"
                >
                  {plan.label}
                </TabsTrigger>
              ))}
            </TabsList>

            {plans.map((plan) => (
              <TabsContent
                key={plan.value}
                value={plan.value}
                className="mt-12 w-full max-w-4xl flex-none"
              >
                <div className="grid items-center gap-10 text-left lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-16">
                  <div>
                    <span className="text-xs font-semibold tracking-[0.16em] text-primary uppercase">
                      {plan.label} coverage
                    </span>
                    <h3 className="mt-3 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                      {plan.title}
                    </h3>
                    <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground">
                      {plan.description}
                    </p>
                    <ul className="mt-7 space-y-3">
                      {plan.highlights.map((highlight) => (
                        <li
                          key={highlight}
                          className="flex items-start gap-3 text-sm text-muted-foreground"
                        >
                          <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                            <Check className="size-3" aria-hidden="true" />
                          </span>
                          {highlight}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <PhoneProductPreview plan={plan.value} />
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </Reveal>
      </div>
    </section>
  );
}
