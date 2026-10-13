"use client";

import { CircleAlert, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";

/** What a screen that broke shows in its place; the frame around it stays. */
export default function PanelError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center gap-3 rounded-xl border border-border bg-card p-6 text-center">
      <CircleAlert className="size-6 text-red-600" />
      <div className="space-y-1">
        <p className="font-medium">Algo salió mal en esta pantalla</p>
        <p className="text-sm text-muted-foreground">Vuelve a intentarlo; si sigue pasando, recarga la página.</p>
      </div>
      <Button variant="outline" size="sm" onClick={reset}>
        <RefreshCw /> Reintentar
      </Button>
    </div>
  );
}
