"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { fieldError, useCreateAccount } from "@/hooks/use-admin";
import { errorMessage } from "@/lib/api";

const MIN_PASSWORD_LENGTH = 8;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Values = { email: string; password: string; first_name: string; last_name: string };
const empty: Values = { email: "", password: "", first_name: "", last_name: "" };

function validate(values: Values): Partial<Record<keyof Values, string>> {
  const errors: Partial<Record<keyof Values, string>> = {};
  if (!values.email.trim()) errors.email = "Escribe el correo.";
  else if (!EMAIL_PATTERN.test(values.email.trim())) errors.email = "Ese correo no parece válido.";
  if (values.password.length < MIN_PASSWORD_LENGTH) errors.password = `Usa al menos ${MIN_PASSWORD_LENGTH} caracteres.`;
  return errors;
}

/** "Nueva cuenta del equipo": someone of Muatle who signs in to this admin right away. */
function NewAccountDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const router = useRouter();
  const [values, setValues] = React.useState(empty);
  const [submitted, setSubmitted] = React.useState(false);

  const create = useCreateAccount({
    onSuccess: (account) => {
      onOpenChange(false);
      router.push(`/accounts/${account.id}`);
    },
  });

  const errors = submitted ? validate(values) : {};
  const set = <K extends keyof Values>(field: K, value: string) => setValues((prev) => ({ ...prev, [field]: value }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    if (Object.keys(validate(values)).length) return;
    create.mutate({
      email: values.email.trim(),
      password: values.password,
      first_name: values.first_name.trim(),
      last_name: values.last_name.trim(),
    });
  };

  const shown = {
    email: errors.email ?? fieldError(create.error, "email"),
    password: errors.password ?? fieldError(create.error, "password"),
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !create.isPending && onOpenChange(next)}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={submit} noValidate className="flex flex-col gap-5">
          <DialogHeader>
            <DialogTitle>Nueva cuenta del equipo</DialogTitle>
            <DialogDescription>
              Una cuenta para alguien de Muatle. Entra a esta administración con su correo y la contraseña que le pongas aquí; después puede cambiarla.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field htmlFor="new-first-name" label="Nombre">
                <Input id="new-first-name" value={values.first_name} onChange={(e) => set("first_name", e.target.value)} autoComplete="off" />
              </Field>
              <Field htmlFor="new-last-name" label="Apellido">
                <Input id="new-last-name" value={values.last_name} onChange={(e) => set("last_name", e.target.value)} autoComplete="off" />
              </Field>
            </div>
            <Field htmlFor="new-email" label="Correo electrónico">
              <Input id="new-email" type="email" value={values.email} onChange={(e) => set("email", e.target.value)} autoComplete="off" aria-invalid={!!shown.email} aria-describedby={shown.email ? "new-email-error" : undefined} />
              <FieldError id="new-email-error">{shown.email}</FieldError>
            </Field>
            <Field htmlFor="new-password" label="Contraseña" hint={`Al menos ${MIN_PASSWORD_LENGTH} caracteres.`}>
              <Input id="new-password" type="password" value={values.password} onChange={(e) => set("password", e.target.value)} autoComplete="new-password" aria-invalid={!!shown.password} aria-describedby={shown.password ? "new-password-error" : undefined} />
              <FieldError id="new-password-error">{shown.password}</FieldError>
            </Field>
          </div>

          {create.isError && !shown.email && !shown.password ? (
            <Alert variant="destructive">
              <AlertDescription>{errorMessage(create.error)}</AlertDescription>
            </Alert>
          ) : null}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={create.isPending}>
              Cancelar
            </Button>
            <Button type="submit" disabled={create.isPending}>
              {create.isPending ? <LoaderCircle className="animate-spin" /> : null}
              Crear cuenta
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export { NewAccountDialog };
