import type { Metadata } from "next";

import { PartnerDetail } from "./components/partner-detail";

export const metadata: Metadata = {
  title: "Aliado",
};

export default async function PartnerPage({ params }: PageProps<"/partners/[id]">) {
  const { id } = await params;
  return <PartnerDetail id={id} />;
}
