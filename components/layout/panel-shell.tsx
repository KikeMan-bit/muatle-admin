"use client";

import * as React from "react";

import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import type { AdminUser } from "@/lib/admin-api";

/**
 * The admin's frame: the sidebar is pinned on desktop and becomes a drawer on
 * mobile. The drawer state lives here, not inside the sidebar, because the
 * button that opens it sits in the topbar, which is its sibling.
 */
function PanelShell({ user, children }: { user: AdminUser; children: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const closeMenu = React.useCallback(() => setMenuOpen(false), []);

  React.useEffect(() => {
    if (!menuOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [menuOpen]);

  return (
    <div className="flex min-h-svh">
      <Sidebar open={menuOpen} onClose={closeMenu} user={user} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onMenuClick={() => setMenuOpen(true)} />
        <main className="flex-1 bg-background px-4 py-6 md:px-8 md:py-8">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}

export { PanelShell };
