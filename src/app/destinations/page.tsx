import type { Metadata } from "next";
import { DestinationsHero } from "@/components/destinations/destinations-hero";
import { DestinationsPlanTypes } from "@/components/destinations/destinations-plan-types";
import { DestinationsGrid } from "@/components/destinations/destinations-grid";
import { DestinationsCta } from "@/components/destinations/destinations-cta";

export const metadata: Metadata = {
  title: "Destinations",
  description:
    "Explore 200+ countries and regions covered by Simphonia. Search or filter to find the perfect local, regional, or global eSIM plan for your next trip.",
};

export default function DestinationsPage() {
  return (
    <>
      <DestinationsHero />
      <DestinationsPlanTypes />
      <DestinationsGrid />
      <DestinationsCta />
    </>
  );
}
