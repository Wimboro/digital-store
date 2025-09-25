import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { deserializeSettings } from "@/lib/serializers";
import { requireAdminSession } from "@/lib/auth-helpers";

const paymentGatewayEnum = z.enum([
  "stripe",
  "midtrans",
  "xendit",
  "manual-qris",
  "duitku",
]);

const settingsSchema = z.object({
  storeName: z.string().min(1),
  storeLogoUrl: z.string().url().nullable().optional(),
  contactEmail: z.string().email(),
  payment: z
    .object({
      activeGateway: paymentGatewayEnum,
      testMode: z.boolean().optional(),
    })
    .catchall(z.any()),
  storage: z
    .object({
      provider: z.enum(["local", "s3", "r2", "supabase"]),
    })
    .catchall(z.any()),
  policy: z.object({
    downloadExpiryHours: z.number().int().positive().default(72),
    maxDownloads: z.number().int().positive().default(3),
  }),
});

export async function GET() {
  try {
    await requireAdminSession();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const settings = await prisma.settings.findFirst({ orderBy: { createdAt: "desc" } });
  if (!settings) {
    return NextResponse.json(null);
  }

  return NextResponse.json(deserializeSettings(settings));
}

export async function PUT(request: Request) {
  try {
    await requireAdminSession();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const json = await request.json().catch(() => undefined);
  const parsed = settingsSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const existing = await prisma.settings.findFirst({ orderBy: { createdAt: "desc" } });

  const data = {
    storeName: parsed.data.storeName,
    storeLogoUrl: parsed.data.storeLogoUrl ?? null,
    contactEmail: parsed.data.contactEmail,
    payment: JSON.stringify(parsed.data.payment),
    storage: JSON.stringify(parsed.data.storage),
    policy: JSON.stringify(parsed.data.policy),
  };

  const updated = existing
    ? await prisma.settings.update({ where: { id: existing.id }, data })
    : await prisma.settings.create({ data: { id: "default-settings", ...data } });

  return NextResponse.json(deserializeSettings(updated));
}
