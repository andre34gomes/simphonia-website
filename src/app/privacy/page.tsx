import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/legal-page";
import type { LegalDocument } from "@/data/legal/types";
import privacyData from "@/data/legal/privacy.json";
import { canonicalUrl } from "@/lib/seo";

const doc = privacyData as LegalDocument;

export const metadata: Metadata = {
  title: doc.title,
  alternates: { canonical: canonicalUrl("/privacy") },
  description: doc.intro,
  robots: { index: true, follow: true },
};

export default function PrivacyPage() {
  return <LegalPage doc={doc} />;
}
