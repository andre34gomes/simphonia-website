import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { features } from "@/data/features";

export function FeaturesGrid() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-24 lg:px-8">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Everything a traveler needs,
          <span className="text-primary"> nothing they don&apos;t</span>
        </h2>
        <p className="mt-4 text-lg text-muted-foreground">
          Built with Clean Architecture and a relentless focus on the details
          that make travel connectivity effortless.
        </p>
      </div>

      <div className="mt-16 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {features.map((feature) => (
          <Card
            key={feature.title}
            className="border-border/60 bg-card/60 transition-colors hover:border-primary/40"
          >
            <CardHeader>
              <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10">
                <feature.icon className="size-5 text-primary" />
              </div>
              <CardTitle className="mt-3 text-base">{feature.title}</CardTitle>
              <CardDescription className="text-sm leading-relaxed">
                {feature.description}
              </CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>
    </section>
  );
}
