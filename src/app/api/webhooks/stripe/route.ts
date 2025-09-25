import { handleBasicWebhook } from "@/app/api/webhooks/shared";

type StripePayload = {
  orderNumber?: string;
  status?: string;
  paymentRef?: string;
  invoiceUrl?: string;
  data?: {
    object?: {
      metadata?: {
        orderNumber?: string;
      };
      payment_intent?: string;
      invoice?: {
        hosted_invoice_url?: string;
      };
    };
  };
};

export async function POST(request: Request) {
  return handleBasicWebhook(request, (payload: unknown) => {
    const stripePayload = payload as StripePayload;
    const data = stripePayload?.data?.object ?? {};
    const metadata = data?.metadata ?? {};

    return {
      orderNumber: metadata.orderNumber ?? stripePayload?.orderNumber ?? "",
      status: stripePayload?.status ?? "paid",
      paymentRef: data?.payment_intent ?? stripePayload?.paymentRef,
      invoiceUrl: data?.invoice?.hosted_invoice_url ?? stripePayload?.invoiceUrl,
    };
  });
}
