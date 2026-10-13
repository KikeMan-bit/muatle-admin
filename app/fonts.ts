import { Geist, Geist_Mono, Montserrat } from "next/font/google";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Only the logo uses it: the wordmark needs a geometric heavy cut that Geist
// does not have, the same as in the businesses' panel.
const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
});

/** The fonts' CSS variables, for the `<html>` of the root layout. */
export const fontVariables = `${geistSans.variable} ${geistMono.variable} ${montserrat.variable}`;
