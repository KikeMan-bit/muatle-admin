/**
 * The currencies a business can show its prices in, as Configuración › General
 * offers them in the panel. The backend keeps the same list in
 * business/currencies.py.
 */
export const currencies: { code: string; name: string; symbol: string }[] = [
  { code: "BOB", name: "Boliviano", symbol: "Bs" },
  { code: "USD", name: "Dólar estadounidense", symbol: "$" },
  { code: "ARS", name: "Peso argentino", symbol: "$" },
  { code: "CLP", name: "Peso chileno", symbol: "$" },
  { code: "COP", name: "Peso colombiano", symbol: "$" },
  { code: "MXN", name: "Peso mexicano", symbol: "$" },
  { code: "PEN", name: "Sol peruano", symbol: "S/" },
  { code: "PYG", name: "Guaraní paraguayo", symbol: "₲" },
  { code: "UYU", name: "Peso uruguayo", symbol: "$" },
];

/** "Boliviano (BOB)", or the code alone for one the admin does not know. */
export function currencyLabel(code: string): string {
  const currency = currencies.find((item) => item.code === code);
  return currency ? `${currency.name} (${currency.code})` : code;
}
