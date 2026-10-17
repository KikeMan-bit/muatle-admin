import { Building2, LayoutDashboard, Settings2, TicketPercent, Users, type LucideIcon } from "lucide-react";

export type NavItem = {
  /** User-facing label, in Spanish. */
  title: string;
  url: string;
  icon: LucideIcon;
};

/**
 * Single source of truth for the admin's navigation: the sidebar and the
 * screen heading both come from here, so a section added in one place keeps
 * the header from showing a stale name.
 */
export const navItems: NavItem[] = [
  { title: "Inicio", url: "/", icon: LayoutDashboard },
  { title: "Negocios", url: "/businesses", icon: Building2 },
  { title: "Cuentas", url: "/accounts", icon: Users },
  { title: "Cupones", url: "/coupons", icon: TicketPercent },
  { title: "Parámetros", url: "/parameters", icon: Settings2 },
];

/** Pages reached from elsewhere than the sidebar; the heading still takes its name from here. */
export const otherPages: NavItem[] = [{ title: "Mi cuenta", url: "/profile", icon: Users }];

/**
 * "/" only matches exactly; every other entry also matches its subroutes. The
 * match stops at a segment boundary on purpose, so `/accounts` never claims a
 * sibling that merely starts the same.
 */
export function isActive(pathname: string, url: string): boolean {
  if (url === "/") return pathname === "/";
  return pathname === url || pathname.startsWith(`${url}/`);
}

export function sectionForPath(pathname: string): NavItem | undefined {
  return [...navItems, ...otherPages].find((item) => isActive(pathname, item.url));
}
