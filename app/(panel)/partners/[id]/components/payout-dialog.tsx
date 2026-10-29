"use client";

import * as React from "react";
import { CircleAlert, LoaderCircle } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { fieldError, usePayPartner } from "@/hooks/use-admin";
import type { Commission, PartnerDetail } from "@/lib/admin-api";
import { errorMessage } from "@/lib/api";
import { formatAmount, formatDate, personName, todayKey } from "@/lib/utils";

import { commissionConcept, recentlyChanged } from "./partner-facts";

/** The amounts' sum in cents, so no float drifts a cent away. */
function totalOf(commissions: Commission[]): number {
  return commissions.reduce((cents, commission) => cents + Math.round(Number(commission.amount) * 100), 0) / 100;
}

/**
 * "Registrar pago": the commissions Carlos transferred to the ally, picked
 * from the ones to collect (all of them at first), with the day it went out
 * and how. They turn "Pagada", and the ally sees the payout in their panel.
 */
function PayoutDialog({ partner, open, onOpenChange }: { partner: PartnerDetail; open: boolean; onOpenChange: (open: boolean) => void }) {
  const pending = partner.commissions.filter((commission) => commission.status === "pending");
  const [picked, setPicked] = React.useState<number[]>(() => pending.map((commission) => commission.id));
  const [paidOn, setPaidOn] = React.useState(todayKey);
  const [note, setNote] = React.useState("");
  const [localError, setLocalError] = React.useState<string | null>(null);
  const pay = usePayPartner(partner.id, { onSuccess: () => onOpenChange(false) });

  const chosen = pending.filter((commission) => picked.includes(commission.id));
  const total = totalOf(chosen);
  const allPicked = chosen.length === pending.length;
  const details = partner.payout_details;
  const hasDetails = Object.values(details).some(Boolean) || !!partner.payout_qr;

  const toggle = (id: number, on: boolean) => setPicked((prev) => (on ? [...prev, id] : prev.filter((x) => x !== id)));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (chosen.length === 0) {
      setLocalError("Elige al menos una comisión.");
      return;
    }
    if (!paidOn) {
      setLocalError("Pon el día del pago.");
      return;
    }
    setLocalError(null);
    // The ones on screen, by id: one that arrived meanwhile waits for the next payout
    pay.mutate({ paid_on: paidOn, note: note.trim(), commissions: chosen.map((commission) => commission.id) });
  };

  const dateError = fieldError(pay.error, "paid_on");
  const listError = localError ?? fieldError(pay.error, "commissions");

  return (
    <Dialog open={open} onOpenChange={(next) => !pay.isPending && onOpenChange(next)}>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-lg">
        <form onSubmit={submit} noValidate className="flex flex-col gap-5">
          <DialogHeader>
            <DialogTitle>Registrar pago a {personName(partner)}</DialogTitle>
            <DialogDescription>Marca como pagadas las comisiones que le transferiste. El aliado ve el pago en su panel.</DialogDescription>
          </DialogHeader>

          {recentlyChanged(partner.payout_updated_at) ? (
            <Alert variant="warning">
              <CircleAlert />
              <AlertDescription>
                Cambió sus datos para cobrar el {formatDate(partner.payout_updated_at)}. Confírmalos con el aliado antes de transferir.
              </AlertDescription>
            </Alert>
          ) : null}

          <div className="rounded-lg border border-border bg-muted/40 px-3 py-2.5 text-sm">
            <p className="text-xs text-muted-foreground">Dónde pagarle</p>
            {hasDetails ? (
              <p className="mt-0.5">
                {[details.bank, details.account, details.holder, details.document && `CI/NIT ${details.document}`].filter(Boolean).join(" · ") || "Solo dejó su QR."}
                {details.note ? <span className="block text-muted-foreground">{details.note}</span> : null}
                {partner.payout_qr ? <span className="block text-muted-foreground">Su QR está en la ficha, en «Datos para pagarle».</span> : null}
              </p>
            ) : (
              <p className="mt-0.5 text-muted-foreground">Todavía no dejó sus datos para cobrar. Pídeselos o que los cargue en su panel.</p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2">
              <p id="payout-commissions-title" className="text-[15px] font-medium">
                Comisiones por cobrar
              </p>
              <Button type="button" variant="link" size="sm" className="h-auto px-0" onClick={() => setPicked(allPicked ? [] : pending.map((commission) => commission.id))}>
                {allPicked ? "Quitar todas" : "Elegir todas"}
              </Button>
            </div>
            <ul aria-labelledby="payout-commissions-title" className="divide-y divide-border rounded-lg border border-border">
              {pending.map((commission) => {
                const id = `payout-commission-${commission.id}`;
                return (
                  <li key={commission.id} className="flex items-start gap-3 px-3 py-2.5">
                    <Checkbox id={id} checked={picked.includes(commission.id)} onCheckedChange={(on) => toggle(commission.id, on === true)} className="mt-0.5" />
                    <Label htmlFor={id} className="flex min-w-0 flex-1 cursor-pointer items-start justify-between gap-3 font-normal">
                      <span className="grid min-w-0 leading-tight">
                        <span className="truncate">{commission.business || "Sin negocio"}</span>
                        <span className="truncate text-xs text-muted-foreground">
                          {formatDate(commission.created_at)} · {commissionConcept(commission)}
                        </span>
                      </span>
                      <span className="shrink-0 font-medium tabular-nums">{formatAmount(commission.amount)}</span>
                    </Label>
                  </li>
                );
              })}
            </ul>
            <FieldError id="payout-commissions-error">{listError}</FieldError>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5">
            <span className="text-sm text-muted-foreground">
              {chosen.length} {chosen.length === 1 ? "comisión" : "comisiones"}
            </span>
            <span className="text-lg font-semibold tabular-nums">{formatAmount(total)}</span>
          </div>

          <div className="grid gap-4 sm:grid-cols-[auto_1fr]">
            <Field htmlFor="payout-paid-on" label="Día del pago">
              <Input
                id="payout-paid-on"
                type="date"
                value={paidOn}
                max={todayKey()}
                onChange={(e) => setPaidOn(e.target.value)}
                className="h-10 w-44"
                aria-invalid={!!dateError}
                aria-describedby={dateError ? "payout-paid-on-error" : undefined}
              />
              <FieldError id="payout-paid-on-error">{dateError}</FieldError>
            </Field>
            <Field htmlFor="payout-note" label="Cómo se pagó">
              <Input id="payout-note" value={note} onChange={(e) => setNote(e.target.value)} maxLength={200} placeholder="Ej. Transferencia BNB, comprobante 1234" />
            </Field>
          </div>

          {pay.isError && !dateError && !listError ? (
            <Alert variant="destructive">
              <AlertDescription>{errorMessage(pay.error)}</AlertDescription>
            </Alert>
          ) : null}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={pay.isPending}>
              Cancelar
            </Button>
            <Button type="submit" disabled={pay.isPending || chosen.length === 0}>
              {pay.isPending ? <LoaderCircle className="animate-spin" /> : null}
              Registrar pago de {formatAmount(total)}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export { PayoutDialog };
