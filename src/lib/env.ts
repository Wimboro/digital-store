import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  NEXTAUTH_SECRET: z.string().min(1).optional(),
  RESEND_API_KEY: z.string().optional(),
  SMTP_URL: z.string().optional(),
  STORE_NAME: z.string().optional(),
  STORE_CONTACT_EMAIL: z.string().optional(),
  STORAGE_PROVIDER: z
    .enum(["local", "s3", "r2", "supabase"] as const)
    .optional(),
  STORAGE_BUCKET: z.string().optional(),
  STORAGE_BASE_URL: z.string().optional(),
  STORAGE_ACCESS_KEY: z.string().optional(),
  STORAGE_SECRET_KEY: z.string().optional(),
  DOWNLOAD_EXPIRY_HOURS: z.string().optional(),
  DOWNLOAD_MAX_COUNT: z.string().optional(),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  MIDTRANS_SERVER_KEY: z.string().optional(),
  MIDTRANS_CLIENT_KEY: z.string().optional(),
  MIDTRANS_MERCHANT_ID: z.string().optional(),
  MIDTRANS_WEBHOOK_SECRET: z.string().optional(),
  XENDIT_API_KEY: z.string().optional(),
  XENDIT_WEBHOOK_SECRET: z.string().optional(),
});

type Env = z.infer<typeof envSchema>;

let cachedEnv: Env | null = null;

export function getEnv(): Env {
  if (cachedEnv) {
    return cachedEnv;
  }

  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    throw new Error(`Invalid environment variables: ${parsed.error.message}`);
  }

  cachedEnv = parsed.data;
  return cachedEnv;
}
