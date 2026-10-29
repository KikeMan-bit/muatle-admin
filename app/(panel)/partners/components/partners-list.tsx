"use client";

import * as React from "react";
import Link from "next/link";
import { Pencil, Plus, X } from "lucide-react";

import { DataTable, type Column } from "@/components/data-table";
import { PageHeader } from "@/components/page-header";
import { SearchInput } from "@/components/search-input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { usePartnerProgram, usePartners } from "@/hooks/use-admin";
import { useUrlState } from "@/hooks/use-url-state";
import type { PartnerRow } from "@/lib/admin-api";
import { dealLabel, dealShort } from "@/lib/partners";
import { CHIP_PLAIN } from "@/lib/plans";
import { cn, formatAmount, formatCount, formatDate, personName } from "@/lib/utils";

import { PartnerDialog } from "./partner-dialog";
import { ProgramDialog } from "./program-dialog";

const PAGE_SIZE = 20;

const ORDER_OPTIONS = [
  { value: "", label: "Más recientes" },
  { value: "created_at", label: "Más antiguos" },
  { value: "-pending_total", label: "Más por pagar" },
  { value: "-business_count", label: "Más negocios" },
  { value: "-paid_total", label: "Más pagado" },
  { value: "code", label: "Código (A–Z)" },
];

/** What keeps an ally from working as one: switched off, or their password still to make. */
function PartnerBadges({ partner }: { partner: PartnerRow }) {
  if (partner.is_active && !partner.invitation_pending) return null;
  return (
    <span className="flex flex-wrap gap-1">
      {!partner.is_active ? (
        <Badge variant="outline" className={cn(CHIP_PLAIN, "text-red-700")}>
          Desactivado
        </Badge>
      ) : null}
      {partner.invitation_pending ? (
        <Badge variant="outline" className={cn(CHIP_PLAIN, "text-amber-800")}>
          Invitación pendiente
        </Badge>
      ) : null}
    </span>
  );
}

/** "General" or "Propia", with the deal under it. */
function DealCell({ partner }: { partner: PartnerRow }) {
  const { commission } = partner;
  return (
    <span className="grid leading-tight">
      <span>{commission.own ? dealShort(commission) : "General"}</span>
      <span className="text-xs text-muted-foreground">{commission.own ? "Propia" : dealShort(commission)}</span>
    </span>
  );
}

const columns: Column<PartnerRow>[] = [
  {
    key: "partner",
    header: "Aliado",
    cell: (row) => (
      <span className="grid min-w-0 leading-tight">
        {/* A real link, so the row opens from the keyboard and in a new tab too */}
        <Link href={`/partners/${row.id}`} className="truncate font-medium hover:underline">
          {personName(row)}
        </Link>
        <span className="truncate text-xs text-muted-foreground">{row.email}</span>
      </span>
    ),
    className: "min-w-52",
  },
  { key: "code", header: "Código", cell: (row) => <span className="font-mono text-sm font-medium">{row.code}</span> },
  { key: "deal", header: "Comisión", cell: (row) => <DealCell partner={row} /> },
  {
    key: "businesses",
    header: "Negocios",
    cell: (row) => (
      <span className="grid leading-tight tabular-nums">
        <span>{formatCount(row.businesses)}</span>
        <span className="text-xs text-muted-foreground">{formatCount(row.paying)} pagando</span>
      </span>
    ),
    className: "text-right",
  },
  {
    key: "pending",
    header: "Por pagar",
    cell: (row) => <span className={cn("tabular-nums", Number(row.pending) > 0 ? "font-medium" : "text-muted-foreground")}>{formatAmount(row.pending)}</span>,
    className: "text-right whitespace-nowrap",
  },
  {
    key: "paid",
    header: "Pagado",
    cell: (row) => <span className="tabular-nums">{formatAmount(row.paid)}</span>,
    className: "text-right whitespace-nowrap",
  },
  {
    key: "state",
    header: "Estado",
    cell: (row) => (row.is_active && !row.invitation_pending ? <span className="text-muted-foreground">Activo</span> : <PartnerBadges partner={row} />),
  },
  { key: "created", header: "Alta", cell: (row) => formatDate(row.created_at), className: "whitespace-nowrap" },
];

/** An ally as a card, for a phone: the same things the row says, stacked. */
function PartnerCard({ partner }: { partner: PartnerRow }) {
  return (
    <div className="flex flex-col gap-2 text-sm">
      <div className="flex items-start justify-between gap-3">
        <span className="grid min-w-0 leading-tight">
          <Link href={`/partners/${partner.id}`} className="truncate font-medium hover:underline">
            {personName(partner)}
          </Link>
          <span className="truncate text-xs text-muted-foreground">
            <span className="font-mono">{partner.code}</span> · {partner.email}
          </span>
        </span>
        <span className="grid shrink-0 text-right leading-tight">
          <span className={cn("tabular-nums", Number(partner.pending) > 0 ? "font-semibold" : "text-muted-foreground")}>{formatAmount(partner.pending)}</span>
          <span className="text-xs text-muted-foreground">por pagar</span>
        </span>
      </div>
      <p className="text-muted-foreground">
        {partner.commission.own ? `Propia: ${dealShort(partner.commission)}` : `General: ${dealShort(partner.commission)}`}
      </p>
      <p className="text-muted-foreground tabular-nums">
        {formatCount(partner.businesses)} {partner.businesses === 1 ? "negocio" : "negocios"} · {formatCount(partner.paying)} pagando · {formatAmount(partner.paid)} pagado
      </p>
      <PartnerBadges partner={partner} />
    </div>
  );
}

/**
 * "Aliados": people outside Muatle who recommend it. The businesses that sign
 * up with their link or their code are theirs, and they earn a share of what
 * those businesses pay for their plan, by the general deal or one of their own.
 */
function PartnersList() {
  // In the URL: open an ally and come back, and the search, order and page are as they were
  const [view, setView] = useUrlState({ q: "", active: "", order: "", page: 1, size: PAGE_SIZE });
  const { q: search, active, order, page, size } = view;
  const program = usePartnerProgram();
  const [programOpen, setProgramOpen] = React.useState(false);
  const [adding, setAdding] = React.useState(false);
  // A new key each time the dialog opens: it starts from an empty form while the last one animates out
  const [addKey, setAddKey] = React.useState(0);
  const startAdding = () => {
    setAddKey((key) => key + 1);
    setAdding(true);
  };

  const { data, isPending, isFetching, error, refetch } = usePartners({
    page,
    page_size: size,
    search: search || undefined,
    active: active || undefined,
    ordering: order || undefined,
  });

  const total = data?.count ?? 0;
  const hasFilters = !!search || !!active || !!order;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Aliados"
        description="Quienes recomiendan Muatle: los negocios que se registran con su enlace o su código quedan a su nombre, y ganan una parte de lo que esos negocios pagan por su plan."
        actions={
          <Button onClick={startAdding}>
            <Plus /> Nuevo aliado
          </Button>
        }
      />

      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-xl border border-border bg-card px-4 py-3">
        <div className="grid min-w-0 gap-0.5">
          <span className="text-xs text-muted-foreground">Comisión general</span>
          {program.isPending ? (
            <Skeleton className="h-5 w-72" />
          ) : program.data ? (
            <span className="text-[15px] font-medium">{dealLabel(program.data)}</span>
          ) : (
            <span className="text-sm text-red-700">No se pudo cargar la comisión general.</span>
          )}
          <span className="text-xs text-muted-foreground">
            La ganan los aliados sin comisión propia.
            {program.data?.updated_by ? ` Cambiada por ${program.data.updated_by} el ${formatDate(program.data.updated_at)}.` : ""}
          </span>
        </div>
        <Button variant="outline" size="sm" onClick={() => setProgramOpen(true)} disabled={!program.data}>
          <Pencil /> Editar
        </Button>
      </div>

      <section className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <SearchInput value={search} onChange={(value) => setView({ q: value, page: 1 })} placeholder="Buscar por nombre, correo, teléfono o código…" className="w-full sm:w-80" />
          <Select value={active} onChange={(e) => setView({ active: e.target.value, page: 1 })} aria-label="Filtrar por estado" wrapperClassName="w-44" className="h-9 text-sm">
            <option value="">Activos e inactivos</option>
            <option value="yes">Solo activos</option>
            <option value="no">Solo desactivados</option>
          </Select>
          <Select value={order} onChange={(e) => setView({ order: e.target.value, page: 1 })} aria-label="Ordenar" wrapperClassName="w-44" className="h-9 text-sm">
            {ORDER_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
          {hasFilters ? (
            <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={() => setView({ q: "", active: "", order: "", page: 1 })}>
              <X /> Limpiar
            </Button>
          ) : null}
          <span className="ml-auto text-sm text-muted-foreground tabular-nums">
            {isPending ? "Cargando…" : `${formatCount(total)} ${total === 1 ? "aliado" : "aliados"}`}
          </span>
        </div>

        <DataTable
          columns={columns}
          rows={data?.results ?? []}
          rowKey={(row) => row.id}
          isLoading={isPending || isFetching}
          error={error}
          onRetry={() => refetch()}
          rowHref={(row) => `/partners/${row.id}`}
          card={(row) => <PartnerCard partner={row} />}
          noun="aliados"
          emptyTitle={hasFilters ? "No hay aliados así" : "Todavía no hay aliados"}
          emptyMessage={hasFilters ? "Prueba con otros filtros o limpia la búsqueda." : "Crea uno: le llega un correo para entrar a su panel y empezar a compartir su enlace."}
          pagination={{
            page,
            pageSize: size,
            total,
            onPageChange: (next) => setView({ page: next }),
            onPageSizeChange: (next) => setView({ size: next, page: 1 }),
          }}
        />
      </section>

      {program.data ? <ProgramDialog key={program.data.updated_at} program={program.data} open={programOpen} onOpenChange={setProgramOpen} /> : null}
      <PartnerDialog key={addKey} open={adding} onOpenChange={setAdding} />
    </div>
  );
}

export { PartnersList };
