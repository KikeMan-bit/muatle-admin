import type { Metadata } from "next";

import { BusinessesList } from "./components/businesses-list";

export const metadata: Metadata = {
  title: "Negocios",
};

export default function BusinessesPage() {
  return <BusinessesList />;
}
