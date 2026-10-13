"use client";

import * as React from "react";
import { Ellipsis, type LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export type RowAction = {
  label: string;
  icon: LucideIcon;
  /** Gets the menu's trigger, where focus goes back once a dialog closes. */
  onSelect: (trigger: HTMLButtonElement | null) => void;
  destructive?: boolean;
  /** Why it cannot be used right now; shown under the label. */
  disabledReason?: string;
};

/**
 * Radix hands focus back to the menu's trigger once the menu closes, and it
 * does so after an item has opened a sheet — pulling focus out of the field
 * the sheet just focused. So focus only goes back when it has nowhere else
 * to be: the menu closed with Escape, or the item did not open anything.
 * For `onCloseAutoFocus` of any dropdown whose items open dialogs.
 */
export function returnFocusIfLost(event: Event, trigger: HTMLElement | null) {
  event.preventDefault();
  const active = document.activeElement;
  // Inside a modal, like Configuración, focus that loses its element lands
  // on the modal itself instead of on the page.
  const lost =
    !active || active === document.body || active === trigger?.closest("[role=dialog]");
  if (lost) trigger?.focus();
}

/** "Acciones", the heading of every "⋯" menu. */
export function ActionsLabel() {
  return (
    <DropdownMenuLabel className="font-semibold text-foreground">
      Acciones
    </DropdownMenuLabel>
  );
}

/**
 * An item of a "⋯" menu: brand icon for the everyday actions, red for the
 * ones that take something away. A disabled one says why under its label.
 */
export function ActionItem({
  icon: Icon,
  label,
  onSelect,
  destructive = false,
  disabledReason,
}: {
  icon: LucideIcon;
  label: string;
  onSelect: () => void;
  destructive?: boolean;
  disabledReason?: string;
}) {
  return (
    <DropdownMenuItem
      disabled={Boolean(disabledReason)}
      onSelect={onSelect}
      className="items-start text-[15px]"
    >
      <Icon
        aria-hidden
        className={cn(
          "mt-0.5 size-4 shrink-0",
          destructive ? "text-red-600" : "text-primary-strong",
        )}
      />
      <span className="flex flex-col">
        <span>{label}</span>
        {disabledReason ? (
          <span className="text-xs text-muted-foreground">{disabledReason}</span>
        ) : null}
      </span>
    </DropdownMenuItem>
  );
}

/** The "⋯" at the end of a table row, with its "Acciones" menu. */
function RowMenu({ label, actions }: { label: string; actions: RowAction[] }) {
  const triggerRef = React.useRef<HTMLButtonElement>(null);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          ref={triggerRef}
          variant="ghost"
          size="icon-sm"
          aria-label={`Acciones de ${label}`}
          // Outlined while open, so it is clear whose menu is showing.
          className="shrink-0 data-[state=open]:bg-card data-[state=open]:shadow-xs data-[state=open]:ring-1 data-[state=open]:ring-border"
        >
          <Ellipsis />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="min-w-44"
        onCloseAutoFocus={(event) => returnFocusIfLost(event, triggerRef.current)}
      >
        <ActionsLabel />
        {actions.map(({ onSelect, ...action }) => (
          <ActionItem
            key={action.label}
            {...action}
            onSelect={() => onSelect(triggerRef.current)}
          />
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export { RowMenu };
