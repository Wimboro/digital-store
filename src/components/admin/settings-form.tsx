"use client";

import { useState } from "react";
import type { StoreSettings } from "@/lib/serializers";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

const gatewayOptions = [
  { value: "manual-qris", label: "Manual QRIS" },
  { value: "stripe", label: "Stripe" },
  { value: "midtrans", label: "Midtrans" },
  { value: "xendit", label: "Xendit" },
  { value: "duitku", label: "Duitku" },
];

const storageProviders = [
  { value: "local", label: "Local" },
  { value: "s3", label: "S3" },
  { value: "r2", label: "Cloudflare R2" },
  { value: "supabase", label: "Supabase" },
];

export function SettingsForm({ settings }: { settings: StoreSettings | null }) {
  const resolveString = (value: unknown, fallback: string) =>
    typeof value === "string" && value.length > 0 ? value : fallback;

  const resolveBoolean = (value: unknown, fallback: boolean) =>
    typeof value === "boolean" ? value : fallback;

  const paymentConfig = (settings?.payment ?? {}) as Record<string, unknown>;
  const manualConfig = (paymentConfig.manual ?? {}) as Record<string, unknown>;
  const storageConfig = (settings?.storage ?? {}) as Record<string, unknown>;
  const duitkuConfig = (paymentConfig.duitku ?? {}) as Record<string, unknown>;
  const resolveNumberString = (value: unknown, fallback: string) => {
    if (typeof value === "number") return String(value);
    if (typeof value === "string" && value.trim().length > 0) return value;
    return fallback;
  };

  const [activeGateway, setActiveGateway] = useState<string>(
    resolveString(paymentConfig.activeGateway, "manual-qris"),
  );
  const [testMode, setTestMode] = useState<boolean>(
    resolveBoolean(paymentConfig.testMode, true),
  );
  const [storeName, setStoreName] = useState(settings?.storeName ?? "Digital Goods Store");
  const [storeLogoUrl, setStoreLogoUrl] = useState(settings?.storeLogoUrl ?? "");
  const [contactEmail, setContactEmail] = useState(settings?.contactEmail ?? "hello@store.test");
  const [downloadExpiryHours, setDownloadExpiryHours] = useState(
    String(settings?.policy?.downloadExpiryHours ?? 72),
  );
  const [maxDownloads, setMaxDownloads] = useState(String(settings?.policy?.maxDownloads ?? 3));
  const [storageProvider, setStorageProvider] = useState(
    resolveString(storageConfig.provider, "local"),
  );
  const [storageBaseUrl, setStorageBaseUrl] = useState(
    resolveString(storageConfig.baseUrl, ""),
  );
  const [manualInstructions, setManualInstructions] = useState(
    resolveString(manualConfig.instructions, "Selesaikan pembayaran melalui QRIS dan kirim bukti ke email kami."),
  );
  const [manualQrImageUrl, setManualQrImageUrl] = useState(
    resolveString(manualConfig.qrImageUrl, ""),
  );
  const [duitkuMerchantCode, setDuitkuMerchantCode] = useState(
    resolveString(duitkuConfig.merchantCode, ""),
  );
  const [duitkuApiKey, setDuitkuApiKey] = useState(resolveString(duitkuConfig.apiKey, ""));
  const [duitkuBaseUrl, setDuitkuBaseUrl] = useState(resolveString(duitkuConfig.baseUrl, ""));
  const [duitkuPaymentMethod, setDuitkuPaymentMethod] = useState(
    resolveString(duitkuConfig.paymentMethod, ""),
  );
  const [duitkuReturnUrl, setDuitkuReturnUrl] = useState(resolveString(duitkuConfig.returnUrl, ""));
  const [duitkuCallbackUrl, setDuitkuCallbackUrl] = useState(
    resolveString(duitkuConfig.callbackUrl, ""),
  );
  const [duitkuProductDetails, setDuitkuProductDetails] = useState(
    resolveString(duitkuConfig.productDetails, ""),
  );
  const [duitkuExpiryPeriod, setDuitkuExpiryPeriod] = useState(
    resolveNumberString(duitkuConfig.expiryPeriod, "60"),
  );
  const [isSubmitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const payload = {
        storeName,
        storeLogoUrl: storeLogoUrl || null,
        contactEmail,
        payment: {
          activeGateway,
          testMode,
          manual: {
            instructions: manualInstructions,
            qrImageUrl: manualQrImageUrl || undefined,
          },
          duitku: {
            merchantCode: duitkuMerchantCode,
            apiKey: duitkuApiKey,
            baseUrl: duitkuBaseUrl || undefined,
            paymentMethod: duitkuPaymentMethod || undefined,
            returnUrl: duitkuReturnUrl || undefined,
            callbackUrl: duitkuCallbackUrl || undefined,
            productDetails: duitkuProductDetails || undefined,
            expiryPeriod: Number(duitkuExpiryPeriod) || undefined,
          },
        },
        storage: {
          provider: storageProvider,
          baseUrl: storageBaseUrl,
        },
        policy: {
          downloadExpiryHours: Number(downloadExpiryHours) || 72,
          maxDownloads: Number(maxDownloads) || 3,
        },
      };

      const response = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error ?? "Gagal menyimpan pengaturan");
      }

      toast.success("Pengaturan disimpan");
    } catch (error) {
      toast.error("Tidak dapat menyimpan pengaturan", {
        description: error instanceof Error ? error.message : "Terjadi kesalahan",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="max-w-3xl">
      <CardHeader>
        <CardTitle>Pengaturan Toko</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <section className="space-y-4">
          <h3 className="text-sm font-semibold text-muted-foreground">Informasi Toko</h3>
          <div className="space-y-2">
            <Label>Nama Toko</Label>
            <Input value={storeName} onChange={(event) => setStoreName(event.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Logo URL</Label>
            <Input value={storeLogoUrl} onChange={(event) => setStoreLogoUrl(event.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Email Kontak</Label>
            <Input value={contactEmail} onChange={(event) => setContactEmail(event.target.value)} />
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="text-sm font-semibold text-muted-foreground">Payment Gateway</h3>
          <div className="space-y-2">
            <Label>Gateway Aktif</Label>
            <Select value={activeGateway} onValueChange={setActiveGateway}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {gatewayOptions.map((gateway) => (
                  <SelectItem key={gateway.value} value={gateway.value}>
                    {gateway.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div>
              <p className="font-medium">Mode Testing</p>
              <p className="text-sm text-muted-foreground">
                Gunakan kredensial sandbox sebelum live.
              </p>
            </div>
            <Switch checked={testMode} onCheckedChange={setTestMode} />
          </div>
          {activeGateway === "manual-qris" && (
            <div className="space-y-4 rounded-lg border p-4">
              <div className="space-y-2">
                <Label>Instruksi Pembayaran</Label>
                <Textarea
                  rows={4}
                  value={manualInstructions}
                  onChange={(event) => setManualInstructions(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>QR Image URL</Label>
                <Input
                  value={manualQrImageUrl}
                  onChange={(event) => setManualQrImageUrl(event.target.value)}
                />
              </div>
            </div>
          )}
          {activeGateway === "duitku" && (
            <div className="space-y-4 rounded-lg border p-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Merchant Code</Label>
                  <Input
                    value={duitkuMerchantCode}
                    onChange={(event) => setDuitkuMerchantCode(event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>API Key</Label>
                  <Input
                    value={duitkuApiKey}
                    onChange={(event) => setDuitkuApiKey(event.target.value)}
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Base URL</Label>
                  <Input
                    placeholder="https://sandbox.duitku.com"
                    value={duitkuBaseUrl}
                    onChange={(event) => setDuitkuBaseUrl(event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Payment Method</Label>
                  <Input
                    placeholder="Leave blank for default"
                    value={duitkuPaymentMethod}
                    onChange={(event) => setDuitkuPaymentMethod(event.target.value)}
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Return URL</Label>
                  <Input
                    placeholder="Override success URL"
                    value={duitkuReturnUrl}
                    onChange={(event) => setDuitkuReturnUrl(event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Callback URL</Label>
                  <Input
                    placeholder="Override webhook URL"
                    value={duitkuCallbackUrl}
                    onChange={(event) => setDuitkuCallbackUrl(event.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Product Details</Label>
                <Textarea
                  rows={2}
                  value={duitkuProductDetails}
                  onChange={(event) => setDuitkuProductDetails(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Expiry Period (minutes)</Label>
                <Input
                  type="number"
                  value={duitkuExpiryPeriod}
                  onChange={(event) => setDuitkuExpiryPeriod(event.target.value)}
                />
              </div>
            </div>
          )}
        </section>

        <section className="space-y-4">
          <h3 className="text-sm font-semibold text-muted-foreground">Storage</h3>
          <div className="space-y-2">
            <Label>Provider</Label>
            <Select value={storageProvider} onValueChange={setStorageProvider}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {storageProviders.map((provider) => (
                  <SelectItem key={provider.value} value={provider.value}>
                    {provider.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Base URL</Label>
            <Input value={storageBaseUrl} onChange={(event) => setStorageBaseUrl(event.target.value)} />
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="text-sm font-semibold text-muted-foreground">Kebijakan Unduhan</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Expiry (jam)</Label>
              <Input
                type="number"
                value={downloadExpiryHours}
                onChange={(event) => setDownloadExpiryHours(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Max Downloads</Label>
              <Input
                type="number"
                value={maxDownloads}
                onChange={(event) => setMaxDownloads(event.target.value)}
              />
            </div>
          </div>
        </section>

        <Button onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? "Menyimpan..." : "Simpan Pengaturan"}
        </Button>
      </CardContent>
    </Card>
  );
}
