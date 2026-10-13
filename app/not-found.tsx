import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";

export default function NotFound() {
  return (
    <div className="grid min-h-svh place-items-center bg-linear-to-b from-auth-from to-auth-to px-4">
      <section className="flex w-full max-w-md flex-col rounded-xl bg-card p-6 text-card-foreground shadow-lg sm:p-9">
        <Logo />
        <h1 className="mt-5.5 text-2xl font-semibold">Esta página no existe</h1>
        <p className="mt-1 text-sm text-muted-foreground">El enlace puede estar mal escrito o la página ya no está.</p>
        <Button asChild className="mt-6 self-start">
          <Link href="/">Ir al inicio</Link>
        </Button>
      </section>
    </div>
  );
}
