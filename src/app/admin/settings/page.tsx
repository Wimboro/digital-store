import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { deserializeSettings } from "@/lib/serializers";
import { SettingsForm } from "@/components/admin/settings-form";
import { getServerAuthSession } from "@/lib/auth";

export default async function AdminSettingsPage() {
  const session = await getServerAuthSession();
  if (session?.user?.role !== "ADMIN") {
    redirect("/admin");
  }

  const settings = await prisma.settings.findFirst({ orderBy: { createdAt: "desc" } });
  const normalized = settings ? deserializeSettings(settings) : null;

  return <SettingsForm settings={normalized} />;
}
