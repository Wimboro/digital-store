import { prisma } from "@/lib/prisma";
import { addHours } from "date-fns";
import { nanoid } from "nanoid";
import { deserializeSettings } from "@/lib/serializers";
import { sendOrderReceiptEmail } from "@/lib/email";

export type PaymentStatus = "paid" | "failed" | "pending" | "refunded";

interface PaymentUpdateParams {
  orderNumber: string;
  paymentReference?: string;
  invoiceUrl?: string;
  status: PaymentStatus;
}

export async function updateOrderFromWebhook({
  orderNumber,
  paymentReference,
  invoiceUrl,
  status,
}: PaymentUpdateParams) {
  const order = await prisma.order.findUnique({ where: { orderNumber } });
  if (!order) {
    throw new Error(`Order ${orderNumber} not found`);
  }

  const updated = await prisma.order.update({
    where: { id: order.id },
    data: {
      status,
      paymentRef: paymentReference ?? order.paymentRef,
      invoiceUrl: invoiceUrl ?? order.invoiceUrl,
    },
  });

  if (status === "paid") {
    await generateDownloadTokens(updated.id);
    await sendOrderReceiptEmail(updated.id).catch((error) => {
      console.error("Failed to send receipt email", error);
    });
  }

  return updated;
}

async function generateDownloadTokens(orderId: string) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });

  if (!order) {
    return;
  }

  const items = JSON.parse(order.items) as Array<{ productId: string }>;

  const settingsRecord = await prisma.settings.findFirst({ orderBy: { createdAt: "desc" } });
  if (!settingsRecord) {
    return;
  }

  const settings = deserializeSettings(settingsRecord);
  const expiryHours = settings.policy.downloadExpiryHours ?? 72;
  const maxDownloads = settings.policy.maxDownloads ?? 3;

  const expiresAt = addHours(new Date(), expiryHours);

  await prisma.downloadToken.deleteMany({ where: { orderId } });

  for (const item of items) {
    await prisma.downloadToken.create({
      data: {
        orderId,
        productId: item.productId,
        token: nanoid(40),
        expiresAt,
        maxDownloads,
      },
    });
  }
}
