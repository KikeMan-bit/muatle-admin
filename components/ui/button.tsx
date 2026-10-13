import * as React from "react";
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:border-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "rounded-lg bg-primary text-primary-foreground shadow-xs hover:bg-primary-strong",
        outline:
          "rounded-lg border border-border bg-card text-foreground hover:bg-muted",
        secondary:
          "rounded-lg bg-secondary text-secondary-foreground border border-border hover:bg-accent",
        ghost: "rounded-lg text-foreground hover:bg-muted",
        dark: "rounded-lg bg-neutral-800 text-white hover:bg-neutral-700",
        // red-600 rather than the `--destructive` token: white text on it
        // reaches 4.83:1, which the lighter red of the field borders does not.
        destructive: "rounded-lg bg-red-600 text-white hover:bg-red-700",
        link: "text-primary-strong underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2 has-[>svg]:px-3.5",
        sm: "h-8 gap-1.5 px-3 text-[13px] has-[>svg]:px-2.5",
        lg: "h-11 px-6 has-[>svg]:px-5",
        icon: "size-9",
        "icon-sm": "size-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot.Root : "button";

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
