"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check, LoaderCircle } from "lucide-react";
import { toast } from "sonner";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { fieldError, useCreatePartner, usePartnerProgram, useUpdatePartner } from "@/hooks/use-admin";
import type { PartnerDetail, PartnerInvited } from "@/lib/admin-api";
import { errorMessage } from "@/lib/api";
import { dealLabel } from "@/lib/partners";
import { cn, personName } from "@/lib/utils";

import { DealFields, dealInput, dealValues, typedPercent, validateDeal, type DealValues } from "./deal-fields";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// As the backend takes them (partners.referrals.CODE_FORMAT)
const CODE_PATTERN = /^[A-Z0-9-]{3,30}$/;

type Values = {
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  code: string;
  own: boolean;
  deal: DealValues;
  note: string;
};

type Errors = Partial<Record<"email" | "first_name" | "code" | "percent" | "months" | "discount", string>>;

function validate(values: Values, creating: boolean): Errors {
  const errors: Errors = {};
  if (creating) {
    if (!values.email.trim()) errors.email = "Escribe el correo.";
    else if (!EMAIL_PATTERN.test(values.email.trim())) errors.email = "Ese correo no parece válido.";
  }
  if (!values.first_name.trim()) errors.first_name = "Escribe el nombre.";
  const code = values.code.trim();
  if (code && !CODE_PATTERN.test(code)) errors.code = "Usa de 3 a 30 letras, números o guiones, sin espacios.";
  if (values.own) Object.assign(errors, validateDeal(values.deal));
  return errors;
}

/** The toast after the invitation was asked for: green when it went out, a warning when it did not. */
export function invitationToast(partner: PartnerInvited, made: boolean) {
  const who = personName(partner);
  if (partner.invitation_sent) {
    toast.success(made ? `${who} ya es aliado. Le enviamos la invitación a ${partner.email}.` : `Le reenviamos la invitación a ${partner.email}.`);
  } else {
    toast.warning(
      made
        ? `${who} ya es aliado, pero no pudimos enviarle la invitación a ${partner.email}. Reenvíala desde su ficha.`
        : `No pudimos enviar la invitación a ${partner.email}. Inténtalo de nuevo en un rato.`,
    );
  }
}

/**
 * "Nuevo aliado" or "Editar": who they are, their code and their deal, the
 * general one or one of their own. A new ally gets an email to make their
 * password; their account is theirs alone, never a business's. The code stays
 * once it brought a business: it is in the link they shared.
 */
function PartnerDialog({ partner, open, onOpenChange }: { partner?: PartnerDetail; open: boolean; onOpenChange: (open: boolean) => void }) {
  const router = useRouter();
  const program = usePartnerProgram();
  const creating = !partner;
  const [values, setValues] = React.useState<Values>(() => ({
    email: partner?.email ?? "",
    first_name: partner?.first_name ?? "",
    last_name: partner?.last_name ?? "",
    phone: partner?.phone ?? "",
    code: partner?.code ?? "",
    own: partner?.commission.own ?? false,
    deal: dealValues(partner?.commission.own ? partner.commission : null),
    note: partner?.note ?? "",
  }));
  const [submitted, setSubmitted] = React.useState(false);

  const create = useCreatePartner({
    onSuccess: (data) => {
      invitationToast(data, true);
      onOpenChange(false);
      router.push(`/partners/${data.id}`);
    },
  });
  const update = useUpdatePartner(partner?.id ?? 0, { onSuccess: () => onOpenChange(false) });
  const mutation = partner ? update : create;
  // Out there in a link once it brought a business
  const codeLocked = !!partner && partner.businesses > 0;

  const set = <K extends keyof Values>(field: K, value: Values[K]) => setValues((prev) => ({ ...prev, [field]: value }));
  // A deal of their own starts from the general discount, to change or take to 0
  const chooseDeal = (own: boolean) =>
    setValues((prev) => {
      if (!own || prev.deal.discount) return { ...prev, own };
      let discount: string | null = "";
      if (program.data) discount = program.data.discount === undefined ? null : typedPercent(program.data.discount);
      return { ...prev, own, deal: { ...prev.deal, discount } };
    });
  const local = submitted ? validate(values, creating) : {};
  const errors: Errors = {
    email: local.email ?? fieldError(mutation.error, "email"),
    first_name: local.first_name ?? fieldError(mutation.error, "first_name"),
    code: local.code ?? fieldError(mutation.error, "code"),
    percent: local.percent ?? fieldError(mutation.error, "percent"),
    months: local.months ?? fieldError(mutation.error, "months"),
    discount: local.discount ?? fieldError(mutation.error, "discount"),
  };
  const anyFieldError = Object.values(errors).some(Boolean);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    if (Object.keys(validate(values, creating)).length) return;
    const deal = values.own ? dealInput(values.deal) : {};
    const common = {
      first_name: values.first_name.trim(),
      last_name: values.last_name.trim(),
      phone: values.phone.trim(),
      own_commission: values.own,
      ...deal,
      note: values.note.trim(),
    };
    if (partner) {
      update.mutate({ ...common, ...(codeLocked ? {} : { code: values.code.trim() }) });
    } else {
      create.mutate({ ...common, email: values.email.trim(), code: values.code.trim() });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !mutation.isPending && onOpenChange(next)}>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-lg">
        <form onSubmit={submit} noValidate className="flex flex-col gap-5">
          <DialogHeader>
            <DialogTitle>{partner ? `Editar a ${personName(partner)}` : "Nuevo aliado"}</DialogTitle>
            <DialogDescription>
              {partner
                ? "Un cambio de comisión o de descuento vale desde el próximo pago de sus negocios: lo que ya ganó no cambia."
                : "Le llega un correo para crear su contraseña y entrar a su panel de aliado. Su cuenta es solo de aliado: no puede ser la de un negocio."}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field htmlFor="partner-first-name" label="Nombre">
                <Input
                  id="partner-first-name"
                  value={values.first_name}
                  onChange={(e) => set("first_name", e.target.value)}
                  maxLength={50}
                  aria-invalid={!!errors.first_name}
                  aria-describedby={errors.first_name ? "partner-first-name-error" : undefined}
                />
                <FieldError id="partner-first-name-error">{errors.first_name}</FieldError>
              </Field>
              <Field htmlFor="partner-last-name" label="Apellido">
                <Input id="partner-last-name" value={values.last_name} onChange={(e) => set("last_name", e.target.value)} maxLength={100} />
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {creating ? (
                <Field htmlFor="partner-email" label="Correo">
                  <Input
                    id="partner-email"
                    type="email"
                    autoComplete="off"
                    value={values.email}
                    onChange={(e) => set("email", e.target.value)}
                    placeholder="nombre@gmail.com"
                    aria-invalid={!!errors.email}
                    aria-describedby={errors.email ? "partner-email-error" : undefined}
                  />
                  <FieldError id="partner-email-error">{errors.email}</FieldError>
                </Field>
              ) : null}
              <Field htmlFor="partner-phone" label="Teléfono">
                <Input id="partner-phone" type="tel" value={values.phone} onChange={(e) => set("phone", e.target.value)} maxLength={20} placeholder="+591 70000000" />
              </Field>
            </div>

            <Field
              htmlFor="partner-code"
              label="Código"
              hint={
                codeLocked
                  ? "Ya trajo negocios con él: cambiarlo rompería el enlace que compartió."
                  : creating
                    ? "El de su enlace, y el que escriben los negocios al registrarse. Vacío, se arma con su nombre, como JUAN."
                    : "El de su enlace: cámbialo solo si todavía no lo compartió."
              }
            >
              <Input
                id="partner-code"
                value={values.code}
                onChange={(e) => set("code", e.target.value.toUpperCase())}
                disabled={codeLocked}
                maxLength={30}
                autoComplete="off"
                placeholder="Ej. JUAN"
                className="font-mono uppercase sm:w-56"
                aria-invalid={!!errors.code}
                aria-describedby={errors.code ? "partner-code-error" : undefined}
              />
              <FieldError id="partner-code-error">{errors.code}</FieldError>
            </Field>
          </div>

          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1 text-[15px] font-medium">Comisión</legend>
            {(
              [
                {
                  own: false,
                  name: "La general",
                  description: program.data ? dealLabel(program.data) : "La que ganan todos los aliados.",
                },
                { own: true, name: "Una propia", description: "Otro porcentaje, plazo o descuento, solo para este aliado." },
              ] as const
            ).map((option) => {
              const selected = option.own === values.own;
              return (
                <label
                  key={option.name}
                  className={cn(
                    "flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-2.5 text-sm transition-colors has-focus-visible:ring-[3px] has-focus-visible:ring-ring/40",
                    selected ? "border-primary bg-primary/4" : "border-border hover:bg-muted",
                  )}
                >
                  <input type="radio" name="partner-deal" checked={selected} onChange={() => chooseDeal(option.own)} className="sr-only" />
                  <span className={cn("mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border", selected ? "border-primary bg-primary text-primary-foreground" : "border-input")}>
                    {selected ? <Check className="size-3" /> : null}
                  </span>
                  <span className="grid gap-0.5">
                    <span className="font-medium">{option.name}</span>
                    <span className="text-muted-foreground">{option.description}</span>
                  </span>
                </label>
              );
            })}
          </fieldset>

          {values.own ? (
            <DealFields idPrefix="partner-deal" values={values.deal} onChange={(changes) => set("deal", { ...values.deal, ...changes })} errors={errors} />
          ) : null}

          <Field htmlFor="partner-note" label="Nota interna" hint="Para el equipo; el aliado no la ve.">
            <Input id="partner-note" value={values.note} onChange={(e) => set("note", e.target.value)} maxLength={200} placeholder="Ej. Amigo de la feria, vende en Cochabamba" />
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
              {partner ? "Guardar cambios" : "Crear aliado"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export { PartnerDialog };
