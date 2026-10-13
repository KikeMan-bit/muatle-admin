import * as React from "react";

import { cn } from "@/lib/utils";

type EmptyStateProps = {
  message?: string;
  className?: string;
};

/**
 * The space in a card with no data yet. It keeps the height the chart or list
 * will take once data arrives, so the dashboard does not jump on load, and
 * says so in a quiet line rather than a box.
 */
function EmptyState({
  message = "No hay datos para mostrar",
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex min-h-52 items-center justify-center rounded-lg bg-muted/50 p-6",
        className,
      )}
    >
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

export { EmptyState };
