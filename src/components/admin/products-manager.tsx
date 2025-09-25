"use client";

import { useState } from "react";
import type { StorefrontProduct } from "@/lib/serializers";
import { formatIDR } from "@/lib/currency";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const productFormSchema = z.object({
  title: z.string().min(1),
  slug: z.string().min(3),
  shortDescription: z.string().min(1),
  description: z.string().min(1),
  priceIDR: z.string().min(1),
  salePriceIDR: z.string().optional(),
  fileKey: z.string().min(1),
  tags: z.string().optional(),
  images: z.string().min(1),
  isActive: z.boolean(),
});

type ProductFormValues = z.infer<typeof productFormSchema>;

export function ProductsManager({ products }: { products: StorefrontProduct[] }) {
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<StorefrontProduct | null>(null);
  const [isSubmitting, setSubmitting] = useState(false);

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      title: "",
      slug: "",
      shortDescription: "",
      description: "",
      priceIDR: "",
      salePriceIDR: "",
      fileKey: "",
      tags: "",
      images: "",
      isActive: true,
    },
  });

  const openCreate = () => {
    setEditingProduct(null);
    form.reset({
      title: "",
      slug: "",
      shortDescription: "",
      description: "",
      priceIDR: "",
      salePriceIDR: "",
      fileKey: "",
      tags: "",
      images: "",
      isActive: true,
    });
    setDialogOpen(true);
  };

  const openEdit = (product: StorefrontProduct) => {
    setEditingProduct(product);
    form.reset({
      title: product.title,
      slug: product.slug,
      shortDescription: product.shortDescription,
      description: product.description,
      priceIDR: product.priceIDR.toString(),
      salePriceIDR: product.salePriceIDR ? product.salePriceIDR.toString() : "",
      fileKey: product.fileKey,
      tags: product.tags.join(", "),
      images: product.images.join(", "),
      isActive: product.isActive,
    });
    setDialogOpen(true);
  };

  const onSubmit = form.handleSubmit(async (values) => {
    setSubmitting(true);
    try {
      const payload = {
        title: values.title,
        slug: values.slug,
        shortDescription: values.shortDescription,
        description: values.description,
        priceIDR: Number(values.priceIDR),
        salePriceIDR: values.salePriceIDR ? Number(values.salePriceIDR) : undefined,
        fileKey: values.fileKey,
        tags: values.tags
          ? values.tags.split(",").map((tag) => tag.trim()).filter(Boolean)
          : [],
        images: values.images.split(",").map((url) => url.trim()).filter(Boolean),
        isActive: values.isActive,
      };

      const endpoint = editingProduct
        ? `/api/admin/products/${editingProduct.id}`
        : "/api/admin/products";

      const response = await fetch(endpoint, {
        method: editingProduct ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error ?? "Gagal menyimpan produk");
      }

      toast.success(editingProduct ? "Produk diperbarui" : "Produk ditambahkan", {
        description: "Refresh halaman untuk melihat perubahan.",
      });
      setDialogOpen(false);
    } catch (error) {
      toast.error("Tidak dapat menyimpan produk", {
        description: error instanceof Error ? error.message : "Terjadi kesalahan",
      });
    } finally {
      setSubmitting(false);
    }
  });

  const handleDelete = async (product: StorefrontProduct) => {
    if (!window.confirm(`Hapus produk ${product.title}?`)) return;

    try {
      const response = await fetch(`/api/admin/products/${product.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error ?? "Gagal menghapus produk");
      }

      toast.success("Produk dihapus", { description: "Refresh halaman untuk update data." });
    } catch (error) {
      toast.error("Tidak dapat menghapus produk", {
        description: error instanceof Error ? error.message : "Terjadi kesalahan",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Produk</h1>
        <Button onClick={openCreate}>Produk Baru</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {products.map((product) => (
          <Card key={product.id}>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">{product.title}</CardTitle>
              <Badge variant={product.isActive ? "default" : "secondary"}>
                {product.isActive ? "Aktif" : "Draft"}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground line-clamp-3">
                {product.shortDescription}
              </p>
              <div>
                <p className="text-sm text-muted-foreground">Harga</p>
                <p className="text-lg font-semibold">
                  {formatIDR(product.salePriceIDR ?? product.priceIDR)}
                </p>
                {product.salePriceIDR && (
                  <p className="text-xs text-muted-foreground line-through">
                    {formatIDR(product.priceIDR)}
                  </p>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {product.tags.map((tag) => (
                  <Badge key={tag} variant="outline">
                    {tag}
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => openEdit(product)}>
                  Edit
                </Button>
                <Button variant="destructive" size="sm" onClick={() => handleDelete(product)}>
                  Hapus
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingProduct ? "Edit Produk" : "Produk Baru"}</DialogTitle>
          </DialogHeader>
          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="space-y-2">
              <Label htmlFor="title">Judul</Label>
              <Input id="title" {...form.register("title")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <Input id="slug" {...form.register("slug")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="shortDescription">Deskripsi Singkat</Label>
              <Textarea id="shortDescription" rows={2} {...form.register("shortDescription")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Deskripsi Markdown</Label>
              <Textarea id="description" rows={6} {...form.register("description")} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="priceIDR">Harga</Label>
                <Input id="priceIDR" type="number" {...form.register("priceIDR")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="salePriceIDR">Harga Diskon</Label>
                <Input id="salePriceIDR" type="number" {...form.register("salePriceIDR")} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="fileKey">File Key</Label>
              <Input id="fileKey" {...form.register("fileKey")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="images">URL Gambar (pisahkan dengan koma)</Label>
              <Textarea id="images" rows={2} {...form.register("images")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tags">Tags (pisahkan dengan koma)</Label>
              <Input id="tags" {...form.register("tags")} />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="font-medium">Produk Aktif</p>
                <p className="text-sm text-muted-foreground">Sembunyikan dari storefront jika dimatikan.</p>
              </div>
              <Switch
                checked={form.watch("isActive")}
                onCheckedChange={(checked) => form.setValue("isActive", checked)}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Menyimpan..." : "Simpan"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
