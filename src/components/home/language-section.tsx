import { PhoneMockup } from "@/components/shared/phone-mockup";
import { Badge } from "@/components/ui/badge";
import { Languages } from "lucide-react";

const languages = [
  "English",
  "Español",
  "Deutsch",
  "日本語",
  "Français",
  "Português",
  "Русский",
  "Italiano",
  "Nederlands",
  "Polski",
  "Türkçe",
  "中文",
  "فارسی",
  "Tiếng Việt",
  "Čeština",
  "Bahasa Indonesia",
  "한국어",
  "Українська",
  "Magyar",
  "العربية",
  "हिन्दी",
];

export function LanguageSection() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-24 lg:px-8">
      <div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-2">
        <div className="order-2 flex justify-center lg:order-1">
          <PhoneMockup
            src="/screenshots/language-selector.webp"
            alt="Simphonia language selector screen"
            className="max-w-[260px]"
          />
        </div>

        <div className="order-1 lg:order-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <Languages className="size-3.5" />
            21 Languages
          </div>
          <h2 className="mt-5 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Built for travelers everywhere
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Simphonia speaks your language — literally. The entire app,
            from onboarding to checkout, is fully localized so nothing gets
            lost in translation.
          </p>

          <div className="mt-8 flex flex-wrap gap-2">
            {languages.map((language) => (
              <Badge key={language} variant="secondary" className="text-sm">
                {language}
              </Badge>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
