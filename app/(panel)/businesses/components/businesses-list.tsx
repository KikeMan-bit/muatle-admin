"use client";

import Link from "next/link";
import { X } from "lucide-react";

import { DataTable, type Column } from "@/components/data-table";
import { PageHeader } from "@/components/page-header";
import { SearchInput } from "@/components/search-input";
import { PlanChip, SubscriptionChip } from "@/components/subscription-chip";
import { Button } from "@/components/ui/button";
import { CountryFlag } from "@/components/ui/country-flag";
import { Select } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useBusinesses, useCountries, usePartnerOptions } from "@/hooks/use-admin";
import type { BusinessRow } from "@/lib/admin-api";
import { countryName } from "@/lib/countries";
import { planIds, planNames } from "@/lib/plans";
import { useUrlState } from "@/hooks/use-url-state";
import { daysLabel, formatCount, formatDate } from "@/lib/utils";

const PAGE_SIZE = 20;

// The tabs are the question of every day: which businesses run, which are
// about to stop, which stopped. Deleted ones go apart, since nobody signs in to them.
const TABS = [
  { value: "all", label: "Todos" },
  { value: "running", label: "Vigentes" },
  { value: "grace", label: "En gracia" },
  { value: "locked", label: "Bloqueados" },
  { value: "deleted", label: "Eliminados" },
];

const ORDER_OPTIONS = [
  { value: "", label: "Más recientes" },
  { value: "created_at", label: "Más antiguos" },
  { value: "plan_end", label: "Vencen antes" },
  { value: "-plan_end", label: "Vencen después" },
  { value: "name", label: "Nombre (A–Z)" },
];

const columns: Column<BusinessRow>[] = [
  {
    key: "name",
    header: "Negocio",
    cell: (row) => (
      <span className="grid min-w-0 leading-tight">
        {/* A real link, so the row opens from the keyboard and in a new tab too */}
        <Link href={`/businesses/${row.id}`} className="truncate font-medium hover:underline">
          {row.name}
        </Link>
        <span className="truncate text-xs text-muted-foreground">{row.owner?.email ?? "Sin dueño"}</span>
      </span>
    ),
    className: "min-w-56",
  },
  {
    key: "country",
    header: "País",
    cell: (row) =>
      row.country ? (
        <span className="inline-flex items-center gap-2">
          <CountryFlag code={row.country} className="h-3.5 w-5 shrink-0" />
          {countryName(row.country)}
        </span>
      ) : (
        <span className="text-muted-foreground">—</span>
      ),
  },
  { key: "plan", header: "Plan", cell: (row) => <PlanChip plan={row.subscription.plan} /> },
  {
    key: "state",
    header: "Estado",
    cell: (row) =>
      row.deleted_at ? (
        <span className="text-muted-foreground">Eliminado el {formatDate(row.deleted_at)}</span>
      ) : (
        <SubscriptionChip subscription={row.subscription} />
      ),
  },
  {
    key: "ends",
    header: "Vence",
    cell: (row) => {
      const { ends_at, days_left, status } = row.subscription;
      if (!ends_at) return <span className="text-muted-foreground">Sin vencimiento</span>;
      return (
        <span className="grid leading-tight">
          <span>{formatDate(ends_at)}</span>
          <span className="text-xs text-muted-foreground">
            {status === "expired" ? "Vencido" : days_left !== null ? `${daysLabel(days_left)} restantes` : ""}
          </span>
        </span>
      );
    },
  },
  {
    key: "size",
    header: "Sucursales · Miembros",
    cell: (row) => (
      <span className="tabular-nums">
        {formatCount(row.branches)} · {formatCount(row.members)}
      </span>
    ),
    className: "text-right",
  },
  { key: "created", header: "Alta", cell: (row) => formatDate(row.created_at), className: "whitespace-nowrap" },
];

/** "Negocios": every business, with where its subscription stands. */
function BusinessesList() {
  // In the URL: open a business and come back, and the tab, search and page are as they were.
  // `partner` comes from an ally's page: the businesses they brought
  const [view, setView] = useUrlState({ tab: "all", q: "", plan: "", country: "", partner: "", order: "", page: 1, size: PAGE_SIZE });
  const { tab, q: search, plan, country, partner, order, page, size } = view;

  const countries = useCountries();
  const partners = usePartnerOptions({ enabled: !!partner });
  const partnerShown = partners.data?.find((option) => String(option.id) === partner);
  const { data, isPending, isFetching, error, refetch } = useBusinesses({
    page,
    page_size: size,
    search: search || undefined,
    plan: plan || undefined,
    country: country || undefined,
    partner: partner ? Number(partner) : undefined,
    state: tab === "running" || tab === "grace" || tab === "locked" ? tab : undefined,
    deleted: tab === "deleted" ? "yes" : "no",
    ordering: order || undefined,
  });

  const total = data?.count ?? 0;
  const hasFilters = !!search || !!plan || !!country || !!partner || !!order || tab !== "all";

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Negocios" description="Los negocios registrados en Muatle: su dueño, su plan y hasta cuándo está vigente. Abre uno para activar su plan o ver sus sucursales y miembros." />

      <section className="flex flex-col gap-4">
        <Tabs value={tab} onValueChange={(value) => setView({ tab: value, page: 1 })}>
          <TabsList variant="chips" aria-label="Filtrar por estado">
            {TABS.map((item) => (
              <TabsTrigger key={item.value} value={item.value}>
                {item.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="flex flex-wrap items-center gap-2">
          <SearchInput
            value={search}
            onChange={(value) => setView({ q: value, page: 1 })}
            placeholder="Buscar por nombre, correo del dueño o menú…"
            className="w-full sm:w-80"
          />
          <Select value={plan} onChange={(e) => setView({ plan: e.target.value, page: 1 })} aria-label="Filtrar por plan" wrapperClassName="w-44" className="h-9 text-sm">
            <option value="">Todos los planes</option>
            {planIds.map((id) => (
              <option key={id} value={id}>
                {planNames[id]}
              </option>
            ))}
          </Select>
          <Select value={country} onChange={(e) => setView({ country: e.target.value, page: 1 })} aria-label="Filtrar por país" wrapperClassName="w-44" className="h-9 text-sm">
            <option value="">Todos los países</option>
            {(countries.data ?? []).map((item) => (
              <option key={item.id} value={item.code ?? ""}>
                {item.name}
              </option>
            ))}
          </Select>
          <Select value={order} onChange={(e) => setView({ order: e.target.value, page: 1 })} aria-label="Ordenar" wrapperClassName="w-44" className="h-9 text-sm">
            {ORDER_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
          {partner ? (
            <Button variant="outline" size="sm" onClick={() => setView({ partner: "", page: 1 })} aria-label="Quitar el filtro por aliado">
              Del aliado {partnerShown ? `${partnerShown.name} (${partnerShown.code})` : `#${partner}`} <X />
            </Button>
          ) : null}
          {hasFilters ? (
            <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={() => setView({ tab: "all", q: "", plan: "", country: "", partner: "", order: "", page: 1 })}>
              <X /> Limpiar
            </Button>
          ) : null}
          <span className="ml-auto text-sm text-muted-foreground tabular-nums">
            {isPending ? "Cargando…" : `${formatCount(total)} ${total === 1 ? "negocio" : "negocios"}`}
          </span>
        </div>

        <DataTable
          columns={columns}
          rows={data?.results ?? []}
          rowKey={(row) => row.id}
          isLoading={isPending || isFetching}
          error={error}
          onRetry={() => refetch()}
          rowHref={(row) => `/businesses/${row.id}`}
          noun="negocios"
          emptyTitle={tab === "deleted" ? "No hay negocios eliminados" : "No hay negocios"}
          emptyMessage={hasFilters ? "Prueba con otros filtros o limpia la búsqueda." : "Los negocios aparecen aquí a medida que se registran."}
          pagination={{
            page,
            pageSize: size,
            total,
            onPageChange: (next) => setView({ page: next }),
            onPageSizeChange: (next) => setView({ size: next, page: 1 }),
          }}
        />
      </section>
    </div>
  );
}

export { BusinessesList };
