import type { Subscription } from "@/lib/admin-api";

/** "trial" until a plan is activated; then one of business/plans.py's plans. */
export type PlanId = "trial" | "basic" | "pro" | "prime";

export const planIds: PlanId[] = ["trial", "basic", "pro", "prime"];

/** What each plan is called, as the panel's "Elige un plan" names them. */
export const planNames: Record<PlanId, string> = {
  trial: "Prueba gratuita",
  basic: "Plan Básico",
  pro: "Plan Pro",
  prime: "Plan Prime",
};

export function planName(id: string): string {
  return planNames[id as PlanId] ?? id;
}

export type SubscriptionState = "running" | "grace" | "locked" | "open";

/**
 * Where a subscription stands, in one word: running, in its days of grace,
 * locked, or with no end at all (a courtesy plan).
 */
export function subscriptionState(subscription: Subscription): SubscriptionState {
  if (subscription.ends_at === null) return "open";
  if (subscription.locked) return "locked";
  if (subscription.status === "expired") return "grace";
  return "running";
}

const stateLabels: Record<SubscriptionState, string> = {
  running: "Vigente",
  grace: "En días de gracia",
  locked: "Bloqueado",
  open: "Sin vencimiento",
};

export function subscriptionStateLabel(subscription: Subscription): string {
  return stateLabels[subscriptionState(subscription)];
}

// Chip of a subscription's state: a neutral border and a colored dot. The dot
// is a ::before so any element with these classes draws it; the classes stay
// written whole, since Tailwind never generates the ones built from strings.
const CHIP =
  "inline-flex items-center gap-1.5 border-border bg-card text-foreground font-normal before:inline-block before:size-1.5 before:shrink-0 before:rounded-full before:content-['']";

const stateStyles: Record<SubscriptionState, string> = {
  running: `${CHIP} before:bg-green-600`,
  grace: `${CHIP} before:bg-amber-500`,
  locked: `${CHIP} before:bg-red-600`,
  open: `${CHIP} before:bg-blue-600`,
};

export function subscriptionStateStyle(subscription: Subscription): string {
  return stateStyles[subscriptionState(subscription)];
}

/** Chip for anything that is not a state: a plan, a role, a country. */
export const CHIP_PLAIN = "border-border bg-card text-foreground font-normal";
