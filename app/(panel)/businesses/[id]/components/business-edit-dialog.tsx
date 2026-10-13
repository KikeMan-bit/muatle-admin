"use client";

import * as React from "react";
import { LoaderCircle } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { fieldError, useCountries, useUpdateBusiness } from "@/hooks/use-admin";
import type { BusinessDetail } from "@/lib/admin-api";
import { errorMessage } from "@/lib/api";
import { currencies } from "@/lib/currencies";

/** "Editar datos": what support changes of a business: its name, country, currency and line. */
function BusinessEditDialog({ business, open, onOpenChange }: { business: BusinessDetail; open: boolean; onOpenChange: (open: boolean) => void }) {
  const countries = useCountries();
  const [name, setName] = React.useState(business.name);
  const [country, setCountry] = React.useState(business.country ?? "");
  const [currency, setCurrency] = React.useState(business.currency);
  const [industry, setIndustry] = React.useState(business.industry);
  const [isFood, setIsFood] = React.useState(business.is_food_business);
  const [nameError, setNameError] = React.useState<string | null>(null);

  const update = useUpdateBusiness(business.id, { onSuccess: () => onOpenChange(false) });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setNameError("Escribe el nombre del negocio.");
      return;
    }
    setNameError(null);
    update.mutate({ name: name.trim(), country: country || null, currency, industry: industry.trim(), is_food_business: isFood });
  };

  const errors = {
    name: nameError ?? fieldError(update.error, "name"),
    country: fieldError(update.error, "country"),
    currency: fieldError(update.error, "currency"),
    industry: fieldError(update.error, "industry"),
  };
  const shownInField = Object.values(errors).some(Boolean);

  return (
    <Dialog open={open} onOpenChange={(next) => !update.isPending && onOpenChange(next)}>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={submit} noValidate className="flex flex-col gap-5">
          <DialogHeader>
            <DialogTitle>Editar {business.name}</DialogTitle>
            <DialogDescription>Lo que el dueño ve en Configuración › General. El país y la divisa cambian cómo se escriben sus fechas y montos.</DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4">
            <Field htmlFor="business-name" label="Nombre">
              <Input id="business-name" value={name} onChange={(e) => setName(e.target.value)} aria-invalid={!!errors.name} aria-describedby={errors.name ? "business-name-error" : undefined} />
              <FieldError id="business-name-error">{errors.name}</FieldError>
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field htmlFor="business-country" label="País">
                <Select id="business-country" value={country} onChange={(e) => setCountry(e.target.value)} aria-invalid={!!errors.country}>
                  <option value="">Sin país</option>
                  {(countries.data ?? [])
                    .filter((item) => item.is_active || item.code === business.country)
                    .map((item) => (
                      <option key={item.id} value={item.code ?? ""}>
                        {item.name}
                      </option>
                    ))}
                </Select>
                <FieldError id="business-country-error">{errors.country}</FieldError>
              </Field>

              <Field htmlFor="business-currency" label="Divisa">
                <Select id="business-currency" value={currency} onChange={(e) => setCurrency(e.target.value)} aria-invalid={!!errors.currency}>
                  {currencies.map((item) => (
                    <option key={item.code} value={item.code}>
                      {item.name} ({item.code})
                    </option>
                  ))}
                </Select>
                <FieldError id="business-currency-error">{errors.currency}</FieldError>
              </Field>
            </div>

            <Field htmlFor="business-industry" label="Rubro" hint="Como lo escribió al registrarse: restaurante, cafetería, pizzería…">
              <Input id="business-industry" value={industry} onChange={(e) => setIndustry(e.target.value)} aria-invalid={!!errors.industry} />
              <FieldError id="business-industry-error">{errors.industry}</FieldError>
            </Field>

            <div className="flex items-center gap-2.5">
              <Checkbox id="business-food" checked={isFood} onCheckedChange={(checked) => setIsFood(checked === true)} />
              <Label htmlFor="business-food" className="text-sm font-normal">
                Es un negocio de comida
              </Label>
            </div>
          </div>

          {update.isError && !shownInField ? (
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
              Guardar cambios
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export { BusinessEditDialog };
