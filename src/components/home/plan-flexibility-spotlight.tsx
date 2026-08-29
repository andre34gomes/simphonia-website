import { Reveal } from "@/components/motion/reveal";
import { MapPin, Orbit, Globe } from "lucide-react";

export function PlanFlexibilitySpotlight() {
  return (
    <section className="border-y border-border/60 bg-card/30 py-24">
      <div className="mx-auto max-w-3xl px-6 text-center lg:px-8">
        <Reveal>
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <MapPin className="size-3.5" />
            Local, Regional &amp; Global
          </div>
          <h2 className="mt-5 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            One app, every trip shape
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
            Most eSIM apps sell you the same one-size-fits-all plan no matter
            where you&apos;re headed. Simphonia lets you pick the coverage
            that actually matches your itinerary — so a weekend in Lisbon
            doesn&apos;t cost the same as a six-country backpacking trip.
          </p>
          <ul className="mx-auto mt-6 flex w-fit flex-col gap-3 text-left text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <MapPin className="mt-0.5 size-4 shrink-0 text-primary" />
              Local plans sized for a single country — no overpaying for
              coverage you won&apos;t use
            </li>
            <li className="flex items-start gap-2">
              <Orbit className="mt-0.5 size-4 shrink-0 text-primary" />
              Regional plans that stay connected across borders, without
              swapping eSIMs mid-trip
            </li>
            <li className="flex items-start gap-2">
              <Globe className="mt-0.5 size-4 shrink-0 text-primary" />
              Global plans for round-the-world routes, all under one balance
            </li>
          </ul>
        </Reveal>
      </div>
    </section>
  );
}
