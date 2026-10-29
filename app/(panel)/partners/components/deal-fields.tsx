"use client";

import * as React from "react";
import { Check } from "lucide-react";

import { Field, FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import type { Deal } from "@/lib/admin-api";
import { cn } from "@/lib/utils";

/**
 * A deal as its fields hold it: the share and the business's discount as
 * typed, and its months or "always". The discount is null when the backend
 * knows of none yet: no field, and nothing sent.
 */
export type DealValues = { percent: string; months: string; forever: boolean; discount: string | null };

export type DealErrors = { percent?: string; months?: string; discount?: string };

// A deal no one wrote yet starts at a year, the usual length of these programs
const DEFAULT_MONTHS = "12";
const MAX_MONTHS = 120;

/** "10" for the "10.00" the backend keeps: a percentage as the field shows it. */
export function typedPercent(value: string): string {
  return String(Number(value));
}

export function dealValues(deal: Deal | null | undefined): DealValues {
  if (!deal) return { percent: "", months: DEFAULT_MONTHS, forever: false, discount: "" };
  return {
    percent: typedPercent(deal.percent),
    months: deal.months === null ? DEFAULT_MONTHS : String(deal.months),
    forever: deal.months === null,
    discount: deal.discount === undefined ? null : typedPercent(deal.discount),
  };
}

/** A percentage as typed, as the backend takes it: with a dot ("12.5"). */
function withDot(value: string): string {
  return value.trim().replace(",", ".");
}

/** What the backend takes: the share and the discount with a dot ("12.5"), and the months or null for always. */
export function dealInput(values: DealValues): Deal {
  const deal: Deal = { percent: withDot(values.percent), months: values.forever ? null : Number(values.months) };
  if (values.discount !== null) deal.discount = withDot(values.discount);
  return deal;
}

/** What is wrong with a percentage as typed, if anything. */
function percentProblem(value: string, missing: string): string | undefined {
  const percent = withDot(value);
  if (!percent) return missing;
  if (!/^\d+(\.\d{1,2})?$/.test(percent)) return "Escribe un número, con hasta 2 decimales.";
  if (Number(percent) > 100) return "Un porcentaje llega hasta 100.";
  return undefined;
}

export function validateDeal(values: DealValues): DealErrors {
  const errors: DealErrors = {};
  const percent = percentProblem(values.percent, "Escribe el porcentaje.");
  if (percent) errors.percent = percent;
  const discount = values.discount === null ? undefined : percentProblem(values.discount, "Escribe el descuento: 0 si no tiene.");
  if (discount) errors.discount = discount;
  if (!values.forever) {
    const months = Number(values.months);
    if (!Number.isInteger(months) || months < 1) errors.months = "Pon al menos 1 mes, o elige «Siempre».";
    else if (months > MAX_MONTHS) errors.months = `Pon como máximo ${MAX_MONTHS} meses, o elige «Siempre».`;
  }
  return errors;
}

/** One of the two answers to "Durante", drawn as the plan dialog's choices. */
function Choice({
  name,
  selected,
  onSelect,
  children,
}: {
  name: string;
  selected: boolean;
  onSelect: () => void;
  children: React.ReactNode;
}) {
  return (
    <label
      className={cn(
        "flex cursor-pointer flex-wrap items-center gap-x-2.5 gap-y-1 rounded-lg border px-3 py-2.5 text-sm transition-colors has-focus-visible:ring-[3px] has-focus-visible:ring-ring/40",
        selected ? "border-primary bg-primary/4" : "border-border hover:bg-muted",
      )}
    >
      <input type="radio" name={name} checked={selected} onChange={onSelect} className="sr-only" />
      <span className={cn("flex size-4 shrink-0 items-center justify-center rounded-full border", selected ? "border-primary bg-primary text-primary-foreground" : "border-input")}>
        {selected ? <Check className="size-3" /> : null}
      </span>
      {children}
    </label>
  );
}

/**
 * The share of each payment, the paid months of each business that earn it,
 * or always, and what the business gets off its plan for those months: how
 * the general deal and an ally's own are written.
 */
function DealFields({
  idPrefix,
  values,
  onChange,
  errors,
}: {
  idPrefix: string;
  values: DealValues;
  onChange: (changes: Partial<DealValues>) => void;
  errors: DealErrors;
}) {
  return (
    <div className="flex flex-col gap-4">
      <Field
        htmlFor={`${idPrefix}-percent`}
        label="Porcentaje de cada pago"
        hint="Sobre lo que el negocio pagó de verdad, ya restado su descuento o su cupón."
      >
        <div className="flex items-center gap-2">
          <Input
            id={`${idPrefix}-percent`}
            inputMode="decimal"
            value={values.percent}
            onChange={(e) => onChange({ percent: e.target.value })}
            placeholder="20"
            className="h-10 w-28 tabular-nums"
            aria-invalid={!!errors.percent}
            aria-describedby={errors.percent ? `${idPrefix}-percent-error` : undefined}
          />
          <span className="text-sm text-muted-foreground">% de cada pago</span>
        </div>
        <FieldError id={`${idPrefix}-percent-error`}>{errors.percent}</FieldError>
      </Field>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-[15px] font-medium">Durante</legend>
        <Choice name={`${idPrefix}-length`} selected={!values.forever} onSelect={() => onChange({ forever: false })}>
          <span>Los primeros</span>
          <Input
            id={`${idPrefix}-months`}
            type="number"
            inputMode="numeric"
            min={1}
            max={MAX_MONTHS}
            value={values.months}
            onChange={(e) => onChange({ months: e.target.value, forever: false })}
            onFocus={() => onChange({ forever: false })}
            className="h-8 w-20 tabular-nums"
            aria-label="Meses pagados de cada negocio"
            aria-invalid={!!errors.months}
            aria-describedby={errors.months ? `${idPrefix}-months-error` : undefined}
          />
          <span>meses pagados de cada negocio</span>
        </Choice>
        <Choice name={`${idPrefix}-length`} selected={values.forever} onSelect={() => onChange({ forever: true })}>
          <span className="font-medium">Siempre</span>
          <span className="text-muted-foreground">mientras el negocio pague</span>
        </Choice>
        <p className="text-xs text-muted-foreground">Un pago mensual cuenta 1 mes; uno anual, 12.</p>
        <FieldError id={`${idPrefix}-months-error`}>{errors.months}</FieldError>
      </fieldset>

      {values.discount === null ? null : (
        <Field
          htmlFor={`${idPrefix}-discount`}
          label="Descuento para el negocio"
          hint="Lo que paga de menos un negocio que llegó con un aliado, durante los mismos meses en que el aliado gana comisión. Con 0, no tiene descuento."
        >
          <div className="flex items-center gap-2">
            <Input
              id={`${idPrefix}-discount`}
              inputMode="decimal"
              value={values.discount}
              onChange={(e) => onChange({ discount: e.target.value })}
              placeholder="10"
              className="h-10 w-28 tabular-nums"
              aria-invalid={!!errors.discount}
              aria-describedby={errors.discount ? `${idPrefix}-discount-error` : undefined}
            />
            <span className="text-sm text-muted-foreground">% menos en su plan</span>
          </div>
          <FieldError id={`${idPrefix}-discount-error`}>{errors.discount}</FieldError>
        </Field>
      )}
    </div>
  );
}

export { DealFields };
