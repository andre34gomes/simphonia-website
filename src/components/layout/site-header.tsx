"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu } from "lucide-react";
import { motion, useScroll, useTransform } from "motion/react";
import { Button, ButtonLink } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Logo } from "@/components/shared/logo";
import { mainNav } from "@/data/nav";
import { cn } from "@/lib/utils";

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Scroll-linked glass material: the header starts fully transparent with
  // no dividing line, then gains blur/opacity/hairline as content scrolls
  // beneath it — a scroll edge effect (apple-design §12) instead of a hard
  // 1px border baked in from frame one.
  const { scrollY } = useScroll();
  const materialOpacity = useTransform(scrollY, [0, 80], [0, 1]);

  return (
    <header className="sticky top-0 z-50">
      <motion.div
        className="absolute inset-0 border-b border-border/60 bg-background/80 backdrop-blur-lg"
        style={{ opacity: materialOpacity }}
        aria-hidden="true"
      />
      <div className="relative mx-auto flex h-18 max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
        <Link href="/" className="flex items-center gap-2.5">
          <Logo className="size-9" />
          <span className="text-lg font-semibold tracking-tight text-foreground">
            Simphonia
          </span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {mainNav.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "group relative py-1 text-sm font-medium transition-colors duration-(--duration-micro) ease-standard",
                  isActive
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {item.label}
                <span
                  aria-hidden="true"
                  className={cn(
                    "absolute inset-x-0 -bottom-0.5 h-px origin-left scale-x-0 bg-foreground transition-transform duration-(--duration-micro) ease-standard group-hover:scale-x-100",
                    isActive && "scale-x-100",
                  )}
                />
              </Link>
            );
          })}
        </nav>

        <div className="hidden md:block">
          <ButtonLink href="/download">
            Get the App
          </ButtonLink>
        </div>

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger
            render={<Button variant="ghost" size="icon" className="md:hidden" />}
          >
            <Menu />
            <span className="sr-only">Open menu</span>
          </SheetTrigger>
          <SheetContent side="right" className="w-72">
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2.5">
                <Logo className="size-8" />
                Simphonia
              </SheetTitle>
            </SheetHeader>
            <nav className="flex flex-col gap-1 px-4">
              {mainNav.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    aria-current={isActive ? "page" : undefined}
                    className={cn(
                      "rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-(--duration-micro) ease-standard hover:bg-accent hover:text-foreground",
                      isActive
                        ? "bg-accent/60 text-foreground"
                        : "text-muted-foreground",
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
              <ButtonLink
                href="/download"
                onClick={() => setOpen(false)}
                className="mt-3"
              >
                Get the App
              </ButtonLink>
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
