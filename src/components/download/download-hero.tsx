import { Download as DownloadIcon } from "lucide-react";
import { PhoneMockup } from "@/components/shared/phone-mockup";
import { StoreBadges } from "@/components/shared/store-badges";

const stats = [
  { value: "Free", label: "To download" },
  { value: "200+", label: "Destinations covered" },
  { value: "<60s", label: "To activate" },
];

export function DownloadHero() {
  return (
    <section className="relative overflow-hidden">
      <div
        className="pointer-events-none absolute inset-x-0 -top-40 -z-10 h-[560px] bg-[radial-gradient(ellipse_at_top,_var(--primary)_0%,_transparent_60%)] opacity-[0.12]"
        aria-hidden="true"
      />

      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-16 px-6 py-20 lg:grid-cols-2 lg:gap-12 lg:px-8 lg:py-28">
        <div className="animate-in slide-in-from-bottom-3 duration-700 ease-out-expo">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-medium text-primary">
            <DownloadIcon className="size-3.5" />
            Available on iOS and Android
          </div>

          <h1 className="mt-6 text-4xl font-semibold tracking-tight text-balance text-foreground sm:text-5xl lg:text-6xl">
            Get Simphonia,
            <span className="block bg-gradient-to-r from-[#f0d060] via-primary to-[#b8941f] bg-clip-text text-transparent">
              travel connected.
            </span>
          </h1>

          <p className="mt-6 max-w-xl text-lg text-pretty text-muted-foreground">
            Download the app, pick your destination, and activate your eSIM
            in under a minute — no SIM swap, no roaming surprises, no
            waiting in line at the airport kiosk.
          </p>

          <StoreBadges className="mt-10" />

          <dl className="mt-14 grid grid-cols-3 gap-6 border-t border-border/60 pt-8">
            {stats.map((stat) => (
              <div key={stat.label}>
                <dt className="text-2xl font-semibold text-foreground sm:text-3xl">
                  {stat.value}
                </dt>
                <dd className="mt-1 text-xs text-muted-foreground sm:text-sm">
                  {stat.label}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="relative mx-auto flex w-full max-w-md items-center justify-center animate-in zoom-in-95 duration-700 ease-out-expo">
          <div className="absolute -right-6 top-6 hidden w-[42%] rotate-6 opacity-70 blur-[1px] sm:block lg:-right-2">
            <PhoneMockup
              src="/screenshots/cart-populated.webp"
              alt="Simphonia checkout screen"
              priority
              className="max-w-none"
            />
          </div>
          <div className="absolute -left-8 bottom-8 hidden w-[40%] -rotate-6 opacity-60 blur-[1px] sm:block lg:-left-4">
            <PhoneMockup
              src="/screenshots/plan-selected.webp"
              alt="Simphonia plan selection screen"
              priority
              className="max-w-none"
            />
          </div>
          <PhoneMockup
            src="/screenshots/profile-dark.webp"
            alt="Simphonia profile screen in dark mode"
            priority
            className="relative z-10 max-w-[280px] drop-shadow-2xl"
          />
        </div>
      </div>
    </section>
  );
}
