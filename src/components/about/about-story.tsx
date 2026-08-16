import Image from "next/image";

const stats = [
  { value: "200+", label: "Countries" },
  { value: "<2min", label: "To Connect" },
  { value: "24/7", label: "AI Support" },
];

export function AboutStory() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-16 lg:px-8 lg:py-24">
      <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-20">
        <div className="relative mx-auto w-full max-w-sm">
          <div
            className="pointer-events-none absolute -inset-8 -z-10 rounded-[3rem] bg-[radial-gradient(circle,_var(--primary)_0%,_transparent_70%)] opacity-[0.15]"
            aria-hidden="true"
          />
          <div className="overflow-hidden rounded-2xl border border-border/60 shadow-2xl shadow-black/40">
            <Image
              src="/screenshots/country-detail.png"
              alt="Simphonia app showing a country's available eSIM data plans"
              width={640}
              height={1380}
              className="h-auto w-full"
              sizes="(max-width: 1024px) 80vw, 400px"
              priority
            />
          </div>
          <div className="absolute -top-4 -left-4 rounded-full border border-primary/30 bg-background px-4 py-1.5 text-xs font-semibold text-primary shadow-lg">
            Est. 2024
          </div>
        </div>

        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-medium text-primary">
            Our Story
          </div>
          <h2 className="mt-6 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Born From a
            <br />
            <span className="text-primary">Travel Frustration</span>
          </h2>
          <blockquote className="mt-6 border-l-2 border-primary/50 pl-4 text-lg text-pretty text-foreground/90 italic">
            &ldquo;I landed in Tokyo at midnight with zero mobile data. No
            maps, no ride, no translation. That one trip changed
            everything.&rdquo;
          </blockquote>
          <p className="mt-6 text-base leading-relaxed text-muted-foreground">
            That frustration — the overpriced roaming, the hunt for local SIM
            cards, the confusing carrier shops — became the spark behind
            Simphonia.
          </p>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            Founded in 2024, we set out to make global connectivity instant
            and accessible for every traveler. Today, Simphonia covers 200+
            countries with one-tap eSIM activation, transparent pricing, and
            24/7 AI-powered support.
          </p>

          <div className="mt-10 grid grid-cols-3 gap-6 border-t border-border/60 pt-8">
            {stats.map((stat) => (
              <div key={stat.label}>
                <div className="text-2xl font-semibold text-primary sm:text-3xl">
                  {stat.value}
                </div>
                <div className="mt-1 text-xs text-muted-foreground sm:text-sm">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
