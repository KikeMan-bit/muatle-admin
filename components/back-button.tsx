"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// "Volver" of the detail pages goes back to where one was (with its filters,
// which live in the URL). Opened directly, from a pasted link or a reload,
// there is nowhere to go back to inside the admin, and it goes to the list.

// The previous screen INSIDE the admin. It lives in the module: a reload
// clears it, which is just when the browser's history may point outside.
let previousPath: string | null = null;
let currentPath: string | null = null;

/** Goes once in the root layout: notes every change of screen. */
function NavigationTracker() {
  const pathname = usePathname();
  React.useEffect(() => {
    if (pathname === currentPath) return;
    previousPath = currentPath;
    currentPath = pathname;
  }, [pathname]);
  return null;
}

function canGoBackInApp() {
  return previousPath !== null;
}

function BackButton({
  fallback,
  label = "Volver",
  className,
}: {
  /** The list to go to when the page was opened directly. */
  fallback: string;
  label?: string;
  className?: string;
}) {
  const router = useRouter();
  return (
    <Button asChild variant="ghost" size="sm" className={cn("-ml-2 w-fit text-muted-foreground", className)}>
      {/* A real link (it opens in another tab) that, with history, goes back */}
      <Link
        href={fallback}
        onClick={(e) => {
          if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
          if (!canGoBackInApp()) return;
          e.preventDefault();
          router.back();
        }}
      >
        <ArrowLeft />
        {label}
      </Link>
    </Button>
  );
}

export { BackButton, NavigationTracker };
