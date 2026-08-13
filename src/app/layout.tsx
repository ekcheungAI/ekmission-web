import type { Metadata } from "next";
import Sidebar from "@/components/layout/Sidebar";
import { AuthProvider } from "@/components/auth/auth-provider";
import AuthGuard from "@/components/auth/auth-guard";
import "./globals.css";

export const metadata: Metadata = {
  title: "ekmission - Command Center",
  description: "Manage agents, machines, and projects from one place",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <AuthProvider>
          <AuthGuardWrapper>{children}</AuthGuardWrapper>
        </AuthProvider>
      </body>
    </html>
  );
}

function AuthGuardWrapper({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 ml-64">
          {children}
        </main>
      </div>
    </AuthGuard>
  );
}
