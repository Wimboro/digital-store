import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { getServerAuthSession } from "@/lib/auth";
import { AdminNavigation } from "@/components/admin/navigation";

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getServerAuthSession();

  if (!session?.user) {
    redirect(`/auth/login?callbackUrl=/admin`);
  }

  return (
    <div className="min-h-screen bg-muted/40">
      <AdminNavigation user={session.user} />
      <main className="container mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:py-10">{children}</main>
    </div>
  );
}
