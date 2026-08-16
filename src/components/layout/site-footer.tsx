import Link from "next/link";
import { Logo } from "@/components/shared/logo";
import { StoreBadges } from "@/components/shared/store-badges";
import { footerNav } from "@/data/nav";

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border/60 bg-card/40">
      <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2.5">
              <Logo className="size-9" />
              <span className="text-lg font-semibold tracking-tight text-foreground">
                Simphonia
              </span>
            </Link>
            <p className="mt-4 max-w-sm text-sm text-muted-foreground">
              Global eSIM connectivity for the modern traveler. 200+ destinations,
              instant activation, transparent pricing — no physical SIM required.
            </p>
            <StoreBadges className="mt-6" />
          </div>

          <div>
            <h2 className="text-sm font-semibold text-foreground">Product</h2>
            <ul className="mt-4 flex flex-col gap-3">
              {footerNav.product.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors duration-(--duration-micro) ease-standard hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-foreground">Company</h2>
            <ul className="mt-4 flex flex-col gap-3">
              {footerNav.company.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors duration-(--duration-micro) ease-standard hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-foreground">Legal</h2>
            <ul className="mt-4 flex flex-col gap-3">
              {footerNav.legal.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors duration-(--duration-micro) ease-standard hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-border/60 pt-8 sm:flex-row">
          <p className="text-xs text-muted-foreground">
            &copy; {year} Simphonia. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground">
            Made for travelers, by travelers.
          </p>
        </div>
      </div>
    </footer>
  );
}
