"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, CircleAlert, Inbox, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { errorMessage } from "@/lib/api";
import { cn, formatCount } from "@/lib/utils";

export type Column<T> = {
  /** Unique within the table. */
  key: string;
  header: React.ReactNode;
  cell: (row: T) => React.ReactNode;
  /** Of the cells and the header: width, alignment. */
  className?: string;
};

export type DataTableProps<T> = {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => React.Key;
  isLoading?: boolean;
  error?: unknown;
  onRetry?: () => void;
  /** Opens the row's page on click; the row is still a plain row for the keyboard. */
  rowHref?: (row: T) => string;
  /** In plural and lower case: "negocios". It words the states. */
  noun?: string;
  emptyTitle?: string;
  emptyMessage?: string;
  /**
   * Each row as a card, shown instead of the table below `md`, for a list too
   * wide for a phone. Left out, the table scrolls sideways there.
   */
  card?: (row: T) => React.ReactNode;
  /** Left out, the table is a plain list without a pager. */
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    onPageChange: (page: number) => void;
    onPageSizeChange?: (size: number) => void;
  };
};

const SKELETON_ROWS = 6;
const PAGE_SIZES = [10, 20, 50, 100];

/**
 * The paginated table of the admin's lists: its skeleton while loading, the
 * backend's words when it fails, a quiet empty state, and the pager under it.
 */
function DataTable<T>({
  columns,
  rows,
  rowKey,
  isLoading = false,
  error,
  onRetry,
  rowHref,
  noun = "registros",
  emptyTitle,
  emptyMessage,
  card,
  pagination,
}: DataTableProps<T>) {
  const router = useRouter();
  const colSpan = columns.length;

  // A whole-row click opens the page, but a click on a control inside the row
  // (a switch, a menu, a link) is that control's alone
  const open = (e: React.MouseEvent, href: string) => {
    const target = e.target as HTMLElement;
    if (target.closest("a, button, input, select, label, [role=menu], [data-row-stop]")) return;
    if (e.metaKey || e.ctrlKey) window.open(href, "_blank");
    else router.push(href);
  };

  // The same failure and the same emptiness for the table and for the cards
  const failed = error ? (
    <EmptyBox icon={<CircleAlert className="size-5 text-red-600" />} title={`No se pudieron cargar los ${noun}`} message={errorMessage(error)}>
      {onRetry ? (
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RefreshCw /> Reintentar
        </Button>
      ) : null}
      {/* The page comes from the URL: if the list shrank since, it no longer exists */}
      {pagination && pagination.page > 1 ? (
        <Button variant="ghost" size="sm" onClick={() => pagination.onPageChange(1)}>
          Ir a la primera página
        </Button>
      ) : null}
    </EmptyBox>
  ) : null;
  const empty = (
    <EmptyBox icon={<Inbox className="size-5 text-muted-foreground" />} title={emptyTitle ?? `No hay ${noun}`} message={emptyMessage ?? "Prueba con otros filtros."} />
  );

  return (
    <div className="flex flex-col gap-3">
      {card ? (
        <div className="flex flex-col gap-2 md:hidden" aria-busy={isLoading || undefined}>
          {isLoading && rows.length === 0 ? (
            Array.from({ length: 3 }).map((_, i) => <Skeleton key={`sk-${i}`} className="h-24 w-full rounded-xl" />)
          ) : failed || rows.length === 0 ? (
            <div className="rounded-xl border border-border bg-card">{failed ?? empty}</div>
          ) : (
            <ul className="flex flex-col gap-2">
              {rows.map((row) => {
                const href = rowHref?.(row);
                return (
                  <li
                    key={rowKey(row)}
                    className={cn("rounded-xl border border-border bg-card p-3.5", isLoading && "opacity-60", href && "cursor-pointer hover:bg-muted/40")}
                    onClick={href ? (e) => open(e, href) : undefined}
                  >
                    {card(row)}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      ) : null}
      <div className={cn("overflow-hidden rounded-xl border border-border bg-card", card && "hidden md:block")}>
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow className="hover:bg-transparent">
              {columns.map((column) => (
                <TableHead key={column.key} className={cn("px-3", column.className)}>
                  {column.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody aria-busy={isLoading || undefined}>
            {isLoading && rows.length === 0 ? (
              Array.from({ length: SKELETON_ROWS }).map((_, i) => (
                <TableRow key={`sk-${i}`} className="hover:bg-transparent">
                  {columns.map((column, j) => (
                    <TableCell key={column.key} className="px-3 py-3">
                      <Skeleton className={cn("h-4", j === 0 ? "w-40" : "w-20")} />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : failed || rows.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={colSpan} className="p-0">
                  {failed ?? empty}
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => {
                const href = rowHref?.(row);
                return (
                  <TableRow
                    key={rowKey(row)}
                    className={cn(isLoading && "opacity-60", href && "cursor-pointer")}
                    onClick={href ? (e) => open(e, href) : undefined}
                  >
                    {columns.map((column) => (
                      <TableCell key={column.key} className={cn("px-3 py-2.5", column.className)}>
                        {column.cell(row)}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {pagination && !error && (rows.length > 0 || pagination.page > 1) ? (
        <Pager {...pagination} isLoading={isLoading} noun={noun} />
      ) : null}
    </div>
  );
}

function EmptyBox({
  icon,
  title,
  message,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  message: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex min-h-56 flex-col items-center justify-center gap-3 p-6 text-center">
      <span className="flex size-10 items-center justify-center rounded-lg border border-border bg-muted/50">{icon}</span>
      <div className="space-y-1">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-sm whitespace-normal text-muted-foreground">{message}</p>
      </div>
      {children ? <div className="flex items-center gap-2">{children}</div> : null}
    </div>
  );
}

function Pager({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  isLoading,
  noun,
}: NonNullable<DataTableProps<unknown>["pagination"]> & { isLoading: boolean; noun: string }) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const first = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const last = Math.min(page * pageSize, total);

  return (
    <div className="flex flex-col-reverse gap-3 px-1 text-sm sm:flex-row sm:items-center sm:justify-between">
      <p className="text-muted-foreground tabular-nums">
        {formatCount(first)}–{formatCount(last)} de {formatCount(total)} {noun}
      </p>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
        {onPageSizeChange ? (
          <label className="flex items-center gap-2 text-muted-foreground">
            <span className="whitespace-nowrap">Filas por página</span>
            <Select
              value={String(pageSize)}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              disabled={isLoading}
              wrapperClassName="w-20"
              className="h-8 text-sm"
            >
              {PAGE_SIZES.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </Select>
          </label>
        ) : null}
        <span className="whitespace-nowrap text-muted-foreground">
          Página <span className="font-medium text-foreground">{page}</span> de {pageCount}
        </span>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon-sm" className="hidden sm:inline-flex" onClick={() => onPageChange(1)} disabled={page <= 1 || isLoading} aria-label="Primera página">
            <ChevronsLeft />
          </Button>
          <Button variant="outline" size="icon-sm" onClick={() => onPageChange(page - 1)} disabled={page <= 1 || isLoading} aria-label="Página anterior">
            <ChevronLeft />
          </Button>
          <Button variant="outline" size="icon-sm" onClick={() => onPageChange(page + 1)} disabled={page >= pageCount || isLoading} aria-label="Página siguiente">
            <ChevronRight />
          </Button>
          <Button variant="outline" size="icon-sm" className="hidden sm:inline-flex" onClick={() => onPageChange(pageCount)} disabled={page >= pageCount || isLoading} aria-label="Última página">
            <ChevronsRight />
          </Button>
        </div>
      </div>
    </div>
  );
}

export { DataTable };
