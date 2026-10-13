import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Muatle's own clock: the subscriptions are counted on Bolivia's calendar,
// whatever country each business is in (business/plans.py).
export const LA_PAZ = "America/La_Paz";

const MONTHS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
const LONG_MONTHS = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

// Only numbers come out of Intl: its Spanish wording shifts between ICU
// versions, and the server and the browser have to print the very same string
// or hydration breaks.
const formatters = new Map<string, Intl.DateTimeFormat>();

function formatter(kind: "clock" | "date", timeZone: string): Intl.DateTimeFormat {
  const key = `${kind}:${timeZone}`;
  let made = formatters.get(key);
  if (!made) {
    const options: Intl.DateTimeFormatOptions =
      kind === "clock"
        ? { year: "numeric", month: "numeric", day: "numeric", hour: "numeric", minute: "2-digit", hourCycle: "h23" }
        : { year: "numeric", month: "numeric", day: "numeric" };
    made = new Intl.DateTimeFormat("en-US", { timeZone, ...options });
    formatters.set(key, made);
  }
  return made;
}

function partsOf(kind: "clock" | "date", iso: string, timeZone: string) {
  return Object.fromEntries(formatter(kind, timeZone).formatToParts(new Date(iso)).map((p) => [p.type, p.value]));
}

/** "4 oct 2026": a moment's day, on Bolivia's clock. */
export function formatDate(iso: string | null | undefined, timeZone: string = LA_PAZ): string {
  if (!iso) return "—";
  const parts = partsOf("date", iso, timeZone);
  return `${parts.day} ${MONTHS[Number(parts.month) - 1]} ${parts.year}`;
}

/** "4 de octubre de 2026", the way a sentence says a day. */
export function formatLongDate(iso: string | null | undefined, timeZone: string = LA_PAZ): string {
  if (!iso) return "—";
  const parts = partsOf("date", iso, timeZone);
  return `${parts.day} de ${LONG_MONTHS[Number(parts.month) - 1]} de ${parts.year}`;
}

/** "4 oct 2026, 2:12 p.m.", on Bolivia's clock whatever the zone of the machine. */
export function formatDateTime(iso: string | null | undefined, timeZone: string = LA_PAZ): string {
  if (!iso) return "—";
  const parts = partsOf("clock", iso, timeZone);
  const hour = Number(parts.hour);
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  const meridiem = hour < 12 ? "a.m." : "p.m.";
  return `${parts.day} ${MONTHS[Number(parts.month) - 1]} ${parts.year}, ${hour12}:${parts.minute} ${meridiem}`;
}

/** "2026-10-04": a moment's day on Bolivia's clock, as a date input holds it. */
export function dayKey(iso: string | null | undefined, timeZone: string = LA_PAZ): string {
  if (!iso) return "";
  const parts = partsOf("date", iso, timeZone);
  return `${parts.year}-${parts.month.padStart(2, "0")}-${parts.day.padStart(2, "0")}`;
}

/** Today on Bolivia's clock, as a date input holds it. */
export function todayKey(): string {
  return dayKey(new Date().toISOString());
}

/** "1.250" the way Bolivia writes numbers. */
export function formatCount(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return value.toLocaleString("es-BO");
}

/** "220 Bs": Muatle charges in bolivianos, whatever currency a business shows its prices in. */
export function formatBs(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return `${value.toLocaleString("es-BO")} Bs`;
}

/** "Ana Pérez", or the email when there is no name. */
export function personName(
  person: { first_name?: string | null; last_name?: string | null; email?: string | null } | null | undefined,
): string {
  if (!person) return "—";
  const name = `${person.first_name ?? ""} ${person.last_name ?? ""}`.trim();
  return name || person.email || "—";
}

/** The initial that stands for someone in an avatar. */
export function initialOf(name: string): string {
  return (name.trim().charAt(0) || "M").toUpperCase();
}

/** "3 días", "1 día". */
export function daysLabel(days: number): string {
  return `${formatCount(days)} ${days === 1 ? "día" : "días"}`;
}
