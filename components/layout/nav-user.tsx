"use client";

import * as React from "react";
import { ChevronsUpDown, LoaderCircle, LogOut } from "lucide-react";
import { signOut } from "next-auth/react";

import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { AdminUser } from "@/lib/admin-api";
import { initialOf, personName } from "@/lib/utils";

/** Who is signed in, at the foot of the sidebar, with the way out in its menu. */
function NavUser({ user }: { user: AdminUser }) {
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [leaving, setLeaving] = React.useState(false);
  const name = personName(user);

  const logout = async () => {
    setLeaving(true);
    try {
      sessionStorage.clear();
    } catch {
      // storage blocked: the session closes all the same
    }
    await signOut({ callbackUrl: "/login" });
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          className="flex w-full items-center gap-2.5 rounded-lg p-2 text-left outline-none transition-colors hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/40 data-[state=open]:bg-muted"
          aria-label={`Cuenta de ${name}`}
        >
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-xs font-semibold text-primary-foreground">
            {leaving ? <LoaderCircle className="size-4 animate-spin" /> : initialOf(name)}
          </span>
          <span className="grid min-w-0 flex-1 leading-tight">
            <span className="truncate text-sm font-medium">{name}</span>
            <span className="truncate text-xs text-muted-foreground">{user.email}</span>
          </span>
          <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" />
        </DropdownMenuTrigger>
        <DropdownMenuContent side="top" align="start" className="w-(--radix-dropdown-menu-trigger-width) min-w-56">
          <DropdownMenuLabel className="truncate">{user.email}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => setConfirmOpen(true)}>
            <LogOut />
            Cerrar sesión
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={(open) => !leaving && setConfirmOpen(open)}
        title="¿Cerrar sesión?"
        description="Vas a tener que volver a entrar con tu correo y contraseña."
        confirmLabel="Cerrar sesión"
        confirmVariant="default"
        onConfirm={logout}
      />
    </>
  );
}

export { NavUser };
