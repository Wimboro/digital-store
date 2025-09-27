import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { deserializeProduct, deserializeSettings } from "@/lib/serializers";
import { resolveDownloadUrl } from "@/lib/storage";

export async function GET(request: NextRequest, context: { params: Promise<{ token: string }> }) {
  const { token } = await context.params;

  const downloadToken = await prisma.downloadToken.findUnique({
    where: { token },
    include: { product: true, order: true },
  });

  if (!downloadToken) {
    return NextResponse.json({ error: "Link unduhan tidak valid." }, { status: 404 });
  }

  if (downloadToken.timesDownloaded >= downloadToken.maxDownloads) {
    return NextResponse.json(
      { error: "Kuota unduhan telah habis. Silakan hubungi support." },
      { status: 410 },
    );
  }

  if (downloadToken.expiresAt.getTime() < Date.now()) {
    return NextResponse.json(
      { error: "Link unduhan sudah kadaluarsa." },
      { status: 410 },
    );
  }

  const [settingsRecord] = await Promise.all([
    prisma.settings.findFirst({ orderBy: { createdAt: "desc" } }),
  ]);

  if (!settingsRecord) {
    return NextResponse.json({ error: "Store belum dikonfigurasi." }, { status: 500 });
  }

  const settings = deserializeSettings(settingsRecord);
  const product = deserializeProduct(downloadToken.product);

  const storage = settings.storage as Record<string, unknown>;
  const fallbackUrl = new URL(`/downloads/${product.fileKey}`, request.url).toString();
  let url: string;

  try {
    url = await resolveDownloadUrl(product.fileKey, storage, fallbackUrl);
  } catch (error) {
    console.error("Failed to resolve download URL", error);
    return NextResponse.json({ error: "Tidak dapat menyiapkan unduhan." }, { status: 500 });
  }

  await prisma.downloadToken.update({
    where: { id: downloadToken.id },
    data: { timesDownloaded: { increment: 1 } },
  });

  return NextResponse.redirect(url, { status: 302 });
}
