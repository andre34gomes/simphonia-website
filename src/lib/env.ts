// Single source of truth for per-environment settings.
//
// Environments: development (local), staging (the "test" mirror of prod) and
// production. NEXT_PUBLIC_* values are inlined at build time, so each
// environment is a separate build (Vercel: Preview/staging vs Production env
// vars — see README).
// Each variable is read via a literal `process.env.NEXT_PUBLIC_X` access so
// Next.js can inline it.

export type AppEnv = "development" | "staging" | "production";

const rawEnv = process.env.NEXT_PUBLIC_APP_ENV ?? "development";

if (!["development", "staging", "production"].includes(rawEnv)) {
  throw new Error(`Invalid NEXT_PUBLIC_APP_ENV: "${rawEnv}"`);
}

export const APP_ENV = rawEnv as AppEnv;
export const IS_PRODUCTION = APP_ENV === "production";

const isDeployedBuild = APP_ENV !== "development";

function required(name: string, value: string | undefined, devDefault: string) {
  if (value) return value;
  if (isDeployedBuild) {
    // Fail the build instead of silently pointing a deployed site at the wrong backend.
    throw new Error(`${name} must be set when NEXT_PUBLIC_APP_ENV=${APP_ENV}`);
  }
  return devDefault;
}

export const API_BASE = required(
  "NEXT_PUBLIC_API_BASE",
  process.env.NEXT_PUBLIC_API_BASE,
  "http://localhost:3000",
);

export const SITE_URL = required(
  "NEXT_PUBLIC_SITE_URL",
  process.env.NEXT_PUBLIC_SITE_URL,
  "http://localhost:3001",
);
