"use client";

import * as React from "react";
import Link from "next/link";
import { CircleAlert, LoaderCircle, LogOut, Pencil, RefreshCw } from "lucide-react";
import { useSession } from "next-auth/react";

import { BackButton } from "@/components/back-button";
import { DataTable, type Column } from "@/components/data-table";
import { PageHeader } from "@/components/page-header";
import { PanelCard } from "@/components/stat-card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { useAccount, useMe, useSignOutAccount, useUpdateAccount } from "@/hooks/use-admin";
import type { AccountDetail as AccountData, AccountSession, Membership } from "@/lib/admin-api";
import { errorMessage } from "@/lib/api";
import { CHIP_PLAIN } from "@/lib/plans";
import { rolesLabel } from "@/lib/roles";
import { cn, formatDate, formatDateTime, formatLongDate, personName } from "@/lib/utils";

import { ActiveChip, RoleChip } from "../../components/accounts-list";

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm">{children}</dd>
    </div>
  );
}

type Pending = "deactivate" | "activate" | "promote" | "demote" | "signOut" | null;

const confirmations: Record<NonNullable<Pending>, { title: string; description: string; confirmLabel: string; destructive?: boolean }> = {
  deactivate: {
    title: "¿Desactivar la cuenta?",
    description: "No podrá iniciar sesión, ni en el panel de su negocio ni aquí, y se cierra en todos sus dispositivos. Se puede volver a activar cuando quieras.",
    confirmLabel: "Desactivar",
    destructive: true,
  },
  activate: {
    title: "¿Activar la cuenta?",
    description: "Vuelve a poder iniciar sesión con su correo y contraseña.",
    confirmLabel: "Activar",
  },
  promote: {
    title: "¿Hacerla parte del equipo de Muatle?",
    description: "Podrá entrar a esta administración y ver todos los negocios, activar planes y manejar cuentas. Solo para gente de Muatle.",
    confirmLabel: "Dar acceso",
  },
  demote: {
    title: "¿Quitarle el acceso a la administración?",
    description: "Deja de poder entrar aquí y se cierra su sesión en todos sus dispositivos. Si es miembro de un negocio, sigue entrando a su panel.",
    confirmLabel: "Quitar acceso",
    destructive: true,
  },
  signOut: {
    title: "¿Cerrar la cuenta en todos sus dispositivos?",
    description: "Donde tenga la sesión abierta, tendrá que volver a entrar con su contraseña. Para cuando alguien perdió un teléfono o dejó el panel abierto.",
    confirmLabel: "Cerrar sesiones",
  },
};

/** An account: who they are, where they can enter, the businesses they are in and their open sessions. */
function AccountDetail({ id }: { id: string }) {
  const { data: account, isPending, error, refetch } = useAccount(id);
  const me = useMe();
  const sessionEmail = useSession().data?.user?.email;
  const [pending, setPending] = React.useState<Pending>(null);
  const [editOpen, setEditOpen] = React.useState(false);

  const update = useUpdateAccount(id);
  const signOutEverywhere = useSignOutAccount(id);

  if (isPending) {
    return (
      <div className="flex flex-col gap-6">
        <BackButton fallback="/accounts" />
        <Skeleton className="h-8 w-72" />
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-56" />
          <Skeleton className="h-56" />
        </div>
      </div>
    );
  }

  if (error || !account) {
    return (
      <div className="flex flex-col gap-6">
        <BackButton fallback="/accounts" />
        <div className="flex min-h-56 flex-col items-center justify-center gap-3 rounded-xl border border-border bg-card p-6 text-center">
          <CircleAlert className="size-5 text-red-600" />
          <p className="text-sm text-muted-foreground">{errorMessage(error)}</p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw /> Reintentar
          </Button>
        </div>
      </div>
    );
  }

  // One's own account: switching it off or leaving the team is refused by the backend too
  const own = me.data?.id === account.id || sessionEmail === account.email;
  const busy = update.isPending || signOutEverywhere.isPending;

  const confirm = () => {
    if (pending === "deactivate") update.mutate({ is_active: false });
    if (pending === "activate") update.mutate({ is_active: true });
    if (pending === "promote") update.mutate({ is_admin: true });
    if (pending === "demote") update.mutate({ is_admin: false });
    if (pending === "signOut") signOutEverywhere.mutate();
    setPending(null);
  };

  const confirmation = pending ? confirmations[pending] : null;

  return (
    <div className="flex flex-col gap-6">
      <BackButton fallback="/accounts" />

      <PageHeader
        title={personName(account)}
        description={
          <>
            {account.email} · Registrada el {formatLongDate(account.created_at)}
          </>
        }
        actions={
          <>
            <Button variant="outline" onClick={() => setEditOpen(true)}>
              <Pencil /> Editar
            </Button>
            <Button variant="outline" onClick={() => setPending("signOut")} disabled={busy || account.sessions.length === 0}>
              <LogOut /> Cerrar sesiones
            </Button>
          </>
        }
      >
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <RoleChip role={account.role} />
          <ActiveChip active={account.is_active} />
          {own ? (
            <Badge variant="outline" className={CHIP_PLAIN}>
              Tu cuenta
            </Badge>
          ) : null}
        </div>
      </PageHeader>

      {account.role === "partner" ? (
        <Alert variant="info">
          <CircleAlert />
          <AlertDescription>
            <span>
              Es la cuenta de un aliado: entra a su propio panel, nunca al de un negocio.{" "}
              <Link href={`/partners?q=${encodeURIComponent(account.email)}`} className="font-medium underline underline-offset-2">
                Ver su ficha en Aliados
              </Link>
              {account.has_password ? "." : ". Todavía no creó su contraseña: tiene la invitación pendiente."}
            </span>
          </AlertDescription>
        </Alert>
      ) : !account.has_password ? (
        <Alert variant="info">
          <CircleAlert />
          <AlertDescription>
            Esta cuenta todavía no creó su contraseña: fue agregada a un negocio con su correo y tiene una invitación pendiente, o pidió restablecerla.
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <PanelCard title="Datos">
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
            <Fact label="Nombre">{account.first_name || "—"}</Fact>
            <Fact label="Apellido">{account.last_name || "—"}</Fact>
            <Fact label="Correo">
              {account.email}
              <span className="text-muted-foreground"> · {account.email_verified ? "verificado" : "sin verificar"}</span>
            </Fact>
            <Fact label="Teléfono">{account.phone || "—"}</Fact>
            <Fact label="Último acceso">{formatDateTime(account.last_login)}</Fact>
            <Fact label="Contraseña">{account.has_password ? "Creada" : "Pendiente"}</Fact>
          </dl>
        </PanelCard>

        <PanelCard title="Acceso">
          <ul className="divide-y divide-border">
            <AccessRow
              title="Cuenta activa"
              description="Apagada, no entra a ningún lado y se cierran sus sesiones."
              checked={account.is_active}
              disabled={busy || own}
              onChange={(checked) => setPending(checked ? "activate" : "deactivate")}
            />
            <AccessRow
              title="Equipo de Muatle"
              description="Entra a esta administración: todos los negocios, planes y cuentas."
              checked={account.role === "admin"}
              disabled={busy || own}
              onChange={(checked) => setPending(checked ? "promote" : "demote")}
            />
          </ul>
          {own ? <p className="mt-3 text-xs text-muted-foreground">Tu propia cuenta la cambia otra persona del equipo.</p> : null}
        </PanelCard>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-base font-semibold">Negocios</h2>
        <DataTable columns={membershipColumns} rows={account.memberships} rowKey={(row) => row.id} rowHref={(row) => `/businesses/${row.business.id}`} noun="negocios" emptyTitle="No está en ningún negocio" emptyMessage={
            account.role === "admin"
              ? "Es una cuenta del equipo de Muatle."
              : account.role === "partner"
                ? "Es la cuenta de un aliado: los negocios que trajo están en su ficha de Aliados."
                : "Fue miembro de un negocio y la quitaron, o su negocio se eliminó."
          } />
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <h2 className="text-base font-semibold">Sesiones abiertas</h2>
          <p className="text-sm text-muted-foreground">Los dispositivos donde entró con su correo en el último mes.</p>
        </div>
        <DataTable columns={sessionColumns} rows={account.sessions} rowKey={(row) => row.id} noun="sesiones" emptyTitle="Sin sesiones abiertas" emptyMessage="No tiene el panel ni la administración abiertos en ningún dispositivo." />
      </section>

      <AccountEditDialog key={account.id + account.first_name + account.last_name + account.phone} account={account} open={editOpen} onOpenChange={setEditOpen} />

      {confirmation ? (
        <ConfirmDialog
          open={pending !== null}
          onOpenChange={(open) => !open && setPending(null)}
          title={confirmation.title}
          description={confirmation.description}
          confirmLabel={confirmation.confirmLabel}
          confirmVariant={confirmation.destructive ? "destructive" : "default"}
          onConfirm={confirm}
        />
      ) : null}
    </div>
  );
}

function AccessRow({
  title,
  description,
  checked,
  disabled,
  onChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  disabled: boolean;
  onChange: (checked: boolean) => void;
}) {
  const id = React.useId();
  return (
    <li className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
      <label htmlFor={id} className={cn("grid gap-0.5", disabled && "opacity-70")}>
        <span className="text-sm font-medium">{title}</span>
        <span className="text-xs text-muted-foreground">{description}</span>
      </label>
      <Switch id={id} checked={checked} disabled={disabled} onCheckedChange={onChange} />
    </li>
  );
}

const membershipColumns: Column<Membership>[] = [
  {
    key: "business",
    header: "Negocio",
    cell: (row) => (
      <span className="inline-flex items-center gap-2">
        <Link href={`/businesses/${row.business.id}`} className="font-medium hover:underline">
          {row.business.name}
        </Link>
        {row.business.deleted_at ? (
          <Badge variant="outline" className={cn(CHIP_PLAIN, "text-red-700")}>
            Eliminado
          </Badge>
        ) : null}
      </span>
    ),
  },
  { key: "role", header: "Rol", cell: (row) => rolesLabel(row.roles, row.owner) },
  { key: "state", header: "Estado", cell: (row) => (row.is_active ? "Miembro activo" : <span className="text-muted-foreground">Ya no es miembro</span>) },
  { key: "since", header: "Desde", cell: (row) => formatDate(row.created_at), className: "whitespace-nowrap" },
];

const sessionColumns: Column<AccountSession>[] = [
  { key: "label", header: "Dispositivo", cell: (row) => row.label || "Dispositivo sin nombre" },
  { key: "created", header: "Abierta el", cell: (row) => formatDateTime(row.created_at), className: "whitespace-nowrap" },
  { key: "used", header: "Último uso", cell: (row) => formatDateTime(row.last_used_at), className: "whitespace-nowrap" },
];

/** "Editar": the account's own name and phone. */
function AccountEditDialog({ account, open, onOpenChange }: { account: AccountData; open: boolean; onOpenChange: (open: boolean) => void }) {
  const [firstName, setFirstName] = React.useState(account.first_name);
  const [lastName, setLastName] = React.useState(account.last_name);
  const [phone, setPhone] = React.useState(account.phone);
  const update = useUpdateAccount(account.id, { onSuccess: () => onOpenChange(false) });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    update.mutate({ first_name: firstName.trim(), last_name: lastName.trim(), phone: phone.trim() });
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !update.isPending && onOpenChange(next)}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={submit} noValidate className="flex flex-col gap-5">
          <DialogHeader>
            <DialogTitle>Editar {personName(account)}</DialogTitle>
            <DialogDescription>El correo lo cambia la persona desde su perfil, con un código que le llega a la nueva dirección.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field htmlFor="account-first-name" label="Nombre">
              <Input id="account-first-name" value={firstName} onChange={(e) => setFirstName(e.target.value)} maxLength={50} />
            </Field>
            <Field htmlFor="account-last-name" label="Apellido">
              <Input id="account-last-name" value={lastName} onChange={(e) => setLastName(e.target.value)} maxLength={100} />
            </Field>
            <Field htmlFor="account-phone" label="Teléfono" className="sm:col-span-2">
              <Input id="account-phone" value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={20} />
            </Field>
          </div>
          {update.isError ? (
            <Alert variant="destructive">
              <AlertDescription>{errorMessage(update.error)}</AlertDescription>
            </Alert>
          ) : null}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={update.isPending}>
              Cancelar
            </Button>
            <Button type="submit" disabled={update.isPending}>
              {update.isPending ? <LoaderCircle className="animate-spin" /> : null}
              Guardar cambios
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export { AccountDetail };
