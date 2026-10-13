"use client";

import * as React from "react";
import Link from "next/link";
import { UserPlus, X } from "lucide-react";

import { DataTable, type Column } from "@/components/data-table";
import { PageHeader } from "@/components/page-header";
import { SearchInput } from "@/components/search-input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAccounts } from "@/hooks/use-admin";
import { useUrlState } from "@/hooks/use-url-state";
import type { AccountRow } from "@/lib/admin-api";
import { CHIP_PLAIN } from "@/lib/plans";
import { cn, formatCount, formatDate, formatDateTime, personName } from "@/lib/utils";

import { NewAccountDialog } from "./new-account-dialog";

const PAGE_SIZE = 20;

const TABS = [
  { value: "all", label: "Todas" },
  { value: "admin", label: "Equipo de Muatle" },
  { value: "business", label: "De los negocios" },
];

const ORDER_OPTIONS = [
  { value: "", label: "Más recientes" },
  { value: "created_at", label: "Más antiguas" },
  { value: "-last_login", label: "Último acceso" },
  { value: "email", label: "Correo (A–Z)" },
];

/** The chip of an account's role: the team or a business's. */
function RoleChip({ role }: { role: AccountRow["role"] }) {
  return (
    <Badge variant="outline" className={cn(CHIP_PLAIN, role === "admin" && "border-primary/40")}>
      {role === "admin" ? "Equipo de Muatle" : "Negocio"}
    </Badge>
  );
}

const ACTIVE_CHIP =
  "inline-flex items-center gap-1.5 border-border bg-card text-foreground font-normal before:inline-block before:size-1.5 before:shrink-0 before:rounded-full before:content-['']";

function ActiveChip({ active }: { active: boolean }) {
  return (
    <Badge variant="outline" className={cn(ACTIVE_CHIP, active ? "before:bg-green-600" : "before:bg-neutral-400")}>
      {active ? "Activa" : "Inactiva"}
    </Badge>
  );
}

const columns: Column<AccountRow>[] = [
  {
    key: "account",
    header: "Cuenta",
    cell: (row) => (
      <span className="grid min-w-0 leading-tight">
        {/* A real link, so the row opens from the keyboard and in a new tab too */}
        <Link href={`/accounts/${row.id}`} className="truncate font-medium hover:underline">
          {personName(row)}
        </Link>
        <span className="truncate text-xs text-muted-foreground">{row.email}</span>
      </span>
    ),
    className: "min-w-56",
  },
  { key: "role", header: "Rol", cell: (row) => <RoleChip role={row.role} /> },
  {
    key: "businesses",
    header: "Negocios",
    cell: (row) => {
      const active = row.memberships.filter((membership) => membership.is_active);
      if (active.length === 0) return <span className="text-muted-foreground">—</span>;
      return (
        <span className="flex flex-wrap gap-1">
          {active.map((membership) => (
            <Link
              key={membership.id}
              href={`/businesses/${membership.business.id}`}
              className="inline-flex items-center gap-1 rounded-md border border-border px-1.5 py-0.5 text-xs hover:bg-muted"
            >
              {membership.business.name}
              {membership.owner ? <span className="text-muted-foreground">· dueño</span> : null}
            </Link>
          ))}
        </span>
      );
    },
    className: "min-w-48",
  },
  { key: "state", header: "Estado", cell: (row) => <ActiveChip active={row.is_active} /> },
  { key: "last_login", header: "Último acceso", cell: (row) => formatDateTime(row.last_login), className: "whitespace-nowrap" },
  { key: "created", header: "Alta", cell: (row) => formatDate(row.created_at), className: "whitespace-nowrap" },
];

/** "Cuentas": everyone who signs in with an email, the team's and the businesses' alike. */
function AccountsList() {
  const [view, setView] = useUrlState({ tab: "all", q: "", active: "", order: "", page: 1, size: PAGE_SIZE });
  const { tab, q: search, active, order, page, size } = view;
  const [creating, setCreating] = React.useState(false);
  // A new key each time the dialog opens: it starts from an empty form while the last one animates out
  const [createKey, setCreateKey] = React.useState(0);
  const startCreating = () => {
    setCreateKey((key) => key + 1);
    setCreating(true);
  };

  const { data, isPending, isFetching, error, refetch } = useAccounts({
    page,
    page_size: size,
    search: search || undefined,
    role: tab === "admin" || tab === "business" ? tab : undefined,
    active: active || undefined,
    ordering: order || undefined,
  });

  const total = data?.count ?? 0;
  const hasFilters = !!search || !!active || !!order || tab !== "all";

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Cuentas"
        description="Quienes entran con un correo: los dueños y miembros de los negocios, y el equipo de Muatle que usa esta administración."
        actions={
          <Button onClick={startCreating}>
            <UserPlus /> Nueva cuenta del equipo
          </Button>
        }
      />

      <section className="flex flex-col gap-4">
        <Tabs value={tab} onValueChange={(value) => setView({ tab: value, page: 1 })}>
          <TabsList variant="chips" aria-label="Filtrar por rol">
            {TABS.map((item) => (
              <TabsTrigger key={item.value} value={item.value}>
                {item.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="flex flex-wrap items-center gap-2">
          <SearchInput value={search} onChange={(value) => setView({ q: value, page: 1 })} placeholder="Buscar por correo, nombre o teléfono…" className="w-full sm:w-80" />
          <Select value={active} onChange={(e) => setView({ active: e.target.value, page: 1 })} aria-label="Filtrar por estado" wrapperClassName="w-40" className="h-9 text-sm">
            <option value="">Activas e inactivas</option>
            <option value="yes">Solo activas</option>
            <option value="no">Solo inactivas</option>
          </Select>
          <Select value={order} onChange={(e) => setView({ order: e.target.value, page: 1 })} aria-label="Ordenar" wrapperClassName="w-44" className="h-9 text-sm">
            {ORDER_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
          {hasFilters ? (
            <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={() => setView({ tab: "all", q: "", active: "", order: "", page: 1 })}>
              <X /> Limpiar
            </Button>
          ) : null}
          <span className="ml-auto text-sm text-muted-foreground tabular-nums">
            {isPending ? "Cargando…" : `${formatCount(total)} ${total === 1 ? "cuenta" : "cuentas"}`}
          </span>
        </div>

        <DataTable
          columns={columns}
          rows={data?.results ?? []}
          rowKey={(row) => row.id}
          isLoading={isPending || isFetching}
          error={error}
          onRetry={() => refetch()}
          rowHref={(row) => `/accounts/${row.id}`}
          noun="cuentas"
          emptyMessage={hasFilters ? "Prueba con otros filtros o limpia la búsqueda." : "Las cuentas aparecen aquí a medida que se registran."}
          pagination={{
            page,
            pageSize: size,
            total,
            onPageChange: (next) => setView({ page: next }),
            onPageSizeChange: (next) => setView({ size: next, page: 1 }),
          }}
        />
      </section>

      <NewAccountDialog key={createKey} open={creating} onOpenChange={setCreating} />
    </div>
  );
}

export { AccountsList, ActiveChip, RoleChip };
