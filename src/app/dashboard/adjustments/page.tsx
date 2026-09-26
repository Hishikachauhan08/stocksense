import { getAdjustments } from '@/actions/adjustments'
import Link from 'next/link'
import { SlidersHorizontal, Plus, Clock, CheckCircle } from 'lucide-react'
import { formatDate, getStatusBadge } from '@/lib/utils'

export default async function AdjustmentsPage({
  searchParams,
}: {
  searchParams: { status?: string }
}) {
  const status = searchParams.status || 'all'
  const adjustments = await getAdjustments(status)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Inventory Adjustments</h1>
          <p className="text-xs text-slate-400 mt-1">
            Reconcile physical stock counts with digital system inventory
          </p>
        </div>

        <Link
          href="/dashboard/adjustments/new"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-semibold shadow-md transition-colors w-fit"
        >
          <Plus className="w-4 h-4" /> New Physical Count Adjustment
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-700 pb-3 text-xs font-semibold">
        <Link
          href="/dashboard/adjustments"
          className={`px-3 py-1.5 rounded-lg transition-colors ${
            status === 'all'
              ? 'bg-blue-600 text-white'
              : 'text-slate-400 hover:bg-slate-800 hover:text-white'
          }`}
        >
          All Adjustments
        </Link>
        <Link
          href="/dashboard/adjustments?status=draft"
          className={`px-3 py-1.5 rounded-lg transition-colors ${
            status === 'draft'
              ? 'bg-amber-600 text-white'
              : 'text-slate-400 hover:bg-slate-800 hover:text-white'
          }`}
        >
          Pending Drafts
        </Link>
        <Link
          href="/dashboard/adjustments?status=validated"
          className={`px-3 py-1.5 rounded-lg transition-colors ${
            status === 'validated'
              ? 'bg-emerald-600 text-white'
              : 'text-slate-400 hover:bg-slate-800 hover:text-white'
          }`}
        >
          Validated (Reconciled)
        </Link>
      </div>

      {/* Adjustments Table */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/60 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-700">
              <tr>
                <th className="px-5 py-3.5">Reference</th>
                <th className="px-5 py-3.5">Counted Location</th>
                <th className="px-5 py-3.5">Item Discrepancies</th>
                <th className="px-5 py-3.5">Date</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/60 text-slate-300">
              {adjustments.map((a) => {
                const totalDiff = a.items.reduce((sum, it) => sum + Math.abs(it.difference), 0)
                return (
                  <tr key={a.id} className="hover:bg-slate-750/30">
                    <td className="px-5 py-3.5">
                      <Link
                        href={`/dashboard/adjustments/${a.id}`}
                        className="font-mono font-bold text-white hover:text-blue-400"
                      >
                        {a.reference}
                      </Link>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="font-medium text-slate-200">
                        {a.location.warehouse.name}
                      </span>
                      <span className="text-slate-400"> → {a.location.name}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="font-semibold text-white">{a.items.length} items</span>
                      <span className="text-slate-400"> (variance: ±{totalDiff} units)</span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-400">{formatDate(a.createdAt)}</td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${getStatusBadge(
                          a.status
                        )}`}
                      >
                        {a.status === 'draft' ? (
                          <Clock className="w-2.5 h-2.5 mr-1" />
                        ) : (
                          <CheckCircle className="w-2.5 h-2.5 mr-1" />
                        )}
                        {a.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <Link
                        href={`/dashboard/adjustments/${a.id}`}
                        className="px-2.5 py-1 bg-slate-700 hover:bg-slate-600 text-white rounded text-[11px] font-semibold transition-colors"
                      >
                        {a.status === 'draft' ? 'Review & Validate' : 'View Details'}
                      </Link>
                    </td>
                  </tr>
                )
              })}

              {adjustments.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-500">
                    <SlidersHorizontal className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    No inventory adjustments recorded.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
