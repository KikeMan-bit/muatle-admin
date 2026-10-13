"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, CircleAlert, RefreshCw } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { PanelCard, StatCard } from "@/components/stat-card";
import { SubscriptionChip } from "@/components/subscription-chip";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboard } from "@/hooks/use-admin";
import type { BusinessRow, Dashboard as DashboardData } from "@/lib/admin-api";
import { errorMessage } from "@/lib/api";
import { cn, daysLabel, formatBs, formatCount, formatDate } from "@/lib/utils";

const MONTHS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

/** "4 oct", from a "2026-10-04" key, with no time zone in the way. */
function shortDay(key: string): string {
  const [, month, day] = key.split("-").map(Number);
  return `${day} ${MONTHS[month - 1]}`;
}

/** "Inicio": how Muatle is doing, and what is due. */
function Dashboard() {
  const { data, isPending, isError, error, refetch } = useDashboard();
  const counts = data?.counts;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Inicio"
        description="Los negocios registrados en Muatle, dónde está cada suscripción y qué toca atender."
      />

      {isError ? (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <CircleAlert className="size-4 shrink-0" />
          <span className="flex-1">{errorMessage(error)}</span>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw /> Reintentar
          </Button>
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatCard
          title="Negocios activos"
          hint="Los negocios registrados que su dueño no eliminó, con prueba o con plan."
          value={formatCount(counts?.businesses)}
          detail={counts ? `${formatCount(counts.new_this_month)} nuevos este mes` : undefined}
          loading={isPending}
        />
        <StatCard
          title="En prueba gratuita"
          value={formatCount(counts?.trial)}
          detail={counts ? `${formatCount(counts.grace)} en días de gracia` : undefined}
          loading={isPending}
        />
        <StatCard
          title="Con plan pagado"
          hint="Negocios con un plan activado. El ingreso mensual suma el precio de los planes vigentes."
          value={formatCount(counts?.paid)}
          detail={counts ? `${formatBs(counts.monthly_revenue)} al mes` : undefined}
          loading={isPending}
        />
        <StatCard
          title="Bloqueados"
          hint="Pasaron los días de gracia sin un plan: su panel solo lee hasta que se active uno."
          value={formatCount(counts?.locked)}
          detail={counts ? `${formatCount(counts.deleted)} eliminados por su dueño` : undefined}
          loading={isPending}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <PanelCard title="Altas de negocios" hint="Negocios registrados cada día en los últimos 30 días." className="lg:col-span-2">
          {isPending ? <Skeleton className="h-40 w-full" /> : data ? <SignupsChart days={data.signups} /> : <EmptyState className="h-40" />}
        </PanelCard>
        <PanelCard title="Negocios por plan">
          {isPending ? <Skeleton className="h-40 w-full" /> : data ? <PlanBreakdown rows={data.by_plan} /> : <EmptyState className="h-40" />}
        </PanelCard>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatCard title="Órdenes este mes" hint="Órdenes no canceladas de todos los negocios desde el 1.º del mes." value={formatCount(counts?.orders_this_month)} loading={isPending} />
        <StatCard title="Cuentas activas" hint="Cuentas con correo que pueden iniciar sesión: dueños, miembros y el equipo." value={formatCount(counts?.accounts)} loading={isPending} />
        <StatCard title="Vigentes" hint="Negocios cuya prueba o plan aún no venció." value={formatCount(counts?.running)} loading={isPending} />
        <StatCard title="En días de gracia" hint="Vencidos hace menos de tres días: su panel todavía funciona." value={formatCount(counts?.grace)} loading={isPending} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <BusinessList
          title="Vencen en los próximos 7 días"
          hint="Pruebas y planes que terminan esta semana: a quién escribirle para renovar."
          rows={data?.ending_soon}
          loading={isPending}
          empty="Nada vence esta semana"
          href="/businesses?tab=running&order=plan_end"
        />
        <BusinessList
          title="Bloqueados"
          hint="Sin plan después de los días de gracia. Se activa uno desde la ficha del negocio."
          rows={data?.locked}
          loading={isPending}
          empty="Ningún negocio bloqueado"
          href="/businesses?tab=locked"
        />
        <BusinessList
          title="Últimos registrados"
          rows={data?.recent}
          loading={isPending}
          empty="Todavía no hay negocios"
          href="/businesses"
        />
      </div>
    </div>
  );
}

/** Columns for the days of sign-ups, the count over each; a day with none is a baseline tick. */
function SignupsChart({ days }: { days: DashboardData["signups"] }) {
  const max = Math.max(1, ...days.map((day) => day.count));
  const total = days.reduce((sum, day) => sum + day.count, 0);
  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm text-muted-foreground">
        <span className="font-medium text-foreground tabular-nums">{formatCount(total)}</span> en 30 días
      </p>
      <ol aria-label="Altas por día" className="flex h-32 items-end gap-1 border-b border-border">
        {days.map((day) => (
          <li key={day.day} className="group relative flex h-full flex-1 items-end" title={`${shortDay(day.day)}: ${daysLabelCount(day.count)}`}>
            <div
              className={cn("w-full rounded-t-sm transition-colors", day.count ? "bg-primary group-hover:bg-primary/80" : "bg-border")}
              style={{ height: day.count ? `${Math.max(6, (day.count / max) * 100)}%` : "2px" }}
            />
            <span className="sr-only">
              {shortDay(day.day)}: {daysLabelCount(day.count)}
            </span>
          </li>
        ))}
      </ol>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{shortDay(days[0].day)}</span>
        <span>{shortDay(days[days.length - 1].day)}</span>
      </div>
    </div>
  );
}

function daysLabelCount(count: number): string {
  return `${formatCount(count)} ${count === 1 ? "alta" : "altas"}`;
}

const planColors = ["bg-chart-2", "bg-chart-1", "bg-chart-5", "bg-chart-4"];

/** Part-to-whole in one bar, the counts in the legend under it. */
function PlanBreakdown({ rows }: { rows: DashboardData["by_plan"] }) {
  const total = rows.reduce((sum, row) => sum + row.count, 0);
  if (total === 0) return <EmptyState message="Todavía no hay negocios" className="h-40" />;
  return (
    <div className="flex flex-col gap-3">
      <div aria-hidden className="flex h-3 gap-0.5 overflow-hidden rounded-full">
        {rows
          .filter((row) => row.count > 0)
          .map((row) => (
            <div key={row.plan} className={planColors[rows.indexOf(row) % planColors.length]} style={{ flex: `${row.count} 1 0%` }} />
          ))}
      </div>
      <ul aria-label="Negocios por plan">
        {rows.map((row, index) => (
          <li key={row.plan} className="flex items-center gap-2 py-1.5 text-sm leading-6">
            <span aria-hidden className={cn("size-2 shrink-0 rounded-full", planColors[index % planColors.length])} />
            <Link href={`/businesses?plan=${row.plan}`} className="min-w-0 flex-1 truncate text-muted-foreground hover:text-foreground hover:underline">
              {row.name}
            </Link>
            <span className="shrink-0 font-medium tabular-nums">{formatCount(row.count)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function BusinessList({
  title,
  hint,
  rows,
  loading,
  empty,
  href,
}: {
  title: string;
  hint?: string;
  rows: BusinessRow[] | undefined;
  loading: boolean;
  empty: string;
  href: string;
}) {
  return (
    <PanelCard
      title={title}
      hint={hint}
      actions={
        <Button asChild variant="ghost" size="sm" className="-mr-2 text-muted-foreground">
          <Link href={href}>
            Ver todos <ArrowRight />
          </Link>
        </Button>
      }
    >
      {loading ? (
        <div className="flex flex-col gap-3 py-1">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-full" />
          ))}
        </div>
      ) : !rows || rows.length === 0 ? (
        <EmptyState message={empty} className="min-h-40" />
      ) : (
        <ul className="-mt-1.5 divide-y divide-border">
          {rows.map((business) => (
            <li key={business.id}>
              <Link
                href={`/businesses/${business.id}`}
                className="-mx-2 flex items-center gap-3 rounded-md px-2 py-2.5 text-sm outline-none hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/40"
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{business.name}</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {business.owner?.email ?? "Sin dueño"}
                    {business.subscription.ends_at
                      ? ` · ${business.subscription.status === "expired" ? "Venció" : "Vence"} el ${formatDate(business.subscription.ends_at)}`
                      : ""}
                    {business.subscription.days_left && business.subscription.status !== "expired"
                      ? ` (${daysLabel(business.subscription.days_left)})`
                      : ""}
                  </span>
                </span>
                <SubscriptionChip subscription={business.subscription} className="shrink-0" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </PanelCard>
  );
}

export { Dashboard };
