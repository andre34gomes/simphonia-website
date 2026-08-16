import Link from "next/link";
import { ArrowRight, Compass, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export function HiwCta() {
  return (
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
          Ready to Get Started?
        </h2>
        <p className="mt-4 text-lg text-muted-foreground">
          Your next trip is 2 minutes away from being fully connected.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-4">
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
          <Button
            variant="outline"
            size="lg"
            className="h-12 px-6 text-base"
            render={<Link href="/" />}
            nativeButton={false}
          >
            <Home data-icon="inline-start" />
            Back to Home
          </Button>
        </div>
      </div>
    </section>
  );
}
