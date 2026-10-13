import { getServerSession } from "next-auth";

import { PanelShell } from "@/components/layout/panel-shell";
import { PanelUnavailable } from "@/components/layout/panel-unavailable";
import { getMe, type AdminUser } from "@/lib/admin-api";
import { ApiError } from "@/lib/api";
import { authOptions } from "@/lib/auth";

/**
 * The admin opens with who is signed in already loaded, read from the backend
 * with the session's token: a token the backend no longer takes, or an account
 * that is no longer the team's, is told so instead of a half-drawn screen.
 */
export default async function PanelLayout({ children }: LayoutProps<"/">) {
  // The proxy already sends anyone without a session to /login; this only
  // misses when the session can't be read, and signing out mends that
  const session = await getServerSession(authOptions);
  if (!session?.apiToken) return <PanelUnavailable reason="session" />;

  let user: AdminUser;
  try {
    user = await getMe(session.apiToken);
  } catch (error) {
    const refused = error instanceof ApiError && (error.status === 401 || error.status === 403);
    return <PanelUnavailable reason={refused ? "session" : "unreachable"} />;
  }

  return <PanelShell user={user}>{children}</PanelShell>;
}
