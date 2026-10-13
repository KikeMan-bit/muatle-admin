import type { Metadata } from "next";

import "./globals.css";

import { NavigationTracker } from "@/components/back-button";

import { fontVariables } from "./fonts";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: { default: "Muatle Admin", template: "%s · Muatle Admin" },
  description: "Administración de Muatle: negocios, suscripciones y cuentas",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${fontVariables} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">
        <Providers>
          {children}
          {/* Notes the previous screen, so "Volver" goes back to where one was */}
          <NavigationTracker />
        </Providers>
      </body>
    </html>
  );
}
