"use client";

import * as React from "react";
import { LoaderCircle } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { fieldError, useUpdatePartnerProgram } from "@/hooks/use-admin";
import type { PartnerProgram } from "@/lib/admin-api";
import { errorMessage } from "@/lib/api";

import { DealFields, dealInput, dealValues, validateDeal } from "./deal-fields";

/**
 * "Comisión general": what every ally without a deal of their own earns, and
 * what the businesses they bring get off. A change counts from each business's
 * next payment; commissions already earned keep the share they were worked
 * out with.
 */
function ProgramDialog({ program, open, onOpenChange }: { program: PartnerProgram; open: boolean; onOpenChange: (open: boolean) => void }) {
  const [values, setValues] = React.useState(() => dealValues(program));
  const [submitted, setSubmitted] = React.useState(false);
  const update = useUpdatePartnerProgram({ onSuccess: () => onOpenChange(false) });

  const local = submitted ? validateDeal(values) : {};
  const errors = {
    percent: local.percent ?? fieldError(update.error, "percent"),
    months: local.months ?? fieldError(update.error, "months"),
    discount: local.discount ?? fieldError(update.error, "discount"),
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    if (Object.keys(validateDeal(values)).length) return;
    update.mutate(dealInput(values));
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !update.isPending && onOpenChange(next)}>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-lg">
        <form onSubmit={submit} noValidate className="flex flex-col gap-5">
          <DialogHeader>
            <DialogTitle>Comisión general</DialogTitle>
            <DialogDescription>
              La ganan los aliados que no tienen una comisión propia, y el descuento es para los negocios que traen. Vale
              desde el próximo pago de cada negocio: las comisiones ya ganadas no cambian.
            </DialogDescription>
          </DialogHeader>

          <DealFields idPrefix="program" values={values} onChange={(changes) => setValues((prev) => ({ ...prev, ...changes }))} errors={errors} />

          {update.isError && !errors.percent && !errors.months && !errors.discount ? (
            <Alert variant="destructive">
              <AlertDescription>{errorMessage(update.error)}</AlertDescription>
            </Alert>
          ) : null}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={update.isPending}>
              Cancelar
            </Button>
            <Button type="submit" disabled={update.isPending}>
              {update.isPending ? <LoaderCircle className="animate-spin" /> : null}
              Guardar comisión
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export { ProgramDialog };
