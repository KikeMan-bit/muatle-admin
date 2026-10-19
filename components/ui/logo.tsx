import Image from "next/image";

import { cn } from "@/lib/utils";

import logo from "@/public/logo-full.png";

/**
 * Mark and wordmark, the same file as the businesses' panel, plus what sets
 * this app apart from it: "Admin". The wordmark is black in the file, for the
 * light surfaces the app draws; 24px tall it fits the sidebar header beside
 * the badge, with the close button on phones.
 */
function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("flex items-center gap-2", className)}>
      <Image src={logo} alt="Muatle" sizes="140px" className="h-6 w-auto" />
      <span className="rounded-md border border-border px-1.5 py-0.5 text-[11px] font-semibold tracking-wide text-muted-foreground">
        ADMIN
      </span>
    </span>
  );
}

export { Logo };
