import type { Product, Settings } from "@prisma/client";

export type StorefrontProduct = Omit<Product, "images" | "tags"> & {
  images: string[];
  tags: string[];
};

type GenericRecord = Record<string, unknown>;

export type StoreSettings = Omit<Settings, "payment" | "storage" | "policy"> & {
  payment: GenericRecord;
  storage: GenericRecord;
  policy: GenericRecord & {
    downloadExpiryHours: number;
    maxDownloads: number;
  };
};

export function deserializeProduct(product: Product): StorefrontProduct {
  return {
    ...product,
    images: safeJsonArray<string>(product.images),
    tags: safeJsonArray<string>(product.tags),
  };
}

export function serializeProductInput(product: Partial<StorefrontProduct>) {
  const { images, tags, ...rest } = product;

  return {
    ...rest,
    ...(images ? { images: JSON.stringify(images) } : {}),
    ...(tags ? { tags: JSON.stringify(tags) } : {}),
  };
}

export function deserializeSettings(settings: Settings): StoreSettings {
  const payment = safeJsonObject<GenericRecord>(settings.payment);
  const storage = safeJsonObject<GenericRecord>(settings.storage);
  const policyObject = safeJsonObject<GenericRecord>(settings.policy);

  return {
    ...settings,
    payment,
    storage,
    policy: {
      downloadExpiryHours: Number(policyObject.downloadExpiryHours ?? 72),
      maxDownloads: Number(policyObject.maxDownloads ?? 3),
      ...policyObject,
    },
  };
}

export function serializeSettingsInput(settings: Partial<StoreSettings>) {
  const { payment, storage, policy, ...rest } = settings;
  return {
    ...rest,
    ...(payment ? { payment: JSON.stringify(payment) } : {}),
    ...(storage ? { storage: JSON.stringify(storage) } : {}),
    ...(policy ? { policy: JSON.stringify(policy) } : {}),
  };
}

function safeJsonArray<T>(value: string, fallback: T[] = []) {
  try {
    const parsed = JSON.parse(value) as T[];
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

function safeJsonObject<T extends Record<string, unknown>>(
  value: string,
  fallback: T = {} as T,
): T {
  try {
    const parsed = JSON.parse(value);
    return typeof parsed === "object" && parsed !== null ? (parsed as T) : fallback;
  } catch {
    return fallback;
  }
}
