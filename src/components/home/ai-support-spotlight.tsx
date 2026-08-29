import { Reveal } from "@/components/motion/reveal";
import { MessageCircleHeart, Clock, Zap } from "lucide-react";

export function AiSupportSpotlight() {
  return (
    <section className="mx-auto max-w-3xl px-6 py-24 text-center lg:px-8">
      <Reveal>
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
          <MessageCircleHeart className="size-3.5" />
          24/7 AI-Powered Support
        </div>
        <h2 className="mt-5 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Never stuck offline in a foreign country
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
          Most eSIM apps leave you with a support ticket and a multi-day wait.
          Simphonia&apos;s in-app AI support diagnoses activation and
          connectivity issues in real time — no call center, no timezone
          gap, no waiting for a human reply while your data plan sits idle.
        </p>
        <ul className="mx-auto mt-6 flex w-fit flex-col gap-3 text-left text-sm text-muted-foreground">
          <li className="flex items-start gap-2">
            <Zap className="mt-0.5 size-4 shrink-0 text-primary" />
            Instant answers to activation and network issues, day or night
          </li>
          <li className="flex items-start gap-2">
            <Clock className="mt-0.5 size-4 shrink-0 text-primary" />
            No queue, no ticket number — just a real-time chat that knows
            your plan and device
          </li>
          <li className="flex items-start gap-2">
            <MessageCircleHeart className="mt-0.5 size-4 shrink-0 text-primary" />
            Escalates to a human specialist automatically when it can&apos;t
            solve it alone
          </li>
        </ul>
      </Reveal>
    </section>
  );
}
