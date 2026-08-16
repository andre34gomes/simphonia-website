import { cn } from "@/lib/utils";

/**
 * Simphonia brand mark — three harmonic gold waves inside a globe ring,
 * reused from the original brand identity (gold #D4AF37 on near-black).
 */
export function Logo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 128 128"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("size-8", className)}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="logo-bg" x1="12" y1="8" x2="118" y2="122" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#151720" />
          <stop offset="55%" stopColor="#0B0C12" />
          <stop offset="100%" stopColor="#06070B" />
        </linearGradient>
        <radialGradient id="logo-glow" cx="64" cy="64" r="52" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#D4AF37" stopOpacity="0.14" />
          <stop offset="100%" stopColor="#D4AF37" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="logo-w1" x1="14" y1="0" x2="114" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#F8E9A0" stopOpacity="0" />
          <stop offset="20%" stopColor="#F8E9A0" />
          <stop offset="80%" stopColor="#F8E9A0" />
          <stop offset="100%" stopColor="#F8E9A0" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="logo-w2" x1="14" y1="0" x2="114" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#D4AF37" stopOpacity="0" />
          <stop offset="15%" stopColor="#E7C85E" />
          <stop offset="50%" stopColor="#F0D060" />
          <stop offset="85%" stopColor="#E7C85E" />
          <stop offset="100%" stopColor="#D4AF37" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="logo-w3" x1="14" y1="0" x2="114" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#B8941F" stopOpacity="0" />
          <stop offset="20%" stopColor="#D4AF37" />
          <stop offset="80%" stopColor="#D4AF37" />
          <stop offset="100%" stopColor="#B8941F" stopOpacity="0" />
        </linearGradient>
        <clipPath id="logo-globe">
          <circle cx="64" cy="64" r="44" />
        </clipPath>
      </defs>

      <rect width="128" height="128" rx="28" fill="url(#logo-bg)" />
      <rect width="128" height="128" rx="28" fill="url(#logo-glow)" />
      <circle cx="64" cy="64" r="44" stroke="#D4AF37" strokeOpacity="0.2" strokeWidth="1.5" fill="none" />

      <g clipPath="url(#logo-globe)">
        <path
          d="M 14 42 Q 30 22, 46 42 Q 64 62, 82 42 Q 98 22, 114 42"
          stroke="url(#logo-w1)"
          strokeWidth="3.5"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M 14 64 Q 30 40, 46 64 Q 64 88, 82 64 Q 98 40, 114 64"
          stroke="url(#logo-w2)"
          strokeWidth="6.5"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M 14 86 Q 30 66, 46 86 Q 64 106, 82 86 Q 98 66, 114 86"
          stroke="url(#logo-w3)"
          strokeWidth="3.5"
          strokeLinecap="round"
          fill="none"
        />
      </g>

      <rect
        x="1"
        y="1"
        width="126"
        height="126"
        rx="27"
        stroke="#D4AF37"
        strokeOpacity="0.18"
        strokeWidth="1.2"
        fill="none"
      />
    </svg>
  );
}
