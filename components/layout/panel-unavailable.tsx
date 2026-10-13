"use client";

import { signOut } from "next-auth/react";
import { RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";

const reasons = {
  session: {
    title: "Tu sesión terminó",
    text: "Vuelve a iniciar sesión para seguir en la administración de Muatle.",
    action: "Volver a entrar",
  },
  unreachable: {
    title: "No pudimos conectar con el servidor",
    text: "Revisa tu conexión y vuelve a intentarlo en un momento.",
    action: "Reintentar",
  },
};

/** The screen instead of the admin when it cannot open: the session is gone, or the backend is not answering. */
function PanelUnavailable({ reason }: { reason: keyof typeof reasons }) {
  const { title, text, action } = reasons[reason];
  return (
    <div className="grid min-h-svh place-items-center bg-linear-to-b from-auth-from to-auth-to px-4">
      <section className="flex w-full max-w-md flex-col rounded-xl bg-card p-6 text-card-foreground shadow-lg sm:p-9">
        <Logo />
        <h1 className="mt-5.5 text-2xl font-semibold">{title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{text}</p>
        <Button
          className="mt-6"
          onClick={() => (reason === "session" ? signOut({ callbackUrl: "/login" }) : window.location.reload())}
        >
          {reason === "unreachable" ? <RefreshCw /> : null}
          {action}
        </Button>
      </section>
    </div>
  );
}

export { PanelUnavailable };
