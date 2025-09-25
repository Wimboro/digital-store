import type { Order } from "@prisma/client";
import { randomBytes } from "crypto";

export function generateOrderNumber() {
  const now = new Date();
  const stamp = now.toISOString().replace(/[-:TZ.]/g, "").slice(0, 14);
  const random = randomBytes(3).toString("hex").toUpperCase();
  return `INV-${stamp}-${random}`;
}

export type NormalizedOrder = Omit<Order, "items" | "customer"> & {
  items: Array<{ productId: string; title: string; priceIDR: number }>;
  customer: {
    name: string;
    email: string;
    phone?: string;
  };
};

export function deserializeOrder(order: Order): NormalizedOrder {
  const items = safeParse<Array<{ productId: string; title: string; priceIDR: number }>>(
    order.items,
    [],
  );
  const customer = safeParse<{ name: string; email: string; phone?: string }>(order.customer, {
    name: "",
    email: "",
  });

  return {
    ...order,
    items,
    customer,
  };
}

function safeParse<T>(value: string, fallback: T): T {
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}
