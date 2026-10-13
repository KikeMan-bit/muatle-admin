import type { Metadata } from "next";

import { AccountDetail } from "./components/account-detail";

export const metadata: Metadata = {
  title: "Cuenta",
};

export default async function AccountPage({ params }: PageProps<"/accounts/[id]">) {
  const { id } = await params;
  return <AccountDetail id={id} />;
}
