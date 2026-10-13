import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type TablePaginationProps = {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  /** What is being counted, singular and plural: ["orden", "órdenes"]. */
  noun: [string, string];
  /** Text after the count: "1 - 1 de 1 miembros entre 1 sucursal". */
  suffix?: string;
  className?: string;
};

/**
 * The band under the panel's tables: "1 - 3 de 3 órdenes" on the left, the
 * previous and next page on the right. `page` starts at 0.
 */
function TablePagination({
  page,
  pageSize,
  total,
  onPageChange,
  noun,
  suffix,
  className,
}: TablePaginationProps) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const first = total === 0 ? 0 : page * pageSize + 1;
  const last = Math.min(total, (page + 1) * pageSize);

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 border-t border-border px-4 py-2.5",
        className,
      )}
    >
      <span className="min-w-0 text-sm text-muted-foreground tabular-nums">
        {first} - {last} de {total} {total === 1 ? noun[0] : noun[1]}
        {suffix ? ` ${suffix}` : null}
      </span>
      <div className="flex shrink-0 items-center gap-1.5">
        <Button
          variant="outline"
          size="icon-sm"
          aria-label="Página anterior"
          disabled={page === 0}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft />
        </Button>
        <Button
          variant="outline"
          size="icon-sm"
          aria-label="Página siguiente"
          disabled={page >= pageCount - 1}
          onClick={() => onPageChange(page + 1)}
        >
          <ChevronRight />
        </Button>
      </div>
    </div>
  );
}

export { TablePagination };
