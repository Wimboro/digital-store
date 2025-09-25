import { formatIDR } from "@/lib/currency";
import { getDashboardMetrics } from "@/lib/metrics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export default async function AdminDashboardPage() {
  const metrics = await getDashboardMetrics();

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard title="Revenue Hari Ini" value={formatIDR(metrics.revenueToday)} />
        <MetricCard title="Revenue 7 Hari" value={formatIDR(metrics.revenue7d)} />
        <MetricCard title="Revenue 30 Hari" value={formatIDR(metrics.revenue30d)} />
        <MetricCard title="Avg Order Value" value={formatIDR(Math.round(metrics.avgOrderValue))} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Kinerja Toko</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <p>Total Order</p>
              <Badge variant="secondary">{metrics.totalOrders}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <p>Order Terbayar</p>
              <Badge variant="outline">{metrics.paidOrders}</Badge>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <p>Conversion Rate</p>
              <span className="font-medium">{(metrics.conversionRate * 100).toFixed(1)}%</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Produk Terlaris</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {metrics.topProducts.length === 0 && (
              <p className="text-sm text-muted-foreground">Belum ada penjualan dalam 30 hari terakhir.</p>
            )}
            <ul className="space-y-3">
              {metrics.topProducts.map((product) => (
                <li key={product.productId} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{product.title}</p>
                    <p className="text-xs text-muted-foreground">Terjual {product.count} kali</p>
                  </div>
                  <span className="text-sm text-muted-foreground">{formatIDR(product.revenue)}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function MetricCard({ title, value }: { title: string; value: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-semibold">{value}</p>
      </CardContent>
    </Card>
  );
}
