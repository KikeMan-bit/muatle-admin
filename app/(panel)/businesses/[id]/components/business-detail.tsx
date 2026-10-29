"use client";

import * as React from "react";
import Link from "next/link";
import { CircleAlert, ExternalLink, Pencil, RefreshCw, RotateCcw, Unlink, WalletCards } from "lucide-react";

import { BackButton } from "@/components/back-button";
import { DataTable, type Column } from "@/components/data-table";
import { PageHeader } from "@/components/page-header";
import { PanelCard } from "@/components/stat-card";
import { PlanChip, SubscriptionChip } from "@/components/subscription-chip";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { CountryFlag } from "@/components/ui/country-flag";
import { Skeleton } from "@/components/ui/skeleton";
import { useBusiness, useRestoreBusiness, useUnlinkDevice } from "@/hooks/use-admin";
import type { BranchData, BusinessDetail as BusinessData, DeviceData, MemberData } from "@/lib/admin-api";
import { errorMessage } from "@/lib/api";
import { countryName } from "@/lib/countries";
import { currencyLabel } from "@/lib/currencies";
import { referralSources } from "@/lib/partners";
import { CHIP_PLAIN } from "@/lib/plans";
import { rolesLabel } from "@/lib/roles";
import { cn, daysLabel, formatBs, formatCount, formatDate, formatDateTime, formatLongDate } from "@/lib/utils";

import { BusinessEditDialog } from "./business-edit-dialog";
import { BusinessPartnerDialog } from "./business-partner-dialog";
import { PlanDialog } from "./plan-dialog";

// Where the businesses' panel lives, to open a branch's digital menu from here
const PANEL_URL = (process.env.NEXT_PUBLIC_PANEL_URL || "http://localhost:3000").replace(/\/+$/, "");

const AGE_LABELS: Record<string, string> = {
  not_started: "Todavía no abrió",
  less_than_1_year: "Menos de 1 año",
  "1_to_3_years": "De 1 a 3 años",
  more_than_3_years: "Más de 3 años",
};

const EXPERIENCE_LABELS: Record<string, string> = {
  first_time: "Primera vez con un sistema",
  used_before: "Ya usó otro sistema",
  switching: "Viene de otro sistema",
};

function labelOf(labels: Record<string, string>, value: string | null): string {
  if (!value) return "—";
  return labels[value] ?? value;
}

/** A row of a definition list: the name in grey, the value in black. */
function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm">{children}</dd>
    </div>
  );
}

/** A business: its subscription, its data, and its branches, members and devices. */
function BusinessDetail({ id }: { id: string }) {
  const { data: business, isPending, error, refetch } = useBusiness(id);
  const [planOpen, setPlanOpen] = React.useState(false);
  const [editOpen, setEditOpen] = React.useState(false);
  const [partnerOpen, setPartnerOpen] = React.useState(false);
  const [restoreOpen, setRestoreOpen] = React.useState(false);
  const restore = useRestoreBusiness(id);

  if (isPending) {
    return (
      <div className="flex flex-col gap-6">
        <BackButton fallback="/businesses" />
        <Skeleton className="h-8 w-72" />
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-56" />
          <Skeleton className="h-56" />
        </div>
      </div>
    );
  }

  if (error || !business) {
    return (
      <div className="flex flex-col gap-6">
        <BackButton fallback="/businesses" />
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

  const { subscription, plan } = business;
  const deleted = business.deleted_at !== null;

  return (
    <div className="flex flex-col gap-6">
      <BackButton fallback="/businesses" />

      <PageHeader
        title={business.name}
        description={
          <>
            {business.owner ? `${business.owner.name || business.owner.email} · ` : "Sin dueño · "}
            Registrado el {formatLongDate(business.created_at)}
          </>
        }
        actions={
          deleted ? (
            <Button onClick={() => setRestoreOpen(true)} disabled={restore.isPending}>
              <RotateCcw /> Restaurar negocio
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => setEditOpen(true)}>
                <Pencil /> Editar datos
              </Button>
              <Button onClick={() => setPlanOpen(true)}>
                <WalletCards /> Cambiar plan
              </Button>
            </>
          )
        }
      >
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <PlanChip plan={subscription.plan} />
          {deleted ? (
            <Badge variant="outline" className={cn(CHIP_PLAIN, "text-red-700")}>
              Eliminado
            </Badge>
          ) : (
            <SubscriptionChip subscription={subscription} />
          )}
          {business.country ? (
            <Badge variant="outline" className={CHIP_PLAIN}>
              <CountryFlag code={business.country} className="h-3 w-4" />
              {countryName(business.country)}
            </Badge>
          ) : null}
        </div>
      </PageHeader>

      {deleted ? (
        <Alert variant="warning">
          <CircleAlert />
          <AlertTitle>Su dueño eliminó este negocio el {formatLongDate(business.deleted_at)}.</AlertTitle>
          <AlertDescription>
            Nadie puede entrar a su panel. Sus datos se borran para siempre 30 días después; hasta entonces se puede
            restaurar, y sus miembros vuelven a entrar con sus cuentas.
          </AlertDescription>
        </Alert>
      ) : null}

      {business.ruppit?.needs_reconnect ? (
        <Alert variant="warning">
          <CircleAlert />
          <AlertDescription>
            Ruppit cerró la sesión de este negocio: su menú y sus órdenes no se sincronizan hasta que el dueño vuelva a
            conectarlo desde Configuración › Integraciones.
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <PanelCard
          title="Suscripción"
          actions={
            deleted ? null : (
              <Button variant="ghost" size="sm" className="-mr-2" onClick={() => setPlanOpen(true)}>
                Cambiar
              </Button>
            )
          }
        >
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
            <Fact label="Plan">
              {subscription.plan_name}
              {subscription.price ? <span className="text-muted-foreground"> · {formatBs(subscription.price)} al mes</span> : null}
            </Fact>
            <Fact label="Estado">
              <SubscriptionChip subscription={subscription} />
            </Fact>
            <Fact label={subscription.plan === "trial" ? "La prueba termina" : "Pagado hasta"}>
              {subscription.ends_at ? formatLongDate(subscription.ends_at) : "Sin vencimiento"}
              {subscription.days_left !== null && subscription.status !== "expired" ? (
                <span className="text-muted-foreground"> · {daysLabel(subscription.days_left)} restantes</span>
              ) : null}
            </Fact>
            <Fact label={subscription.locked ? "Bloqueado desde" : "Se bloquea"}>
              {subscription.locks_at ? formatLongDate(subscription.locks_at) : "—"}
            </Fact>
            {plan.usage ? (
              <>
                <Fact label="Órdenes del menú digital este mes">
                  {formatCount(plan.usage.menu_orders)}
                  {plan.limits.menu_orders !== null ? (
                    <span className="text-muted-foreground">
                      {" "}
                      de {formatCount(plan.limits.menu_orders)}
                      {plan.limits.extra_menu_orders ? " incluidas" : ""}
                    </span>
                  ) : null}
                </Fact>
                <Fact label="Órdenes en mesa este mes">
                  {formatCount(plan.usage.table_orders)}
                  {plan.limits.table_orders !== null ? (
                    <span className="text-muted-foreground">
                      {" "}
                      {plan.limits.table_orders === 0 ? "(no incluidas)" : `de ${formatCount(plan.limits.table_orders)}`}
                    </span>
                  ) : null}
                </Fact>
              </>
            ) : null}
          </dl>
          {subscription.status === "expired" && !subscription.locked ? (
            <p className="mt-3 text-sm text-amber-800">
              Venció y está en sus días de gracia: el panel funciona hasta el {formatLongDate(subscription.locks_at)}.
            </p>
          ) : null}
          {subscription.locked ? (
            <p className="mt-3 text-sm text-red-700">
              Bloqueado: el panel solo lee y su menú digital no recibe órdenes hasta que se active un plan.
            </p>
          ) : null}
        </PanelCard>

        <PanelCard
          title="Datos del negocio"
          actions={
            deleted ? null : (
              <Button variant="ghost" size="sm" className="-mr-2" onClick={() => setEditOpen(true)}>
                Editar
              </Button>
            )
          }
        >
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
            <Fact label="Dueño">
              {business.owner ? (
                <span className="grid leading-tight">
                  <span>{business.owner.name || "—"}</span>
                  <span className="text-xs text-muted-foreground">{business.owner.email}</span>
                </span>
              ) : (
                "—"
              )}
            </Fact>
            <Fact label="País">{countryName(business.country)}</Fact>
            <Fact label="Divisa">{currencyLabel(business.currency)}</Fact>
            <Fact label="Rubro">
              {business.industry || "—"}
              {business.is_food_business ? <span className="text-muted-foreground"> · Comida</span> : null}
            </Fact>
            <Fact label="Antigüedad">{labelOf(AGE_LABELS, business.business_age)}</Fact>
            <Fact label="Experiencia con sistemas">{labelOf(EXPERIENCE_LABELS, business.os_experience)}</Fact>
            <Fact label="Productos en el menú">{formatCount(business.counts.products)}</Fact>
            <Fact label="Órdenes">
              {formatCount(business.counts.orders)}
              <span className="text-muted-foreground"> · {formatCount(business.counts.orders_last_30_days)} en 30 días</span>
            </Fact>
            <div className="col-span-2 flex items-start justify-between gap-3 border-t border-border pt-3">
              <Fact label="Aliado">
                {business.partner ? (
                  <span className="grid leading-tight">
                    <Link href={`/partners/${business.partner.id}`} className="font-medium hover:underline">
                      {business.partner.name} <span className="font-mono text-xs text-muted-foreground">{business.partner.code}</span>
                    </Link>
                    <span className="text-xs text-muted-foreground">
                      {referralSources[business.partner.source]} · {formatDate(business.partner.referred_at)}
                    </span>
                  </span>
                ) : (
                  <span className="text-muted-foreground">Ningún aliado</span>
                )}
              </Fact>
              {deleted ? null : (
                <Button
                  variant="ghost"
                  size="sm"
                  className="-mr-2 shrink-0"
                  onClick={() => setPartnerOpen(true)}
                  // The subscription's own "Cambiar" is on this page too
                  aria-label={business.partner ? "Cambiar el aliado" : "Asignar un aliado"}
                >
                  {business.partner ? "Cambiar" : "Asignar"}
                </Button>
              )}
            </div>
          </dl>
        </PanelCard>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-base font-semibold">Sucursales</h2>
        <DataTable columns={branchColumns} rows={business.branches} rowKey={(row) => row.id} noun="sucursales" emptyTitle="Sin sucursales" emptyMessage="El negocio todavía no agregó su casa matriz." />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-base font-semibold">Miembros</h2>
        <DataTable columns={memberColumns(business.branches)} rows={business.members} rowKey={(row) => row.id} noun="miembros" emptyTitle="Sin miembros" emptyMessage="Nadie trabaja en este negocio todavía." />
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <h2 className="text-base font-semibold">Dispositivos vinculados</h2>
          <p className="text-sm text-muted-foreground">Cajas, tablets y pantallas de cocina donde el equipo entra con su PIN.</p>
        </div>
        <DevicesTable business={business} />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-base font-semibold">Ruppit</h2>
        <PanelCard title={business.ruppit ? business.ruppit.ruppit_business_name || "Local vinculado" : "Sin vincular"}>
          {business.ruppit ? (
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4">
              <Fact label="Correo del local en Ruppit">{business.ruppit.email}</Fact>
              <Fact label="Id del local">{business.ruppit.ruppit_business_id}</Fact>
              <Fact label="Conectado el">{formatDateTime(business.ruppit.connected_at)}</Fact>
              <Fact label="Sesión">{business.ruppit.needs_reconnect ? <span className="text-red-700">Hay que reconectar</span> : "Activa"}</Fact>
            </dl>
          ) : (
            <p className="text-sm text-muted-foreground">Este negocio no vinculó su cuenta de Ruppit. Se hace desde el panel, en Configuración › Integraciones.</p>
          )}
        </PanelCard>
      </section>

      <PlanDialog key={`plan-${business.updated_at}`} business={business} open={planOpen} onOpenChange={setPlanOpen} />
      <BusinessEditDialog key={`edit-${business.updated_at}`} business={business} open={editOpen} onOpenChange={setEditOpen} />
      {partnerOpen ? <BusinessPartnerDialog business={business} open onOpenChange={setPartnerOpen} /> : null}
      <ConfirmDialog
        open={restoreOpen}
        onOpenChange={setRestoreOpen}
        title={`¿Restaurar ${business.name}?`}
        description="El negocio vuelve a estar activo y sus miembros pueden entrar de nuevo con sus cuentas, salvo los que ya estén en otro negocio. Los dispositivos y Ruppit se vuelven a vincular desde el panel."
        confirmLabel="Restaurar"
        confirmVariant="default"
        onConfirm={() => restore.mutate()}
      />
    </div>
  );
}

const branchColumns: Column<BranchData>[] = [
  {
    key: "name",
    header: "Sucursal",
    cell: (row) => (
      <span className="inline-flex items-center gap-2">
        <span className="font-medium">{row.name}</span>
        {row.is_main ? (
          <Badge variant="outline" className={CHIP_PLAIN}>
            Matriz
          </Badge>
        ) : null}
      </span>
    ),
  },
  { key: "address", header: "Dirección", cell: (row) => <span className="whitespace-normal">{row.address || "—"}</span>, className: "min-w-56" },
  {
    key: "menu",
    header: "Menú digital",
    cell: (row) =>
      row.menu_slug ? (
        <a
          href={`${PANEL_URL}/m/${row.menu_slug}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-foreground underline-offset-2 hover:underline"
        >
          /m/{row.menu_slug}
          <ExternalLink className="size-3.5 text-muted-foreground" />
        </a>
      ) : (
        "—"
      ),
  },
  {
    key: "ruppit",
    header: "Ruppit",
    cell: (row) =>
      row.ruppit ? (
        <span className="grid leading-tight">
          <span>{row.ruppit.ruppit_branch_name || `Sucursal ${row.ruppit.ruppit_branch_id}`}</span>
          <span className="text-xs text-muted-foreground">
            {[row.ruppit.publishes_menu ? "Menú sincronizado" : null, row.ruppit.takes_orders ? "Recibe órdenes" : null].filter(Boolean).join(" · ") || "Vinculada"}
          </span>
        </span>
      ) : (
        <span className="text-muted-foreground">—</span>
      ),
  },
  {
    key: "state",
    header: "Estado",
    cell: (row) => (row.is_active ? "Abierta" : <span className="text-muted-foreground">Cerrada</span>),
  },
  { key: "created", header: "Alta", cell: (row) => formatDate(row.created_at), className: "whitespace-nowrap" },
];

function memberColumns(branches: BranchData[]): Column<MemberData>[] {
  const branchName = (id: number | null) => (id === null ? "Todas" : branches.find((branch) => branch.id === id)?.name ?? `#${id}`);
  return [
    {
      key: "name",
      header: "Miembro",
      cell: (row) => (
        <span className="grid min-w-0 leading-tight">
          <span className="truncate font-medium">{row.name || "Sin nombre"}</span>
          <span className="truncate text-xs text-muted-foreground">{row.email ?? "Sin correo: entra con su PIN"}</span>
        </span>
      ),
      className: "min-w-56",
    },
    { key: "roles", header: "Rol", cell: (row) => <span className="whitespace-normal">{rolesLabel(row.roles, row.owner)}</span> },
    { key: "branch", header: "Sucursal", cell: (row) => branchName(row.branch) },
    {
      key: "access",
      header: "Acceso",
      cell: (row) => (
        <span className="flex flex-wrap gap-1">
          {row.email ? (
            <Badge variant="outline" className={CHIP_PLAIN}>
              Correo
            </Badge>
          ) : null}
          {row.has_pin ? (
            <Badge variant="outline" className={CHIP_PLAIN}>
              PIN
            </Badge>
          ) : null}
          {row.invitation_pending ? (
            <Badge variant="outline" className={cn(CHIP_PLAIN, "text-amber-800")}>
              Invitación pendiente
            </Badge>
          ) : null}
        </span>
      ),
    },
    { key: "last_login", header: "Último acceso", cell: (row) => formatDateTime(row.last_login), className: "whitespace-nowrap" },
    { key: "state", header: "Estado", cell: (row) => (row.is_active ? "Activo" : <span className="text-muted-foreground">Inactivo</span>) },
  ];
}

function DevicesTable({ business }: { business: BusinessData }) {
  const [unlinking, setUnlinking] = React.useState<DeviceData | null>(null);
  const unlink = useUnlinkDevice(business.id);
  const branchName = (id: number) => business.branches.find((branch) => branch.id === id)?.name ?? `#${id}`;

  const columns: Column<DeviceData>[] = [
    { key: "name", header: "Dispositivo", cell: (row) => <span className="font-medium">{row.name}</span> },
    { key: "branch", header: "Sucursal", cell: (row) => branchName(row.branch) },
    { key: "linked_by", header: "Vinculado por", cell: (row) => row.linked_by || "—" },
    { key: "created", header: "Vinculado el", cell: (row) => formatDateTime(row.created_at), className: "whitespace-nowrap" },
    { key: "used", header: "Último uso", cell: (row) => formatDateTime(row.last_used_at), className: "whitespace-nowrap" },
    {
      key: "pins",
      header: "PIN",
      cell: (row) =>
        row.locked_until && new Date(row.locked_until) > new Date() ? (
          <span className="text-red-700">Bloqueado hasta {formatDateTime(row.locked_until)}</span>
        ) : row.failed_pins ? (
          <span className="text-muted-foreground">{formatCount(row.failed_pins)} intentos fallidos</span>
        ) : (
          "—"
        ),
    },
    {
      key: "actions",
      header: <span className="sr-only">Acciones</span>,
      cell: (row) => (
        <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-red-700" onClick={() => setUnlinking(row)} disabled={unlink.isPending}>
          <Unlink /> Desvincular
        </Button>
      ),
      className: "text-right",
    },
  ];

  return (
    <>
      <DataTable columns={columns} rows={business.devices} rowKey={(row) => row.id} noun="dispositivos" emptyTitle="Sin dispositivos vinculados" emptyMessage="El negocio vincula sus cajas y pantallas desde Configuración › Miembros." />
      <ConfirmDialog
        open={unlinking !== null}
        onOpenChange={(open) => !open && setUnlinking(null)}
        title={`¿Desvincular ${unlinking?.name ?? "el dispositivo"}?`}
        description="Nadie podrá entrar con su PIN desde ese dispositivo hasta que lo vuelvan a vincular. Queda anotado en el historial de seguridad del negocio como hecho por Soporte de Muatle."
        confirmLabel="Desvincular"
        onConfirm={() => unlinking && unlink.mutate(unlinking.id)}
      />
    </>
  );
}

export { BusinessDetail };
