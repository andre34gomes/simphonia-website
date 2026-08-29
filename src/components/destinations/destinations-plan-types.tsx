import { Globe, MapPin, Orbit } from "lucide-react";
import Link from "next/link";

const planTypes = [
  {
    icon: MapPin,
    title: "Local Plans",
    description:
      "Data sized exactly for a single-country trip — no overpaying for coverage you won't use.",
  },
  {
    icon: Orbit,
    title: "Regional Plans",
    description:
      "One eSIM that stays connected across a whole region, so you don't swap plans at every border.",
  },
  {
    icon: Globe,
    title: "Global Plans",
    description:
      "A single plan for round-the-world trips, with coverage across 200+ destinations worldwide.",
  },
];

export function DestinationsPlanTypes() {
  return (
    <section className="border-y border-border/60 bg-card/30 py-16 lg:py-20">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
          {planTypes.map((plan) => (
            <div key={plan.title} className="text-center sm:text-left">
              <div className="mx-auto flex size-11 items-center justify-center rounded-xl bg-primary/10 sm:mx-0">
                <plan.icon className="size-5 text-primary" />
              </div>
              <h2 className="mt-4 text-lg font-semibold text-foreground">
                {plan.title}
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {plan.description}
              </p>
            </div>
          ))}
        </div>
        <p className="mt-10 text-center text-sm text-muted-foreground">
          Every destination below works with all three plan types.{" "}
          <Link
            href="/how-it-works"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            See how it works
          </Link>
        </p>
      </div>
    </section>
  );
}
