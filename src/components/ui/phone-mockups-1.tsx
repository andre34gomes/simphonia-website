import {
  ImageItem,
  PhoneCarousel,
} from "@/components/ui/phone-mockups-1-utils/phone-carousel";

/**
 * Adapted from the `solaceui/phone-mockups-1` community component (21st.dev).
 * The demo's external Cloudinary example images are swapped for real
 * Simphonia app screenshots — this site's CSP (`img-src 'self' data:` in
 * next.config.ts) blocks third-party image hosts outright, and the real
 * screens are more useful here than generic stock app mockups anyway.
 */
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

export default function PhoneMockupBasic() {
  return <PhoneCarousel images={appScreens} />;
}
