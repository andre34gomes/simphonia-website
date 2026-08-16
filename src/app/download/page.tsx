import type { Metadata } from "next";
import { DownloadHero } from "@/components/download/download-hero";
import { DownloadQr } from "@/components/download/download-qr";
import { DownloadRequirements } from "@/components/download/download-requirements";
import { DownloadSteps } from "@/components/download/download-steps";
import { DownloadFinalCta } from "@/components/download/download-final-cta";

export const metadata: Metadata = {
  title: "Download",
  description:
    "Download Simphonia for iOS and Android. Get instant eSIM data in 200+ countries — free to download, activated in under a minute.",
};

export default function DownloadPage() {
  return (
    <>
      <DownloadHero />
      <DownloadQr />
      <DownloadRequirements />
      <DownloadSteps />
      <DownloadFinalCta />
    </>
  );
}
