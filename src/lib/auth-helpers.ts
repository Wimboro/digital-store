import { getServerAuthSession } from "@/lib/auth";

export async function requireAdminSession() {
  const session = await getServerAuthSession();
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("UNAUTHORIZED");
  }
  return session;
}

export async function requireStaffSession() {
  const session = await getServerAuthSession();
  if (!session?.user) {
    throw new Error("UNAUTHORIZED");
  }
  return session;
}
