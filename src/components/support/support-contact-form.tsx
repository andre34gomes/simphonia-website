"use client";

import { useRef, useState, type FormEvent } from "react";
import { CheckCircle2, Loader2, Send, TriangleAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { submitSupportContact } from "@/lib/api";

const SUBJECT_OPTIONS = [
  "General Inquiry",
  "Billing & Payments",
  "Technical Issue",
  "eSIM Activation",
  "Refund Request",
  "Other",
];

const SUBMIT_COOLDOWN_MS = 30_000;

type FormStatus = "idle" | "submitting" | "success" | "error";

interface FormErrors {
  name?: string;
  email?: string;
  subject?: string;
  message?: string;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function SupportContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [status, setStatus] = useState<FormStatus>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  // Spam honeypot — legitimate visitors never fill this hidden field.
  const honeypotRef = useRef<HTMLInputElement>(null);
  const lastSubmitAtRef = useRef(0);

  function validate(): FormErrors {
    const nextErrors: FormErrors = {};
    if (!name.trim()) nextErrors.name = "Please enter your name.";
    if (!email.trim()) {
      nextErrors.email = "Please enter your email.";
    } else if (!EMAIL_PATTERN.test(email.trim())) {
      nextErrors.email = "Please enter a valid email address.";
    }
    if (!subject) nextErrors.subject = "Please select a topic.";
    if (!message.trim()) {
      nextErrors.message = "Please describe your issue or question.";
    } else if (message.trim().length < 10) {
      nextErrors.message = "Please provide a few more details (10+ characters).";
    }
    return nextErrors;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    // Honeypot tripped — silently pretend success without hitting the API.
    if (honeypotRef.current?.value) {
      setStatus("success");
      return;
    }

    const now = Date.now();
    if (now - lastSubmitAtRef.current < SUBMIT_COOLDOWN_MS) {
      setStatus("error");
      setErrorMessage(
        "You're sending messages too quickly. Please wait a moment and try again.",
      );
      return;
    }

    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setStatus("submitting");
    setErrorMessage("");

    try {
      await submitSupportContact({
        name: name.trim(),
        email: email.trim(),
        subject,
        message: message.trim(),
      });
      lastSubmitAtRef.current = Date.now();
      setStatus("success");
      setName("");
      setEmail("");
      setSubject("");
      setMessage("");
      setErrors({});
    } catch (err) {
      setStatus("error");
      setErrorMessage(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again.",
      );
    }
  }

  const isSubmitting = status === "submitting";

  return (
    <section id="contact" className="relative">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-full bg-[radial-gradient(ellipse_at_center,_var(--primary)_0%,_transparent_65%)] opacity-[0.06]"
        aria-hidden="true"
      />
      <div className="mx-auto max-w-2xl px-6 py-16 lg:px-8 lg:py-24">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-medium text-primary">
            Contact Us
          </div>
          <h2 className="mt-6 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Still Need Help?
          </h2>
          <p className="mt-4 text-muted-foreground">
            Our support team is available 24/7. Send us a message and
            we&apos;ll get back to you shortly.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          noValidate
          className="relative mt-12 rounded-2xl border border-border/60 bg-card/40 p-6 sm:p-8"
        >
          {/* Honeypot field — hidden from real users, bots tend to fill every field */}
          <div className="absolute -left-[9999px] -top-[9999px]" aria-hidden="true">
            <label htmlFor="contact-website">Website</label>
            <input
              ref={honeypotRef}
              type="text"
              id="contact-website"
              name="website"
              tabIndex={-1}
              autoComplete="off"
            />
          </div>

          <FieldGroup>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <Field data-invalid={!!errors.name}>
                <FieldLabel htmlFor="contact-name">Name *</FieldLabel>
                <Input
                  id="contact-name"
                  name="name"
                  placeholder="Your name"
                  autoComplete="name"
                  maxLength={100}
                  value={name}
                  aria-invalid={!!errors.name}
                  onChange={(e) => setName(e.target.value)}
                />
                <FieldError>{errors.name}</FieldError>
              </Field>

              <Field data-invalid={!!errors.email}>
                <FieldLabel htmlFor="contact-email">Email *</FieldLabel>
                <Input
                  id="contact-email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  maxLength={254}
                  value={email}
                  aria-invalid={!!errors.email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <FieldError>{errors.email}</FieldError>
              </Field>
            </div>

            <Field data-invalid={!!errors.subject}>
              <FieldLabel htmlFor="contact-subject">Subject *</FieldLabel>
              <Select
                value={subject}
                onValueChange={(value) => setSubject(String(value))}
              >
                <SelectTrigger id="contact-subject" className="w-full">
                  <SelectValue placeholder="Select a topic…" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {SUBJECT_OPTIONS.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              <FieldError>{errors.subject}</FieldError>
            </Field>

            <Field data-invalid={!!errors.message}>
              <FieldLabel htmlFor="contact-message">Message *</FieldLabel>
              <Textarea
                id="contact-message"
                name="message"
                placeholder="Describe your issue or question…"
                maxLength={5000}
                rows={5}
                value={message}
                aria-invalid={!!errors.message}
                onChange={(e) => setMessage(e.target.value)}
              />
              <FieldError>{errors.message}</FieldError>
              <FieldDescription>
                Please avoid sharing sensitive information like passwords or
                payment details.
              </FieldDescription>
            </Field>

            {status === "success" && (
              <Alert>
                <CheckCircle2 />
                <AlertTitle>Message sent</AlertTitle>
                <AlertDescription>
                  Thanks for reaching out — our team will get back to you
                  shortly at the email address you provided.
                </AlertDescription>
              </Alert>
            )}

            {status === "error" && (
              <Alert variant="destructive">
                <TriangleAlert />
                <AlertTitle>Couldn&apos;t send your message</AlertTitle>
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              size="lg"
              disabled={isSubmitting}
              className="w-full sm:w-auto"
            >
              {isSubmitting ? (
                <Loader2 data-icon="inline-start" className="animate-spin" />
              ) : (
                <Send data-icon="inline-start" />
              )}
              {isSubmitting ? "Sending…" : "Send Message"}
            </Button>
          </FieldGroup>
        </form>
      </div>
    </section>
  );
}
