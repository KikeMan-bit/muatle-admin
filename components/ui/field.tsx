import * as React from "react";

import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type FieldProps = {
  /** Id of the control it wraps; this is what ties the label to the field. */
  htmlFor: string;
  label: string;
  /** Helper text under the label ("Por ejemplo: ferretería, papelería…"). */
  hint?: string;
  children: React.ReactNode;
  className?: string;
};

/**
 * Label + hint + control, on the same vertical rhythm across the whole form.
 * The hint sits BETWEEN the label and the control — not under the control —
 * because it is what you need to read before answering.
 */
function Field({ htmlFor, label, hint, children, className }: FieldProps) {
  const hintId = hint ? `${htmlFor}-hint` : undefined;

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex flex-col gap-1">
        <Label htmlFor={htmlFor}>{label}</Label>
        {hint ? (
          <p id={hintId} className="text-sm text-muted-foreground">
            {hint}
          </p>
        ) : null}
      </div>
      {children}
    </div>
  );
}

/**
 * What is wrong with a field, right under it. Renders nothing without a
 * message. The control should point at it with `aria-describedby={id}`, so
 * screen readers read it together with the field.
 */
function FieldError({ id, children }: { id: string; children?: React.ReactNode }) {
  if (!children) return null;

  return (
    <p id={id} className="text-sm text-destructive">
      {children}
    </p>
  );
}

export { Field, FieldError };
