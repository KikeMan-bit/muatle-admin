"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, Ban, CircleAlert, Ellipsis, HandCoins, Pencil, Plus, Power, PowerOff, RefreshCw, Send, Undo2 } from "lucide-react";

import { BackButton } from "@/components/back-button";
import { DataTable, type Column } from "@/components/data-table";
import { PageHeader } from "@/components/page-header";
import { PanelCard, StatCard } from "@/components/stat-card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { CopyButton } from "@/components/ui/copy-button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ActionItem, ActionsLabel, returnFocusIfLost, RowMenu } from "@/components/ui/row-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useInvitePartner, usePartner, useUndoPayout, useUpdatePartner } from "@/hooks/use-admin";
import { useUrlState } from "@/hooks/use-url-state";
import type { Commission, CommissionStatus, PartnerDetail as PartnerData, Payout, Referral } from "@/lib/admin-api";
import { errorMessage } from "@/lib/api";
import { commissionStatuses, countedLabel, dealLabel, partnerActive, referralSources, referralStates } from "@/lib/partners";
import { CHIP_PLAIN } from "@/lib/plans";
import { cn, formatAmount, formatCount, formatDate, formatDateTime, formatLongDate, personName } from "@/lib/utils";

import { invitationToast, PartnerDialog } from "../../components/partner-dialog";
import { CommissionDialog } from "./commission-dialog";
import { commissionConcept, dayLabel, Fact, recentlyChanged } from "./partner-facts";
import { PayoutDialog } from "./payout-dialog";
import { VoidDialog } from "./void-dialog";

const STATUS_TABS: { value: "" | CommissionStatus; label: string }[] = [
  { value: "", label: "Todas" },
  { value: "pending", label: "Por cobrar" },
  { value: "paid", label: "Pagadas" },
  { value: "void", label: "Anuladas" },
];

type Toggle = "deactivate" | "activate" | null;

/** An ally: their link and deal, where they get paid, the businesses they brought, what they earned and what they were paid. */
function PartnerDetail({ id }: { id: string }) {
  const { data: partner, isPending, error, refetch } = usePartner(id);
  const [view, setView] = useUrlState({ tab: "businesses", status: "" }, { persist: false });
  const [editOpen, setEditOpen] = React.useState(false);
  const [payOpen, setPayOpen] = React.useState(false);
  const [manualOpen, setManualOpen] = React.useState(false);
  const [voiding, setVoiding] = React.useState<Commission | null>(null);
  const [undoing, setUndoing] = React.useState<Payout | null>(null);
  const [toggle, setToggle] = React.useState<Toggle>(null);
  const menuTrigger = React.useRef<HTMLButtonElement>(null);

  const update = useUpdatePartner(id);
  const invite = useInvitePartner(id, { onSuccess: (data) => invitationToast(data, false) });
  const undo = useUndoPayout(id);

  if (isPending) {
    return (
      <div className="flex flex-col gap-6">
        <BackButton fallback="/partners" />
        <Skeleton className="h-8 w-72" />
        <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-56" />
          <Skeleton className="h-56" />
        </div>
      </div>
    );
  }

  if (error || !partner) {
    return (
      <div className="flex flex-col gap-6">
        <BackButton fallback="/partners" />
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

  const name = personName(partner);
  const pending = partner.commissions.filter((commission) => commission.status === "pending");
  // The latest first, whatever order they come in: undoing one should never pick the wrong one
  const payouts = [...partner.payouts].sort((a, b) => b.paid_on.localeCompare(a.paid_on) || b.id - a.id);
  const shownCommissions = view.status ? partner.commissions.filter((commission) => commission.status === view.status) : partner.commissions;
  const stateCount = (state: Referral["state"]) => partner.referrals.filter((referral) => referral.state === state).length;
  const active = partnerActive[partner.is_active ? "on" : "off"];

  const confirmToggle = () => {
    if (toggle) update.mutate({ is_active: toggle === "activate" });
    setToggle(null);
  };

  const commissionColumns: Column<Commission>[] = [
    { key: "date", header: "Fecha", cell: (row) => formatDate(row.created_at), className: "whitespace-nowrap" },
    {
      key: "business",
      header: "Negocio",
      cell: (row) =>
        row.business_id ? (
          <Link href={`/businesses/${row.business_id}`} className="font-medium hover:underline">
            {row.business || `Negocio #${row.business_id}`}
          </Link>
        ) : (
          <span className={row.business ? "font-medium" : "text-muted-foreground"}>{row.business || "—"}</span>
        ),
      className: "min-w-40",
    },
    {
      key: "concept",
      header: "Concepto",
      cell: (row) => (
        <span className="grid leading-tight whitespace-normal">
          <span>{commissionConcept(row)}</span>
          {row.created_by ? <span className="text-xs text-muted-foreground">Por {row.created_by}</span> : null}
        </span>
      ),
      className: "min-w-56",
    },
    { key: "amount", header: "Comisión", cell: (row) => <span className="font-medium tabular-nums">{formatAmount(row.amount)}</span>, className: "text-right whitespace-nowrap" },
    { key: "status", header: "Estado", cell: (row) => <CommissionState commission={row} /> },
    {
      key: "actions",
      header: <span className="sr-only">Acciones</span>,
      cell: (row) =>
        row.status === "pending" ? <RowMenu label={`la comisión de ${formatAmount(row.amount)}`} actions={[{ label: "Anular", icon: Ban, destructive: true, onSelect: () => setVoiding(row) }]} /> : null,
      className: "w-12 text-right",
    },
  ];

  const payoutColumns: Column<Payout>[] = [
    { key: "date", header: "Pagado el", cell: (row) => dayLabel(row.paid_on), className: "whitespace-nowrap" },
    { key: "amount", header: "Monto", cell: (row) => <span className="font-medium tabular-nums">{formatAmount(row.amount)}</span>, className: "text-right whitespace-nowrap" },
    { key: "count", header: "Comisiones", cell: (row) => <span className="tabular-nums">{formatCount(row.commissions)}</span>, className: "text-right" },
    { key: "note", header: "Cómo se pagó", cell: (row) => <span className="whitespace-normal">{row.note || "—"}</span>, className: "min-w-48" },
    {
      key: "by",
      header: "Registrado",
      cell: (row) => (
        <span className="grid leading-tight">
          <span>{row.created_by ?? "—"}</span>
          <span className="text-xs text-muted-foreground">{formatDateTime(row.created_at)}</span>
        </span>
      ),
      className: "whitespace-nowrap",
    },
    {
      key: "actions",
      header: <span className="sr-only">Acciones</span>,
      cell: (row) => <RowMenu label={`el pago del ${dayLabel(row.paid_on)}`} actions={[{ label: "Deshacer", icon: Undo2, destructive: true, onSelect: () => setUndoing(row) }]} />,
      className: "w-12 text-right",
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <BackButton fallback="/partners" />

      <PageHeader
        title={name}
        description={
          <>
            {partner.email}
            {partner.phone ? ` · ${partner.phone}` : ""} · Aliado desde el {formatLongDate(partner.created_at)}
          </>
        }
        actions={
          <>
            <Button variant="outline" onClick={() => setEditOpen(true)}>
              <Pencil /> Editar
            </Button>
            <Button onClick={() => setPayOpen(true)} disabled={pending.length === 0}>
              <HandCoins /> Registrar pago
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button ref={menuTrigger} variant="outline" size="icon" aria-label="Más acciones" className="data-[state=open]:bg-muted">
                  <Ellipsis />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-52" onCloseAutoFocus={(event) => returnFocusIfLost(event, menuTrigger.current)}>
                <ActionsLabel />
                <ActionItem icon={Plus} label="Comisión a mano" onSelect={() => setManualOpen(true)} />
                <ActionItem
                  icon={Send}
                  label="Reenviar invitación"
                  onSelect={() => invite.mutate()}
                  disabledReason={!partner.invitation_pending ? "Ya creó su contraseña." : !partner.is_active ? "Actívalo primero." : undefined}
                />
                {partner.is_active ? (
                  <ActionItem icon={PowerOff} label="Desactivar" destructive onSelect={() => setToggle("deactivate")} />
                ) : (
                  <ActionItem icon={Power} label="Activar" onSelect={() => setToggle("activate")} />
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        }
      >
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <Badge variant="outline" className={cn(CHIP_PLAIN, "font-mono")}>
            {partner.code}
          </Badge>
          <Badge variant="outline" className={active.style}>
            {active.label}
          </Badge>
          <Badge variant="outline" className={CHIP_PLAIN}>
            {partner.commission.own ? "Comisión propia" : "Comisión general"}
          </Badge>
          {partner.invitation_pending ? (
            <Badge variant="outline" className={cn(CHIP_PLAIN, "text-amber-800")}>
              Invitación pendiente
            </Badge>
          ) : null}
        </div>
      </PageHeader>

      {!partner.is_active ? (
        <Alert variant="warning">
          <CircleAlert />
          <AlertTitle>Este aliado está desactivado.</AlertTitle>
          <AlertDescription>
            No entra a su panel, su código no trae negocios y no gana comisiones nuevas. Lo que tiene por cobrar se le
            puede pagar igual.
          </AlertDescription>
        </Alert>
      ) : partner.invitation_pending ? (
        <Alert variant="info">
          <CircleAlert />
          <AlertDescription className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
            <span>Todavía no creó su contraseña. El enlace del correo vence a los 7 días y sirve una sola vez.</span>
            <Button variant="outline" size="sm" onClick={() => invite.mutate()} disabled={invite.isPending}>
              <Send /> Reenviar invitación
            </Button>
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatCard
          title="Negocios"
          hint="Los negocios que se registraron con su enlace o su código, o que se le asignaron."
          value={formatCount(partner.businesses)}
          detail={`${formatCount(stateCount("trial"))} en prueba · ${formatCount(stateCount("expired"))} ${stateCount("expired") === 1 ? "vencido" : "vencidos"}`}
        />
        <StatCard title="Pagando" hint="Sus negocios con un plan pagado vigente." value={formatCount(partner.paying)} />
        <StatCard
          title="Por pagar"
          hint="Lo que ganó y todavía no se le pagó."
          value={formatAmount(partner.pending)}
          detail={`${formatCount(pending.length)} ${pending.length === 1 ? "comisión" : "comisiones"}`}
        />
        <StatCard
          title="Pagado"
          value={formatAmount(partner.paid)}
          detail={`${formatCount(partner.payouts.length)} ${partner.payouts.length === 1 ? "pago" : "pagos"}`}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <PanelCard title="Su enlace y su comisión">
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
            <Fact label="Enlace para compartir" className="col-span-2">
              <span className="flex flex-wrap items-center gap-2">
                <a href={partner.link} target="_blank" rel="noreferrer" className="break-all underline-offset-2 hover:underline">
                  {partner.link}
                </a>
                <CopyButton text={partner.link} subject="el enlace del aliado" />
              </span>
            </Fact>
            <Fact label="Código">
              <span className="inline-flex items-center gap-2">
                <span className="font-mono font-medium">{partner.code}</span>
                <CopyButton text={partner.code} subject={`el código ${partner.code}`} />
              </span>
            </Fact>
            <Fact label="Último acceso a su panel">{formatDateTime(partner.last_login)}</Fact>
            <Fact label="Comisión" className="col-span-2">
              {dealLabel(partner.commission)}
              <span className="text-muted-foreground"> · {partner.commission.own ? "propia" : "la general"}</span>
            </Fact>
            <Fact label="Nota interna" className="col-span-2">
              {partner.note || "—"}
            </Fact>
          </dl>
        </PanelCard>

        <PanelCard title="Datos para pagarle" hint="Los carga el aliado en su panel, en «Mi cuenta».">
          <PayoutDetailsFacts partner={partner} />
        </PanelCard>
      </div>

      <Tabs value={view.tab} onValueChange={(tab) => setView({ tab })} className="gap-4">
        <TabsList className="w-full sm:w-fit">
          <TabsTrigger value="businesses">Negocios ({formatCount(partner.referrals.length)})</TabsTrigger>
          <TabsTrigger value="commissions">Comisiones ({formatCount(partner.commissions.length)})</TabsTrigger>
          <TabsTrigger value="payouts">Pagos ({formatCount(partner.payouts.length)})</TabsTrigger>
        </TabsList>

        <TabsContent value="businesses" className="flex flex-col gap-3">
          {partner.referrals.length ? (
            <Button asChild variant="ghost" size="sm" className="-mt-1 self-end text-muted-foreground">
              <Link href={`/businesses?partner=${partner.id}`}>
                Verlos en Negocios <ArrowRight />
              </Link>
            </Button>
          ) : null}
          <DataTable
            columns={referralColumns}
            rows={partner.referrals}
            rowKey={(row) => row.id}
            rowHref={(row) => `/businesses/${row.business_id}`}
            card={(row) => <ReferralCard referral={row} />}
            noun="negocios"
            emptyTitle="Todavía no trajo negocios"
            emptyMessage="Aparecen aquí cuando uno se registra con su enlace o su código, o cuando le asignas uno desde la ficha del negocio."
          />
        </TabsContent>

        <TabsContent value="commissions" className="flex flex-col gap-3">
          <Tabs value={view.status} onValueChange={(status) => setView({ status })}>
            <TabsList variant="chips" aria-label="Filtrar por estado">
              {STATUS_TABS.map((item) => (
                <TabsTrigger key={item.value} value={item.value}>
                  {item.label}
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {formatCount(item.value ? partner.commissions.filter((commission) => commission.status === item.value).length : partner.commissions.length)}
                  </span>
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          <DataTable
            columns={commissionColumns}
            rows={shownCommissions}
            rowKey={(row) => row.id}
            card={(row) => <CommissionCard commission={row} onVoid={() => setVoiding(row)} />}
            noun="comisiones"
            emptyTitle={view.status ? "No hay comisiones así" : "Todavía no ganó comisiones"}
            emptyMessage={
              view.status
                ? "Prueba con otro estado."
                : "Gana una cada vez que un negocio suyo paga su plan. También puedes agregar una a mano."
            }
          />
        </TabsContent>

        <TabsContent value="payouts">
          <DataTable
            columns={payoutColumns}
            rows={payouts}
            rowKey={(row) => row.id}
            card={(row) => <PayoutCard payout={row} onUndo={() => setUndoing(row)} />}
            noun="pagos"
            emptyTitle="Todavía no se le pagó"
            emptyMessage="Registra un pago cuando le transfieras lo que tiene por cobrar."
          />
        </TabsContent>
      </Tabs>

      {editOpen ? <PartnerDialog partner={partner} open onOpenChange={setEditOpen} /> : null}
      {payOpen ? <PayoutDialog partner={partner} open onOpenChange={setPayOpen} /> : null}
      {manualOpen ? <CommissionDialog partner={partner} open onOpenChange={setManualOpen} /> : null}
      {voiding ? <VoidDialog partnerId={partner.id} commission={voiding} open onOpenChange={(open) => !open && setVoiding(null)} /> : null}

      <ConfirmDialog
        open={undoing !== null}
        onOpenChange={(open) => !open && setUndoing(null)}
        title={`¿Deshacer el pago de ${formatAmount(undoing?.amount)}?`}
        description={`Para un pago registrado por error: sus ${formatCount(undoing?.commissions)} comisiones vuelven a estar por cobrar y el pago deja de verse en el panel del aliado. No devuelve ninguna transferencia.`}
        confirmLabel="Deshacer pago"
        onConfirm={() => undoing && undo.mutate(undoing.id)}
      />
      <ConfirmDialog
        open={toggle !== null}
        onOpenChange={(open) => !open && setToggle(null)}
        title={toggle === "activate" ? `¿Activar a ${name}?` : `¿Desactivar a ${name}?`}
        description={
          toggle === "activate"
            ? "Vuelve a entrar a su panel, su código vuelve a traer negocios y gana comisiones desde el próximo pago de sus negocios."
            : "No podrá entrar a su panel, su código deja de traer negocios y no gana comisiones nuevas; se cierra en todos sus dispositivos. Lo que tiene por cobrar se le puede pagar igual."
        }
        confirmLabel={toggle === "activate" ? "Activar" : "Desactivar"}
        confirmVariant={toggle === "activate" ? "default" : "destructive"}
        onConfirm={confirmToggle}
      />
    </div>
  );
}

/** Where the ally gets paid, with when it last changed: a recent change is worth a word with them before paying. */
function PayoutDetailsFacts({ partner }: { partner: PartnerData }) {
  const details = partner.payout_details;
  const empty = !Object.values(details).some(Boolean) && !partner.payout_qr;
  if (empty) {
    return <p className="text-sm text-muted-foreground">Todavía no dejó sus datos para cobrar. Los carga en su panel de aliado, en «Mi cuenta».</p>;
  }
  return (
    <div className="flex flex-col gap-3">
      <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
        <Fact label="Banco">{details.bank || "—"}</Fact>
        <Fact label="Número de cuenta">
          {details.account ? (
            <span className="inline-flex flex-wrap items-center gap-2">
              <span className="tabular-nums">{details.account}</span>
              <CopyButton text={details.account} subject="el número de cuenta" />
            </span>
          ) : (
            "—"
          )}
        </Fact>
        <Fact label="Titular">{details.holder || "—"}</Fact>
        <Fact label="CI o NIT">{details.document || "—"}</Fact>
        {details.note ? (
          <Fact label="Nota" className="col-span-2">
            {details.note}
          </Fact>
        ) : null}
      </dl>
      {partner.payout_qr ? (
        <a href={partner.payout_qr} target="_blank" rel="noreferrer" className="w-fit rounded-lg outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40">
          {/* A bucket's address, unknown when building: next/image would need it listed */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={partner.payout_qr} alt={`QR de la cuenta de ${personName(partner)}`} className="size-40 rounded-lg border border-border bg-white object-contain" />
        </a>
      ) : null}
      {partner.payout_updated_at ? (
        <p className={cn("text-xs", recentlyChanged(partner.payout_updated_at) ? "font-medium text-amber-800" : "text-muted-foreground")}>
          Cambiados el {formatDateTime(partner.payout_updated_at)}
          {recentlyChanged(partner.payout_updated_at) ? ": hace poco, confírmalos con el aliado antes de pagar." : "."}
        </p>
      ) : null}
    </div>
  );
}

/** "Plan Pro hasta 12 nov 2026", "Prueba hasta …", "Venció el …": where the business's plan is. */
function planLine(referral: Referral): string {
  if (referral.state === "deleted") return "Su dueño lo eliminó";
  if (!referral.ends_at) return referral.plan_name;
  if (referral.state === "expired") return `${referral.plan_name} · venció el ${formatDate(referral.ends_at)}`;
  return `${referral.plan_name} · hasta el ${formatDate(referral.ends_at)}`;
}

function ReferralChip({ referral }: { referral: Referral }) {
  const state = referralStates[referral.state];
  return (
    <Badge variant="outline" className={state.style}>
      {state.label}
    </Badge>
  );
}

const referralColumns: Column<Referral>[] = [
  {
    key: "business",
    header: "Negocio",
    cell: (row) => (
      <span className="grid min-w-0 leading-tight">
        <Link href={`/businesses/${row.business_id}`} className="truncate font-medium hover:underline">
          {row.business || `Negocio #${row.business_id}`}
        </Link>
        <span className="truncate text-xs text-muted-foreground">
          Desde el {formatDate(row.referred_at)} · {referralSources[row.source]}
        </span>
      </span>
    ),
    className: "min-w-56",
  },
  { key: "state", header: "Estado", cell: (row) => <ReferralChip referral={row} /> },
  { key: "plan", header: "Plan", cell: (row) => <span className="whitespace-normal">{planLine(row)}</span>, className: "min-w-48" },
  { key: "months", header: "Meses con comisión", cell: (row) => <span className="tabular-nums">{countedLabel(row.months_counted, row.months)}</span> },
  { key: "earned", header: "Ganado", cell: (row) => <span className="font-medium tabular-nums">{formatAmount(row.earned)}</span>, className: "text-right whitespace-nowrap" },
];

function ReferralCard({ referral }: { referral: Referral }) {
  return (
    <div className="flex flex-col gap-1.5 text-sm">
      <div className="flex items-start justify-between gap-3">
        <Link href={`/businesses/${referral.business_id}`} className="min-w-0 truncate font-medium hover:underline">
          {referral.business || `Negocio #${referral.business_id}`}
        </Link>
        <ReferralChip referral={referral} />
      </div>
      <p className="text-muted-foreground">{planLine(referral)}</p>
      <p className="flex justify-between gap-3 text-muted-foreground tabular-nums">
        <span>{countedLabel(referral.months_counted, referral.months)} con comisión</span>
        <span className="font-medium text-foreground">{formatAmount(referral.earned)}</span>
      </p>
      <p className="text-xs text-muted-foreground">
        Desde el {formatDate(referral.referred_at)} · {referralSources[referral.source]}
      </p>
    </div>
  );
}

/** Its state, and under it when it was paid or why it was voided. */
function CommissionState({ commission }: { commission: Commission }) {
  const status = commissionStatuses[commission.status];
  return (
    <span className="grid justify-items-start gap-0.5">
      <Badge variant="outline" className={status.style}>
        {status.label}
      </Badge>
      {commission.status === "paid" && commission.paid_on ? (
        <span className="text-xs text-muted-foreground">el {dayLabel(commission.paid_on)}</span>
      ) : null}
      {commission.status === "void" && commission.void_reason ? (
        <span className="max-w-56 text-xs whitespace-normal text-muted-foreground">{commission.void_reason}</span>
      ) : null}
    </span>
  );
}

function CommissionCard({ commission, onVoid }: { commission: Commission; onVoid: () => void }) {
  return (
    <div className="flex flex-col gap-1.5 text-sm">
      <div className="flex items-start justify-between gap-3">
        <span className="grid min-w-0 leading-tight">
          <span className="truncate font-medium">{commission.business || "Sin negocio"}</span>
          <span className="text-xs text-muted-foreground">{formatDate(commission.created_at)}</span>
        </span>
        <span className="shrink-0 font-semibold tabular-nums">{formatAmount(commission.amount)}</span>
      </div>
      <p className="text-muted-foreground">
        {commissionConcept(commission)}
        {commission.created_by ? ` · por ${commission.created_by}` : ""}
      </p>
      <div className="flex items-end justify-between gap-3">
        <CommissionState commission={commission} />
        {commission.status === "pending" ? (
          <Button variant="ghost" size="sm" className="-mr-2 text-muted-foreground hover:text-red-700" onClick={onVoid}>
            <Ban /> Anular
          </Button>
        ) : null}
      </div>
    </div>
  );
}

function PayoutCard({ payout, onUndo }: { payout: Payout; onUndo: () => void }) {
  return (
    <div className="flex flex-col gap-1.5 text-sm">
      <div className="flex items-start justify-between gap-3">
        <span className="font-medium">{dayLabel(payout.paid_on)}</span>
        <span className="shrink-0 font-semibold tabular-nums">{formatAmount(payout.amount)}</span>
      </div>
      <p className="text-muted-foreground">
        {formatCount(payout.commissions)} {payout.commissions === 1 ? "comisión" : "comisiones"}
        {payout.note ? ` · ${payout.note}` : ""}
      </p>
      <div className="flex items-end justify-between gap-3">
        <span className="text-xs text-muted-foreground">
          {payout.created_by ? `Por ${payout.created_by}, ` : ""}
          {formatDateTime(payout.created_at)}
        </span>
        <Button variant="ghost" size="sm" className="-mr-2 text-muted-foreground hover:text-red-700" onClick={onUndo}>
          <Undo2 /> Deshacer
        </Button>
      </div>
    </div>
  );
}

export { PartnerDetail };
