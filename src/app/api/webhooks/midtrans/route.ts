import { handleBasicWebhook } from "@/app/api/webhooks/shared";

type MidtransPayload = {
  order_id?: string;
  orderNumber?: string;
  transaction_status?: string;
  transaction_id?: string;
  paymentRef?: string;
  pdf_url?: string;
  invoiceUrl?: string;
};

export async function POST(request: Request) {
  return handleBasicWebhook(request, (payload: unknown) => {
    const midtransPayload = payload as MidtransPayload;
    const statusMap: Record<string, string> = {
      capture: "paid",
      settlement: "paid",
      pending: "pending",
      cancel: "failed",
      deny: "failed",
      expire: "failed",
    };

    const statusKey = midtransPayload?.transaction_status ?? "";

    return {
      orderNumber: midtransPayload?.order_id ?? midtransPayload?.orderNumber ?? "",
      status: statusMap[statusKey] ?? "paid",
      paymentRef: midtransPayload?.transaction_id ?? midtransPayload?.paymentRef,
      invoiceUrl: midtransPayload?.pdf_url ?? midtransPayload?.invoiceUrl,
    };
  });
}
