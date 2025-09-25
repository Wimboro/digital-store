import { handleBasicWebhook } from "@/app/api/webhooks/shared";

type XenditPayload = {
  data?: {
    external_id?: string;
    status?: string;
    id?: string;
    invoice_url?: string;
  };
  orderNumber?: string;
  status?: string;
  paymentRef?: string;
  invoiceUrl?: string;
};

export async function POST(request: Request) {
  return handleBasicWebhook(request, (payload: unknown) => {
    const xenditPayload = payload as XenditPayload;
    const data = xenditPayload?.data ?? {};
    const status = (data?.status ?? xenditPayload?.status ?? "paid").toLowerCase();

    const statusMap: Record<string, string> = {
      paid: "paid",
      settled: "paid",
      voided: "failed",
      expired: "failed",
      failed: "failed",
      pending: "pending",
    };

    return {
      orderNumber: data?.external_id ?? xenditPayload?.orderNumber ?? "",
      status: statusMap[status] ?? "paid",
      paymentRef: data?.id ?? xenditPayload?.paymentRef,
      invoiceUrl: data?.invoice_url ?? xenditPayload?.invoiceUrl,
    };
  });
}
