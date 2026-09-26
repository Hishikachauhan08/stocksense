'use client';

import { useEffect, useState } from 'react';
import { Plus, Search } from 'lucide-react';
import AppShell from '@/components/AppShell';
import Modal from '@/components/Modal';
import {
  products as productsApi,
  categories as categoriesApi,
  warehouses as warehousesApi,
  Product,
  Category,
  Warehouse,
} from '@/lib/api';
import { useToast } from '@/lib/toast';

export default function ProductsPage() {
  const [list, setList] = useState<Product[]>([]);
  const [cats, setCats] = useState<Category[]>([]);
  const [whs, setWhs] = useState<Warehouse[]>([]);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const [form, setForm] = useState({
    name: '',
    sku: '',
    category_id: '',
    unit: 'Units',
    reorder_level: 10,
    initial_stock: 0,
    warehouse_id: '',
  });

  const load = async () => {
    try {
      const [p, c, w] = await Promise.all([
        productsApi.list(),
        categoriesApi.list(),
        warehousesApi.list(),
      ]);
      setList(p);
      setCats(c);
      setWhs(w);
      if (w.length) setForm((f) => ({ ...f, warehouse_id: String(w[0].id) }));
    } catch (e: any) {
      toast(e.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = list.filter((p) => {
    const q = search.toLowerCase();
    const matchQ = !q || p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q);
    const matchC = !catFilter || p.category_id === Number(catFilter);
    return matchQ && matchC;
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await productsApi.create({
        name: form.name,
        sku: form.sku,
        category_id: form.category_id ? Number(form.category_id) : null,
        unit: form.unit,
        reorder_level: form.reorder_level,
        initial_stock: form.initial_stock,
        warehouse_id: form.warehouse_id ? Number(form.warehouse_id) : null,
      });
      toast('Product created', 'success');
      setOpen(false);
      setForm({ name: '', sku: '', category_id: '', unit: 'Units', reorder_level: 10, initial_stock: 0, warehouse_id: whs[0] ? String(whs[0].id) : '' });
      load();
    } catch (err: any) {
      toast(err.message, 'error');
    }
  };

  return (
    <AppShell title="Products" subtitle="Manage catalog & stock levels">
      <div className="flex flex-wrap gap-3 justify-between items-center mb-6">
        <div className="flex gap-3 flex-wrap">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name or SKU..."
              className="pl-10 pr-4 py-2.5 bg-dark-800 border border-slate-700 rounded-xl text-sm w-64"
            />
          </div>
          <select
            value={catFilter}
            onChange={(e) => setCatFilter(e.target.value)}
            className="px-4 py-2.5 bg-dark-800 border border-slate-700 rounded-xl text-sm"
          >
            <option value="">All Categories</option>
            {cats.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="btn-primary px-5 py-2.5 rounded-xl text-sm font-semibold text-white flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Add Product
        </button>
      </div>

      <div className="glass rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-dark-800/80 text-slate-400 text-xs uppercase">
              <tr>
                <th className="text-left px-5 py-3">Product</th>
                <th className="text-left px-5 py-3">SKU</th>
                <th className="text-left px-5 py-3">Category</th>
                <th className="text-right px-5 py-3">Stock</th>
                <th className="text-right px-5 py-3">Reorder</th>
                <th className="text-center px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-slate-500">No products found</td>
                </tr>
              ) : (
                filtered.map((p) => (
                  <tr key={p.id} className="border-t border-slate-800 hover:bg-brand-500/5 transition">
                    <td className="px-5 py-3.5 font-medium">{p.name}</td>
                    <td className="px-5 py-3.5 text-slate-400 font-mono text-xs">{p.sku}</td>
                    <td className="px-5 py-3.5 text-slate-400">{p.category_name || '—'}</td>
                    <td className="px-5 py-3.5 text-right font-semibold">
                      {p.total_stock} <span className="text-xs text-slate-500">{p.unit}</span>
                    </td>
                    <td className="px-5 py-3.5 text-right text-slate-400">{p.reorder_level}</td>
                    <td className="px-5 py-3.5 text-center">
                      {p.is_out ? (
                        <span className="text-red-400 text-xs font-medium">OUT</span>
                      ) : p.is_low ? (
                        <span className="text-amber-400 text-xs font-medium">LOW</span>
                      ) : (
                        <span className="text-emerald-400 text-xs font-medium">OK</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Create Product">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="text-xs text-slate-400">Name *</label>
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full mt-1 px-4 py-2.5 bg-dark-800 border border-slate-700 rounded-xl text-sm" />
          </div>
          <div>
            <label className="text-xs text-slate-400">SKU *</label>
            <input required value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} className="w-full mt-1 px-4 py-2.5 bg-dark-800 border border-slate-700 rounded-xl text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400">Category</label>
              <select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })} className="w-full mt-1 px-4 py-2.5 bg-dark-800 border border-slate-700 rounded-xl text-sm">
                <option value="">—</option>
                {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400">Unit</label>
              <input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} className="w-full mt-1 px-4 py-2.5 bg-dark-800 border border-slate-700 rounded-xl text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400">Reorder Level</label>
              <input type="number" value={form.reorder_level} onChange={(e) => setForm({ ...form, reorder_level: Number(e.target.value) })} className="w-full mt-1 px-4 py-2.5 bg-dark-800 border border-slate-700 rounded-xl text-sm" />
            </div>
            <div>
              <label className="text-xs text-slate-400">Initial Stock</label>
              <input type="number" value={form.initial_stock} onChange={(e) => setForm({ ...form, initial_stock: Number(e.target.value) })} className="w-full mt-1 px-4 py-2.5 bg-dark-800 border border-slate-700 rounded-xl text-sm" />
            </div>
          </div>
          <div>
            <label className="text-xs text-slate-400">Warehouse (for initial stock)</label>
            <select value={form.warehouse_id} onChange={(e) => setForm({ ...form, warehouse_id: e.target.value })} className="w-full mt-1 px-4 py-2.5 bg-dark-800 border border-slate-700 rounded-xl text-sm">
              {whs.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setOpen(false)} className="flex-1 py-2.5 rounded-xl border border-slate-600 text-sm">Cancel</button>
            <button type="submit" className="flex-1 py-2.5 btn-primary rounded-xl text-sm font-semibold text-white">Create</button>
          </div>
        </form>
      </Modal>
    </AppShell>
  );
}
