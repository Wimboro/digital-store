import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { deserializeProduct, deserializeSettings } from "@/lib/serializers";
import { generateOrderNumber } from "@/lib/orders";
import { createDuitkuInvoice } from "@/lib/duitku";
import { generateAutoQrisInvoice } from "@/lib/auto-qris";
import { siteConfig } from "@/config/site";

const checkoutSchema = z.object({
  productId: z.string().min(1),
  customer: z.object({
    name: z.string().min(1),
    email: z.string().email(),
    phone: z.string().optional(),
  }),
});

export async function POST(request: Request) {
  const json = await request.json().catch(() => undefined);
  const parsed = checkoutSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const { productId, customer } = parsed.data;

  const productRecord = await prisma.product.findUnique({
    where: { id: productId },
  });

  if (!productRecord || !productRecord.isActive) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  const product = deserializeProduct(productRecord);
  const settingsRecord = await prisma.settings.findFirst({ orderBy: { createdAt: "desc" } });

  if (!settingsRecord) {
    return NextResponse.json({ error: "Store not configured" }, { status: 500 });
  }

  const settings = deserializeSettings(settingsRecord);
  const paymentConfig = settings.payment as Record<string, unknown>;
  const paymentGateway = String(paymentConfig.activeGateway ?? "manual-qris");

  const order = await prisma.order.create({
    data: {
      orderNumber: generateOrderNumber(),
      items: JSON.stringify([
        {
          productId: product.id,
          title: product.title,
          priceIDR: product.salePriceIDR ?? product.priceIDR,
        },
      ]),
      customer: JSON.stringify(customer),
      totalIDR: product.salePriceIDR ?? product.priceIDR,
      status: "pending",
      paymentGateway,
    },
  });

  switch (paymentGateway) {
    case "manual-qris": {
      const manualConfig = (paymentConfig.manual as Record<string, unknown>) ?? {};
      const instructions = typeof manualConfig.instructions === "string"
        ? manualConfig.instructions
        : "Silakan selesaikan pembayaran melalui QRIS dan kirim bukti pembayaran ke email kami.";
      const qrImageUrl = typeof manualConfig.qrImageUrl === "string" ? manualConfig.qrImageUrl : null;

      return NextResponse.json({
        orderId: order.id,
        orderNumber: order.orderNumber,
        paymentGateway,
        paymentAction: {
          type: "manual",
          instructions,
          qrImageUrl,
        },
      });
    }
    case "duitku": {
      const duitkuConfig = (paymentConfig.duitku as Record<string, unknown>) ?? {};
      const baseAppUrl = process.env.APP_BASE_URL ?? siteConfig.url ?? "http://localhost:3000";
      const merchantCode = String(duitkuConfig.merchantCode ?? process.env.DUITKU_MERCHANT_CODE ?? "");
      const apiKey = String(duitkuConfig.apiKey ?? process.env.DUITKU_API_KEY ?? "");
      const baseUrl = typeof duitkuConfig.baseUrl === "string" ? duitkuConfig.baseUrl : undefined;
      const paymentMethod = typeof duitkuConfig.paymentMethod === "string" ? duitkuConfig.paymentMethod : undefined;
      const callbackUrl = typeof duitkuConfig.callbackUrl === "string"
        ? duitkuConfig.callbackUrl
        : `${baseAppUrl.replace(/\/$/, "")}/api/webhooks/duitku`;
      const returnUrl = typeof duitkuConfig.returnUrl === "string"
        ? duitkuConfig.returnUrl
        : `${baseAppUrl.replace(/\/$/, "")}/success?orderNumber=${order.orderNumber}`;
      const productDetails = typeof duitkuConfig.productDetails === "string" ? duitkuConfig.productDetails : undefined;

      const invoice = await createDuitkuInvoice({
        config: {
          merchantCode,
          apiKey,
          baseUrl,
          paymentMethod,
          callbackUrl,
          returnUrl,
          productDetails: productDetails ?? product.title,
          expiryPeriod: typeof duitkuConfig.expiryPeriod === "number"
            ? Number(duitkuConfig.expiryPeriod)
            : undefined,
        },
        orderId: order.orderNumber,
        amount: order.totalIDR,
        customer,
        items: [
          {
            name: product.title,
            price: product.salePriceIDR ?? product.priceIDR,
            quantity: 1,
          },
        ],
      });

      await prisma.order.update({
        where: { id: order.id },
        data: {
          paymentRef: invoice.reference,
          invoiceUrl: invoice.paymentUrl,
        },
      });

      return NextResponse.json({
        orderId: order.id,
        orderNumber: order.orderNumber,
        paymentGateway,
        paymentAction: {
          type: "redirect",
          url: invoice.paymentUrl,
        },
      });
    }
    case "auto-qris": {
      const autoQrisConfig = (paymentConfig.autoQris as Record<string, unknown>) ?? {};
      const invoice = await generateAutoQrisInvoice({
        config: {
          workerUrl: typeof autoQrisConfig.workerUrl === "string" ? autoQrisConfig.workerUrl : undefined,
          apiKey: typeof autoQrisConfig.apiKey === "string" ? autoQrisConfig.apiKey : undefined,
          staticQris: typeof autoQrisConfig.staticQris === "string" ? autoQrisConfig.staticQris : undefined,
          callbackUrl:
            typeof autoQrisConfig.callbackUrl === "string" ? autoQrisConfig.callbackUrl : undefined,
          productDetails:
            typeof autoQrisConfig.productDetails === "string"
              ? autoQrisConfig.productDetails
              : product.title,
          expiryPeriod:
            typeof autoQrisConfig.expiryPeriod === "number"
              ? autoQrisConfig.expiryPeriod
              : typeof autoQrisConfig.expiryPeriod === "string"
              ? Number(autoQrisConfig.expiryPeriod)
              : undefined,
        },
        orderNumber: order.orderNumber,
        amount: order.totalIDR,
      });

      await prisma.order.update({
        where: { id: order.id },
        data: {
          paymentRef: invoice.orderReference,
          invoiceUrl: JSON.stringify({
            combinedAmount: invoice.combinedAmount,
            uniqueAmount: invoice.uniqueAmount,
            originalAmount: invoice.originalAmount,
          }),
        },
      });

      return NextResponse.json({
        orderId: order.id,
        orderNumber: order.orderNumber,
        paymentGateway,
        paymentAction: {
          type: "auto_qris",
          qrString: invoice.dynamicQris,
          orderReference: invoice.orderReference,
          amounts: {
            original: invoice.originalAmount,
            unique: invoice.uniqueAmount,
            combined: invoice.combinedAmount,
          },
          instructions: invoice.instructions?.customer ?? undefined,
        },
      });
    }
    case "stripe":
    case "midtrans":
    case "xendit": {
      const paymentActionUrl = typeof paymentConfig.paymentActionUrl === "string"
        ? paymentConfig.paymentActionUrl
        : "#";

      return NextResponse.json({
        orderId: order.id,
        orderNumber: order.orderNumber,
        paymentGateway,
        paymentAction: {
          type: "redirect",
          url: paymentActionUrl,
        },
      });
    }
    default: {
      return NextResponse.json({
        orderId: order.id,
        orderNumber: order.orderNumber,
        paymentGateway,
      });
    }
  }
}
