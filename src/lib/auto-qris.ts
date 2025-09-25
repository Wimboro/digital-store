import { siteConfig } from "@/config/site";

interface AutoQrisConfig {
  workerUrl?: string;
  apiKey?: string;
  staticQris?: string;
  callbackUrl?: string;
  productDetails?: string;
  expiryPeriod?: number;
}

interface GenerateAutoQrisParams {
  config: AutoQrisConfig;
  orderNumber: string;
  amount: number;
}

export interface AutoQrisInvoice {
  orderReference: string;
  dynamicQris: string;
  originalAmount: string;
  uniqueAmount: string;
  combinedAmount: string;
  amountForPayment: string;
  instructions?: {
    customer?: string;
    system?: string;
  };
  timestamp?: string;
}

interface AutoQrisNotification {
  amount_detected?: string | number | null;
}

interface AutoQrisNotificationResponse {
  success?: boolean;
  data?: AutoQrisNotification[];
}

function sanitizeBaseUrl(url: string | undefined) {
  if (!url) return undefined;
  return url.replace(/\/$/, "");
}

function getWorkerUrl(config: AutoQrisConfig) {
  return sanitizeBaseUrl(
    config.workerUrl || process.env.AUTOQRIS_WORKER_URL || "",
  );
}

function getApiKey(config: AutoQrisConfig) {
  return config.apiKey || process.env.AUTOQRIS_API_KEY || "";
}

function getStaticQris(config: AutoQrisConfig) {
  return config.staticQris || process.env.AUTOQRIS_STATIC_QRIS || "";
}

function getCallbackUrl(config: AutoQrisConfig) {
  const base =
    config.callbackUrl ||
    process.env.AUTOQRIS_CALLBACK_URL ||
    `${(process.env.APP_BASE_URL ?? siteConfig.url ?? "http://localhost:3000").replace(/\/$/, "")}/api/webhooks/auto-qris`;
  return base.replace(/\/$/, "");
}

export async function generateAutoQrisInvoice({
  config,
  orderNumber,
  amount,
}: GenerateAutoQrisParams): Promise<AutoQrisInvoice> {
  const workerUrl = getWorkerUrl(config);
  const apiKey = getApiKey(config);
  const staticQris = getStaticQris(config);

  if (!workerUrl) {
    throw new Error("Auto QRIS worker URL is missing");
  }
  if (!apiKey) {
    throw new Error("Auto QRIS API key is missing");
  }
  if (!staticQris) {
    throw new Error("Auto QRIS static QRIS code is missing");
  }

  const callbackUrl = getCallbackUrl(config);

  const response = await fetch(`${workerUrl}/qris/generate-for-order`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
    },
    body: JSON.stringify({
      staticQRIS: staticQris,
      originalAmount: String(amount),
      orderRef: orderNumber,
      callbackUrl,
    }),
  });

  const raw = await response.text();
  if (!response.ok) {
    throw new Error(`Auto QRIS invoice request failed: ${response.status} ${raw}`);
  }

  let data: Record<string, unknown> = {};
  try {
    data = JSON.parse(raw);
  } catch {
    throw new Error(`Unexpected Auto QRIS response: ${raw}`);
  }

  if (!data.success) {
    throw new Error(String(data.message ?? "Auto QRIS request failed"));
  }

  return {
    orderReference: String(data.order_reference ?? orderNumber),
    dynamicQris: String(data.dynamic_qris ?? ""),
    originalAmount: String(data.original_amount ?? String(amount)),
    uniqueAmount: String(data.unique_amount ?? "0"),
    combinedAmount: String(data.combined_amount ?? data.amount_for_payment ?? String(amount)),
    amountForPayment: String(data.amount_for_payment ?? data.combined_amount ?? String(amount)),
    instructions: data.instructions as AutoQrisInvoice["instructions"],
    timestamp: String(data.timestamp ?? ""),
  };
}

export async function checkAutoQrisPayment({
  config,
  combinedAmount,
  limit = 10,
}: {
  config: AutoQrisConfig;
  combinedAmount: string;
  limit?: number;
}) {
  const workerUrl = getWorkerUrl(config);
  const apiKey = getApiKey(config);

  if (!workerUrl) {
    throw new Error("Auto QRIS worker URL is missing");
  }
  if (!apiKey) {
    throw new Error("Auto QRIS API key is missing");
  }

  const response = await fetch(`${workerUrl}/notifications?limit=${limit}`, {
    headers: {
      "X-API-Key": apiKey,
    },
  });

  const raw = await response.text();
  if (!response.ok) {
    throw new Error(`Auto QRIS notifications failed: ${response.status} ${raw}`);
  }

  let data: AutoQrisNotificationResponse = {};
  try {
    data = JSON.parse(raw) as AutoQrisNotificationResponse;
  } catch {
    throw new Error(`Unexpected Auto QRIS notifications response: ${raw}`);
  }

  if (!Array.isArray(data.data)) {
    return false;
  }

  const normalized = combinedAmount.replace(/^0+/, "");

  return data.data.some((item) => {
    const detected = String(item.amount_detected ?? "").replace(/^0+/, "");
    return detected.length > 0 && detected === normalized;
  });
}
