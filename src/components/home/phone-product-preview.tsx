import {
  Check,
  ChevronRight,
  Globe2,
  MapPin,
  Plane,
  SignalHigh,
  Wifi,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type PhonePreviewPlan = "local" | "regional" | "global";

interface PreviewContent {
  eyebrow: string;
  title: string;
  description: string;
  icon: LucideIcon;
  status: string;
}

const previewContent: Record<PhonePreviewPlan, PreviewContent> = {
  local: {
    eyebrow: "Local coverage",
    title: "A plan for one perfect stop",
    description: "Stay online from arrival to departure.",
    icon: MapPin,
    status: "Destination selected",
  },
  regional: {
    eyebrow: "Regional coverage",
    title: "One plan across the journey",
    description: "Keep moving without swapping eSIMs.",
    icon: Plane,
    status: "Multi-country trip ready",
  },
  global: {
    eyebrow: "Global coverage",
    title: "Stay connected everywhere",
    description: "One app for a bigger itinerary.",
    icon: Globe2,
    status: "Worldwide trip ready",
  },
};

interface PhoneProductPreviewProps {
  plan?: PhonePreviewPlan;
  showMetrics?: boolean;
  className?: string;
}

/**
 * Decorative app-preview shell for marketing sections. All essential plan
 * details remain in adjacent DOM content, so the simulated phone stays out of
 * the accessibility tree and never becomes a fake interactive control.
 */
export function PhoneProductPreview({
  plan = "regional",
  showMetrics = false,
  className,
}: PhoneProductPreviewProps) {
  const content = previewContent[plan];
  const PlanIcon = content.icon;

  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none relative isolate mx-auto w-[15.5rem] select-none sm:w-[17rem]",
        className,
      )}
    >
      <div className="absolute inset-x-4 bottom-3 top-10 -z-10 rounded-[3rem] bg-primary/15 blur-3xl" />

      {showMetrics ? (
        <>
          <div className="absolute -left-18 top-24 hidden w-32 rounded-2xl border border-border/80 bg-card/90 p-3 shadow-md backdrop-blur lg:block">
            <span className="text-[10px] font-semibold tracking-[0.16em] text-muted-foreground uppercase">
              Coverage
            </span>
            <span className="mt-1 block text-sm font-semibold text-foreground">
              200+ places
            </span>
          </div>
          <div className="absolute -right-20 bottom-20 hidden w-36 rounded-2xl border border-primary/25 bg-card/90 p-3 shadow-md backdrop-blur lg:block">
            <span className="text-[10px] font-semibold tracking-[0.16em] text-muted-foreground uppercase">
              Activation
            </span>
            <span className="mt-1 block text-sm font-semibold text-foreground">
              Ready in minutes
            </span>
          </div>
        </>
      ) : null}

      <div className="relative rounded-[2.6rem] border border-white/15 bg-[#080809] p-2 shadow-lg">
        <div
          className="relative min-h-[31rem] overflow-hidden rounded-[2.1rem] border border-white/8 bg-card p-4"
          style={{
            background:
              "radial-gradient(ellipse at 18% 0%, color-mix(in oklch, var(--primary) 24%, transparent), transparent 42%), var(--card)",
          }}
        >
          <div className="absolute inset-x-0 top-0 flex justify-center">
            <div className="h-6 w-24 rounded-b-2xl bg-[#080809]" />
          </div>

          <div className="flex items-center justify-between pt-5">
            <div className="flex items-center gap-2">
              <span className="flex size-7 items-center justify-center rounded-lg border border-primary/25 bg-primary/10 text-primary">
                <Globe2 className="size-3.5" />
              </span>
              <span className="text-xs font-semibold tracking-tight text-foreground">
                Simphonia
              </span>
            </div>
            <SignalHigh className="size-4 text-primary" />
          </div>

          <div className="mt-8">
            <span className="text-[10px] font-semibold tracking-[0.16em] text-primary uppercase">
              Your next trip
            </span>
            <p className="mt-2 text-xl font-semibold tracking-tight text-foreground">
              Connection, sorted.
            </p>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              Choose your coverage before you arrive.
            </p>
          </div>

          <div className="mt-7 rounded-2xl border border-primary/25 bg-primary/10 p-3.5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-[10px] font-medium text-primary">
                  {content.eyebrow}
                </span>
                <p className="mt-1 text-sm font-semibold text-foreground">
                  {content.title}
                </p>
              </div>
              <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <PlanIcon className="size-4" />
              </span>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
              {content.description}
            </p>
          </div>

          <div className="mt-4 rounded-2xl border border-border/80 bg-background/65 p-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-foreground">
                eSIM activation
              </span>
              <span className="flex size-5 items-center justify-center rounded-full bg-success/15 text-success">
                <Check className="size-3" />
              </span>
            </div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
              <div className="h-full w-3/4 rounded-full bg-primary" />
            </div>
            <span className="mt-2 block text-[11px] text-muted-foreground">
              {content.status}
            </span>
          </div>

          <div className="mt-4 flex items-center justify-between rounded-2xl border border-border/80 bg-background/45 px-3.5 py-3">
            <span className="flex items-center gap-2 text-xs text-foreground">
              <Wifi className="size-3.5 text-primary" />
              Travel-ready data
            </span>
            <ChevronRight className="size-4 text-muted-foreground" />
          </div>

          <div className="absolute inset-x-0 bottom-4 flex justify-center">
            <span className="h-1 w-20 rounded-full bg-white/25" />
          </div>
        </div>
      </div>
    </div>
  );
}
