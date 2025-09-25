import { prisma } from "@/lib/prisma";
import { subDays, startOfDay } from "date-fns";

function safeParse<T>(value: string, fallback: T): T {
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export async function getDashboardMetrics() {
  const now = new Date();
  const start7d = subDays(now, 7);
  const start30d = subDays(now, 30);
  const startToday = startOfDay(now);

  const [orders30d, allOrdersCount, paidOrdersCount] = await Promise.all([
    prisma.order.findMany({
      where: { createdAt: { gte: start30d } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.order.count(),
    prisma.order.count({ where: { status: "paid" } }),
  ]);

  const revenueToday = orders30d
    .filter((order) => order.status === "paid" && order.createdAt >= startToday)
    .reduce((acc, order) => acc + order.totalIDR, 0);

  const revenue7d = orders30d
    .filter((order) => order.status === "paid" && order.createdAt >= start7d)
    .reduce((acc, order) => acc + order.totalIDR, 0);

  const revenue30d = orders30d
    .filter((order) => order.status === "paid")
    .reduce((acc, order) => acc + order.totalIDR, 0);

  const avgOrderValue = paidOrdersCount > 0 ? revenue30d / paidOrdersCount : 0;
  const conversionRate = allOrdersCount > 0 ? paidOrdersCount / allOrdersCount : 0;

  const productSales: Record<string, { count: number; revenue: number; title: string }> = {};

  for (const order of orders30d) {
    if (order.status !== "paid") continue;
    const items = safeParse<Array<{ productId: string; title: string; priceIDR: number }>>(order.items, []);

    for (const item of items) {
      const key = item.productId;
      if (!productSales[key]) {
        productSales[key] = {
          count: 0,
          revenue: 0,
          title: item.title,
        };
      }
      productSales[key].count += 1;
      productSales[key].revenue += item.priceIDR;
    }
  }

  const topProducts = Object.entries(productSales)
    .map(([productId, stats]) => ({
      productId,
      title: stats.title,
      count: stats.count,
      revenue: stats.revenue,
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  const orderTrend = orders30d.map((order) => ({
    date: order.createdAt,
    totalIDR: order.totalIDR,
    status: order.status,
  }));

  return {
    revenueToday,
    revenue7d,
    revenue30d,
    totalOrders: allOrdersCount,
    paidOrders: paidOrdersCount,
    conversionRate,
    avgOrderValue,
    topProducts,
    orderTrend,
  };
}
