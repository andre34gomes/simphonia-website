import { HeroSection } from "@/components/home/hero-section";
import { FeaturesGrid } from "@/components/home/features-grid";
import { AppPreviewShowcase } from "@/components/home/app-preview-showcase";
import { ScreenshotShowcase } from "@/components/home/screenshot-showcase";
import { HowItWorksPreview } from "@/components/home/how-it-works-preview";
import { ThemeSpotlight } from "@/components/home/theme-spotlight";
import { CheckoutShowcase } from "@/components/home/checkout-showcase";
import { LanguageSection } from "@/components/home/language-section";
import { DownloadCta } from "@/components/home/download-cta";

export default function Home() {
  return (
    <>
      <HeroSection />
      <FeaturesGrid />
      <AppPreviewShowcase />
      <ScreenshotShowcase />
      <HowItWorksPreview />
      <ThemeSpotlight />
      <CheckoutShowcase />
      <LanguageSection />
      <DownloadCta />
    </>
  );
}
