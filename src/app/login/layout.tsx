import { redirect } from "next/navigation";
import { isAuthenticated } from "@/lib/auth-utils";

export default async function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const authed = await isAuthenticated();
  
  // If already authenticated, redirect to dashboard
  if (authed) {
    redirect("/");
  }
  
  return <>{children}</>;
}
