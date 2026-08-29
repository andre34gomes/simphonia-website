import type { Metadata } from "next";
import { AboutHero } from "@/components/about/about-hero";
import { AboutStory } from "@/components/about/about-story";
import { AboutValues } from "@/components/about/about-values";
import { AboutTeamCta } from "@/components/about/about-team-cta";

export const metadata: Metadata = {
  title: "About",
  description:
    "Simphonia was born from a travel frustration in Tokyo. Learn our story, our values, and the team building instant global eSIM connectivity.",
};

export default function AboutPage() {
  return (
    <>
      <AboutHero />
      <AboutStory />
      <AboutValues />
      <AboutTeamCta />
    </>
  );
}
