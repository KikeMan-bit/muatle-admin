import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * A field made of pieces: fixed text or controls next to an input, all inside
 * one border. Focus and the invalid state are read off what is inside, so the
 * group lights up as if it were a single control.
 */
function InputGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="input-group"
      className={cn(
        "flex h-10 w-full min-w-0 items-center rounded-lg border border-input bg-card text-[15px] text-foreground shadow-xs transition-[color,box-shadow]",
        "focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/40",
        "has-[input[aria-invalid=true]]:border-destructive has-[input[aria-invalid=true]]:focus-within:ring-destructive/30",
        className,
      )}
      {...props}
    />
  );
}

/** The group's input: no border of its own, it takes the room the rest leaves. */
function InputGroupInput({
  className,
  ...props
}: React.ComponentProps<"input">) {
  return (
    <input
      data-slot="input-group-input"
      className={cn(
        "h-full min-w-0 flex-1 bg-transparent px-3 outline-none not-first:pl-1.5",
        "placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground",
        className,
      )}
      {...props}
    />
  );
}

export { InputGroup, InputGroupInput };
