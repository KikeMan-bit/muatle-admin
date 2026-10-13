"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import { Tabs as TabsPrimitive } from "radix-ui";

const tabsListVariants = cva("inline-flex w-fit items-center", {
  variants: {
    variant: {
      default:
        "h-9 justify-center rounded-lg bg-muted p-[3px] text-muted-foreground",
      // Separate bordered chips, the filters over the panel's tables
      // ("Todos", "No disponibles") and the zone picker of the table panel.
      chips: "flex-wrap gap-1.5",
    },
  },
  defaultVariants: { variant: "default" },
});

const tabsTriggerVariants = cva(
  "inline-flex items-center justify-center gap-1.5 text-sm font-medium whitespace-nowrap transition-[color,box-shadow,border-color] outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "h-[calc(100%-1px)] flex-1 rounded-md border border-transparent px-2 py-1 text-foreground data-[state=active]:bg-card data-[state=active]:shadow-sm",
        chips:
          "h-9 rounded-lg border border-border bg-card px-3 text-muted-foreground hover:text-foreground data-[state=active]:border-primary data-[state=active]:text-primary-strong",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

type TabsVariant = VariantProps<typeof tabsListVariants>["variant"];

// The list decides the look; its triggers read it from here so each one
// does not have to repeat it.
const TabsVariantContext = React.createContext<TabsVariant>("default");

function Tabs({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      className={cn("flex flex-col gap-2", className)}
      {...props}
    />
  );
}

function TabsList({
  className,
  variant,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List> &
  VariantProps<typeof tabsListVariants>) {
  return (
    <TabsVariantContext value={variant}>
      <TabsPrimitive.List
        data-slot="tabs-list"
        className={cn(tabsListVariants({ variant }), className)}
        {...props}
      />
    </TabsVariantContext>
  );
}

function TabsTrigger({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  const variant = React.use(TabsVariantContext);

  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(tabsTriggerVariants({ variant }), className)}
      {...props}
    />
  );
}

function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn("flex-1 outline-none", className)}
      {...props}
    />
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContent };
