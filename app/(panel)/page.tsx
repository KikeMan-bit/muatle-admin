import type { Metadata } from "next";

import { Dashboard } from "./components/dashboard";

export const metadata: Metadata = {
  title: "Inicio",
};

export default function HomePage() {
  return <Dashboard />;
}
