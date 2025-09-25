import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { deserializeProduct } from "@/lib/serializers";
import { requireAdminSession } from "@/lib/auth-helpers";

const productInputSchema = z.object({
  title: z.string().min(1),
  slug: z.string().min(3),
  shortDescription: z.string().min(1),
  description: z.string().min(1),
  priceIDR: z.number().int().positive(),
  salePriceIDR: z.number().int().positive().optional(),
  images: z.array(z.string().min(1)).min(1),
  fileKey: z.string().min(1),
  isActive: z.boolean().default(true),
  tags: z.array(z.string()).default([]),
});

export async function GET() {
  try {
    await requireAdminSession();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const products = await prisma.product.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(products.map(deserializeProduct));
}

export async function POST(request: Request) {
  try {
    await requireAdminSession();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const json = await request.json().catch(() => undefined);
  const parsed = productInputSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const existing = await prisma.product.findUnique({ where: { slug: parsed.data.slug } });
  if (existing) {
    return NextResponse.json({ error: "Slug already exists" }, { status: 409 });
  }

  const product = await prisma.product.create({
    data: {
      title: parsed.data.title,
      slug: parsed.data.slug,
      shortDescription: parsed.data.shortDescription,
      description: parsed.data.description,
      priceIDR: parsed.data.priceIDR,
      salePriceIDR: parsed.data.salePriceIDR ?? null,
      fileKey: parsed.data.fileKey,
      isActive: parsed.data.isActive,
      images: JSON.stringify(parsed.data.images),
      tags: JSON.stringify(parsed.data.tags),
    },
  });

  return NextResponse.json(deserializeProduct(product), { status: 201 });
}
