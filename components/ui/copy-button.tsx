"use client";

import * as React from "react";
import { Check, Clipboard } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const FEEDBACK_MS = 2000;

/**
 * Puts the text on the clipboard. The async API only exists on secure
 * origins, so a phone opening the panel over the local network falls back to
 * copying from a hidden textarea; focus goes back where it was after that.
 */
async function writeClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const focused = document.activeElement;
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.append(area);
    area.select();
    const copied = document.execCommand("copy");
    area.remove();
    if (focused instanceof HTMLElement) focused.focus();
    return copied;
  }
}

type CopyButtonProps = {
  text: string;
  /** What gets copied, to tell the "Copiar" buttons of a page apart. */
  subject: string;
  className?: string;
};

/**
 * "Copiar" that turns into "Copiado" for a moment. Both words share one grid
 * cell, so the button keeps the width of the longer one and nothing beside it
 * moves; the change is also announced to screen readers.
 */
function CopyButton({ text, subject, className }: CopyButtonProps) {
  const [copied, setCopied] = React.useState(false);
  const timer = React.useRef<number | undefined>(undefined);

  React.useEffect(() => () => window.clearTimeout(timer.current), []);

  const copy = async () => {
    if (!(await writeClipboard(text))) return;
    setCopied(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(false), FEEDBACK_MS);
  };

  return (
    <>
      <Button
        type="button"
        variant="outline"
        aria-label={copied ? "Copiado" : `Copiar ${subject}`}
        className={cn("h-8 gap-1.5 px-2.5 has-[>svg]:px-2.5", className)}
        onClick={copy}
      >
        <span className="grid">
          <span className={cn("col-start-1 row-start-1", copied && "invisible")}>
            Copiar
          </span>
          <span className={cn("col-start-1 row-start-1", !copied && "invisible")}>
            Copiado
          </span>
        </span>
        {copied ? <Check /> : <Clipboard />}
      </Button>
      <span role="status" className="sr-only">
        {copied ? `${subject} copiado` : ""}
      </span>
    </>
  );
}

export { CopyButton };
