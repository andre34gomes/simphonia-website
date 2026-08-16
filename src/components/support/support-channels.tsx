import { Card, CardContent } from "@/components/ui/card";
import { MessageCircle, Mail, Share2 } from "lucide-react";

const channels = [
  {
    icon: MessageCircle,
    title: "In-App Chat",
    description:
      "Get instant answers from our AI assistant directly inside the Simphonia app — available 24/7.",
    link: null,
  },
  {
    icon: Mail,
    title: "Email",
    description:
      "Drop us a line any time — we typically respond within a few hours.",
    link: { href: "mailto:support@simphonia.pt", label: "support@simphonia.pt" },
  },
  {
    icon: Share2,
    title: "Social",
    description:
      "Follow us for destination highlights, travel tips, and product updates.",
    socials: [
      { href: "https://instagram.com/simphonia.pt", label: "Instagram" },
      { href: "https://x.com/simphonia", label: "X / Twitter" },
    ],
  },
];

export function SupportChannels() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-16 lg:px-8 lg:py-24">
      <div className="mx-auto max-w-2xl text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-medium text-primary">
          Other Ways to Reach Us
        </div>
        <h2 className="mt-6 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          We&apos;re Always Available
        </h2>
        <p className="mt-4 text-muted-foreground">
          Pick the channel that works best for you.
        </p>
      </div>

      <div className="mt-16 grid grid-cols-1 gap-5 sm:grid-cols-3">
        {channels.map((channel) => (
          <Card
            key={channel.title}
            className="border-border/60 bg-card/60 transition-colors hover:border-primary/40"
          >
            <CardContent className="flex flex-col items-center gap-3 text-center">
              <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10">
                <channel.icon className="size-5 text-primary" />
              </div>
              <h3 className="text-base font-medium text-foreground">
                {channel.title}
              </h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {channel.description}
              </p>
              {channel.link && (
                <a
                  href={channel.link.href}
                  className="text-sm font-medium text-primary underline underline-offset-4 hover:text-primary/80"
                >
                  {channel.link.label}
                </a>
              )}
              {channel.socials && (
                <div className="flex items-center gap-2 text-sm">
                  {channel.socials.map((social, index) => (
                    <span key={social.href} className="flex items-center gap-2">
                      {index > 0 && (
                        <span className="text-muted-foreground" aria-hidden="true">
                          ·
                        </span>
                      )}
                      <a
                        href={social.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-primary underline underline-offset-4 hover:text-primary/80"
                      >
                        {social.label}
                      </a>
                    </span>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
