import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const AUTH_COOKIE_NAME = "ekmission_auth";

export async function GET() {
  const cookieStore = await cookies();
  const authCookie = cookieStore.get(AUTH_COOKIE_NAME);

  return NextResponse.json({ 
    authenticated: authCookie?.value === "authenticated" 
  });
}
