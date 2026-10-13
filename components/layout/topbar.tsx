"use client";

import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";

import { Button } from "@/components/ui/button";
import { sectionForPath } from "@/lib/nav";

/** One row with the section's name, and the menu button on a phone. It stays on top while the screen scrolls. */
function Topbar({ onMenuClick }: { onMenuClick: () => void }) {
  const pathname = usePathname();
  const section = sectionForPath(pathname);

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-card px-4 md:px-8">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-2">
        <Button variant="ghost" size="icon-sm" onClick={onMenuClick} aria-label="Abrir menú" className="-ml-1.5 text-muted-foreground lg:hidden">
          <Menu />
        </Button>
        <h1 className="min-w-0 truncate text-lg font-semibold tracking-tight text-foreground">{section?.title ?? ""}</h1>
      </div>
    </header>
  );
}

export { Topbar };
