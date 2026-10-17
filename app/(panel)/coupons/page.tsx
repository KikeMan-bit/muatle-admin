import type { Metadata } from "next";

import { Coupons } from "./components/coupons";

export const metadata: Metadata = {
  title: "Cupones",
};

export default function CouponsPage() {
  return <Coupons />;
}
