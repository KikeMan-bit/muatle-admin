"use client";

import * as React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SessionProvider } from "next-auth/react";

import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

let browserQueryClient: QueryClient | undefined;

function getQueryClient() {
  const make = () =>
    new QueryClient({
      defaultOptions: {
        queries: {
          // What the admin reads changes slowly; a list is read again when its
          // screen opens, not every time the window gets focus
          staleTime: 30_000,
          refetchOnWindowFocus: false,
          retry: 1,
        },
      },
    });
  // Server requests stay isolated; the browser keeps one cache across renders
  if (typeof window === "undefined") return make();
  browserQueryClient ??= make();
  return browserQueryClient;
}

/** What every screen needs around it: the session, the query cache, tooltips and toasts. */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <QueryClientProvider client={getQueryClient()}>
        <TooltipProvider>{children}</TooltipProvider>
        <Toaster />
      </QueryClientProvider>
    </SessionProvider>
  );
}
