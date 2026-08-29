import { HeroSection } from "@/components/home/hero-section";
import { FeaturesGrid } from "@/components/home/features-grid";
import { ScreenshotShowcase } from "@/components/home/screenshot-showcase";
import { HowItWorksPreview } from "@/components/home/how-it-works-preview";
import { PlanFlexibilitySpotlight } from "@/components/home/plan-flexibility-spotlight";
import { CheckoutShowcase } from "@/components/home/checkout-showcase";
import { AiSupportSpotlight } from "@/components/home/ai-support-spotlight";
import { DownloadCta } from "@/components/home/download-cta";

export default function Home() {
  return (
    <>
      <HeroSection />
      <FeaturesGrid />
      <ScreenshotShowcase />
      <HowItWorksPreview />
      <PlanFlexibilitySpotlight />
      <CheckoutShowcase />
      <AiSupportSpotlight />
      <DownloadCta />
    </>
  );
}
