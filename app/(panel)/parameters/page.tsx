import type { Metadata } from "next";

import { Parameters } from "./components/parameters";

export const metadata: Metadata = {
  title: "Parámetros",
};

export default function ParametersPage() {
  return <Parameters />;
}
