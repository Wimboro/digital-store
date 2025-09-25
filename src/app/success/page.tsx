import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { deserializeOrder } from "@/lib/orders";
import { formatIDR } from "@/lib/currency";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";

interface SuccessPageProps {
  searchParams: {
    orderNumber?: string;
  };
}

export default async function SuccessPage({ searchParams }: SuccessPageProps) {
  const orderNumber = searchParams.orderNumber;

  if (!orderNumber) {
    return (
      <main className="container mx-auto max-w-3xl py-12">
        <Alert>
          <AlertTitle>Order tidak ditemukan</AlertTitle>
          <AlertDescription>
            Pastikan Anda mengakses halaman ini melalui tautan yang benar.
          </AlertDescription>
        </Alert>
      </main>
    );
  }

  const order = await prisma.order.findUnique({
    where: { orderNumber },
  });

  if (!order) {
    return (
      <main className="container mx-auto max-w-3xl py-12">
        <Alert variant="destructive">
          <AlertTitle>Order tidak ditemukan</AlertTitle>
          <AlertDescription>
            Kami tidak menemukan order dengan nomor {orderNumber}.
          </AlertDescription>
        </Alert>
      </main>
    );
  }

  const downloadTokens = await prisma.downloadToken.findMany({
    where: { orderId: order.id },
    include: { product: true },
  });

  const normalizedOrder = deserializeOrder(order);

  return (
    <main className="container mx-auto max-w-3xl space-y-8 py-12">
      <Card>
        <CardHeader>
          <CardTitle>Terima kasih! Pembayaran berhasil.</CardTitle>
          <p className="text-sm text-muted-foreground">
            Nomor Order {normalizedOrder.orderNumber} • Total {formatIDR(normalizedOrder.totalIDR)}
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="font-semibold">Detail Produk</h3>
            <ul className="mt-3 space-y-3">
              {normalizedOrder.items.map((item) => (
                <li key={item.productId} className="flex items-center justify-between">
                  <span>{item.title}</span>
                  <span className="text-sm text-muted-foreground">{formatIDR(item.priceIDR)}</span>
                </li>
              ))}
            </ul>
          </div>
          <Separator />
          <div className="space-y-4">
            <h3 className="font-semibold">Link Unduhan</h3>
            {downloadTokens.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Link unduhan akan dikirim melalui email setelah pembayaran terverifikasi.
              </p>
            )}
            <div className="space-y-3">
              {downloadTokens.map((token) => {
                const remaining = token.maxDownloads - token.timesDownloaded;
                return (
                  <div
                    key={token.id}
                    className="flex flex-col gap-2 rounded-lg border p-4 md:flex-row md:items-center md:justify-between"
                  >
                    <div>
                      <p className="font-medium">{token.product.title}</p>
                      <p className="text-sm text-muted-foreground">
                        Kedaluwarsa {token.expiresAt.toLocaleString("id-ID")} • Sisa unduhan {remaining}
                      </p>
                    </div>
                    <Button asChild>
                      <Link href={`/api/download/${token.token}`}>Unduh Sekarang</Link>
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
          <Separator />
          <div className="flex flex-col gap-2">
            <Badge variant="outline" className="w-fit">Info Pelanggan</Badge>
            <p>{normalizedOrder.customer.name}</p>
            <p className="text-sm text-muted-foreground">{normalizedOrder.customer.email}</p>
          </div>
        </CardContent>
      </Card>
      <div className="flex justify-center">
        <Button variant="ghost" asChild>
          <Link href="/">Kembali ke beranda</Link>
        </Button>
      </div>
    </main>
  );
}
