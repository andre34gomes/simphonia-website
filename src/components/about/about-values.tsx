import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Globe, Zap, Gem, HeartHandshake } from "lucide-react";

const values = [
  {
    icon: Globe,
    title: "Global First",
    description:
      "We think globally. Every feature, every plan, every decision is made with the world traveler in mind. Coverage without borders.",
  },
  {
    icon: Zap,
    title: "Instant Everything",
    description:
      "Speed matters when you travel. From purchase to activation, everything happens in seconds. No waiting, no delays.",
  },
  {
    icon: Gem,
    title: "Radical Transparency",
    description:
      "No hidden fees, no surprise charges, no fine print. What you see is what you pay. We believe trust is built through honesty.",
  },
  {
    icon: HeartHandshake,
    title: "Traveler Obsessed",
    description:
      "Every feature exists because a traveler needed it. We listen, iterate, and ship relentlessly to solve real travel pain points.",
  },
];

export function AboutValues() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-16 lg:px-8 lg:py-24">
      <div className="mx-auto max-w-2xl text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-medium text-primary">
          Our Values
        </div>
        <h2 className="mt-6 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          What Drives Us
        </h2>
      </div>

      <div className="mt-16 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {values.map((value) => (
          <Card
            key={value.title}
            className="border-border/60 bg-card/60 transition-colors hover:border-primary/40"
          >
            <CardHeader>
              <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10">
                <value.icon className="size-5 text-primary" />
              </div>
              <CardTitle className="mt-3 text-base">{value.title}</CardTitle>
              <CardDescription className="text-sm leading-relaxed">
                {value.description}
              </CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>
    </section>
  );
}
