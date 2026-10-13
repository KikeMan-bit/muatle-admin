import * as React from "react";

import { cn } from "@/lib/utils";

/** Multi-line `Input`: same border, focus ring and invalid state. */
function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        // Resizes only in height: dragged sideways it would break the form.
        "min-h-16 w-full min-w-0 resize-y rounded-lg border border-input bg-card px-3 py-2 text-[15px] text-foreground shadow-xs transition-[color,box-shadow] outline-none",
        "placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground",
        "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/40",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        "aria-invalid:border-destructive aria-invalid:focus-visible:ring-destructive/30",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
