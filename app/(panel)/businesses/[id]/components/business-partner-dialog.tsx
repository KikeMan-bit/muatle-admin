"use client";

import * as React from "react";
import { LoaderCircle } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, FieldError } from "@/components/ui/field";
import { Select } from "@/components/ui/select";
import { fieldError, usePartnerOptions, useSetBusinessPartner } from "@/hooks/use-admin";
import type { BusinessDetail } from "@/lib/admin-api";
import { errorMessage } from "@/lib/api";

/**
 * "Aliado": who brought the business, set by hand for one that signed up
 * without the ally's link or code, or corrected. Commissions only come from
 * the payments it makes from then on; the ones already earned stay with
 * whoever earned them.
 */
function BusinessPartnerDialog({ business, open, onOpenChange }: { business: BusinessDetail; open: boolean; onOpenChange: (open: boolean) => void }) {
  const options = usePartnerOptions({ enabled: open });
  const current = business.partner?.id ?? null;
  const [partner, setPartner] = React.useState(current === null ? "" : String(current));
  const change = useSetBusinessPartner(business.id, { onSuccess: () => onOpenChange(false) });
  const chosen = partner ? Number(partner) : null;
  const shownError = fieldError(change.error, "partner");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    change.mutate(chosen);
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !change.isPending && onOpenChange(next)}>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={submit} noValidate className="flex flex-col gap-5">
          <DialogHeader>
            <DialogTitle>Aliado de {business.name}</DialogTitle>
            <DialogDescription>
              Para un negocio que se registró sin el enlace ni el código de quien lo trajo. Las comisiones salen solo de
              los pagos que haga desde ahora: las que ya se ganaron se quedan con quien las ganó.
            </DialogDescription>
          </DialogHeader>

          <Field htmlFor="business-partner" label="Aliado">
            <Select
              id="business-partner"
              value={partner}
              onChange={(e) => setPartner(e.target.value)}
              disabled={options.isPending}
              aria-invalid={!!shownError}
              aria-describedby={shownError ? "business-partner-error" : undefined}
            >
              <option value="">Sin aliado</option>
              {(options.data ?? []).map((option) => (
                <option key={option.id} value={option.id} disabled={!option.is_active && option.id !== current}>
                  {option.name} ({option.code}){option.is_active ? "" : " · desactivado"}
                </option>
              ))}
            </Select>
            <FieldError id="business-partner-error">{shownError}</FieldError>
            {options.isError ? <p className="text-sm text-red-700">{errorMessage(options.error)}</p> : null}
          </Field>

          {change.isError && !shownError ? (
            <Alert variant="destructive">
              <AlertDescription>{errorMessage(change.error)}</AlertDescription>
            </Alert>
          ) : null}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={change.isPending}>
              Cancelar
            </Button>
            <Button type="submit" disabled={change.isPending || options.isPending || chosen === current}>
              {change.isPending ? <LoaderCircle className="animate-spin" /> : null}
              {chosen === null && current !== null ? "Quitar aliado" : "Guardar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export { BusinessPartnerDialog };
