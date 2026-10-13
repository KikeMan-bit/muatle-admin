"use client";

import { Toaster as Sonner, type ToasterProps } from "sonner";

/** The toasts, neutral like the rest: white card, hairline border, no colored wash. */
function Toaster(props: ToasterProps) {
  return (
    <Sonner
      position="bottom-right"
      closeButton
      toastOptions={{
        classNames: {
          toast: "!rounded-xl !border-border !bg-card !text-card-foreground !shadow-lg",
          title: "!text-sm !font-medium",
          description: "!text-sm",
        },
      }}
      {...props}
    />
  );
}

export { Toaster };
