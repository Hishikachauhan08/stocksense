'use client';

import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import AppShell from '@/components/AppShell';
import Modal from '@/components/Modal';
import { adjustments as api, products as productsApi, warehouses as whApi, Product, Warehouse } from '@/lib/api';
import { statusColor } from '@/lib/utils';
import { useToast } from '@/lib/toast';

export default function AdjustmentsPage() {
  const [list, setList] = useState<any[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [whs, setWhs] = useState<Warehouse[]>([]);
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const [form, setForm] = useState({ warehouse_id: '', product_id: '', counted_qty: 0, reason: '' });

  const load = async () => {
    try {
      const [r, p, w] = await Promise.all([api.list(), productsApi.list(), whApi.list()]);
      setList(r); setProducts(p); setWhs(w);
      if (w.length && !form.warehouse_id) setForm((f) => ({ ...f, warehouse_id: String(w[0].id) }));
      if (p.length && !form.product_id) setForm((f) => ({ ...f, product_id: String(p[0].id) }));
    } catch (e: any) { toast(e.message, 'error'); }
  };

  useEffect(() => { load(); }, []);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.create({
        warehouse_id: Number(form.warehouse_id),
        product_id: Number(form.product_id),
        counted_qty: Number(form.counted_qty),
        reason: form.reason,
      });
      toast('Adjustment applied', 'success'); setOpen(false); load();
    } catch (e: any) { toast(e.message, 'error'); }
  };

  return (
    <AppShell title="Stock Adjustments" subtitle="Correct physical count differences">
      <div className="flex justify-end mb-6">
        <button onClick={() => setOpen(true)} className="btn-primary px-5 py-2.5 rounded-xl text-sm font-semibold text-white flex items-center gap-2">
          <Plus className="w-4 h-4" /> New Adjustment
        </button>
      </div>

      <div className="glass rounded-2xl overflow-hidden divide-y divide-slate-800">
        {list.length === 0 ? (
          <p className="p-8 text-center text-slate-500">No adjustments yet</p>
        ) : list.map((a) => (
          <div key={a.id} className="p-5 hover:bg-brand-500/5 transition flex items-center justify-between">
            <div>
              <p className="font-semibold">{a.reference}</p>
              <p className="text-xs text-slate-500 mt-0.5">{a.product_name} @ {a.warehouse_name} · {new Date(a.created_at).toLocaleString()}</p>
              <p className="text-sm mt-1">
                System: {a.system_qty} → Counted: {a.counted_qty}{' '}
                <span className={a.difference >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                  ({a.difference >= 0 ? '+' : ''}{a.difference})
                </span>
              </p>
              {a.reason && <p className="text-xs text-slate-500 mt-1">{a.reason}</p>}
            </div>
            <span className={`px-2.5 py-1 rounded-full text-xs font-medium text-white ${statusColor(a.status)}`}>{a.status}</span>
          </div>
        ))}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Stock Adjustment">
        <form onSubmit={create} className="space-y-4">
          <div>
            <label className="text-xs text-slate-400">Warehouse *</label>
            <select required value={form.warehouse_id} onChange={(e) => setForm({ ...form, warehouse_id: e.target.value })} className="w-full mt-1 px-4 py-2.5 bg-dark-800 border border-slate-700 rounded-xl text-sm">
              {whs.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-400">Product *</label>
            <select required value={form.product_id} onChange={(e) => setForm({ ...form, product_id: e.target.value })} className="w-full mt-1 px-4 py-2.5 bg-dark-800 border border-slate-700 rounded-xl text-sm">
              {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-400">Counted Quantity *</label>
            <input type="number" required step="any" value={form.counted_qty} onChange={(e) => setForm({ ...form, counted_qty: Number(e.target.value) })} className="w-full mt-1 px-4 py-2.5 bg-dark-800 border border-slate-700 rounded-xl text-sm" />
          </div>
          <div>
            <label className="text-xs text-slate-400">Reason</label>
            <input value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder="Damaged, lost, found..." className="w-full mt-1 px-4 py-2.5 bg-dark-800 border border-slate-700 rounded-xl text-sm" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setOpen(false)} className="flex-1 py-2.5 rounded-xl border border-slate-600 text-sm">Cancel</button>
            <button type="submit" className="flex-1 py-2.5 btn-primary rounded-xl text-sm font-semibold text-white">Apply</button>
          </div>
        </form>
      </Modal>
    </AppShell>
  );
}
