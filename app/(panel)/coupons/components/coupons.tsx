"use client";

import * as React from "react";
import { Check, LoaderCircle, Pencil, Plus } from "lucide-react";

import { DataTable, type Column } from "@/components/data-table";
import { PageHeader } from "@/components/page-header";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { CopyButton } from "@/components/ui/copy-button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { fieldError, useCoupons, useCreateCoupon, useUpdateCoupon } from "@/hooks/use-admin";
import type { Coupon, CouponInput, CouponKind } from "@/lib/admin-api";
import { errorMessage } from "@/lib/api";
import { planName } from "@/lib/plans";
import { cn, formatBs, formatCount, formatDate, todayKey } from "@/lib/utils";

// The plans and the ways of paying a coupon can be held to, as business/plans.py has them
const PLANS = ["basic", "pro", "prime"] as const;
const BILLINGS = [
  { id: "monthly", name: "Pago mensual" },
  { id: "yearly", name: "Pago anual" },
] as const;

type BillingId = (typeof BILLINGS)[number]["id"];

/** "30%" or "50 Bs": what the coupon takes off. */
function discountLabel(coupon: Pick<Coupon, "kind" | "value">): string {
  const value = Number(coupon.value);
  return coupon.kind === "percent" ? `${value.toLocaleString("es-BO")}%` : formatBs(value);
}

/** "Plan Pro · Pago anual", or "Todos los planes": what it is good for. */
function scopeLabel(coupon: Coupon): string {
  const plans = coupon.plans.length ? coupon.plans.map(planName).join(", ") : "Todos los planes";
  const billing = coupon.billings.length === 1 ? BILLINGS.find((b) => b.id === coupon.billings[0])?.name : null;
  return billing ? `${plans} · ${billing}` : plans;
}

/** "31 oct 2026": a day as the backend keeps it ("2026-10-31"), read at noon so no clock moves it. */
function dayLabel(key: string): string {
  return formatDate(`${key}T16:00:00Z`);
}

/** Why a coupon switched on still takes nothing: past its day, or out of uses. */
function spentLabel(coupon: Coupon): string | null {
  if (coupon.expires_on !== null && coupon.expires_on < todayKey()) return "Vencido";
  if (coupon.max_uses !== null && coupon.uses >= coupon.max_uses) return "Agotado";
  return null;
}

/**
 * "Cupones": the discounts an owner can type at the panel's checkout. Each
 * takes a percentage or bolivianos off, may be held to some plans or a way of
 * paying, end on a day, or run out after so many payments. Switched off
 * rather than deleted, since the payments made with it point at it.
 */
function Coupons() {
  const { data, isPending, error, refetch } = useCoupons();
  const update = useUpdateCoupon();
  const [adding, setAdding] = React.useState(false);
  // A new key each time the dialog opens: it starts from an empty form while the last one animates out
  const [addKey, setAddKey] = React.useState(0);
  const [editing, setEditing] = React.useState<Coupon | null>(null);
  const startAdding = () => {
    setAddKey((key) => key + 1);
    setAdding(true);
  };

  const columns: Column<Coupon>[] = [
    {
      key: "code",
      header: "Código",
      cell: (row) => (
        <span className="inline-flex items-center gap-1">
          <span className="font-mono text-sm font-medium">{row.code}</span>
          <CopyButton text={row.code} subject={`el cupón ${row.code}`} />
        </span>
      ),
    },
    { key: "discount", header: "Descuento", cell: (row) => <span className="font-medium tabular-nums">{discountLabel(row)}</span> },
    {
      key: "scope",
      header: "Vale para",
      cell: (row) => (
        <span className="flex flex-col">
          <span>{scopeLabel(row)}</span>
          {row.once_per_business ? <span className="text-xs text-muted-foreground">Una vez por negocio</span> : null}
        </span>
      ),
    },
    { key: "expires", header: "Vence", cell: (row) => (row.expires_on ? dayLabel(row.expires_on) : <span className="text-muted-foreground">Nunca</span>) },
    {
      key: "uses",
      header: "Usos",
      cell: (row) => (
        <span className="tabular-nums">
          {formatCount(row.uses)}
          {row.max_uses !== null ? <span className="text-muted-foreground"> de {formatCount(row.max_uses)}</span> : null}
        </span>
      ),
    },
    {
      key: "active",
      header: "Activo",
      cell: (row) => {
        const spent = spentLabel(row);
        return (
          <span className="inline-flex items-center gap-2">
            <Switch
              checked={row.is_active}
              disabled={update.isPending}
              onCheckedChange={(checked) => update.mutate({ id: row.id, is_active: checked })}
              aria-label={`Cupón ${row.code} activo`}
            />
            {row.is_active && spent ? <span className="text-xs text-muted-foreground">{spent}</span> : null}
          </span>
        );
      },
    },
    {
      key: "actions",
      header: <span className="sr-only">Acciones</span>,
      cell: (row) => (
        <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={() => setEditing(row)}>
          <Pencil /> Editar
        </Button>
      ),
      className: "text-right",
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Cupones"
        description="Descuentos que el dueño de un negocio escribe al pagar su plan. Un uso es un pago completado: un QR generado y nunca pagado no gasta ninguno."
      />
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm text-muted-foreground">Se suman al 20% del pago anual. Uno del 100% activa el plan sin pasar por el banco.</p>
          <Button size="sm" onClick={startAdding}>
            <Plus /> Crear cupón
          </Button>
        </div>
        <DataTable
          columns={columns}
          rows={data ?? []}
          rowKey={(row) => row.id}
          isLoading={isPending}
          error={error}
          onRetry={() => refetch()}
          noun="cupones"
          emptyTitle="Todavía no hay cupones"
          emptyMessage="Crea uno para regalar meses o hacer una promoción."
        />
      </section>
      <CouponDialog key={addKey} open={adding} onOpenChange={setAdding} />
      {editing ? <CouponDialog key={editing.id} coupon={editing} open onOpenChange={(open) => !open && setEditing(null)} /> : null}
    </div>
  );
}

/** Make a coupon, or change one; its code only while making it. */
function CouponDialog({ coupon, open, onOpenChange }: { coupon?: Coupon; open: boolean; onOpenChange: (open: boolean) => void }) {
  const [code, setCode] = React.useState(coupon?.code ?? "");
  const [kind, setKind] = React.useState<CouponKind>(coupon?.kind ?? "percent");
  const [value, setValue] = React.useState(coupon ? String(Number(coupon.value)) : "");
  const [plans, setPlans] = React.useState<string[]>(coupon?.plans ?? []);
  const [billings, setBillings] = React.useState<BillingId[]>(coupon?.billings ?? []);
  const [expiresOn, setExpiresOn] = React.useState(coupon?.expires_on ?? "");
  const [maxUses, setMaxUses] = React.useState(coupon?.max_uses ? String(coupon.max_uses) : "");
  const [oncePerBusiness, setOncePerBusiness] = React.useState(coupon?.once_per_business ?? true);
  const [note, setNote] = React.useState(coupon?.note ?? "");
  const [localError, setLocalError] = React.useState<string | null>(null);
  const create = useCreateCoupon({ onSuccess: () => onOpenChange(false) });
  const update = useUpdateCoupon({ onSuccess: () => onOpenChange(false) });
  const mutation = coupon ? update : create;

  const toggle = <T extends string>(list: T[], item: T, on: boolean) => (on ? [...list, item] : list.filter((x) => x !== item));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim()) {
      setLocalError("Escribe el descuento.");
      return;
    }
    setLocalError(null);
    const input: CouponInput = {
      kind,
      value: value.trim().replace(",", "."),
      plans,
      billings,
      expires_on: expiresOn || null,
      max_uses: maxUses ? Number(maxUses) : null,
      once_per_business: oncePerBusiness,
      note: note.trim(),
    };
    if (coupon) update.mutate({ id: coupon.id, ...input });
    else create.mutate({ ...input, code: code.trim() });
  };

  const errors = {
    code: fieldError(mutation.error, "code"),
    value: localError ?? fieldError(mutation.error, "value"),
    plans: fieldError(mutation.error, "plans"),
    billings: fieldError(mutation.error, "billings"),
    expires: fieldError(mutation.error, "expires_on"),
    maxUses: fieldError(mutation.error, "max_uses"),
  };
  const anyFieldError = Object.values(errors).some(Boolean);

  return (
    <Dialog open={open} onOpenChange={(next) => !mutation.isPending && onOpenChange(next)}>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-lg">
        <form onSubmit={submit} noValidate className="flex flex-col gap-5">
          <DialogHeader>
            <DialogTitle>{coupon ? `Editar el cupón ${coupon.code}` : "Crear cupón"}</DialogTitle>
            <DialogDescription>
              {coupon
                ? "Los cambios valen para los pagos que vengan; los ya hechos guardan su descuento."
                : "El dueño lo escribe al pagar su plan, en la pantalla de pago del panel."}
            </DialogDescription>
          </DialogHeader>

          {coupon ? null : (
            <Field htmlFor="coupon-code" label="Código" hint="Déjalo vacío y Muatle genera uno, como 7KQ2M9XA.">
              <Input
                id="coupon-code"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="Ej. FERIA30"
                maxLength={30}
                autoComplete="off"
                className="font-mono uppercase"
                aria-invalid={!!errors.code}
                aria-describedby={errors.code ? "coupon-code-error" : undefined}
              />
              <FieldError id="coupon-code-error">{errors.code}</FieldError>
            </Field>
          )}

          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1 text-[15px] font-medium">Descuento</legend>
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  { id: "percent", name: "Porcentaje" },
                  { id: "amount", name: "Monto fijo (Bs)" },
                ] as const
              ).map((option) => {
                const selected = option.id === kind;
                return (
                  <label
                    key={option.id}
                    className={cn(
                      "flex cursor-pointer items-center gap-2.5 rounded-lg border px-3 py-2.5 text-sm transition-colors has-focus-visible:ring-[3px] has-focus-visible:ring-ring/40",
                      selected ? "border-primary bg-primary/4" : "border-border hover:bg-muted",
                    )}
                  >
                    <input type="radio" name="coupon-kind" value={option.id} checked={selected} onChange={() => setKind(option.id)} className="sr-only" />
                    <span className={cn("flex size-4 items-center justify-center rounded-full border", selected ? "border-primary bg-primary text-primary-foreground" : "border-input")}>
                      {selected ? <Check className="size-3" /> : null}
                    </span>
                    <span className="font-medium">{option.name}</span>
                  </label>
                );
              })}
            </div>
            <div className="flex items-center gap-2">
              <Input
                id="coupon-value"
                inputMode="decimal"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={kind === "percent" ? "30" : "50"}
                className="h-10 w-32 tabular-nums"
                aria-label={kind === "percent" ? "Porcentaje de descuento" : "Bolivianos de descuento"}
                aria-invalid={!!errors.value}
                aria-describedby={errors.value ? "coupon-value-error" : undefined}
              />
              <span className="text-sm text-muted-foreground">{kind === "percent" ? "% del total" : "Bs del total"}</span>
            </div>
            <FieldError id="coupon-value-error">{errors.value}</FieldError>
          </fieldset>

          <div className="grid gap-5 sm:grid-cols-2">
            <fieldset className="flex flex-col gap-2">
              <legend className="mb-1 text-[15px] font-medium">Planes</legend>
              {PLANS.map((id) => (
                <div key={id} className="flex items-center gap-2">
                  <Checkbox id={`coupon-plan-${id}`} checked={plans.includes(id)} onCheckedChange={(on) => setPlans(toggle(plans, id, on === true))} />
                  <Label htmlFor={`coupon-plan-${id}`} className="font-normal">
                    {planName(id)}
                  </Label>
                </div>
              ))}
              <p className="text-xs text-muted-foreground">Sin marcar ninguno, vale para todos.</p>
              <FieldError id="coupon-plans-error">{errors.plans}</FieldError>
            </fieldset>
            <fieldset className="flex flex-col gap-2">
              <legend className="mb-1 text-[15px] font-medium">Forma de pago</legend>
              {BILLINGS.map((billing) => (
                <div key={billing.id} className="flex items-center gap-2">
                  <Checkbox
                    id={`coupon-billing-${billing.id}`}
                    checked={billings.includes(billing.id)}
                    onCheckedChange={(on) => setBillings(toggle(billings, billing.id, on === true))}
                  />
                  <Label htmlFor={`coupon-billing-${billing.id}`} className="font-normal">
                    {billing.name}
                  </Label>
                </div>
              ))}
              <p className="text-xs text-muted-foreground">Sin marcar ninguna, vale para las dos.</p>
              <FieldError id="coupon-billings-error">{errors.billings}</FieldError>
            </fieldset>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field htmlFor="coupon-expires" label="Vence el" hint="Vale hasta el final de ese día. Vacío, no vence.">
              <Input
                id="coupon-expires"
                type="date"
                value={expiresOn}
                min={coupon ? undefined : todayKey()}
                onChange={(e) => setExpiresOn(e.target.value)}
                className="h-10"
                aria-invalid={!!errors.expires}
                aria-describedby={errors.expires ? "coupon-expires-error" : undefined}
              />
              <FieldError id="coupon-expires-error">{errors.expires}</FieldError>
            </Field>
            <Field htmlFor="coupon-max-uses" label="Máximo de usos" hint="Entre todos los negocios. Vacío, sin límite.">
              <Input
                id="coupon-max-uses"
                type="number"
                inputMode="numeric"
                min={1}
                value={maxUses}
                onChange={(e) => setMaxUses(e.target.value)}
                className="h-10 tabular-nums"
                aria-invalid={!!errors.maxUses}
                aria-describedby={errors.maxUses ? "coupon-max-uses-error" : undefined}
              />
              <FieldError id="coupon-max-uses-error">{errors.maxUses}</FieldError>
            </Field>
          </div>

          <div className="flex items-center justify-between gap-4 rounded-lg border border-border px-3 py-2.5">
            <Label htmlFor="coupon-once" className="flex flex-col items-start gap-0.5">
              <span>Una vez por negocio</span>
              <span className="text-xs font-normal text-muted-foreground">Cada negocio lo puede usar en un solo pago.</span>
            </Label>
            <Switch id="coupon-once" checked={oncePerBusiness} onCheckedChange={setOncePerBusiness} />
          </div>

          <Field htmlFor="coupon-note" label="Nota interna" hint="Para qué es; solo la ve el equipo.">
            <Input id="coupon-note" value={note} onChange={(e) => setNote(e.target.value)} maxLength={200} placeholder="Ej. Feria gastronómica de octubre" />
          </Field>

          {mutation.isError && !anyFieldError ? (
            <Alert variant="destructive">
              <AlertDescription>{errorMessage(mutation.error)}</AlertDescription>
            </Alert>
          ) : null}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={mutation.isPending}>
              Cancelar
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? <LoaderCircle className="animate-spin" /> : null}
              {coupon ? "Guardar cambios" : "Crear cupón"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export { Coupons };
