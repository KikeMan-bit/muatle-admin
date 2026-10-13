import * as React from "react";
import { Info } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle, CardValue } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

/** The info icon beside a title, with what the number means. */
function Hint({ title, hint }: { title: string; hint: string }) {
  return (
    <Tooltip>
      <TooltipTrigger
        aria-label={`Más información sobre ${title.toLowerCase()}`}
        className="rounded-full outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40"
      >
        <Info className="size-3.5" />
      </TooltipTrigger>
      <TooltipContent className="max-w-72">{hint}</TooltipContent>
    </Tooltip>
  );
}

/** A headline number with its title over it and, when there is one, a line under it. */
function StatCard({
  title,
  hint,
  value,
  detail,
  loading = false,
  className,
}: {
  title: string;
  hint?: string;
  value: React.ReactNode;
  detail?: React.ReactNode;
  loading?: boolean;
  className?: string;
}) {
  return (
    <Card className={cn("gap-2 p-4", className)}>
      <CardHeader className="gap-1">
        <CardTitle className="leading-5">
          <h2>{title}</h2>
          {hint ? <Hint title={title} hint={hint} /> : null}
        </CardTitle>
        {loading ? <Skeleton className="h-8 w-24" /> : <CardValue className="text-xl leading-8 sm:text-2xl">{value}</CardValue>}
      </CardHeader>
      {detail ? <CardContent className="text-sm text-muted-foreground">{detail}</CardContent> : null}
    </Card>
  );
}

/** A card with a title and whatever it holds, the same height as its neighbours. */
function PanelCard({
  title,
  hint,
  actions,
  className,
  contentClassName,
  children,
}: {
  title: React.ReactNode;
  hint?: string;
  actions?: React.ReactNode;
  className?: string;
  contentClassName?: string;
  children: React.ReactNode;
}) {
  return (
    <Card className={cn("gap-3", className)}>
      <CardHeader className="flex-row items-center justify-between gap-3">
        <CardTitle className="text-sm font-semibold text-foreground">
          <h2>{title}</h2>
          {hint ? <Hint title={typeof title === "string" ? title : "esta sección"} hint={hint} /> : null}
        </CardTitle>
        {actions}
      </CardHeader>
      <CardContent className={cn("flex min-h-0 flex-1 flex-col", contentClassName)}>{children}</CardContent>
    </Card>
  );
}

export { Hint, PanelCard, StatCard };
