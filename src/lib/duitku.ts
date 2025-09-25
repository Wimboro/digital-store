import crypto from "crypto";

interface DuitkuConfig {
  merchantCode: string;
  apiKey: string;
  baseUrl?: string;
  callbackUrl?: string;
  returnUrl?: string;
  paymentMethod?: string;
  productDetails?: string;
  expiryPeriod?: number;
}

interface InvoiceItem {
  name: string;
  price: number;
  quantity: number;
}

interface CreateInvoiceParams {
  config: DuitkuConfig;
  orderId: string;
  amount: number;
  customer: {
    name: string;
    email: string;
    phone?: string;
  };
  items: InvoiceItem[];
}

interface DuitkuInvoiceResponse {
  reference: string;
  paymentUrl: string;
  statusCode: string;
  statusMessage: string;
  amount: number;
}

function sha256(input: string) {
  return crypto.createHash("sha256").update(input).digest("hex");
}

function md5(input: string) {
  return crypto.createHash("md5").update(input).digest("hex");
}

function sanitizeUrl(url: string | undefined, fallback: string) {
  if (!url) return fallback;
  return url.replace(/\/$/, "");
}

function stripUndefined<T extends Record<string, unknown>>(value: T): T {
  return Object.entries(value).reduce((acc, [key, val]) => {
    if (val !== undefined && val !== "") {
      (acc as Record<string, unknown>)[key] = val;
    }
    return acc;
  }, {} as Record<string, unknown>) as T;
}

export async function createDuitkuInvoice({
  config,
  orderId,
  amount,
  customer,
  items,
}: CreateInvoiceParams): Promise<DuitkuInvoiceResponse> {
  const merchantCode = config.merchantCode || process.env.DUITKU_MERCHANT_CODE || "";
  const apiKey = config.apiKey || process.env.DUITKU_API_KEY || "";

  if (!merchantCode || !apiKey) {
    throw new Error("Duitku credentials are missing");
  }

  const baseUrl = sanitizeUrl(config.baseUrl || process.env.DUITKU_BASE_URL, "https://sandbox.duitku.com");
  const endpoint = `${baseUrl}/api/merchant/createInvoice`;
  const timestamp = Date.now().toString();
  const signature = sha256(`${merchantCode}${timestamp}${apiKey}`);

  const [firstName = customer.name, ...rest] = customer.name.split(" ");
  const lastName = rest.join(" ") || firstName;

  const normalizedItems = items.length
    ? items
    : [{ name: config.productDetails ?? "Digital Product", price: amount, quantity: 1 }];

  const defaultAddress = {
    firstName,
    lastName,
    address: "-",
    city: "Jakarta",
    postalCode: "12345",
    phone: customer.phone ?? "",
    countryCode: "ID",
  };

  const payload = stripUndefined({
    paymentAmount: amount,
    merchantOrderId: orderId,
    productDetails: config.productDetails ?? normalizedItems[0]?.name ?? "Digital Product",
    additionalParam: "",
    merchantUserInfo: "",
    customerVaName: customer.name,
    email: customer.email,
    phoneNumber: customer.phone ?? "",
    itemDetails: normalizedItems.map((item) => ({
      name: item.name,
      price: item.price,
      quantity: item.quantity,
    })),
    customerDetail: {
      firstName,
      lastName,
      email: customer.email,
      phoneNumber: customer.phone ?? "",
      billingAddress: defaultAddress,
      shippingAddress: defaultAddress,
    },
    callbackUrl: config.callbackUrl,
    returnUrl: config.returnUrl,
    expiryPeriod: config.expiryPeriod ?? 60,
    paymentMethod: config.paymentMethod,
  });

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-duitku-signature": signature,
      "x-duitku-timestamp": timestamp,
      "x-duitku-merchantcode": merchantCode,
    },
    body: JSON.stringify(payload),
  });

  const raw = await response.text();
  if (!response.ok) {
    throw new Error(`Duitku invoice request failed: ${response.status} ${raw}`);
  }

  let data: Record<string, unknown> = {};
  try {
    data = JSON.parse(raw);
  } catch {
    throw new Error(`Unexpected Duitku response: ${raw}`);
  }

  const statusCode = String(data.statusCode ?? "");
  if (statusCode !== "00") {
    const statusMessage = String(data.statusMessage ?? "Duitku error");
    throw new Error(`Duitku invoice rejected: ${statusCode} ${statusMessage}`);
  }

  return {
    reference: String(data.reference ?? ""),
    paymentUrl: String(data.paymentUrl ?? ""),
    statusCode,
    statusMessage: String(data.statusMessage ?? ""),
    amount: Number(data.amount ?? amount),
  };
}

export function verifyDuitkuSignature(params: {
  merchantCode: string;
  merchantOrderId: string;
  amount: string;
  resultCode: string;
  apiKey: string;
  signature: string;
}) {
  const expected = md5(
    `${params.merchantCode}${params.merchantOrderId}${params.amount}${params.resultCode}${params.apiKey}`,
  );
  return expected === params.signature.toLowerCase();
}
