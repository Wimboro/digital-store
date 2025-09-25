import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { deserializeOrder } from "@/lib/orders";
import { OrderDetail } from "@/components/admin/order-detail";

interface OrderDetailPageProps {
  params: {
    id: string;
  };
}

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
  const orderRecord = await prisma.order.findUnique({ where: { id: params.id } });

  if (!orderRecord) {
    notFound();
  }

  const order = deserializeOrder(orderRecord);
  const tokens = await prisma.downloadToken.findMany({
    where: { orderId: orderRecord.id },
    include: { product: true },
  });

  return <OrderDetail order={order} tokens={tokens} />;
}
