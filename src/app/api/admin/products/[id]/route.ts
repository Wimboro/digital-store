import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { deserializeProduct } from "@/lib/serializers";
import { requireAdminSession } from "@/lib/auth-helpers";

const updateSchema = z
  .object({
    title: z.string().min(1).optional(),
    slug: z.string().min(3).optional(),
    shortDescription: z.string().min(1).optional(),
    description: z.string().min(1).optional(),
    priceIDR: z.number().int().positive().optional(),
    salePriceIDR: z.number().int().positive().nullable().optional(),
    images: z.array(z.string().min(1)).min(1).optional(),
    fileKey: z.string().min(1).optional(),
    isActive: z.boolean().optional(),
    tags: z.array(z.string()).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    await requireAdminSession();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  const json = await request.json().catch(() => undefined);
  const parsed = updateSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.message }, { status: 400 });
  }

  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  if (parsed.data.slug && parsed.data.slug !== product.slug) {
    const slugExists = await prisma.product.findUnique({ where: { slug: parsed.data.slug } });
    if (slugExists) {
      return NextResponse.json({ error: "Slug already exists" }, { status: 409 });
    }
  }

  const updateData: Record<string, unknown> = {};

  if (parsed.data.title !== undefined) updateData.title = parsed.data.title;
  if (parsed.data.slug !== undefined) updateData.slug = parsed.data.slug;
  if (parsed.data.shortDescription !== undefined)
    updateData.shortDescription = parsed.data.shortDescription;
  if (parsed.data.description !== undefined) updateData.description = parsed.data.description;
  if (parsed.data.priceIDR !== undefined) updateData.priceIDR = parsed.data.priceIDR;
  if (parsed.data.salePriceIDR !== undefined)
    updateData.salePriceIDR = parsed.data.salePriceIDR ?? null;
  if (parsed.data.fileKey !== undefined) updateData.fileKey = parsed.data.fileKey;
  if (parsed.data.isActive !== undefined) updateData.isActive = parsed.data.isActive;
  if (parsed.data.images)
    updateData.images = JSON.stringify(parsed.data.images);
  if (parsed.data.tags)
    updateData.tags = JSON.stringify(parsed.data.tags);

  const updated = await prisma.product.update({
    where: { id },
    data: updateData,
  });

  return NextResponse.json(deserializeProduct(updated));
}

export async function DELETE(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    await requireAdminSession();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  await prisma.product.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
