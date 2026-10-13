"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

// Filters, search, tab and page that SURVIVE opening a detail and coming back.
//
// They live in the URL (`/businesses?q=ana&page=2`), so the browser's Back
// returns to the list as it was, reloading or sharing the link shows the same,
// and coming back through a bare link (the menu, "Volver") restores what was
// last used on this screen during the session (sessionStorage, per tab).
//
// The URL is rewritten with `history.replaceState`, which Next syncs with
// `useSearchParams` without a round trip and without filling the history.

export type UrlStateValue = string | number | boolean;
export type UrlStateShape = Record<string, UrlStateValue>;

type Setter<T> = (patch: Partial<T> | ((prev: T) => Partial<T>)) => void;

/** `{ open: false, tab: "info" }` is typed as `{ open: boolean; tab: string }`: the default is not the only value. */
export type Widen<T> = {
  [K in keyof T]: T[K] extends boolean ? boolean : T[K] extends number ? number : T[K] extends string ? string : T[K];
};

type Options = {
  /** Restore the session's last values when coming back through a link without filters. On by default. */
  persist?: boolean;
};

const useIsomorphicLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

function parse<T extends UrlStateShape>(defaults: T, params: { get(key: string): string | null }): T {
  const out: UrlStateShape = { ...defaults };
  for (const key of Object.keys(defaults)) {
    const raw = params.get(key);
    if (raw == null) continue;
    const fallback = defaults[key];
    if (typeof fallback === "number") {
      const n = Number(raw);
      if (raw !== "" && Number.isFinite(n)) out[key] = n;
    } else if (typeof fallback === "boolean") {
      out[key] = raw === "1" || raw === "true";
    } else {
      out[key] = raw;
    }
  }
  return out as T;
}

/** What goes to the URL: only what differs from the default, so it stays short. */
function serialize<T extends UrlStateShape>(defaults: T, state: T, into = new URLSearchParams()) {
  for (const key of Object.keys(defaults)) {
    const value = state[key];
    if (value === defaults[key] || value === "") into.delete(key);
    else into.set(key, typeof value === "boolean" ? (value ? "1" : "0") : String(value));
  }
  return into;
}

/**
 * Forgets what a route saved (its filters, tab, page). The sidebar uses it:
 * ENTERING a section starts from scratch, while coming back from a detail
 * brings everything as it was.
 */
export function forgetUrlState(pathname: string) {
  try {
    const prefix = `url-state:${pathname}:`;
    for (let i = window.sessionStorage.length - 1; i >= 0; i--) {
      const key = window.sessionStorage.key(i);
      if (key?.startsWith(prefix)) window.sessionStorage.removeItem(key);
    }
  } catch {
    // storage blocked: nothing was saved
  }
}

function same<T extends UrlStateShape>(a: T, b: T) {
  for (const key of Object.keys(a)) if (a[key] !== b[key]) return false;
  return true;
}

function readStorage(key: string): string | null {
  try {
    return window.sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: string) {
  try {
    window.sessionStorage.setItem(key, value);
  } catch {
    // storage blocked: the convenience is lost, nothing else
  }
}

/**
 * Screen state kept in the URL. `defaults` defines the keys, their default
 * values and their type (number, boolean or text). Returns the state, a
 * setter that takes partial changes, and `reset`.
 *
 *   const [f, setF] = useUrlState({ q: "", plan: "", page: 1, size: 10 });
 *   setF({ plan: "pro", page: 1 });
 */
export function useUrlState<D extends UrlStateShape>(
  defaults: D,
  options: Options = {},
): [Widen<D>, Setter<Widen<D>>, { reset: () => void }] {
  return useUrlStateImpl(defaults as Widen<D>, options);
}

// The URL and sessionStorage are the external systems this hook follows: when
// they change (Back/Forward, a link), the state is set from them inside an
// effect, which is what the rule guards against in general but is the point here.
/* eslint-disable react-hooks/set-state-in-effect */
function useUrlStateImpl<T extends UrlStateShape>(
  defaults: T,
  { persist = true }: Options,
): [T, Setter<T>, { reset: () => void }] {
  // The defaults are fixed on the first render: they are the screen's constants
  const [initial] = useState(defaults);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const keys = Object.keys(initial);
  const storageKey = `url-state:${pathname}:${keys.join(",")}`;

  const [state, setState] = useState<T>(() => parse(initial, searchParams));
  const stateRef = useRef(state);
  // The URLs we wrote: when Next hands them back through `useSearchParams`
  // they are already in the state, even an old one arriving late
  const written = useRef<Set<string>>(new Set());

  const commit = useCallback(
    (next: T) => {
      const params = serialize(initial, next, new URLSearchParams(window.location.search));
      const qs = params.toString();
      const ours = serialize(initial, next).toString();
      written.current.add(ours);
      if (persist) writeStorage(storageKey, ours);
      const url = `${window.location.pathname}${qs ? `?${qs}` : ""}${window.location.hash}`;
      if (url !== `${window.location.pathname}${window.location.search}${window.location.hash}`) {
        // `null` and not `history.state`: with Next's own state inside, Next
        // takes the call as its own and does not update `useSearchParams`
        window.history.replaceState(null, "", url);
      }
    },
    [initial, persist, storageKey],
  );

  const apply = useCallback((next: T) => {
    stateRef.current = next;
    setState(next);
  }, []);

  const set = useCallback<Setter<T>>(
    (patch) => {
      const prev = stateRef.current;
      const next = { ...prev, ...(typeof patch === "function" ? patch(prev) : patch) } as T;
      if (same(prev, next)) return;
      apply(next);
      commit(next);
    },
    [apply, commit],
  );

  const reset = useCallback(() => set(initial), [set, initial]);

  // Coming in with none of our keys in the URL (the menu, "Volver"), the
  // screen's last values are brought back, before paint
  useIsomorphicLayoutEffect(() => {
    if (!persist) return;
    const params = new URLSearchParams(window.location.search);
    if (keys.some((k) => params.has(k))) {
      writeStorage(storageKey, serialize(initial, parse(initial, params)).toString());
      return;
    }
    const saved = readStorage(storageKey);
    if (!saved) return;
    const restored = parse(initial, new URLSearchParams(saved));
    if (same(restored, stateRef.current)) return;
    apply(restored);
    commit(restored);
    // Only on mount: from then on, the URL leads
  }, []);

  // The URL changed from outside (Back/Forward, or a link to this same screen
  // with other filters): the state follows it
  const fromUrl = serialize(initial, parse(initial, searchParams)).toString();
  useEffect(() => {
    if (fromUrl === serialize(initial, stateRef.current).toString()) {
      written.current.clear();
      return;
    }
    if (written.current.has(fromUrl)) return;
    if (persist && fromUrl === "") {
      if (readStorage(storageKey) === null) {
        // Entered again from the menu, which forgot what was saved: from scratch
        apply(initial);
        writeStorage(storageKey, "");
        return;
      }
      // A bare link to this same screen: what is on screen stays and goes back to the URL
      commit(stateRef.current);
      return;
    }
    apply(parse(initial, new URLSearchParams(fromUrl)));
    if (persist) writeStorage(storageKey, fromUrl);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromUrl]);

  return [state, set, { reset }];
}
/* eslint-enable react-hooks/set-state-in-effect */
