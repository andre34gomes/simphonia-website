/**
 * Shared schema for legal documents (privacy.json, terms.json).
 * Kept intentionally simple: three content block types are enough to
 * express both documents without any rich-text/markdown parsing.
 */
export type LegalContentBlock =
  | { type: "heading"; level: 3 | 4; text: string }
  | { type: "paragraph"; text: string }
  | { type: "list"; items: string[] };

export interface LegalSection {
  id: string;
  title: string;
  content: LegalContentBlock[];
}

export interface LegalDocument {
  type: "privacy" | "terms";
  language: string;
  lastUpdated: string;
  title: string;
  heroLabel: string;
  heroHeading1: string;
  heroHeading2: string;
  intro: string;
  sections: LegalSection[];
}
