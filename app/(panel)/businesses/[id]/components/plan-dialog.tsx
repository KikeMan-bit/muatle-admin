"use client";

import * as React from "react";
import { Check, LoaderCircle } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { fieldError, usePlans, useSetBusinessPlan } from "@/hooks/use-admin";
import type { BusinessDetail } from "@/lib/admin-api";
import { errorMessage } from "@/lib/api";
import { planName } from "@/lib/plans";
import { cn, dayKey, formatBs, todayKey } from "@/lib/utils";

/** "2026-11-10" plus some days, with no time zone in the way. */
function addDays(key: string, days: number): string {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day + days)).toISOString().slice(0, 10);
}

/**
 * "Cambiar plan": the plan contracted and the day it is paid until, or the
 * trial with the day it ends. What Carlos does once a payment is confirmed.
 */
function PlanDialog({ business, open, onOpenChange }: { business: BusinessDetail; open: boolean; onOpenChange: (open: boolean) => void }) {
  const plans = usePlans();
  const { subscription } = business;
  const today = todayKey();
  const [plan, setPlan] = React.useState(subscription.plan);
  // The paid day defaults to a month from today, or to what it is; the trial's, to what it is or ten days on
  const [paidUntil, setPaidUntil] = React.useState(
    subscription.plan !== "trial" && subscription.paid_until ? dayKey(subscription.paid_until) : addDays(today, 30),
  );
  const [trialEndsAt, setTrialEndsAt] = React.useState(subscription.trial_ends_at ? dayKey(subscription.trial_ends_at) : addDays(today, 10));
  const [localError, setLocalError] = React.useState<string | null>(null);

  const change = useSetBusinessPlan(business.id, { onSuccess: () => onOpenChange(false) });
  const trial = plan === "trial";

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    if (!trial && !paidUntil) {
      setLocalError("Pon hasta cuándo está pagado el plan.");
      return;
    }
    if (trial && !trialEndsAt) {
      setLocalError("Pon el día en que termina la prueba.");
      return;
    }
    change.mutate(trial ? { plan, trial_ends_at: trialEndsAt } : { plan, paid_until: paidUntil });
  };

  const dateError = localError ?? fieldError(change.error, trial ? "trial_ends_at" : "paid_until");

  return (
    <Dialog open={open} onOpenChange={(next) => !change.isPending && onOpenChange(next)}>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={submit} noValidate className="flex flex-col gap-5">
          <DialogHeader>
            <DialogTitle>Cambiar el plan de {business.name}</DialogTitle>
            <DialogDescription>
              Elige el plan contratado y hasta cuándo está pagado. El panel del negocio lo lee al instante.
            </DialogDescription>
          </DialogHeader>

          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1 text-[15px] font-medium">Plan</legend>
            {(plans.data ?? []).map((option) => {
              const selected = option.id === plan;
              return (
                <label
                  key={option.id}
                  className={cn(
                    "flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 text-sm transition-colors",
                    selected ? "border-primary bg-primary/4" : "border-border hover:bg-muted",
                  )}
                >
                  <input type="radio" name="plan" value={option.id} checked={selected} onChange={() => setPlan(option.id)} className="sr-only" />
                  <span className={cn("flex size-4 items-center justify-center rounded-full border", selected ? "border-primary bg-primary text-primary-foreground" : "border-input")}>
                    {selected ? <Check className="size-3" /> : null}
                  </span>
                  <span className="flex-1 font-medium">{option.name}</span>
                  <span className="text-muted-foreground tabular-nums">{option.price ? `${formatBs(option.price)} / mes` : "Gratis"}</span>
                  {option.id === subscription.plan ? <span className="text-xs text-muted-foreground">Actual</span> : null}
                </label>
              );
            })}
            {plans.isPending ? <p className="text-sm text-muted-foreground">Cargando los planes…</p> : null}
            {plans.isError ? <p className="text-sm text-red-700">{errorMessage(plans.error)}</p> : null}
          </fieldset>

          {trial ? (
            <Field htmlFor="trial_ends_at" label="La prueba termina el" hint="Ese día, al empezar, la prueba se da por terminada: el negocio tiene 3 días de gracia para elegir un plan.">
              <Input id="trial_ends_at" type="date" value={trialEndsAt} min={today} onChange={(e) => setTrialEndsAt(e.target.value)} aria-invalid={!!dateError} aria-describedby={dateError ? "plan-date-error" : undefined} className="h-10 w-56" />
              <FieldError id="plan-date-error">{dateError}</FieldError>
            </Field>
          ) : (
            <Field htmlFor="paid_until" label="Pagado hasta el" hint={`Ese día, al empezar, el ${planName(plan)} vence: el panel dirá "Vence el …" y el negocio tendrá 3 días de gracia para renovar.`}>
              <Input id="paid_until" type="date" value={paidUntil} min={today} onChange={(e) => setPaidUntil(e.target.value)} aria-invalid={!!dateError} aria-describedby={dateError ? "plan-date-error" : undefined} className="h-10 w-56" />
              <FieldError id="plan-date-error">{dateError}</FieldError>
            </Field>
          )}

          {change.isError && !dateError ? (
            <Alert variant="destructive">
              <AlertDescription>{errorMessage(change.error)}</AlertDescription>
            </Alert>
          ) : null}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={change.isPending}>
              Cancelar
            </Button>
            <Button type="submit" disabled={change.isPending || plans.isPending}>
              {change.isPending ? <LoaderCircle className="animate-spin" /> : null}
              {trial ? "Guardar prueba" : `Activar ${planName(plan)}`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export { PlanDialog };
