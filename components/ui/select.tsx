import * as React from "react";
import { ChevronsUpDown } from "lucide-react";

import { cn } from "@/lib/utils";

type SelectProps = React.ComponentProps<"select"> & {
  /** Icon shown left of the value, like the calendar on the date filter. */
  icon?: React.ReactNode;
  /** Classes for the wrapper, not for the <select> itself. */
  wrapperClassName?: string;
};

/**
 * Native `<select>` with its own arrow turned off and the double chevron drawn
 * separately. macOS — where the designs come from — already renders the native
 * control this way, but Windows and Linux paint a different single arrow, so
 * the indicator is drawn by hand to keep the control identical on all three.
 *
 * Staying native is deliberate: on mobile it opens the system picker, which
 * beats any floating list we could build.
 */
function Select({
  className,
  wrapperClassName,
  icon,
  children,
  ...props
}: SelectProps) {
  return (
    <div className={cn("relative w-full", wrapperClassName)}>
      {icon ? (
        <span className="pointer-events-none absolute top-1/2 left-3 flex -translate-y-1/2 items-center text-muted-foreground [&_svg:not([class*='size-'])]:size-4">
          {icon}
        </span>
      ) : null}
      <select
        data-slot="select"
        className={cn(
          "h-10 w-full appearance-none rounded-lg border border-input bg-card py-1 pr-9 text-[15px] text-foreground shadow-xs transition-[color,box-shadow] outline-none",
          icon ? "pl-9" : "pl-3",
          "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/40",
          "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
          "aria-invalid:border-destructive aria-invalid:focus-visible:ring-destructive/30",
          // An unanswered select shows an empty option; the text stays grey
          // until there is a value, the same way a placeholder would.
          "[&:has(option[value='']:checked)]:text-muted-foreground",
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronsUpDown
        aria-hidden
        className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground"
      />
    </div>
  );
}

export { Select };
