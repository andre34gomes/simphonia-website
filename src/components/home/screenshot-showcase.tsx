"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PhoneMockup } from "@/components/shared/phone-mockup";

const plans = [
  {
    value: "local",
    label: "Local",
    src: "/screenshots/local-tab.png",
    title: "Local plans for single-country trips",
    description:
      "Landing in one country? Pick a local data plan sized exactly to your trip length and data needs — no overpaying for coverage you won't use.",
  },
  {
    value: "regional",
    label: "Regional",
    src: "/screenshots/regional-tab.png",
    title: "Regional plans for multi-country journeys",
    description:
      "Hopping between neighboring countries? One regional eSIM keeps you online across an entire region without swapping plans at every border.",
  },
  {
    value: "global",
    label: "Global",
    src: "/screenshots/global-tab.png",
    title: "Global plans for round-the-world travel",
    description:
      "For trips that span continents, a single global plan keeps you connected in 200+ destinations — one purchase, worldwide coverage.",
  },
];

export function ScreenshotShowcase() {
  return (
    <section className="border-y border-border/60 bg-card/30 py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Plans that match how you actually travel
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Every itinerary is different. Simphonia adapts with three ways to
            buy data, browsed right from the app.
          </p>
        </div>

        <Tabs defaultValue="local" className="mt-14 items-center">
          <TabsList className="h-11 gap-1 bg-muted/60 p-1.5">
            {plans.map((plan) => (
              <TabsTrigger
                key={plan.value}
                value={plan.value}
                className="h-8 px-5 text-sm"
              >
                {plan.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {plans.map((plan) => (
            <TabsContent
              key={plan.value}
              value={plan.value}
              className="mt-12 flex-none"
            >
              <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
                <PhoneMockup
                  src={plan.src}
                  alt={plan.title}
                  className="max-w-[280px]"
                />
                <div className="text-center lg:text-left">
                  <h3 className="text-2xl font-semibold text-foreground">
                    {plan.title}
                  </h3>
                  <p className="mt-4 text-base text-muted-foreground">
                    {plan.description}
                  </p>
                </div>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </section>
  );
}
