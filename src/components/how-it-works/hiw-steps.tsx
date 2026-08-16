import { CheckCircle2, MapPin, CreditCard, Wifi } from "lucide-react";
import { PhoneMockup } from "@/components/shared/phone-mockup";
import { cn } from "@/lib/utils";

const steps = [
  {
    icon: MapPin,
    number: "01",
    title: "Choose Your Destination",
    description:
      "Browse 200+ countries and regions. Compare local, regional, and global plans by data allowance, duration, and price with smart search and filters.",
    checks: [
      "200+ countries and regions",
      "Local plans for every destination",
      "Smart search & filters",
    ],
    screenshot: "/screenshots/local-tab.png",
  },
  {
    icon: CreditCard,
    number: "02",
    title: "Purchase in Seconds",
    description:
      "Check out in under 30 seconds with Apple Pay, Google Pay, or card. Your QR code is generated instantly — no waiting for shipping or activation emails.",
    checks: [
      "Secure payment processing",
      "Instant QR code generation",
      "Discount codes supported",
    ],
    screenshot: "/screenshots/plan-selected.png",
  },
  {
    icon: Wifi,
    number: "03",
    title: "Connect & Travel",
    description:
      "Scan the QR code before you depart and your eSIM auto-activates the moment you land. Keep your primary phone number active the whole time.",
    checks: [
      "Easy QR code installation",
      "Auto-connect on arrival",
      "Keep your primary number active",
    ],
    screenshot: "/screenshots/profile-dark.png",
  },
];

export function HiwSteps() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-16 lg:px-8 lg:py-24">
      <div className="flex flex-col gap-24 lg:gap-32">
        {steps.map((step, index) => {
          const reversed = index % 2 === 1;
          return (
            <div
              key={step.number}
              className={cn(
                "grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-20",
              )}
            >
              <div
                className={cn(
                  "order-2",
                  reversed ? "lg:order-2" : "lg:order-1",
                )}
              >
                <span
                  aria-hidden="true"
                  className="text-5xl font-bold text-primary/60 sm:text-6xl"
                >
                  {step.number}
                </span>
                <div className="mt-4 flex items-center gap-3">
                  <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10">
                    <step.icon className="size-5 text-primary" />
                  </div>
                  <h2 className="text-2xl font-semibold text-foreground sm:text-3xl">
                    {step.title}
                  </h2>
                </div>
                <p className="mt-5 max-w-lg text-base leading-relaxed text-muted-foreground">
                  {step.description}
                </p>
                <ul className="mt-6 flex flex-col gap-3">
                  {step.checks.map((check) => (
                    <li
                      key={check}
                      className="flex items-center gap-3 text-sm text-foreground/90"
                    >
                      <CheckCircle2 className="size-4.5 shrink-0 text-primary" />
                      {check}
                    </li>
                  ))}
                </ul>
              </div>
              <div
                className={cn(
                  "order-1",
                  reversed ? "lg:order-1" : "lg:order-2",
                )}
              >
                <PhoneMockup
                  src={step.screenshot}
                  alt={step.title}
                  className="max-w-[280px]"
                />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
