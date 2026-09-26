import { getTransfers } from '@/actions/transfers'
import Link from 'next/link'
import { ArrowLeftRight, Plus, Clock, CheckCircle } from 'lucide-react'
import { formatDate, getStatusBadge } from '@/lib/utils'

export default async function TransfersPage({
  searchParams,
}: {
  searchParams: { status?: string }
}) {
  const status = searchParams.status || 'all'
  const transfers = await getTransfers(status)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Internal Transfers</h1>
          <p className="text-xs text-slate-400 mt-1">
            Relocate stock between warehouses or internal storage bins with zero net change to total stock
          </p>
        </div>

        <Link
          href="/dashboard/transfers/new"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-md transition-colors w-fit"
        >
          <Plus className="w-4 h-4" /> Create Internal Transfer
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-700 pb-3 text-xs font-semibold">
        <Link
          href="/dashboard/transfers"
          className={`px-3 py-1.5 rounded-lg transition-colors ${
            status === 'all'
              ? 'bg-blue-600 text-white'
              : 'text-slate-400 hover:bg-slate-800 hover:text-white'
          }`}
        >
          All Transfers
        </Link>
        <Link
          href="/dashboard/transfers?status=draft"
          className={`px-3 py-1.5 rounded-lg transition-colors ${
            status === 'draft'
              ? 'bg-amber-600 text-white'
              : 'text-slate-400 hover:bg-slate-800 hover:text-white'
          }`}
        >
          Scheduled Drafts
        </Link>
        <Link
          href="/dashboard/transfers?status=validated"
          className={`px-3 py-1.5 rounded-lg transition-colors ${
            status === 'validated'
              ? 'bg-emerald-600 text-white'
              : 'text-slate-400 hover:bg-slate-800 hover:text-white'
          }`}
        >
          Validated (Completed)
        </Link>
      </div>

      {/* Transfers Table */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/60 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-700">
              <tr>
                <th className="px-5 py-3.5">Reference</th>
                <th className="px-5 py-3.5">Source Location</th>
                <th className="px-5 py-3.5">Destination Location</th>
                <th className="px-5 py-3.5">Item Summary</th>
                <th className="px-5 py-3.5">Date</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/60 text-slate-300">
              {transfers.map((t) => {
                const totalUnits = t.items.reduce((sum, it) => sum + it.quantity, 0)
                return (
                  <tr key={t.id} className="hover:bg-slate-750/30">
                    <td className="px-5 py-3.5">
                      <Link
                        href={`/dashboard/transfers/${t.id}`}
                        className="font-mono font-bold text-white hover:text-blue-400"
                      >
                        {t.reference}
                      </Link>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="font-medium text-slate-200">
                        {t.source.warehouse.name}
                      </span>
                      <span className="text-slate-400"> → {t.source.name}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="font-medium text-slate-200">
                        {t.destination.warehouse.name}
                      </span>
                      <span className="text-slate-400"> → {t.destination.name}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="font-semibold text-white">{totalUnits} units</span>
                      <span className="text-slate-400"> ({t.items.length} items)</span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-400">{formatDate(t.createdAt)}</td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${getStatusBadge(
                          t.status
                        )}`}
                      >
                        {t.status === 'draft' ? (
                          <Clock className="w-2.5 h-2.5 mr-1" />
                        ) : (
                          <CheckCircle className="w-2.5 h-2.5 mr-1" />
                        )}
                        {t.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <Link
                        href={`/dashboard/transfers/${t.id}`}
                        className="px-2.5 py-1 bg-slate-700 hover:bg-slate-600 text-white rounded text-[11px] font-semibold transition-colors"
                      >
                        {t.status === 'draft' ? 'Review & Validate' : 'View Details'}
                      </Link>
                    </td>
                  </tr>
                )
              })}

              {transfers.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-slate-500">
                    <ArrowLeftRight className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    No internal transfers recorded.
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
