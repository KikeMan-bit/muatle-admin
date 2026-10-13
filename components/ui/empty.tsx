import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * A screen with nothing in it yet: icon, what will show up here and the first
 * step to get there. Not to be confused with `EmptyState`, the quiet space
 * that holds a chart's place inside a card.
 */
function Empty({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="empty"
      className={cn(
        "flex min-w-0 flex-col items-center justify-center gap-5 rounded-xl border border-border bg-card px-6 py-12 text-center text-balance md:py-16",
        className,
      )}
      {...props}
    />
  );
}

function EmptyHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="empty-header"
      className={cn("flex max-w-xl flex-col items-center gap-1.5", className)}
      {...props}
    />
  );
}

function EmptyMedia({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="empty-media"
      aria-hidden
      className={cn(
        "mb-3 flex size-12 shrink-0 items-center justify-center rounded-xl border border-border bg-muted/60 text-muted-foreground [&_svg:not([class*='size-'])]:size-6",
        className,
      )}
      {...props}
    />
  );
}

function EmptyTitle({ className, ...props }: React.ComponentProps<"h2">) {
  return (
    <h2
      data-slot="empty-title"
      className={cn("text-base font-semibold text-foreground", className)}
      {...props}
    />
  );
}

function EmptyDescription({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="empty-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  );
}

function EmptyContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="empty-content"
      className={cn(
        "flex flex-wrap items-center justify-center gap-3",
        className,
      )}
      {...props}
    />
  );
}

export {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
};
