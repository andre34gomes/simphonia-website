import {
  PhoneCarousel,
  type ImageItem,
} from "@/components/ui/phone-mockups-1-utils/phone-carousel";
import { Reveal, ScaleReveal } from "@/components/motion/reveal";

const appScreens: ImageItem[] = [
  {
    src: "/screenshots/home-dark.webp",
    alt: "Simphonia home screen showing the world at night",
  },
  {
    src: "/screenshots/country-detail.webp",
    alt: "Country detail screen with available eSIM plans",
  },
  {
    src: "/screenshots/plan-selected.webp",
    alt: "Plan details before checkout",
  },
  {
    src: "/screenshots/cart-populated.webp",
    alt: "Secure Stripe-powered checkout",
  },
  {
    src: "/screenshots/favorites.webp",
    alt: "Saved destinations for one-tap reordering",
  },
];

/**
 * Below-the-fold, auto-rotating tour of the real app using `PhoneCarousel`
 * (integrated from the `solaceui/phone-mockups-1` component). Distinct from
 * `ScreenshotShowcase`'s tab-driven single mockups and `CheckoutShowcase`'s
 * three side-by-side static mockups — this section's job is a single-frame,
 * self-playing walkthrough of the whole journey, not a click-to-compare.
 */
export function AppPreviewShowcase() {
  return (
    <section className="border-y border-border/60 bg-card/30 py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <Reveal className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            One app, every step of the trip
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            From picking a destination to landing connected — take a tour of
            the real Simphonia app, screen by screen.
          </p>
        </Reveal>

        <ScaleReveal delay={0.1} className="mt-14">
          <PhoneCarousel images={appScreens} />
        </ScaleReveal>
      </div>
    </section>
  );
}
