import type { Metadata } from "next";

import { LoginForm } from "./components/login-form";

export const metadata: Metadata = {
  title: "Iniciar sesión",
};

/** Only paths of this same app: an absolute URL in `callbackUrl` would send the session elsewhere. */
function safeCallbackUrl(value: string | string[] | undefined): string {
  const url = Array.isArray(value) ? value[0] : value;
  return url && url.startsWith("/") && !url.startsWith("//") ? url : "/";
}

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  // Where the admin was headed when the proxy asked for a session
  const { callbackUrl } = await searchParams;
  return <LoginForm callbackUrl={safeCallbackUrl(callbackUrl)} />;
}
