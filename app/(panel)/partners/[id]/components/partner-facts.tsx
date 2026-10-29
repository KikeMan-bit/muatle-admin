import * as React from "react";

import type { Commission } from "@/lib/admin-api";
import { percentLabel } from "@/lib/partners";
import { cn, formatAmount, formatDate } from "@/lib/utils";

// Where they get paid changed this recently, and the admin says so before paying
const RECENT_CHANGE_MS = 7 * 24 * 60 * 60 * 1000;

/** A row of a definition list: the name in grey, the value in black. */
export function Fact({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-col gap-0.5", className)}>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm break-words">{children}</dd>
    </div>
  );
}

/** "Plan Pro · 1 mes · 20 % de 220 Bs", or "A mano: Bono por 5 negocios": what a commission is for. */
export function commissionConcept(commission: Commission): string {
  if (commission.kind === "manual") return commission.note ? `A mano: ${commission.note}` : "A mano";
  const months = `${commission.months} ${commission.months === 1 ? "mes" : "meses"}`;
  return `${commission.plan_name ?? "Plan"} · ${months} · ${percentLabel(commission.percent)} de ${formatAmount(commission.base)}`;
}

/** "26 oct 2026": a day as the backend keeps it ("2026-10-26"), read at noon so no clock moves it. */
export function dayLabel(key: string | null): string {
  return key ? formatDate(`${key}T16:00:00Z`) : "—";
}

/** Whether the ally changed where they get paid in the last week. */
export function recentlyChanged(iso: string | null): boolean {
  return iso !== null && Date.now() - new Date(iso).getTime() < RECENT_CHANGE_MS;
}
