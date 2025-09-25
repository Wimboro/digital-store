"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { useForm, type UseFormReturn } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { formatIDR } from "@/lib/currency";
import type { StoreSettings, StorefrontProduct } from "@/lib/serializers";

const checkoutSchema = z.object({
  name: z.string().min(1, "Nama wajib diisi"),
  email: z.string().email("Email tidak valid"),
  phone: z.string().optional(),
});

type CheckoutValues = z.infer<typeof checkoutSchema>;

type CheckoutResponse = {
  orderId: string;
  orderNumber: string;
  paymentGateway: string;
  paymentAction?: {
    type: "manual" | "redirect";
    instructions?: string;
    qrImageUrl?: string | null;
    url?: string;
  };
};

interface StorefrontProps {
  products: StorefrontProduct[];
  settings: StoreSettings | null;
}

export function Storefront({ products, settings }: StorefrontProps) {
  const [search, setSearch] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<StorefrontProduct | null>(null);
  const [isCheckoutOpen, setCheckoutOpen] = useState(false);
  const [checkoutResult, setCheckoutResult] = useState<CheckoutResponse | null>(null);
  const [isSubmitting, setSubmitting] = useState(false);

  const form = useForm<CheckoutValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
    },
  });

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch = [
        product.title,
        product.shortDescription,
        product.tags.join(" "),
      ]
        .join(" ")
        .toLowerCase()
        .includes(search.toLowerCase());

      const matchesTag = activeTag ? product.tags.includes(activeTag) : true;

      return matchesSearch && matchesTag;
    });
  }, [products, search, activeTag]);

  const uniqueTags = useMemo(() => {
    const tags = new Set<string>();
    products.forEach((product) => {
      product.tags.forEach((tag) => tags.add(tag));
    });
    return Array.from(tags.values()).sort();
  }, [products]);

  const activeGateway =
    typeof settings?.payment?.activeGateway === "string"
      ? settings.payment.activeGateway
      : "manual-qris";

  const handleCheckout = async (values: CheckoutValues) => {
    if (!selectedProduct) return;

    setSubmitting(true);
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: selectedProduct.id,
          customer: values,
        }),
      });

      if (!response.ok) {
        throw new Error("Gagal memproses checkout");
      }

      const data = (await response.json()) as CheckoutResponse;
      setCheckoutResult(data);
      toast.success("Pesanan berhasil dibuat", {
        description: `Nomor order ${data.orderNumber}`,
      });
      setCheckoutOpen(false);
      setSelectedProduct(null);
    } catch (error) {
      toast.error("Checkout gagal", {
        description:
          error instanceof Error ? error.message : "Terjadi kesalahan pada server",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSelectProduct = (product: StorefrontProduct) => {
    setSelectedProduct(product);
    form.reset();
    setCheckoutOpen(true);
    setCheckoutResult(null);
  };

  return (
    <div className="space-y-12">
      <HeroSection settings={settings} productCount={products.length} />

      <section className="space-y-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex w-full max-w-lg items-center gap-2">
            <Input
              placeholder="Cari produk digital..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <Tabs value={activeTag ?? "semua"} onValueChange={(value) => setActiveTag(value === "semua" ? null : value)}>
            <TabsList className="w-full overflow-x-auto">
              <TabsTrigger value="semua">Semua</TabsTrigger>
              {uniqueTags.map((tag) => (
                <TabsTrigger key={tag} value={tag} className="capitalize">
                  {tag}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredProducts.map((product) => (
            <Card key={product.id} className="flex flex-col overflow-hidden">
              <div
                className="h-48 bg-cover bg-center"
                style={{ backgroundImage: `url(${product.images[0] ?? "/placeholder.svg"})` }}
              />
              <CardHeader className="space-y-2">
                <div className="flex flex-wrap gap-1">
                  {product.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
                <CardTitle>{product.title}</CardTitle>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {product.shortDescription}
                </p>
              </CardHeader>
              <CardContent className="mt-auto space-y-4">
                <div className="space-y-1">
                  <p className="text-lg font-semibold text-primary">
                    {formatIDR(product.salePriceIDR ?? product.priceIDR)}
                  </p>
                  {product.salePriceIDR && (
                    <p className="text-sm text-muted-foreground line-through">
                      {formatIDR(product.priceIDR)}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button className="flex-1" onClick={() => setSelectedProduct(product)}>
                    Detail
                  </Button>
                  <Button className="flex-1" onClick={() => handleSelectProduct(product)}>
                    Beli Sekarang
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        {filteredProducts.length === 0 && (
          <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
            Tidak ada produk yang cocok dengan pencarian.
          </div>
        )}
      </section>

      <ProductDetailDialog
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onCheckout={() => setCheckoutOpen(true)}
        activeGateway={activeGateway}
      />

      <CheckoutSheet
        isOpen={isCheckoutOpen}
        onOpenChange={setCheckoutOpen}
        product={selectedProduct}
        form={form}
        onSubmit={handleCheckout}
        isSubmitting={isSubmitting}
        activeGateway={activeGateway}
      />

      <CheckoutResult result={checkoutResult} />
    </div>
  );
}

function HeroSection({
  settings,
  productCount,
}: {
  settings: StoreSettings | null;
  productCount: number;
}) {
  return (
    <section className="rounded-3xl border bg-gradient-to-br from-primary/5 via-background to-background p-10">
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="space-y-4">
          <Badge variant="outline" className="w-fit">
            Produk Digital • Unduh Instan
          </Badge>
          <h1 className="text-3xl font-bold md:text-4xl">
            {settings?.storeName ?? "Digital Goods Store"}
          </h1>
          <p className="max-w-2xl text-lg text-muted-foreground">
            Beli ebook, template, dan aset digital lainnya dengan checkout sekali klik.
            Setelah pembayaran, link unduhan aman akan dikirimkan langsung ke email Anda.
          </p>
        </div>
        <div className="rounded-xl border bg-card p-6 text-center">
          <p className="text-sm text-muted-foreground">Koleksi Produk</p>
          <p className="text-3xl font-semibold">{productCount}</p>
        </div>
      </div>
    </section>
  );
}

function ProductDetailDialog({
  product,
  onClose,
  onCheckout,
  activeGateway,
}: {
  product: StorefrontProduct | null;
  onClose: () => void;
  onCheckout: () => void;
  activeGateway: string;
}) {
  return (
    <Dialog open={Boolean(product)} onOpenChange={(value) => !value && onClose()}>
      <DialogContent className="max-w-2xl overflow-y-auto">
        {product && (
          <div className="space-y-6">
            <DialogHeader>
              <DialogTitle>{product.title}</DialogTitle>
            </DialogHeader>
            <div className="prose prose-neutral dark:prose-invert">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeRaw, rehypeSanitize]}
              >
                {product.description}
              </ReactMarkdown>
            </div>
            <Separator />
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-2xl font-semibold text-primary">
                  {formatIDR(product.salePriceIDR ?? product.priceIDR)}
                </p>
                {product.salePriceIDR && (
                  <p className="text-sm text-muted-foreground line-through">
                    {formatIDR(product.priceIDR)}
                  </p>
                )}
              </div>
              <Button size="lg" onClick={onCheckout}>
                Checkout via {formatGatewayLabel(activeGateway)}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function CheckoutSheet({
  isOpen,
  onOpenChange,
  product,
  form,
  onSubmit,
  isSubmitting,
  activeGateway,
}: {
  isOpen: boolean;
  onOpenChange: (value: boolean) => void;
  product: StorefrontProduct | null;
  form: UseFormReturn<CheckoutValues>;
  onSubmit: (values: CheckoutValues) => void;
  isSubmitting: boolean;
  activeGateway: string;
}) {
  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Checkout Produk</SheetTitle>
          <SheetDescription>
            {product ? `Anda akan membeli ${product.title}` : "Pilih produk terlebih dahulu"}
          </SheetDescription>
        </SheetHeader>

        {product && (
          <form
            className="mt-6 space-y-6"
            onSubmit={form.handleSubmit(onSubmit)}
            noValidate
          >
            <div className="space-y-2">
              <Label>Produk</Label>
              <div className="rounded-lg border bg-muted/40 p-3">
                <p className="font-medium">{product.title}</p>
                <p className="text-sm text-muted-foreground">{formatIDR(product.salePriceIDR ?? product.priceIDR)}</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Nama Lengkap</Label>
              <Input id="name" placeholder="Nama Anda" {...form.register("name")} />
              {form.formState.errors.name && (
                <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="email@anda.com" {...form.register("email")} />
              {form.formState.errors.email && (
                <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Nomor WhatsApp (opsional)</Label>
              <Input id="phone" placeholder="08xxxxxxxxxx" {...form.register("phone")} />
            </div>

            <div className="space-y-2">
              <Label>Metode Pembayaran</Label>
              <div className="rounded-lg border bg-muted/40 p-3 text-sm text-muted-foreground">
                {formatGatewayLabel(activeGateway)}
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Memproses..." : "Bayar Sekarang"}
            </Button>
          </form>
        )}
      </SheetContent>
    </Sheet>
  );
}

function CheckoutResult({ result }: { result: CheckoutResponse | null }) {
  if (!result) return null;

  return (
    <section className="rounded-xl border bg-muted/30 p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Order berhasil dibuat</p>
          <h3 className="text-xl font-semibold">Nomor Order {result.orderNumber}</h3>
        </div>
        <div className="space-y-2 text-sm">
          <p>Gateway: {formatGatewayLabel(result.paymentGateway)}</p>
              {result.paymentAction?.type === "manual" && (
                <div className="space-y-2 rounded-lg border bg-background p-3">
                  <p className="font-medium">Instruksi Pembayaran</p>
                  <p className="text-muted-foreground">{result.paymentAction.instructions}</p>
                  {result.paymentAction.qrImageUrl && (
                    <Image
                      src={result.paymentAction.qrImageUrl}
                      alt="QRIS"
                      width={160}
                      height={160}
                      className="mt-2 h-40 w-40 rounded-lg border object-cover"
                    />
                  )}
                </div>
              )}
          {result.paymentAction?.type === "redirect" && result.paymentAction.url && (
            <Button asChild variant="secondary">
              <a href={result.paymentAction.url}>Lanjut ke Pembayaran</a>
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}

function formatGatewayLabel(gateway: string) {
  switch (gateway) {
    case "stripe":
      return "Stripe";
    case "midtrans":
      return "Midtrans";
    case "xendit":
      return "Xendit";
    case "duitku":
      return "Duitku";
    case "manual-qris":
      return "Manual QRIS";
    default:
      return gateway;
  }
}
