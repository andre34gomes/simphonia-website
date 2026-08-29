import type { LucideIcon } from "lucide-react";
import {
  Globe2,
  Zap,
  MessageCircleHeart,
  ShieldCheck,
  Heart,
  Layers,
  Gift,
  Gauge,
} from "lucide-react";

export interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
}

export const features: Feature[] = [
  {
    icon: Globe2,
    title: "200+ Destinations",
    description:
      "Local, regional, and global data plans covering more than 200 countries and territories worldwide.",
  },
  {
    icon: Zap,
    title: "Instant Activation",
    description:
      "Scan a QR code or install with one tap. Your eSIM is active in seconds — no waiting, no physical SIM.",
  },
  {
    icon: ShieldCheck,
    title: "Secure Checkout",
    description:
      "Payments processed through Stripe with bank-level encryption and full multi-currency support.",
  },
  {
    icon: MessageCircleHeart,
    title: "AI-Powered Support",
    description:
      "Real-time chat support backed by AI, available whenever you need help choosing or troubleshooting a plan.",
  },
  {
    icon: Heart,
    title: "Favorites & Referrals",
    description:
      "Save your go-to destinations and earn discounts by inviting friends to travel connected.",
  },
  {
    icon: Layers,
    title: "Local, Regional & Global Plans",
    description:
      "Pick coverage sized to your actual trip — a single country, a whole region, or the entire globe on one balance.",
  },
  {
    icon: Gauge,
    title: "Live Data Usage Tracking",
    description:
      "Watch your remaining data in real time inside the app, so you never get caught out mid-trip with no way to check.",
  },
  {
    icon: Gift,
    title: "Transparent Pricing",
    description:
      "No hidden fees, no roaming surprises. See exactly what you pay before you buy, every time.",
  },
];
