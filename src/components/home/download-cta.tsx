import { StoreBadges } from "@/components/shared/store-badges";

export function DownloadCta() {
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
          Ready to travel connected?
        </h2>
        <p className="mt-4 text-lg text-muted-foreground">
          Download Simphonia and get online in 200+ destinations before your
          plane even lands.
        </p>
        <div className="mt-10 flex justify-center">
          <StoreBadges />
        </div>
      </div>
    </section>
  );
}
