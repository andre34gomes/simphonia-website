import { PhoneMockup } from "@/components/shared/phone-mockup";
import { Moon, Sun } from "lucide-react";

export function ThemeSpotlight() {
  return (
    <section className="border-y border-border/60 bg-card/30 py-24">
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-16 px-6 lg:grid-cols-2 lg:px-8">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <Sun className="size-3.5" />
            <Moon className="size-3.5" />
            Light &amp; Dark
          </div>
          <h2 className="mt-5 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Looks great at midnight or midday
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Simphonia adapts to your system preference automatically, with
            two fully designed themes — not a hastily inverted color scheme.
            Every screen, from country search to checkout, is polished in
            both modes.
          </p>
          <ul className="mt-6 space-y-3 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="mt-1 size-1.5 shrink-0 rounded-full bg-primary" />
              Automatic system theme detection
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 size-1.5 shrink-0 rounded-full bg-primary" />
              Manual override, always one tap away
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 size-1.5 shrink-0 rounded-full bg-primary" />
              Consistent contrast &amp; accessibility across both
            </li>
          </ul>
        </div>

        <div className="relative mx-auto flex w-full max-w-md items-center justify-center gap-4">
          <PhoneMockup
            src="/screenshots/home-light.png"
            alt="Simphonia home screen in light mode"
            className="max-w-[200px] translate-y-6 opacity-90 sm:max-w-[220px]"
          />
          <PhoneMockup
            src="/screenshots/home-dark.png"
            alt="Simphonia home screen in dark mode"
            className="max-w-[200px] -translate-y-6 sm:max-w-[220px]"
          />
        </div>
      </div>
    </section>
  );
}
