import Link from "next/link";
import { CheckCircle2, Smartphone, Wifi, ShieldCheck } from "lucide-react";

const requirements = [
  {
    icon: Smartphone,
    title: "eSIM-compatible device",
    description:
      "Most phones released from 2018 onward support eSIM, including recent iPhone, Samsung Galaxy, and Google Pixel models.",
  },
  {
    icon: ShieldCheck,
    title: "Carrier-unlocked",
    description:
      "Your device must be unlocked from any existing carrier so it can accept a new eSIM profile.",
  },
  {
    icon: Wifi,
    title: "Wi-Fi or data for setup",
    description:
      "You'll need an internet connection once — to install the eSIM profile — before you travel.",
  },
  {
    icon: CheckCircle2,
    title: "One device per eSIM",
    description:
      "Each eSIM profile installs on a single device and can't be transferred once activated.",
  },
];

export function DownloadRequirements() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-24 lg:px-8">
      <div className="mx-auto max-w-2xl text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-medium text-primary">
          Before you download
        </div>
        <h2 className="mt-6 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          What you&apos;ll need
        </h2>
        <p className="mt-4 text-lg text-pretty text-muted-foreground">
          A quick checklist so your eSIM installs without a hitch.
        </p>
      </div>

      <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2">
        {requirements.map((req) => (
          <div key={req.title} className="flex gap-4">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10">
              <req.icon className="size-5 text-primary" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-foreground">
                {req.title}
              </h3>
              <p className="mt-1.5 text-sm text-muted-foreground">
                {req.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      <p className="mt-10 text-center text-sm text-muted-foreground">
        Not sure if your phone qualifies? Check under Settings →
        Cellular/Mobile, or visit our{" "}
        <Link
          href="/support"
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          Support &amp; FAQ
        </Link>{" "}
        page.
      </p>
    </section>
  );
}
