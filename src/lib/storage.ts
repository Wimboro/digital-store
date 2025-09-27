import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

interface StorageConfig extends Record<string, unknown> {
  provider?: string;
  baseUrl?: string;
  bucket?: string;
  accessKey?: string;
  secretKey?: string;
  accountId?: string;
  publicBaseUrl?: string;
}

const cachedClients: Record<string, S3Client> = {};

function createR2Client({
  accountId,
  accessKey,
  secretKey,
}: {
  accountId: string;
  accessKey: string;
  secretKey: string;
}) {
  const cacheKey = `${accountId}:${accessKey}`;
  if (!cachedClients[cacheKey]) {
    cachedClients[cacheKey] = new S3Client({
      region: "auto",
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: accessKey,
        secretAccessKey: secretKey,
      },
    });
  }
  return cachedClients[cacheKey];
}

export async function resolveDownloadUrl(
  fileKey: string,
  storage: StorageConfig,
  fallbackUrl: string,
) {
  const provider = (storage.provider as string | undefined) ?? process.env.STORAGE_PROVIDER ?? "local";

  if (provider === "r2") {
    const bucket = (storage.bucket as string | undefined) ?? process.env.R2_BUCKET;
    const accountId = (storage.accountId as string | undefined) ?? process.env.R2_ACCOUNT_ID;
    const accessKey = (storage.accessKey as string | undefined) ?? process.env.R2_ACCESS_KEY_ID;
    const secretKey = (storage.secretKey as string | undefined) ?? process.env.R2_SECRET_ACCESS_KEY;
    const publicBaseUrl =
      (storage.publicBaseUrl as string | undefined) ?? process.env.R2_PUBLIC_BASE_URL;

    if (publicBaseUrl) {
      return `${publicBaseUrl.replace(/\/$/, "")}/${fileKey}`;
    }

    if (bucket && accountId && accessKey && secretKey) {
      const client = createR2Client({ accountId, accessKey, secretKey });
      const command = new GetObjectCommand({
        Bucket: bucket,
        Key: fileKey,
      });

      return getSignedUrl(client, command, { expiresIn: 60 * 5 });
    }
  }

  const baseUrl = (storage.baseUrl as string | undefined) ?? process.env.STORAGE_BASE_URL;
  if (baseUrl) {
    return `${baseUrl.replace(/\/$/, "")}/${fileKey}`;
  }

  return fallbackUrl;
}
