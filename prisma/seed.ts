import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@demo.test";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "Admin123!";

  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      name: "Admin",
      hashedPassword,
      role: "ADMIN",
    },
  });

  const products = [
    {
      slug: "ultimate-notion-kit",
      title: "Ultimate Notion Productivity Kit",
      shortDescription: "Template Notion lengkap untuk manajemen tugas dan habit.",
      description:
        "## Apa yang Anda dapatkan\n- Dashboard produktivitas harian\n- Template tujuan mingguan\n- Sistem habit tracker otomatis\n\nSangat cocok untuk kreator dan pekerja remote yang ingin lebih teratur.",
      priceIDR: 99000,
      salePriceIDR: 79000,
      images: [
        "https://images.unsplash.com/photo-1523475472560-d2df97ec485c?auto=format&fit=crop&w=900&q=80",
      ],
      fileKey: "products/notion-kit.zip",
      tags: ["template", "productivity"],
    },
    {
      slug: "ai-prompt-bundle",
      title: "AI Prompt Bundle 200+",
      shortDescription: "Kumpulan prompt siap pakai untuk ChatGPT dan Midjourney.",
      description:
        "### Bundel ini mencakup\n- 150+ prompt produktivitas\n- 50+ prompt desain & visual\n- Update gratis versi 1.1\n\nUnduh format PDF dan Notion siap pakai.",
      priceIDR: 149000,
      images: [
        "https://images.unsplash.com/photo-1545239351-1141bd82e8a6?auto=format&fit=crop&w=900&q=80",
      ],
      fileKey: "products/ai-prompt-bundle.zip",
      tags: ["AI", "ebook"],
    },
    {
      slug: "brand-identity-pack",
      title: "Brand Identity Pack",
      shortDescription: "Template Figma + panduan PDF untuk brand identity startup.",
      description:
        "### Isi paket\n- Template deck brand\n- 40+ komponen UI Figma\n- Styleguide PDF 30 halaman\n\nLisensi komersial untuk 1 brand.",
      priceIDR: 249000,
      images: [
        "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=900&q=80",
      ],
      fileKey: "products/brand-identity-pack.zip",
      tags: ["design", "template"],
    },
  ];

  for (const product of products) {
    await prisma.product.upsert({
      where: { slug: product.slug },
      update: {
        title: product.title,
        shortDescription: product.shortDescription,
        description: product.description,
        priceIDR: product.priceIDR,
        salePriceIDR: product.salePriceIDR ?? null,
        images: JSON.stringify(product.images),
        fileKey: product.fileKey,
        tags: JSON.stringify(product.tags),
        isActive: true,
      },
      create: {
        ...product,
        images: JSON.stringify(product.images),
        tags: JSON.stringify(product.tags),
        isActive: true,
      },
    });
  }

  await prisma.settings.upsert({
    where: { id: "default-settings" },
    update: {
      storeName: process.env.STORE_NAME ?? "Digital Goods Store",
      contactEmail: process.env.STORE_CONTACT_EMAIL ?? "hello@store.test",
      payment: JSON.stringify({
        activeGateway: "manual-qris",
        testMode: true,
        stripeKey: "",
        stripeWebhookSecret: "",
        midtransServerKey: "",
        midtransClientKey: "",
        midtransMerchantId: "",
        midtransWebhookSecret: "",
        xenditApiKey: "",
        xenditWebhookSecret: "",
        duitku: {
          merchantCode: process.env.DUITKU_MERCHANT_CODE ?? "",
          apiKey: process.env.DUITKU_API_KEY ?? "",
          baseUrl: process.env.DUITKU_BASE_URL ?? "https://api-sandbox.duitku.com",
        },
        autoQris: {
          workerUrl: process.env.AUTOQRIS_WORKER_URL ?? "",
          apiKey: process.env.AUTOQRIS_API_KEY ?? "",
          staticQris: process.env.AUTOQRIS_STATIC_QRIS ?? "",
          callbackUrl: process.env.AUTOQRIS_CALLBACK_URL ?? "",
        },
      }),
      storage: JSON.stringify({
        provider: process.env.STORAGE_PROVIDER ?? "local",
        bucket: process.env.STORAGE_BUCKET ?? "",
        baseUrl: process.env.STORAGE_BASE_URL ?? "",
        accessKey: process.env.STORAGE_ACCESS_KEY ?? "",
        secretKey: process.env.STORAGE_SECRET_KEY ?? "",
      }),
      policy: JSON.stringify({
        downloadExpiryHours: Number(process.env.DOWNLOAD_EXPIRY_HOURS ?? "72"),
        maxDownloads: Number(process.env.DOWNLOAD_MAX_COUNT ?? "3"),
      }),
    },
    create: {
      id: "default-settings",
      storeName: process.env.STORE_NAME ?? "Digital Goods Store",
      contactEmail: process.env.STORE_CONTACT_EMAIL ?? "hello@store.test",
      payment: JSON.stringify({
        activeGateway: "manual-qris",
        testMode: true,
        stripeKey: "",
        stripeWebhookSecret: "",
        midtransServerKey: "",
        midtransClientKey: "",
        midtransMerchantId: "",
        midtransWebhookSecret: "",
        xenditApiKey: "",
        xenditWebhookSecret: "",
        duitku: {
          merchantCode: process.env.DUITKU_MERCHANT_CODE ?? "",
          apiKey: process.env.DUITKU_API_KEY ?? "",
          baseUrl: process.env.DUITKU_BASE_URL ?? "https://api-sandbox.duitku.com",
        },
        autoQris: {
          workerUrl: process.env.AUTOQRIS_WORKER_URL ?? "",
          apiKey: process.env.AUTOQRIS_API_KEY ?? "",
          staticQris: process.env.AUTOQRIS_STATIC_QRIS ?? "",
          callbackUrl: process.env.AUTOQRIS_CALLBACK_URL ?? "",
        },
      }),
      storage: JSON.stringify({
        provider: process.env.STORAGE_PROVIDER ?? "local",
        bucket: process.env.STORAGE_BUCKET ?? "",
        baseUrl: process.env.STORAGE_BASE_URL ?? "",
        accessKey: process.env.STORAGE_ACCESS_KEY ?? "",
        secretKey: process.env.STORAGE_SECRET_KEY ?? "",
      }),
      policy: JSON.stringify({
        downloadExpiryHours: Number(process.env.DOWNLOAD_EXPIRY_HOURS ?? "72"),
        maxDownloads: Number(process.env.DOWNLOAD_MAX_COUNT ?? "3"),
      }),
    },
  });

  console.log("Seed data completed.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
