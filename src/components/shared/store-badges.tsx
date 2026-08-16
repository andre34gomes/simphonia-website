import Image from "next/image";
import { APP_STORE_URL, PLAY_STORE_URL } from "@/data/nav";
import { cn } from "@/lib/utils";

/**
 * App Store / Google Play badge links, styled to match the dark+gold
 * brand theme. Uses the real published store URLs from the current app.
 */
export function StoreBadges({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-wrap items-center gap-3", className)}>
      <a
        href={APP_STORE_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="group flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-2.5 transition-colors hover:border-primary/50 hover:bg-accent"
      >
        <Image src="/apple.svg" alt="" width={20} height={20} className="opacity-90" />
        <span className="flex flex-col leading-tight">
          <span className="text-[10px] text-muted-foreground">Download on the</span>
          <span className="text-sm font-semibold text-foreground">App Store</span>
        </span>
      </a>
      <a
        href={PLAY_STORE_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="group flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-2.5 transition-colors hover:border-primary/50 hover:bg-accent"
      >
        <Image src="/google.svg" alt="" width={20} height={20} className="opacity-90" />
        <span className="flex flex-col leading-tight">
          <span className="text-[10px] text-muted-foreground">Get it on</span>
          <span className="text-sm font-semibold text-foreground">Google Play</span>
        </span>
      </a>
    </div>
  );
}
