import Image from "next/image";
import * as React from "react";

import { cn } from "@/lib/utils";

import logo from "@/public/logo.png";

/**
 * The brand tile: Muatle's logo, a winking face in white rings on a black
 * field, the same as in the businesses' panel. Size it through `className`.
 */
function LogoMark({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span aria-hidden className={cn("block shrink-0 overflow-hidden rounded-[20%]", className)} {...props}>
      <Image src={logo} alt="" sizes="100px" className="size-full" />
    </span>
  );
}

/** Tile plus wordmark, and what sets this app apart from the panel: "Admin". */
function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("flex items-center gap-1.5", className)}>
      <LogoMark className="size-6.5" />
      <span className="font-brand text-xl font-bold text-foreground">Muatle</span>
      <span className="rounded-md border border-border px-1.5 py-0.5 text-[11px] font-semibold tracking-wide text-muted-foreground">
        ADMIN
      </span>
    </span>
  );
}

export { Logo, LogoMark };
