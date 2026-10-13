/**
 * What the businesses' panel calls each staff role (app/(panel)/settings/members
 * in muatle), for the members a business lists here. The backend keeps the
 * same identifiers in business/roles.py.
 */
export const roleNames: Record<string, string> = {
  cashier: "Cajero",
  waiter: "Mesero",
  cook: "Cocinero",
  "stock-keeper": "Almacenista",
  buyer: "Comprador",
  manager: "Gerente",
  "menu-editor": "Editor de menú",
  "cash-supervisor": "Supervisor de caja",
  admin: "Administrador",
};

/** "Cajero, Mesero"; "Dueño" for the owner, who has every permission without any role. */
export function rolesLabel(roles: string[], owner: boolean): string {
  if (owner) return "Dueño de la cuenta";
  if (roles.length === 0) return "Sin roles";
  return roles.map((role) => roleNames[role] ?? role).join(", ");
}
