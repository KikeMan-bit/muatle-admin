import type { AuthOptions, User } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

import { apiRequest, errorMessage } from "@/lib/api";
import type { AdminUser } from "@/lib/admin-api";

/** What the backend answers an admin sign-in with. */
type LoginResponse = { user: AdminUser; token: string };

// A week: the admin is opened now and then, not left open on a register all
// day. The backend's own session ends after a month without use.
const SESSION_MAX_AGE = 7 * 24 * 60 * 60;

/** The browser signing in, for the account's list of sessions: the backend names it "Chrome en Windows". */
function userAgent(req: { headers?: Record<string, unknown> } | undefined): string {
  const agent = req?.headers?.["user-agent"];
  return typeof agent === "string" ? agent.slice(0, 300) : "";
}

export const authOptions: AuthOptions = {
  pages: { signIn: "/login" },
  providers: [
    CredentialsProvider({
      id: "credentials",
      name: "Muatle",
      credentials: {
        email: { label: "Correo electrónico", type: "email" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials, req): Promise<User | null> {
        if (!credentials?.email || !credentials.password) return null;
        let data: LoginResponse;
        try {
          data = await apiRequest<LoginResponse>("/admin/login/", {
            method: "POST",
            body: { email: credentials.email, password: credentials.password, agent: userAgent(req) },
          });
        } catch (error) {
          // The backend's refusal reaches the form as the `error` signIn() returns
          throw new Error(errorMessage(error));
        }
        return {
          id: String(data.user.id),
          name: `${data.user.first_name} ${data.user.last_name}`.trim() || data.user.email,
          email: data.user.email,
          apiToken: data.token,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user, trigger, session }) {
      // `user` only comes along right after signing in
      if (user) token.apiToken = user.apiToken;
      // A new name, from the account's own page
      if (trigger === "update" && typeof session?.name === "string") token.name = session.name;
      return token;
    },
    session({ session, token }) {
      session.apiToken = token.apiToken;
      return session;
    },
  },
  events: {
    async signOut({ token }) {
      // The session ends on the backend too, on this device only
      if (token?.apiToken) {
        await apiRequest("/auth/logout/", { method: "POST", body: {}, token: token.apiToken }).catch(() => undefined);
      }
    },
  },
  session: { strategy: "jwt", maxAge: SESSION_MAX_AGE },
  secret: process.env.NEXTAUTH_SECRET,
};
