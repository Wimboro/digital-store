import { Resend } from "resend";
import nodemailer from "nodemailer";
import { prisma } from "@/lib/prisma";
import { deserializeOrder } from "@/lib/orders";
import { deserializeSettings } from "@/lib/serializers";
import { siteConfig } from "@/config/site";

const resendApiKey = process.env.RESEND_API_KEY;
const smtpUrl = process.env.SMTP_URL;
const appUrl = process.env.APP_BASE_URL ?? siteConfig.url ?? "http://localhost:3000";

const resendClient = resendApiKey ? new Resend(resendApiKey) : null;

const mailer = smtpUrl
  ? nodemailer.createTransport(smtpUrl)
  : null;

export async function sendOrderReceiptEmail(orderId: string) {
  const orderRecord = await prisma.order.findUnique({
    where: { id: orderId },
  });

  if (!orderRecord) {
    return;
  }

  const order = deserializeOrder(orderRecord);
  const { customer } = order;

  if (!customer.email) {
    return;
  }

  const downloadTokens = await prisma.downloadToken.findMany({
    where: { orderId },
    orderBy: { createdAt: "asc" },
    include: { product: true },
  });

  const settingsRecord = await prisma.settings.findFirst({ orderBy: { createdAt: "desc" } });
  const settings = settingsRecord ? deserializeSettings(settingsRecord) : null;

  const downloadLinks = downloadTokens.map((token) => ({
    title: token.product.title,
    url: `${appUrl.replace(/\/$/, "")}/api/download/${token.token}`,
    expiresAt: token.expiresAt,
    remaining: token.maxDownloads - token.timesDownloaded,
  }));

  const html = renderReceiptHtml({
    storeName: settings?.storeName ?? siteConfig.name,
    customerName: customer.name ?? customer.email,
    orderNumber: order.orderNumber,
    total: order.totalIDR,
    downloadLinks,
  });

  const subject = `[${settings?.storeName ?? siteConfig.name}] Bukti Pembelian ${order.orderNumber}`;

  if (resendClient) {
    await resendClient.emails.send({
      from: settings?.contactEmail ?? "onboarding@hiddencyber.online",
      to: customer.email,
      subject,
      html,
    });
    return;
  }

  if (mailer) {
    await mailer.sendMail({
      from: settings?.contactEmail ?? "onboarding@hiddencyber.online",
      to: customer.email,
      subject,
      html,
    });
    return;
  }

  console.info("[sendOrderReceiptEmail] Email transport not configured. Intended payload:", {
    to: customer.email,
    subject,
  });
}

function renderReceiptHtml({
  storeName,
  customerName,
  orderNumber,
  total,
  downloadLinks,
}: {
  storeName: string;
  customerName: string;
  orderNumber: string;
  total: number;
  downloadLinks: Array<{
    title: string;
    url: string;
    expiresAt: Date;
    remaining: number;
  }>;
}) {
  const formattedTotal = new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(total);

  const linksHtml = downloadLinks
    .map(
      (link) => `
        <li>
          <p><strong>${link.title}</strong></p>
          <p><a href="${link.url}">Unduh file</a></p>
          <p>Kedaluwarsa: ${link.expiresAt.toLocaleString("id-ID")}</p>
          <p>Sisa kuota unduhan: ${link.remaining}</p>
        </li>
      `,
    )
    .join("\n");

  return `
    <div>
      <h2>${storeName}</h2>
      <p>Halo ${customerName},</p>
      <p>Terima kasih atas pembelian Anda. Berikut detail pesanan <strong>${orderNumber}</strong>.</p>
      <p>Total dibayar: ${formattedTotal}</p>
      <h3>Link Unduhan</h3>
      <ul>${linksHtml}</ul>
      <p>Selamat menikmati produk digital Anda!</p>
    </div>
  `;
}
