export interface NavLink {
  label: string;
  href: string;
}

export const mainNav: NavLink[] = [
  { label: "Destinations", href: "/destinations" },
  { label: "How It Works", href: "/how-it-works" },
  { label: "About", href: "/about" },
  { label: "Support", href: "/support" },
];

export const footerNav = {
  product: [
    { label: "Download", href: "/download" },
    { label: "Destinations", href: "/destinations" },
    { label: "How It Works", href: "/how-it-works" },
    { label: "Support & FAQ", href: "/support" },
  ],
  company: [
    { label: "About Simphonia", href: "/about" },
    { label: "Support & FAQ", href: "/support" },
  ],
  legal: [
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Terms of Service", href: "/terms" },
  ],
};

export const APP_STORE_URL = "https://apps.apple.com/app/simphonia/id6740088498";
export const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=com.simphonia.app";
