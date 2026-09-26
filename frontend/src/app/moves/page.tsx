'use client';

import { useEffect, useState } from 'react';
import AppShell from '@/components/AppShell';
import { moves as api } from '@/lib/api';
import { useToast } from '@/lib/toast';

export default function MovesPage() {
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    (async () => {
      try {
        setList(await api.list(50));
      } catch (e: any) {
        toast(e.message, 'error');
      } finally {
        setLoading(false);
      }
    })();
  }, [toast]);

  return (
    <AppShell title="Move History" subtitle="Complete stock ledger">
      <div className="glass rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-dark-800/80 text-slate-400 text-xs uppercase">
              <tr>
                <th className="text-left px-5 py-3">Date</th>
                <th className="text-left px-5 py-3">Product</th>
                <th className="text-left px-5 py-3">Warehouse</th>
                <th className="text-right px-5 py-3">Qty</th>
                <th className="text-left px-5 py-3">Type</th>
                <th className="text-left px-5 py-3">Reference</th>
              </tr>
            </thead>
            <tbody>
              {list.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-slate-500">No moves yet</td>
                </tr>
              ) : (
                list.map((m) => (
                  <tr key={m.id} className="border-t border-slate-800 hover:bg-brand-500/5 transition">
                    <td className="px-5 py-3 text-xs text-slate-400">{new Date(m.created_at).toLocaleString()}</td>
                    <td className="px-5 py-3 font-medium">{m.product_name}</td>
                    <td className="px-5 py-3 text-slate-400">{m.warehouse_name}</td>
                    <td className={`px-5 py-3 text-right font-semibold ${m.quantity >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {m.quantity >= 0 ? '+' : ''}{m.quantity}
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-xs bg-dark-800 px-2 py-1 rounded">{m.move_type}</span>
                    </td>
                    <td className="px-5 py-3 text-xs font-mono text-slate-500">{m.reference || '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </AppShell>
  );
}
