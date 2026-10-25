import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/legal-page";
import type { LegalDocument } from "@/data/legal/types";
import termsData from "@/data/legal/terms.json";
import { canonicalUrl } from "@/lib/seo";

const doc = termsData as LegalDocument;

export const metadata: Metadata = {
  title: doc.title,
  alternates: { canonical: canonicalUrl("/terms") },
  description: doc.intro,
  robots: { index: true, follow: true },
};

export default function TermsPage() {
  return <LegalPage doc={doc} />;
}
