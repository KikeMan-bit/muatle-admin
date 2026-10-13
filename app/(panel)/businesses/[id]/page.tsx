import type { Metadata } from "next";

import { BusinessDetail } from "./components/business-detail";

export const metadata: Metadata = {
  title: "Negocio",
};

export default async function BusinessPage({ params }: PageProps<"/businesses/[id]">) {
  const { id } = await params;
  return <BusinessDetail id={id} />;
}
