import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "Can I get a refund on an unused eSIM plan?",
    answer:
      "Yes. If your plan hasn't been installed or activated, you're eligible for a full refund within 30 days of purchase. Just reach out through the contact form below or our in-app chat and we'll process it right away.",
  },
  {
    question: "What if my eSIM isn't working or I hit a technical issue?",
    answer:
      "If we verify a genuine technical issue on our end, you'll receive a full refund or a free replacement eSIM — whichever you prefer. Contact support with your order details and a brief description of the problem.",
  },
  {
    question: "Is my phone compatible with eSIM?",
    answer:
      "Most phones released from 2018 onward support eSIM, including recent iPhone, Samsung Galaxy, Google Pixel, and other flagship Android models. Checking compatibility is your responsibility before purchase — look under Settings → Cellular/Mobile or check with your device manufacturer if you're unsure.",
  },
  {
    question: "Can I install one eSIM on multiple devices?",
    answer:
      "No. Each eSIM is a single-device license — once installed, it's locked to that device and can't be transferred or reused elsewhere. If you're switching phones, you'll need a new eSIM for the new device.",
  },
  {
    question: "How do I pay, and is it secure?",
    answer:
      "Payments are processed by Stripe, a PCI-DSS Level 1 certified provider — the highest standard in the industry. We support credit/debit cards, Apple Pay, and Google Pay. Your card details are never stored on Simphonia's servers.",
  },
  {
    question: "Can I top up my data plan?",
    answer:
      "Yes, top-ups are available on eligible plans directly from the app. Note that once a top-up is applied to your eSIM, it is non-refundable.",
  },
  {
    question: "Is the in-app AI assistant reliable for urgent decisions?",
    answer:
      "Our AI assistant (powered by OpenAI and Gemini models) is great for quick questions about plans, destinations, and account settings. However, it shouldn't be relied on for critical or time-sensitive travel decisions — for anything urgent, please contact our human support team directly.",
  },
  {
    question: "How do I delete my account?",
    answer:
      "You can permanently delete your account from Profile Settings inside the app. This action is irreversible and forfeits any unused eSIMs or unclaimed referral rewards, so make sure that's what you want before confirming.",
  },
];

export function SupportFaq() {
  return (
    <section id="faq" className="mx-auto max-w-4xl px-6 py-16 lg:px-8 lg:py-24">
      <div className="mx-auto max-w-2xl text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-medium text-primary">
          Help Center
        </div>
        <h2 className="mt-6 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Answers at a Glance
        </h2>
        <p className="mt-4 text-muted-foreground">
          Select any question to read the full answer.
        </p>
      </div>

      <Accordion className="mt-12 rounded-2xl border border-border/60 bg-card/40 px-6">
        {faqs.map((faq, index) => (
          <AccordionItem key={faq.question} value={`faq-${index}`}>
            <AccordionTrigger className="text-base">
              {faq.question}
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground">
              {faq.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      <p className="mt-8 text-center text-sm text-muted-foreground">
        Don&apos;t see your question?{" "}
        <a href="#contact" className="text-primary underline underline-offset-4 hover:text-primary/80">
          Contact us directly
        </a>
        .
      </p>
    </section>
  );
}
