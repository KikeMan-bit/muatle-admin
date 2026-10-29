"use client";

import * as React from "react";
import { LoaderCircle } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { fieldError, useAddCommission } from "@/hooks/use-admin";
import type { PartnerDetail } from "@/lib/admin-api";
import { errorMessage } from "@/lib/api";
import { personName } from "@/lib/utils";

/**
 * "Comisión a mano": a sum for the ally that is no share of a payment by QR,
 * such as a plan Carlos activated himself or a bonus. It is to collect with
 * the rest, and says why.
 */
function CommissionDialog({ partner, open, onOpenChange }: { partner: PartnerDetail; open: boolean; onOpenChange: (open: boolean) => void }) {
  const [amount, setAmount] = React.useState("");
  const [note, setNote] = React.useState("");
  const [business, setBusiness] = React.useState("");
  const [submitted, setSubmitted] = React.useState(false);
  const add = useAddCommission(partner.id, { onSuccess: () => onOpenChange(false) });

  const typed = amount.trim().replace(",", ".");
  const local = submitted
    ? {
        amount: !typed ? "Escribe el monto." : !/^\d+(\.\d{1,2})?$/.test(typed) || Number(typed) <= 0 ? "Escribe un monto mayor a 0, con hasta 2 decimales." : undefined,
        note: note.trim() ? undefined : "Escribe por qué.",
      }
    : {};
  const errors = {
    amount: local.amount ?? fieldError(add.error, "amount"),
    note: local.note ?? fieldError(add.error, "note"),
    business: fieldError(add.error, "business"),
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    if (!typed || !/^\d+(\.\d{1,2})?$/.test(typed) || Number(typed) <= 0 || !note.trim()) return;
    add.mutate({ amount: typed, note: note.trim(), business: business ? Number(business) : null });
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !add.isPending && onOpenChange(next)}>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-lg">
        <form onSubmit={submit} noValidate className="flex flex-col gap-5">
          <DialogHeader>
            <DialogTitle>Comisión a mano para {personName(partner)}</DialogTitle>
            <DialogDescription>
              Para lo que no es parte de un pago por QR: un plan que activaste tú, un bono. Queda por cobrar con las demás, y el aliado ve el motivo.
            </DialogDescription>
          </DialogHeader>

          <Field htmlFor="commission-amount" label="Monto">
            <div className="flex items-center gap-2">
              <Input
                id="commission-amount"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="50"
                className="h-10 w-32 tabular-nums"
                aria-invalid={!!errors.amount}
                aria-describedby={errors.amount ? "commission-amount-error" : undefined}
              />
              <span className="text-sm text-muted-foreground">Bs</span>
            </div>
            <FieldError id="commission-amount-error">{errors.amount}</FieldError>
          </Field>

          <Field htmlFor="commission-note" label="Por qué">
            <Input
              id="commission-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={200}
              placeholder="Ej. Plan Pro activado a mano en octubre"
              aria-invalid={!!errors.note}
              aria-describedby={errors.note ? "commission-note-error" : undefined}
            />
            <FieldError id="commission-note-error">{errors.note}</FieldError>
          </Field>

          <Field htmlFor="commission-business" label="Negocio" hint="Opcional: el negocio del que sale, si es uno de los que trajo.">
            <Select id="commission-business" value={business} onChange={(e) => setBusiness(e.target.value)} aria-invalid={!!errors.business}>
              <option value="">Ninguno</option>
              {partner.referrals.map((referral) => (
                <option key={referral.id} value={referral.business_id}>
                  {referral.business || `Negocio #${referral.business_id}`}
                </option>
              ))}
            </Select>
            <FieldError id="commission-business-error">{errors.business}</FieldError>
          </Field>

          {add.isError && !errors.amount && !errors.note && !errors.business ? (
            <Alert variant="destructive">
              <AlertDescription>{errorMessage(add.error)}</AlertDescription>
            </Alert>
          ) : null}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={add.isPending}>
              Cancelar
            </Button>
            <Button type="submit" disabled={add.isPending}>
              {add.isPending ? <LoaderCircle className="animate-spin" /> : null}
              Agregar comisión
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export { CommissionDialog };
