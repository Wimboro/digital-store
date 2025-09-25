"use client";

import { useState } from "react";
import type { NormalizedOrder } from "@/lib/orders";
import type { DownloadToken, Product } from "@prisma/client";
import { formatIDR } from "@/lib/currency";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { format } from "date-fns";
import { id } from "date-fns/locale";

interface OrderDetailProps {
  order: NormalizedOrder;
  tokens: Array<DownloadToken & { product: Product }>;
}

export function OrderDetail({ order, tokens }: OrderDetailProps) {
  const [status, setStatus] = useState(order.status);
  const [paymentRef, setPaymentRef] = useState(order.paymentRef ?? "");
  const [invoiceUrl, setInvoiceUrl] = useState(order.invoiceUrl ?? "");
  const [loading, setLoading] = useState(false);

  const handleUpdate = async (options?: { resendEmail?: boolean }) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/orders/${order.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          paymentRef: paymentRef || undefined,
          invoiceUrl: invoiceUrl || undefined,
          resendEmail: options?.resendEmail ?? false,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error ?? "Gagal memperbarui order");
      }

      toast.success("Order diperbarui");
    } catch (error) {
      toast.error("Tidak dapat memperbarui order", {
        description: error instanceof Error ? error.message : "Terjadi kesalahan",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Order {order.orderNumber}</CardTitle>
          <p className="text-sm text-muted-foreground">
            Dibuat pada {format(order.createdAt, "dd MMM yyyy HH:mm", { locale: id })}
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <span className="text-xs uppercase text-muted-foreground">Status</span>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="refunded">Refunded</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <span className="text-xs uppercase text-muted-foreground">Gateway</span>
              <Badge variant="secondary">{order.paymentGateway}</Badge>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <span className="text-xs uppercase text-muted-foreground">Payment Ref</span>
              <Input value={paymentRef} onChange={(event) => setPaymentRef(event.target.value)} />
            </div>
            <div className="space-y-2">
              <span className="text-xs uppercase text-muted-foreground">Invoice URL</span>
              <Input value={invoiceUrl} onChange={(event) => setInvoiceUrl(event.target.value)} />
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button onClick={() => handleUpdate()} disabled={loading}>
              Simpan Perubahan
            </Button>
            <Button
              variant="outline"
              onClick={() => handleUpdate({ resendEmail: true })}
              disabled={loading}
            >
              Re-send Email
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Produk</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {order.items.map((item) => (
            <div key={item.productId} className="flex items-center justify-between">
              <div>
                <p className="font-medium">{item.title}</p>
                <p className="text-xs text-muted-foreground">{item.productId}</p>
              </div>
              <p>{formatIDR(item.priceIDR)}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Link Unduhan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {tokens.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Token belum dibuat. Tandai order sebagai paid untuk membuat link unduhan.
            </p>
          )}
          {tokens.map((token) => {
            const remaining = token.maxDownloads - token.timesDownloaded;
            return (
              <div key={token.id} className="rounded-lg border p-4">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-medium">{token.product.title}</p>
                    <p className="text-xs text-muted-foreground">Token: {token.token}</p>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Kedaluwarsa {format(token.expiresAt, "dd MMM yyyy HH:mm", { locale: id })}
                  </div>
                </div>
                <Separator className="my-3" />
                <div className="flex items-center justify-between text-sm">
                  <span>Sisa unduhan: {remaining}</span>
                  <Button asChild variant="outline" size="sm">
                    <a href={`/api/download/${token.token}`} target="_blank" rel="noopener noreferrer">
                      Salin Link
                    </a>
                  </Button>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
