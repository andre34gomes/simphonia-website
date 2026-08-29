// Shared API configuration and helpers for talking to the Simphonia backend
// (guest auth + support ticket submission). Mirrors the working contract
// used by the Flutter app and the previous marketing site's contact form.

export const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE ?? "https://api.simphonia.pt";

const GUEST_TOKEN_KEY = "simphonia_guest_token";
const GUEST_EXPIRY_KEY = "simphonia_guest_expiry";
const EXPIRY_MARGIN_MS = 60_000;

interface GuestTokenResponse {
  data?: { token?: string; expiresIn?: number };
  token?: string;
  expiresIn?: number;
}

/**
 * Retrieves a short-lived guest token used to authenticate unauthenticated
 * requests (such as the support contact form). Caches the token in
 * sessionStorage to avoid re-requesting one on every submit.
 */
async function getGuestToken(): Promise<string> {
  if (typeof window !== "undefined") {
    const stored = window.sessionStorage.getItem(GUEST_TOKEN_KEY);
    const expiry = Number(window.sessionStorage.getItem(GUEST_EXPIRY_KEY) ?? 0);
    if (stored && Date.now() < expiry - EXPIRY_MARGIN_MS) {
      return stored;
    }
  }

  const res = await fetch(`${API_BASE}/api/v1/auth/guest`, { method: "POST" });
  if (!res.ok) {
    throw new Error(`Guest auth responded with ${res.status}`);
  }

  const envelope: GuestTokenResponse = await res.json();
  const data = envelope.data ?? envelope;
  const token = data.token;
  if (!token) {
    throw new Error("Guest auth returned no token");
  }

  if (typeof window !== "undefined") {
    const expiresInNum = Number(data.expiresIn);
    window.sessionStorage.setItem(GUEST_TOKEN_KEY, token);
    window.sessionStorage.setItem(
      GUEST_EXPIRY_KEY,
      String(Number.isFinite(expiresInNum) ? Date.now() + expiresInNum * 1000 : 0),
    );
  }

  return token;
}

export interface SupportContactPayload {
  name: string;
  email: string;
  subject: string;
  message: string;
}

/**
 * Submits a support request to the Simphonia backend. Acquires a guest
 * token first, then posts the contact payload. Throws with a user-facing
 * message on failure.
 */
export async function submitSupportContact(
  payload: SupportContactPayload,
): Promise<void> {
  const token = await getGuestToken().catch(() => {
    throw new Error(
      "We couldn't reach our servers right now. Please try again shortly.",
    );
  });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);

  try {
    const res = await fetch(`${API_BASE}/api/v1/support/contact`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      signal: controller.signal,
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}) as { message?: string });
      throw new Error(
        body.message ?? "Something went wrong. Please try again.",
      );
    }
  } finally {
    clearTimeout(timeout);
  }
}
