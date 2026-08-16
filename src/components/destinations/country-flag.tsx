import * as Flags from "country-flag-icons/react/3x2";
import { hasFlag } from "country-flag-icons";
import { Flag } from "lucide-react";

/**
 * Renders a country's flag as a crisp SVG (via `country-flag-icons`) instead
 * of relying on Unicode flag emoji, which Chromium on Windows/Linux renders
 * as plain two-letter glyphs rather than an actual flag icon.
 */
export function CountryFlag({
  code,
  name,
  className,
}: {
  code: string;
  name: string;
  className?: string;
}) {
  const FlagComponent = hasFlag(code)
    ? (Flags as unknown as Record<string, React.ComponentType<{ title?: string; className?: string }>>)[code]
    : undefined;

  if (!FlagComponent) {
    return <Flag className={className} aria-hidden="true" />;
  }

  return <FlagComponent title={name} className={className} />;
}
