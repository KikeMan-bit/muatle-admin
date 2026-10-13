"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type ConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCloseAutoFocus?: (event: Event) => void;
  title: string;
  description: string;
  onConfirm: () => void;
  /** Names the action itself ("Borrar", "Cancelar orden"), never "Aceptar". */
  confirmLabel?: string;
  /** The way out, worded so it cannot be mistaken for the action. */
  cancelLabel?: string;
  /** "default" for an action that changes things without taking them away. */
  confirmVariant?: "destructive" | "default";
};

/**
 * Asks before something that cannot be undone: deleting, canceling an
 * order. It behaves as an alert: a click outside does not dismiss it, and
 * focus starts on the choice that loses nothing.
 */
function ConfirmDialog({
  open,
  onOpenChange,
  onCloseAutoFocus,
  title,
  description,
  onConfirm,
  confirmLabel = "Borrar",
  cancelLabel = "Cancelar",
  confirmVariant = "destructive",
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        role="alertdialog"
        showCloseButton={false}
        onInteractOutside={(e) => e.preventDefault()}
        onCloseAutoFocus={onCloseAutoFocus}
        className="sm:max-w-md"
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription className="text-[15px]">
            {description}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">{cancelLabel}</Button>
          </DialogClose>
          <Button
            variant={confirmVariant}
            onClick={() => {
              onConfirm();
              onOpenChange(false);
            }}
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export { ConfirmDialog };
