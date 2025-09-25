import { prisma } from "@/lib/prisma";
import { deserializeProduct } from "@/lib/serializers";
import { ProductsManager } from "@/components/admin/products-manager";

export default async function AdminProductsPage() {
  const products = await prisma.product.findMany({ orderBy: { createdAt: "desc" } });
  const normalized = products.map(deserializeProduct);

  return <ProductsManager products={normalized} />;
}
