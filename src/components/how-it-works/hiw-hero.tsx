export function HiwHero() {
  return (
    <section className="relative overflow-hidden">
      <div
        className="pointer-events-none absolute inset-x-0 -top-40 -z-10 h-[420px] bg-[radial-gradient(ellipse_at_top,_var(--primary)_0%,_transparent_60%)] opacity-[0.12]"
        aria-hidden="true"
      />
      <div className="mx-auto max-w-4xl px-6 py-24 text-center lg:px-8 lg:py-28">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-medium text-primary">
          How It Works
        </div>
        <h1 className="mt-6 text-4xl font-semibold tracking-tight text-balance text-foreground sm:text-5xl">
          Connected in Under
          <br />
          <span className="bg-gradient-to-r from-[#f0d060] via-primary to-[#b8941f] bg-clip-text text-transparent">
            2 Minutes
          </span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-pretty text-muted-foreground">
          No stores to visit, no SIM cards to swap, no contracts to sign.
          Just seamless global connectivity in three steps.
        </p>
      </div>
    </section>
  );
}
