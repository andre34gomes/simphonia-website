import type { ReactNode } from "react";

interface DeeplinkShellProps {
  icon: ReactNode;
  eyebrow: string;
  title: string;
  subtitle?: string;
  children?: ReactNode;
}

/**
 * Shared full-page container for the four deep-link utility routes
 * (join, open-in-app, reset-password, verify-email). Reuses the site's
 * standard hero treatment (radial gradient + eyebrow pill) but centers
 * everything in a single narrow column, since these are single-purpose
 * utility pages rather than long-form landing pages.
 */
export function DeeplinkShell({
  icon,
  eyebrow,
  title,
  subtitle,
  children,
}: DeeplinkShellProps) {
  return (
    <section className="relative overflow-hidden">
      <div
        className="pointer-events-none absolute inset-x-0 -top-40 -z-10 h-[420px] opacity-[0.12]"
        style={{
          background:
            "radial-gradient(ellipse at top, var(--primary) 0%, transparent 60%)",
        }}
        aria-hidden="true"
      />
      <div className="mx-auto flex min-h-[70vh] max-w-xl flex-col items-center px-6 py-24 text-center lg:px-8">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary [&_svg]:size-7">
          {icon}
        </div>
        <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-medium text-primary">
          {eyebrow}
        </div>
        <h1 className="mt-6 text-3xl font-semibold tracking-tight text-balance text-foreground sm:text-4xl">
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-4 max-w-md text-lg text-pretty text-muted-foreground">
            {subtitle}
          </p>
        ) : null}
        {children}
      </div>
    </section>
  );
}
