import type { CommissionStatus, Deal, ReferralSource, ReferralState } from "@/lib/admin-api";

/** "20 %", "12,5 %": a deal's share as the backend keeps it ("20.00"). */
export function percentLabel(percent: string | null): string {
  if (percent === null) return "—";
  return `${Number(percent).toLocaleString("es-BO", { maximumFractionDigits: 2 })} %`;
}

/** "12 meses", "1 mes", or "siempre" for a deal with no end. */
export function monthsLabel(months: number | null): string {
  if (months === null) return "siempre";
  return `${months} ${months === 1 ? "mes" : "meses"}`;
}

/** "20 % · 12 meses", "30 % · siempre": a deal in the few words a table has room for. */
export function dealShort(deal: Deal): string {
  return `${percentLabel(deal.percent)} · ${monthsLabel(deal.months)}`;
}

/** "20 % de cada pago · primeros 12 meses pagados", or "· siempre": a deal as a sentence says it. */
export function dealLabel(deal: Deal): string {
  const months =
    deal.months === null ? "siempre" : deal.months === 1 ? "primer mes pagado" : `primeros ${deal.months} meses pagados`;
  return `${percentLabel(deal.percent)} de cada pago · ${months}`;
}

/** "3 de 12 meses", or "3 meses (siempre)": the paid months of a business that earned its ally. */
export function countedLabel(counted: number, months: number | null): string {
  if (months === null) return `${counted} ${counted === 1 ? "mes" : "meses"} (siempre)`;
  return `${counted} de ${monthsLabel(months)}`;
}

// The same chip as a subscription's state: a neutral border and a colored dot,
// the classes written whole for Tailwind to find them
const CHIP =
  "inline-flex items-center gap-1.5 border-border bg-card text-foreground font-normal before:inline-block before:size-1.5 before:shrink-0 before:rounded-full before:content-['']";

/** Where a business an ally brought stands, in the words the ally's own panel uses. */
export const referralStates: Record<ReferralState, { label: string; style: string }> = {
  trial: { label: "En prueba", style: `${CHIP} before:bg-blue-600` },
  active: { label: "Pagando", style: `${CHIP} before:bg-green-600` },
  expired: { label: "Vencido", style: `${CHIP} before:bg-amber-500` },
  deleted: { label: "Eliminado", style: `${CHIP} before:bg-neutral-400` },
};

export const commissionStatuses: Record<CommissionStatus, { label: string; style: string }> = {
  pending: { label: "Por cobrar", style: `${CHIP} before:bg-amber-500` },
  paid: { label: "Pagada", style: `${CHIP} before:bg-green-600` },
  void: { label: "Anulada", style: `${CHIP} before:bg-neutral-400` },
};

export const referralSources: Record<ReferralSource, string> = {
  signup: "Se registró con su código",
  admin: "Asignado desde el admin",
};

/** An ally switched on or off. */
export const partnerActive = {
  on: { label: "Activo", style: `${CHIP} before:bg-green-600` },
  off: { label: "Desactivado", style: `${CHIP} before:bg-neutral-400` },
};
