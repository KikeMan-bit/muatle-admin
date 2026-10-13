"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { flushSync } from "react-dom";
import { LoaderCircle } from "lucide-react";
import { signIn } from "next-auth/react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/ui/logo";

type FormValues = { email: string; password: string };
type FormErrors = Partial<Record<keyof FormValues, string>>;

// Deliberately loose: it only catches what is clearly not an address
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate({ email, password }: FormValues): FormErrors {
  const errors: FormErrors = {};
  if (email.trim() === "") errors.email = "Escribe tu correo electrónico.";
  else if (!EMAIL_PATTERN.test(email.trim())) errors.email = "Ese correo no parece válido.";
  if (password === "") errors.password = "Escribe tu contraseña.";
  return errors;
}

const SIGN_IN_FAILED = "No pudimos iniciar sesión. Inténtalo de nuevo.";

/**
 * Sign-in card. Errors stay hidden until the first submit and from then on
 * follow what is typed. A session opens through NextAuth, which checks the
 * password against the backend and that the account is the team's.
 */
function LoginForm({ callbackUrl }: { callbackUrl: string }) {
  const router = useRouter();
  const [values, setValues] = React.useState<FormValues>({ email: "", password: "" });
  const [submitted, setSubmitted] = React.useState(false);
  // What the backend said, like a wrong password. Cleared on the next try
  const [formError, setFormError] = React.useState<string | null>(null);
  const [signingIn, setSigningIn] = React.useState(false);

  const errors = submitted ? validate(values) : {};

  const set = <K extends keyof FormValues>(field: K, value: FormValues[K]) =>
    setValues((prev) => ({ ...prev, [field]: value }));

  const describedBy = (field: keyof FormValues) => ({
    "aria-invalid": Boolean(errors[field]),
    "aria-describedby": errors[field] ? `${field}-error` : undefined,
  });

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (signingIn) return;
    const form = e.currentTarget;

    flushSync(() => {
      setSubmitted(true);
      setFormError(null);
    });

    const firstInvalid = Object.keys(validate(values))[0];
    if (firstInvalid) {
      (form.elements.namedItem(firstInvalid) as HTMLInputElement).focus();
      return;
    }

    setSigningIn(true);
    const result = await signIn("credentials", {
      email: values.email.trim(),
      password: values.password,
      redirect: false,
    }).catch(() => undefined);

    if (!result?.ok) {
      setSigningIn(false);
      const message = result?.error;
      setFormError(message && message !== "CredentialsSignin" ? message : SIGN_IN_FAILED);
      return;
    }

    // Stays "signing in" while the admin loads
    router.replace(callbackUrl);
    router.refresh();
  };

  return (
    <form
      noValidate
      method="post"
      onSubmit={onSubmit}
      className="flex flex-col rounded-xl bg-card p-6 text-card-foreground shadow-lg sm:p-9"
    >
      <Logo />

      <header className="mt-5.5">
        <h1 className="text-2xl font-semibold">Iniciar sesión</h1>
        <p className="text-sm text-muted-foreground">Administración de Muatle, para el equipo.</p>
      </header>

      <div className="mt-6 flex flex-col gap-3">
        <Field htmlFor="email" label="Correo electrónico" className="gap-1">
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            autoFocus
            className="h-9"
            value={values.email}
            onChange={(e) => set("email", e.target.value)}
            {...describedBy("email")}
          />
          <FieldError id="email-error">{errors.email}</FieldError>
        </Field>

        <Field htmlFor="password" label="Contraseña" className="gap-1">
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            className="h-9"
            value={values.password}
            onChange={(e) => set("password", e.target.value)}
            {...describedBy("password")}
          />
          <FieldError id="password-error">{errors.password}</FieldError>
        </Field>
      </div>

      {formError ? (
        <Alert variant="destructive" className="mt-4">
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      ) : null}

      <Button type="submit" className="mt-5 text-[15px] shadow-sm" aria-disabled={signingIn || undefined}>
        {signingIn ? (
          <>
            <LoaderCircle className="animate-spin" />
            Iniciando sesión…
          </>
        ) : (
          "Iniciar sesión"
        )}
      </Button>
      <p role="status" className="sr-only">
        {signingIn ? "Iniciando sesión." : ""}
      </p>
    </form>
  );
}

export { LoginForm };
