'use client';

import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import AppShell from '@/components/AppShell';
import Modal from '@/components/Modal';
import { transfers as api, products as productsApi, warehouses as whApi, Product, Warehouse } from '@/lib/api';
import { statusColor } from '@/lib/utils';
import { useToast } from '@/lib/toast';

export default function TransfersPage() {
  const [list, setList] = useState<any[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [whs, setWhs] = useState<Warehouse[]>([]);
  const [status, setStatus] = useState('');
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const [form, setForm] = useState({ source_warehouse_id: '', dest_warehouse_id: '', product_id: '', quantity: 1 });

  const load = async () => {
    try {
      const [r, p, w] = await Promise.all([api.list(status || undefined), productsApi.list(), whApi.list()]);
      setList(r); setProducts(p); setWhs(w);
      if (w.length >= 2) {
        setForm((f) => ({
          ...f,
          source_warehouse_id: f.source_warehouse_id || String(w[0].id),
          dest_warehouse_id: f.dest_warehouse_id || String(w[1].id),
        }));
      }
      if (p.length && !form.product_id) setForm((f) => ({ ...f, product_id: String(p[0].id) }));
    } catch (e: any) { toast(e.message, 'error'); }
  };

  useEffect(() => { load(); }, [status]);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.create({
        source_warehouse_id: Number(form.source_warehouse_id),
        dest_warehouse_id: Number(form.dest_warehouse_id),
        lines: [{ product_id: Number(form.product_id), quantity: Number(form.quantity) }],
      });
      toast('Transfer created', 'success'); setOpen(false); load();
    } catch (e: any) { toast(e.message, 'error'); }
  };

  const validate = async (id: number) => {
    try {
      await api.validate(id);
      toast('Transfer completed!', 'success'); load();
    } catch (e: any) { toast(e.message, 'error'); }
  };

  const whName = (id: number) => whs.find((w) => w.id === id)?.name || id;

  return (
    <AppShell title="Internal Transfers" subtitle="Move stock between locations">
      <div className="flex justify-between mb-6">
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="px-4 py-2.5 bg-dark-800 border border-slate-700 rounded-xl text-sm">
          <option value="">All Status</option>
          <option>Draft</option>
          <option>Done</option>
        </select>
        <button onClick={() => setOpen(true)} className="btn-primary px-5 py-2.5 rounded-xl text-sm font-semibold text-white flex items-center gap-2">
          <Plus className="w-4 h-4" /> New Transfer
        </button>
      </div>

      <div className="glass rounded-2xl overflow-hidden divide-y divide-slate-800">
        {list.length === 0 ? (
          <p className="p-8 text-center text-slate-500">No transfers yet</p>
        ) : list.map((t) => (
          <div key={t.id} className="p-5 hover:bg-brand-500/5 transition flex items-center justify-between">
            <div>
              <p className="font-semibold">{t.reference}</p>
              <p className="text-xs text-slate-500 mt-0.5">{whName(t.source_warehouse_id)} → {whName(t.dest_warehouse_id)} · {new Date(t.created_at).toLocaleString()}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {t.lines?.map((l: any, i: number) => (
                  <span key={i} className="text-xs bg-dark-800 px-2 py-1 rounded">{l.product_name} × {l.quantity}</span>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className={`px-2.5 py-1 rounded-full text-xs font-medium text-white ${statusColor(t.status)}`}>{t.status}</span>
              {t.status !== 'Done' && (
                <button onClick={() => validate(t.id)} className="btn-success px-3 py-1.5 rounded-lg text-xs text-white font-medium">Validate</button>
              )}
            </div>
          </div>
        ))}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="New Internal Transfer">
        <form onSubmit={create} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400">From *</label>
              <select required value={form.source_warehouse_id} onChange={(e) => setForm({ ...form, source_warehouse_id: e.target.value })} className="w-full mt-1 px-4 py-2.5 bg-dark-800 border border-slate-700 rounded-xl text-sm">
                {whs.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400">To *</label>
              <select required value={form.dest_warehouse_id} onChange={(e) => setForm({ ...form, dest_warehouse_id: e.target.value })} className="w-full mt-1 px-4 py-2.5 bg-dark-800 border border-slate-700 rounded-xl text-sm">
                {whs.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs text-slate-400">Product *</label>
            <select required value={form.product_id} onChange={(e) => setForm({ ...form, product_id: e.target.value })} className="w-full mt-1 px-4 py-2.5 bg-dark-800 border border-slate-700 rounded-xl text-sm">
              {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-400">Quantity *</label>
            <input type="number" required min={0.01} step="any" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })} className="w-full mt-1 px-4 py-2.5 bg-dark-800 border border-slate-700 rounded-xl text-sm" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setOpen(false)} className="flex-1 py-2.5 rounded-xl border border-slate-600 text-sm">Cancel</button>
            <button type="submit" className="flex-1 py-2.5 btn-primary rounded-xl text-sm font-semibold text-white">Create Draft</button>
          </div>
        </form>
      </Modal>
    </AppShell>
  );
}
