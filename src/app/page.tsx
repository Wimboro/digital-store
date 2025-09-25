import { prisma } from "@/lib/prisma";
import { deserializeProduct, deserializeSettings } from "@/lib/serializers";
import { Storefront } from "@/components/storefront/storefront";

export default async function HomePage() {
  const [productRecords, settingsRecord] = await Promise.all([
    prisma.product.findMany({ where: { isActive: true }, orderBy: { createdAt: "desc" } }),
    prisma.settings.findFirst({ orderBy: { createdAt: "desc" } }),
  ]);

  const products = productRecords.map(deserializeProduct);
  const settings = settingsRecord ? deserializeSettings(settingsRecord) : null;

  return (
    <main className="container mx-auto flex max-w-6xl flex-col gap-16 py-12">
      <Storefront products={products} settings={settings} />
    </main>
  );
}
