import * as React from "react";

import { cn } from "@/lib/utils";

// Drawn by hand instead of using emoji: Windows has no flag emoji and prints
// the two letters ("BO") in their place. Coats of arms shrink to a dot or are
// left out, which is all they amount to at 18px wide. Stripes are stacked
// rects, each painted over a full-size one, so no seam shows between them.
const flags: Record<string, React.ReactNode> = {
  BO: (
    <>
      <rect width="30" height="20" fill="#007a3d" />
      <rect width="30" height="13.33" fill="#f4e400" />
      <rect width="30" height="6.67" fill="#da291c" />
    </>
  ),
  AR: (
    <>
      <rect width="30" height="20" fill="#74acdf" />
      <rect y="6.67" width="30" height="6.67" fill="#fff" />
      <circle cx="15" cy="10" r="2" fill="#f6b40e" />
    </>
  ),
  CL: (
    <>
      <rect width="30" height="20" fill="#d52b1e" />
      <rect width="30" height="10" fill="#fff" />
      <rect width="10" height="10" fill="#0039a6" />
      <path
        d="M5 2.5L5.56 4.23H7.38L5.91 5.3L6.47 7.02L5 5.96L3.53 7.02L4.09 5.3L2.62 4.23H4.44Z"
        fill="#fff"
      />
    </>
  ),
  CO: (
    <>
      <rect width="30" height="20" fill="#ce1126" />
      <rect width="30" height="15" fill="#003893" />
      <rect width="30" height="10" fill="#fcd116" />
    </>
  ),
  EC: (
    <>
      <rect width="30" height="20" fill="#ed1c24" />
      <rect width="30" height="15" fill="#034ea2" />
      <rect width="30" height="10" fill="#ffdd00" />
      <ellipse cx="15" cy="10" rx="2.2" ry="2.8" fill="#8a6d3b" />
    </>
  ),
  MX: (
    <>
      <rect width="30" height="20" fill="#ce1126" />
      <rect width="20" height="20" fill="#fff" />
      <rect width="10" height="20" fill="#006847" />
      <circle cx="15" cy="10" r="2.4" fill="#8c5a2b" />
    </>
  ),
  PE: (
    <>
      <rect width="30" height="20" fill="#d91023" />
      <rect x="10" width="10" height="20" fill="#fff" />
    </>
  ),
  PY: (
    <>
      <rect width="30" height="20" fill="#0038a8" />
      <rect width="30" height="13.33" fill="#fff" />
      <rect width="30" height="6.67" fill="#d52b1e" />
      <circle cx="15" cy="10" r="2" fill="none" stroke="#00843d" strokeWidth="0.8" />
      <circle cx="15" cy="10" r="0.8" fill="#fcd116" />
    </>
  ),
  UY: (
    <>
      <rect width="30" height="20" fill="#fff" />
      <path
        d="M0 2.22h30v2.22H0zM0 6.67h30v2.22H0zM0 11.11h30v2.22H0zM0 15.56h30v2.22H0z"
        fill="#0038a8"
      />
      <rect width="11.11" height="11.11" fill="#fff" />
      <circle cx="5.56" cy="5.56" r="2.8" fill="#fcd116" />
    </>
  ),
};

/**
 * Small 3:2 flag for an ISO country code. Decorative: the country's name has
 * to be available next to it in text, for instance in the control it labels.
 */
function CountryFlag({ code, className }: { code: string; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        // The hairline keeps white stripes from bleeding into a white field.
        "inline-flex h-3 w-4.5 shrink-0 overflow-hidden rounded-[2px] bg-muted shadow-[0_0_0_1px_rgb(0_0_0/0.1)]",
        className,
      )}
    >
      <svg viewBox="0 0 30 20" preserveAspectRatio="none" className="size-full">
        {flags[code]}
      </svg>
    </span>
  );
}

export { CountryFlag };
