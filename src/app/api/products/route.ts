import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { deserializeProduct } from "@/lib/serializers";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const searchQuery = searchParams.get("q")?.trim();
  const tag = searchParams.get("tag")?.trim()?.toLowerCase();

  const products = await prisma.product.findMany({
    where: {
      isActive: true,
      ...(searchQuery
        ? {
            OR: [
              { title: { contains: searchQuery } },
              { shortDescription: { contains: searchQuery } },
              { description: { contains: searchQuery } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
  });

  const normalized = products.map(deserializeProduct);

  const filtered = tag
    ? normalized.filter((product) =>
        product.tags.map((value) => value.toLowerCase()).includes(tag),
      )
    : normalized;

  return NextResponse.json(filtered);
}
