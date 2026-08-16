import Link from "next/link";
import { ArrowRight, Download, MapPin, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

const steps = [
  {
    icon: Download,
    title: "Download & sign up",
    description: "Grab the app and create your free account in seconds.",
  },
  {
    icon: MapPin,
    title: "Choose your destination",
    description: "Pick a local, regional, or global plan for your trip.",
  },
  {
    icon: Zap,
    title: "Activate & go",
    description: "Scan the QR code or tap install — you're online instantly.",
  },
];

export function DownloadSteps() {
  return (
    <section className="border-y border-border/60 bg-card/30 py-16 lg:py-20">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Three steps to get connected
          </h2>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-8 sm:grid-cols-3">
          {steps.map((step, index) => (
            <div key={step.title} className="text-center sm:text-left">
              <div className="mx-auto flex size-11 items-center justify-center rounded-xl bg-primary/10 sm:mx-0">
                <step.icon className="size-5 text-primary" />
              </div>
              <p className="mt-4 text-xs font-medium text-primary">
                Step {index + 1}
              </p>
              <h3 className="mt-1 text-lg font-semibold text-foreground">
                {step.title}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {step.description}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-12 flex justify-center">
          <Button
            variant="outline"
            size="lg"
            className="h-12 px-6 text-base"
            render={<Link href="/how-it-works" />}
            nativeButton={false}
          >
            See the full guide
            <ArrowRight data-icon="inline-end" />
          </Button>
        </div>
      </div>
    </section>
  );
}
