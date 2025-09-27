"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { NormalizedOrder } from "@/lib/orders";
import { formatIDR } from "@/lib/currency";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { id } from "date-fns/locale";

const statusBadges: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  paid: "default",
  pending: "secondary",
  failed: "destructive",
  refunded: "outline",
};

interface OrdersTableProps {
  orders: NormalizedOrder[];
}

export function OrdersTable({ orders }: OrdersTableProps) {
  const [statusFilter, setStatusFilter] = useState<string>("semua");
  const [gatewayFilter, setGatewayFilter] = useState<string>("semua");
  const [search, setSearch] = useState("");

  const gateways = useMemo(() => {
    const unique = new Set<string>();
    orders.forEach((order) => unique.add(order.paymentGateway));
    return Array.from(unique.values());
  }, [orders]);

  const filtered = useMemo(() => {
    return orders.filter((order) => {
      const matchStatus = statusFilter === "semua" || order.status === statusFilter;
      const matchGateway = gatewayFilter === "semua" || order.paymentGateway === gatewayFilter;
      const keyword = search.toLowerCase();
      const matchSearch = [
        order.orderNumber,
        order.customer.email,
        order.customer.name,
      ]
        .join(" ")
        .toLowerCase()
        .includes(keyword);

      return matchStatus && matchGateway && matchSearch;
    });
  }, [orders, statusFilter, gatewayFilter, search]);

  return (
    <Card>
      <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <CardTitle>Orders</CardTitle>
        <div className="flex w-full flex-col gap-3 md:w-auto md:flex-row">
          <Input
            placeholder="Cari order..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="w-full md:w-56"
          />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="semua">Semua Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="refunded">Refunded</SelectItem>
            </SelectContent>
          </Select>
          <Select value={gatewayFilter} onValueChange={setGatewayFilter}>
            <SelectTrigger className="w-full md:w-40">
              <SelectValue placeholder="Gateway" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="semua">Semua Gateway</SelectItem>
              {gateways.map((gateway) => (
                <SelectItem key={gateway} value={gateway}>
                  {formatGatewayLabel(gateway)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order</TableHead>
              <TableHead>Pelanggan</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Gateway</TableHead>
              <TableHead>Tanggal</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((order) => (
              <TableRow key={order.id}>
                <TableCell className="font-medium">{order.orderNumber}</TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span>{order.customer.name}</span>
                    <span className="text-xs text-muted-foreground">{order.customer.email}</span>
                  </div>
                </TableCell>
                <TableCell>{formatIDR(order.totalIDR)}</TableCell>
                <TableCell>
                  <Badge variant={statusBadges[order.status] ?? "secondary"}>{order.status}</Badge>
                </TableCell>
                <TableCell>{formatGatewayLabel(order.paymentGateway)}</TableCell>
                <TableCell>
                  {format(order.createdAt, "dd MMM yyyy HH:mm", { locale: id })}
                </TableCell>
                <TableCell className="text-right">
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/admin/orders/${order.id}`}>Detail</Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center text-sm text-muted-foreground">
                  Tidak ada order dengan filter saat ini.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
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
    case "auto-qris":
      return "Auto QRIS";
    case "manual-qris":
      return "Manual QRIS";
    default:
      return gateway;
  }
}
