'use client';

import { useEffect, useState } from 'react';
import { Plus, Warehouse as WarehouseIcon } from 'lucide-react';
import AppShell from '@/components/AppShell';
import Modal from '@/components/Modal';
import { warehouses as api, Warehouse } from '@/lib/api';
import { useToast } from '@/lib/toast';

export default function WarehousesPage() {
  const [list, setList] = useState<Warehouse[]>([]);
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const [form, setForm] = useState({ name: '', location: '' });

  const load = async () => {
    try {
      setList(await api.list());
    } catch (e: any) {
      toast(e.message, 'error');
    }
  };

  useEffect(() => { load(); }, []);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.create(form);
      toast('Warehouse created', 'success');
      setOpen(false);
      setForm({ name: '', location: '' });
      load();
    } catch (e: any) {
      toast(e.message, 'error');
    }
  };

  return (
    <AppShell title="Warehouses" subtitle="Manage storage locations">
      <div className="flex justify-end mb-6">
        <button onClick={() => setOpen(true)} className="btn-primary px-5 py-2.5 rounded-xl text-sm font-semibold text-white flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Warehouse
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {list.map((w) => (
          <div key={w.id} className="glass rounded-2xl p-5 card-hover">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-brand-600/20 flex items-center justify-center">
                <WarehouseIcon className="w-5 h-5 text-brand-400" />
              </div>
              <div>
                <p className="font-semibold">{w.name}</p>
                <p className="text-xs text-slate-500">{w.location || 'No location'}</p>
              </div>
            </div>
            <span className="text-xs text-emerald-400">Active</span>
          </div>
        ))}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Add Warehouse">
        <form onSubmit={create} className="space-y-4">
          <div>
            <label className="text-xs text-slate-400">Name *</label>
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full mt-1 px-4 py-2.5 bg-dark-800 border border-slate-700 rounded-xl text-sm" />
          </div>
          <div>
            <label className="text-xs text-slate-400">Location</label>
            <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="w-full mt-1 px-4 py-2.5 bg-dark-800 border border-slate-700 rounded-xl text-sm" />
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
