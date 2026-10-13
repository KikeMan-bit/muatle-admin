"use client";

import * as React from "react";
import { Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/**
 * The search box of the lists. What is typed shows at once, but `onChange`
 * fires only once typing stops (and without spare spaces): otherwise every
 * key is a request. `value` is the committed value, the one in the URL; when
 * it changes from outside ("Limpiar", coming back to the list), the text follows.
 */
function SearchInput({
  value,
  onChange,
  placeholder = "Buscar…",
  delay = 400,
  className,
  "aria-label": ariaLabel,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  delay?: number;
  /** The box's width: `w-full sm:w-80`. */
  className?: string;
  "aria-label"?: string;
}) {
  const [text, setText] = React.useState(value);
  const committed = React.useRef(value);
  // The latest `onChange`, for the debounce effect below, which runs after this one
  const onChangeRef = React.useRef(onChange);
  React.useEffect(() => {
    onChangeRef.current = onChange;
  });

  React.useEffect(() => {
    if (value !== committed.current) {
      committed.current = value;
      setText(value);
    }
  }, [value]);

  React.useEffect(() => {
    const next = text.trim();
    if (next === committed.current) return;
    const t = setTimeout(() => {
      committed.current = next;
      onChangeRef.current(next);
    }, delay);
    return () => clearTimeout(t);
  }, [text, delay]);

  const clear = () => {
    setText("");
    if (committed.current !== "") {
      committed.current = "";
      onChangeRef.current("");
    }
  };

  return (
    <div className={cn("relative w-full sm:w-80", className)}>
      <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="text"
        role="searchbox"
        placeholder={placeholder}
        aria-label={ariaLabel ?? placeholder}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape" && text) {
            e.preventDefault();
            clear();
          } else if (e.key === "Enter") {
            // Enter commits without waiting
            const next = text.trim();
            if (next !== committed.current) {
              committed.current = next;
              onChangeRef.current(next);
            }
          }
        }}
        className="h-9 pr-9 pl-9 text-sm"
      />
      {text ? (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={clear}
          aria-label="Limpiar búsqueda"
          className="absolute top-1/2 right-0.5 size-8 -translate-y-1/2 text-muted-foreground"
        >
          <X />
        </Button>
      ) : null}
    </div>
  );
}

export { SearchInput };
