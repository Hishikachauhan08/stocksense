'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Package,
  AlertTriangle,
  XCircle,
  Cuboid,
  Truck,
  Boxes,
  ArrowLeftRight,
  PlusCircle,
} from 'lucide-react';
import AppShell from '@/components/AppShell';
import KpiCard from '@/components/KpiCard';
import { dashboard, products as productsApi, Product, DashboardKPI } from '@/lib/api';
import { useToast } from '@/lib/toast';

export default function DashboardPage() {
  const [kpis, setKpis] = useState<DashboardKPI | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    (async () => {
      try {
        const [k, p] = await Promise.all([dashboard.kpis(), productsApi.list()]);
        setKpis(k);
        setProducts(p);
      } catch (e: any) {
        toast(e.message, 'error');
      } finally {
        setLoading(false);
      }
    })();
  }, [toast]);

  const low = products.filter((p) => p.is_low || p.is_out);

  if (loading) {
    return (
      <AppShell title="Dashboard" subtitle="Real-time inventory snapshot">
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="Dashboard" subtitle="Real-time inventory snapshot">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <KpiCard title="Total Products" value={kpis?.total_products ?? 0} icon={Package} gradient="from-blue-500 to-cyan-500" delay={0} />
        <KpiCard title="Low Stock" value={kpis?.low_stock_items ?? 0} icon={AlertTriangle} gradient="from-amber-500 to-orange-500" alert={(kpis?.low_stock_items ?? 0) > 0} delay={0.05} />
        <KpiCard title="Out of Stock" value={kpis?.out_of_stock_items ?? 0} icon={XCircle} gradient="from-red-500 to-rose-500" alert={(kpis?.out_of_stock_items ?? 0) > 0} delay={0.1} />
        <KpiCard title="Total Units" value={Math.round(kpis?.total_stock_value ?? 0)} icon={Cuboid} gradient="from-emerald-500 to-teal-500" delay={0.15} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
        <KpiCard title="Pending Receipts" value={kpis?.pending_receipts ?? 0} icon={Truck} gradient="from-indigo-500 to-purple-500" delay={0.2} />
        <KpiCard title="Pending Deliveries" value={kpis?.pending_deliveries ?? 0} icon={Boxes} gradient="from-pink-500 to-rose-500" delay={0.25} />
        <KpiCard title="Pending Transfers" value={kpis?.pending_transfers ?? 0} icon={ArrowLeftRight} gradient="from-violet-500 to-purple-500" delay={0.3} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass rounded-2xl p-6">
          <h3 className="font-semibold mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'New Receipt', href: '/receipts' },
              { label: 'New Delivery', href: '/deliveries' },
              { label: 'New Transfer', href: '/transfers' },
              { label: 'Stock Adjust', href: '/adjustments' },
            ].map((a) => (
              <button
                key={a.href}
                onClick={() => router.push(a.href)}
                className="p-4 rounded-xl bg-dark-800 hover:bg-brand-600/20 border border-slate-700 hover:border-brand-500 transition text-left"
              >
                <PlusCircle className="w-5 h-5 text-brand-400 mb-2" />
                <p className="text-sm font-medium">{a.label}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="glass rounded-2xl p-6">
          <h3 className="font-semibold mb-4">Stock Alerts</h3>
          <div className="space-y-2 max-h-48 overflow-y-auto text-sm">
            {low.length === 0 ? (
              <p className="text-slate-500">No alerts – all stock healthy 🎉</p>
            ) : (
              low.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-dark-800/50"
                >
                  <div>
                    <span className="font-medium">{p.name}</span>
                    <span className="text-slate-500 text-xs ml-1">({p.sku})</span>
                  </div>
                  <span className={`text-xs ${p.is_out ? 'text-red-400' : 'text-amber-400'}`}>
                    {p.is_out ? 'OUT OF STOCK' : `Low: ${p.total_stock}`}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
