"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";

import { NavUser } from "@/components/layout/nav-user";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import { forgetUrlState } from "@/hooks/use-url-state";
import type { AdminUser } from "@/lib/admin-api";
import { isActive, navItems, type NavItem } from "@/lib/nav";
import { cn } from "@/lib/utils";

type SidebarProps = {
  /** Only matters on mobile: from `lg` up the bar is always visible. */
  open: boolean;
  onClose: () => void;
  user: AdminUser;
};

// Entering a section from the menu starts from scratch: no filters or page
// from last time. Being already INSIDE it (on a business's page and tapping
// "Negocios") is going back to the list, where the search is kept.
function enterSection(href: string, pathname: string) {
  const inside = href !== "/" && pathname.startsWith(`${href}/`);
  if (!inside) forgetUrlState(href);
}

function Sidebar({ open, onClose, user }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Scrim behind the mobile drawer; tapping it closes the drawer */}
      <div
        aria-hidden
        onClick={onClose}
        className={cn(
          "fixed inset-0 z-40 bg-black/30 transition-opacity lg:hidden",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      />

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-transform duration-200",
          "lg:sticky lg:inset-y-auto lg:top-0 lg:h-svh lg:w-60 lg:translate-x-0 lg:transition-none",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-14 items-center justify-between gap-1 px-4">
          <Link href="/" onClick={onClose} aria-label="Muatle Admin, inicio" className="rounded-md outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40">
            <Logo />
          </Link>
          <Button variant="ghost" size="icon-sm" onClick={onClose} aria-label="Cerrar menú" className="text-muted-foreground lg:hidden">
            <X />
          </Button>
        </div>

        <nav aria-label="Menú principal" className="flex-1 overflow-y-auto px-3 py-2">
          <ul className="flex flex-col gap-0.5">
            {navItems.map((item) => (
              <li key={item.url}>
                <NavLink
                  item={item}
                  active={isActive(pathname, item.url)}
                  onClick={() => {
                    enterSection(item.url, pathname);
                    onClose();
                  }}
                />
              </li>
            ))}
          </ul>
        </nav>

        <div className="border-t border-sidebar-border p-3">
          <NavUser user={user} />
        </div>
      </aside>
    </>
  );
}

/** A row of the menu: the current one sits on a faint tint, the rest stay grey until hovered. */
function NavLink({ item, active, onClick }: { item: NavItem; active: boolean; onClick: () => void }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.url}
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex h-9 items-center gap-3 rounded-md px-2.5 text-sm font-medium transition-colors outline-none",
        "focus-visible:ring-[3px] focus-visible:ring-ring/40",
        active ? "bg-primary/8 text-primary-strong" : "text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      <Icon className="size-4.5 shrink-0" />
      {item.title}
    </Link>
  );
}

export { Sidebar };
