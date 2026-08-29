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
        className="group flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-2.5 outline-none transition-[color,background-color,border-color,box-shadow,transform] duration-(--duration-micro) ease-standard hover:border-primary/50 hover:bg-accent focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:translate-y-px active:duration-(--duration-instant)"
      >
        <Image src="/apple.svg" alt="" width={20} height={20} className="brightness-0 invert" />
        <span className="flex flex-col leading-tight">
          <span className="text-[10px] text-muted-foreground">Download on the</span>
          <span className="text-sm font-semibold text-foreground">App Store</span>
        </span>
      </a>
      <a
        href={PLAY_STORE_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="group flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-2.5 outline-none transition-[color,background-color,border-color,box-shadow,transform] duration-(--duration-micro) ease-standard hover:border-primary/50 hover:bg-accent focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:translate-y-px active:duration-(--duration-instant)"
      >
        <Image src="/google.svg" alt="" width={20} height={20} className="brightness-0 invert" />
        <span className="flex flex-col leading-tight">
          <span className="text-[10px] text-muted-foreground">Get it on</span>
          <span className="text-sm font-semibold text-foreground">Google Play</span>
        </span>
      </a>
    </div>
  );
}
