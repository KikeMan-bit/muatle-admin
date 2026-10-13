import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface User {
    /** The backend's API token, sent as `Authorization: Token …`. */
    apiToken: string;
  }

  interface Session {
    apiToken: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    apiToken: string;
  }
}
