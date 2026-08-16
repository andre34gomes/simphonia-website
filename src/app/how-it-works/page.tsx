import type { Metadata } from "next";
import { HiwHero } from "@/components/how-it-works/hiw-hero";
import { HiwSteps } from "@/components/how-it-works/hiw-steps";
import { HiwCta } from "@/components/how-it-works/hiw-cta";

export const metadata: Metadata = {
  title: "How It Works",
  description:
    "Choose your destination, purchase in seconds, and connect instantly. See how Simphonia gets travelers online in under 2 minutes.",
};

export default function HowItWorksPage() {
  return (
    <>
      <HiwHero />
      <HiwSteps />
      <HiwCta />
    </>
  );
}
