import Link from "next/link";
import { ArrowRight, Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function AboutTeamCta() {
  return (
    <>
      {/* Team */}
      <section className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-medium text-primary">
            Our Team
          </div>
          <h2 className="mt-6 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            The Person Behind Simphonia
          </h2>
        </div>

        <div className="mt-12 flex justify-center">
          <Card className="w-full max-w-xs border-border/60 bg-card/60 text-center shadow-sm">
            <CardContent className="flex flex-col items-center gap-4 pt-6">
              <div className="flex size-20 items-center justify-center rounded-full bg-gradient-to-br from-[#f0d060] via-primary to-[#b8941f] text-xl font-semibold tracking-wide text-background ring-2 ring-primary/25 ring-offset-2 ring-offset-card shadow-(--shadow-primary)">
                AG
              </div>
              <div>
                <div className="text-base font-semibold text-foreground">
                  André Gomes
                </div>
                <div className="mt-1 text-sm text-muted-foreground">
                  Founder &amp; CEO
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden py-24">
        <div
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            background:
              "radial-gradient(ellipse 60% 50% at 50% 50%, color-mix(in oklch, var(--primary) 12%, transparent), transparent)",
          }}
        />
        <div className="mx-auto max-w-3xl px-6 text-center lg:px-8">
          <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Be Part of the Journey
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Explore our destinations and stay connected wherever you travel.
          </p>
          <div className="mt-10 flex justify-center">
            <Button
              size="lg"
              className="h-12 px-6 text-base"
              render={<Link href="/destinations" />}
              nativeButton={false}
            >
              <Compass data-icon="inline-start" />
              Browse Destinations
              <ArrowRight data-icon="inline-end" />
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
