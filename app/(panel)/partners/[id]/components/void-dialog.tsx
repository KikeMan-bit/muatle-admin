"use client";

import * as React from "react";
import { LoaderCircle } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { fieldError, useVoidCommission } from "@/hooks/use-admin";
import type { Commission } from "@/lib/admin-api";
import { errorMessage } from "@/lib/api";
import { formatAmount } from "@/lib/utils";

/**
 * "Anular": a commission still to collect that should not be paid, as one of
 * a payment given back. It stays in the list, voided, with the reason, which
 * the ally sees too.
 */
function VoidDialog({
  partnerId,
  commission,
  open,
  onOpenChange,
}: {
  partnerId: number;
  commission: Commission;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [reason, setReason] = React.useState("");
  const [submitted, setSubmitted] = React.useState(false);
  const cancel = useVoidCommission(partnerId, { onSuccess: () => onOpenChange(false) });

  const reasonError = (submitted && !reason.trim() ? "Escribe por qué se anula." : undefined) ?? fieldError(cancel.error, "reason");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    if (!reason.trim()) return;
    cancel.mutate({ commission: commission.id, reason: reason.trim() });
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !cancel.isPending && onOpenChange(next)}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={submit} noValidate className="flex flex-col gap-5">
          <DialogHeader>
            <DialogTitle>¿Anular la comisión de {formatAmount(commission.amount)}?</DialogTitle>
            <DialogDescription className="text-[15px]">
              {commission.business ? `De ${commission.business}. ` : ""}Queda en la lista como anulada, con el motivo, y no se le paga. El aliado también ve el motivo.
            </DialogDescription>
          </DialogHeader>

          <Field htmlFor="void-reason" label="Motivo">
            <Input
              id="void-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              maxLength={200}
              placeholder="Ej. El pago se devolvió"
              aria-invalid={!!reasonError}
              aria-describedby={reasonError ? "void-reason-error" : undefined}
            />
            <FieldError id="void-reason-error">{reasonError}</FieldError>
          </Field>

          {cancel.isError && !reasonError ? (
            <Alert variant="destructive">
              <AlertDescription>{errorMessage(cancel.error)}</AlertDescription>
            </Alert>
          ) : null}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={cancel.isPending}>
              No anular
            </Button>
            <Button type="submit" variant="destructive" disabled={cancel.isPending}>
              {cancel.isPending ? <LoaderCircle className="animate-spin" /> : null}
              Anular comisión
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export { VoidDialog };
