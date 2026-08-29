const stats = [
  { value: "200+", label: "Countries" },
  { value: "<2min", label: "To Connect" },
  { value: "24/7", label: "AI Support" },
];

export function AboutStory() {
  return (
    <section className="mx-auto max-w-3xl px-6 py-16 text-center lg:px-8 lg:py-24">
      <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-medium text-primary">
        Our Story
      </div>
      <h2 className="mt-6 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
        Born From a
        <br />
        <span className="text-primary">Travel Frustration</span>
      </h2>
      <blockquote className="mx-auto mt-6 max-w-xl border-l-2 border-primary/50 pl-4 text-left text-lg text-pretty text-foreground/90 italic">
        &ldquo;I landed in Tokyo at midnight with zero mobile data. No
        maps, no ride, no translation. That one trip changed
        everything.&rdquo;
      </blockquote>
      <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-muted-foreground">
        That frustration — the overpriced roaming, the hunt for local SIM
        cards, the confusing carrier shops — became the spark behind
        Simphonia.
      </p>
      <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-muted-foreground">
        Founded in 2024, we set out to make global connectivity instant
        and accessible for every traveler. Today, Simphonia covers 200+
        countries with one-tap eSIM activation, transparent pricing, and
        24/7 AI-powered support.
      </p>

      <div className="mx-auto mt-10 grid max-w-lg grid-cols-3 gap-6 border-t border-border/60 pt-8">
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
    </section>
  );
}
