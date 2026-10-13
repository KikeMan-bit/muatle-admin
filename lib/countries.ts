/**
 * The countries the sign-up offers, by ISO 3166-1 alpha-2 code, as the backend
 * seeds them (parameters/migrations/0002_countries). The admin reads the live
 * list from the API to filter by; this is for naming a code in a row without
 * a request, and the flag beside it (`CountryFlag`).
 */
export const countryNames: Record<string, string> = {
  BO: "Bolivia",
  AR: "Argentina",
  CL: "Chile",
  CO: "Colombia",
  EC: "Ecuador",
  MX: "México",
  PE: "Perú",
  PY: "Paraguay",
  UY: "Uruguay",
};

export function countryName(code: string | null | undefined): string {
  if (!code) return "Sin país";
  return countryNames[code] ?? code;
}
