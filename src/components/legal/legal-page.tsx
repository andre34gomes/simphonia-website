import type { LegalContentBlock, LegalDocument } from "@/data/legal/types";

function ContentBlock({ block }: { block: LegalContentBlock }) {
  switch (block.type) {
    case "heading": {
      const Tag = block.level === 3 ? "h3" : "h4";
      return (
        <Tag className="mt-6 mb-2 text-lg font-semibold text-foreground first:mt-0">
          {block.text}
        </Tag>
      );
    }
    case "paragraph":
      return (
        <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
          {block.text}
        </p>
      );
    case "list":
      return (
        <ul className="mb-4 flex flex-col gap-2">
          {block.items.map((item) => (
            <li
              key={item}
              className="flex gap-3 text-sm leading-relaxed text-muted-foreground"
            >
              <span
                className="mt-2 size-1.5 shrink-0 rounded-full bg-primary/60"
                aria-hidden="true"
              />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      );
    default:
      return null;
  }
}

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "long",
  day: "numeric",
});

export function LegalPage({ doc }: { doc: LegalDocument }) {
  const formattedDate = dateFormatter.format(new Date(doc.lastUpdated));

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-x-0 -top-40 -z-10 h-[420px] bg-[radial-gradient(ellipse_at_top,_var(--primary)_0%,_transparent_60%)] opacity-[0.1]"
          aria-hidden="true"
        />
        <div className="mx-auto max-w-4xl px-6 py-20 lg:px-8 lg:py-24">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-medium text-primary">
            {doc.heroLabel}
          </div>
          <h1 className="mt-6 text-4xl font-semibold tracking-tight text-balance text-foreground sm:text-5xl">
            {doc.heroHeading1}{" "}
            <span className="text-primary">{doc.heroHeading2}</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-pretty text-muted-foreground">
            {doc.intro}
          </p>
          <p className="mt-6 text-xs text-muted-foreground">
            Last updated: {formattedDate}
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="mx-auto max-w-7xl px-6 pb-24 lg:px-8">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[260px_1fr]">
          {/* Table of contents */}
          <nav
            aria-label="Table of contents"
            className="hidden lg:sticky lg:top-24 lg:block lg:h-fit"
          >
            <p className="mb-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              On this page
            </p>
            <ul className="flex flex-col gap-1 border-l border-border/60">
              {doc.sections.map((section) => (
                <li key={section.id}>
                  <a
                    href={`#${section.id}`}
                    className="block -ml-px border-l border-transparent py-1.5 pl-4 text-sm text-muted-foreground transition-colors hover:border-primary/60 hover:text-foreground"
                  >
                    {section.title}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          {/* Sections */}
          <div className="max-w-3xl">
            {doc.sections.map((section) => (
              <div
                key={section.id}
                id={section.id}
                className="scroll-mt-24 border-b border-border/60 py-8 first:pt-0 last:border-b-0"
              >
                <h2 className="mb-4 text-xl font-semibold text-foreground">
                  {section.title}
                </h2>
                {section.content.map((block, index) => (
                  <ContentBlock key={`${section.id}-${index}`} block={block} />
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
