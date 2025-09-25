import { prisma } from "@/lib/prisma";
import { deserializeOrder } from "@/lib/orders";
import { OrdersTable } from "@/components/admin/orders-table";

export default async function AdminOrdersPage() {
  const orders = await prisma.order.findMany({ orderBy: { createdAt: "desc" } });
  const normalized = orders.map(deserializeOrder);

  return <OrdersTable orders={normalized} />;
}
