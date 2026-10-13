import { NextResponse, type NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

// The one page for whoever has no session. With a session it leads to the admin instead.
const SIGNED_OUT_PAGES = ["/login"];

function matches(pathname: string, pages: string[]): boolean {
  return pages.some((page) => pathname === page || pathname.startsWith(`${page}/`));
}

/**
 * Keeps the admin behind a session: without one, any other page sends to
 * /login, remembering where it was headed. It only looks at the cookie; the
 * backend still checks the token, and that it is the team's, on every request.
 */
export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const session = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

  if (session) {
    return matches(pathname, SIGNED_OUT_PAGES)
      ? NextResponse.redirect(new URL("/", request.url))
      : NextResponse.next();
  }

  if (matches(pathname, SIGNED_OUT_PAGES)) return NextResponse.next();

  const signIn = new URL("/login", request.url);
  if (pathname !== "/") signIn.searchParams.set("callbackUrl", `${pathname}${search}`);
  return NextResponse.redirect(signIn);
}

export const config = {
  // Everything but NextAuth's own routes, Next's internals and files such as favicon.ico
  matcher: ["/((?!api/auth|_next|.*\\..*).*)"],
};
