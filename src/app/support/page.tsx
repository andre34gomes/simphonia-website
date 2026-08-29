import type { Metadata } from "next";
import { SupportHero } from "@/components/support/support-hero";
import { SupportFaq } from "@/components/support/support-faq";
import { SupportContactForm } from "@/components/support/support-contact-form";
import { SupportChannels } from "@/components/support/support-channels";

export const metadata: Metadata = {
  title: "Support",
  description:
    "Find answers to common questions about Simphonia's eSIM plans, or get in touch with our support team — available 24/7.",
};

export default function SupportPage() {
  return (
    <>
      <SupportHero />
      <SupportFaq />
      <SupportContactForm />
      <SupportChannels />
    </>
  );
}
