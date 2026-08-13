import { cookies } from "next/headers";

const AUTH_COOKIE_NAME = "ekmission_auth";

export async function isAuthRoute(pathname: string): Promise<boolean> {
  return pathname.startsWith("/login") || pathname.startsWith("/api/auth");
}

export async function isAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const authCookie = cookieStore.get(AUTH_COOKIE_NAME);
  return authCookie?.value === "authenticated";
}
