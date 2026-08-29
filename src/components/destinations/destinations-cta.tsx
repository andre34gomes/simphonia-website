import { MessageCircle } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";

export function DestinationsCta() {
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
          Can&apos;t Find Your Destination?
        </h2>
        <p className="mt-4 text-lg text-muted-foreground">
          We&apos;re adding new countries every week. Check back soon for
          more destinations.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <ButtonLink
            variant="cta"
            size="cta"
            href="/support"
          >
            <MessageCircle data-icon="inline-start" />
            Contact Support
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}
