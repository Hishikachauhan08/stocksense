import { getDeliveries } from '@/actions/deliveries'
import Link from 'next/link'
import { ArrowUpFromLine, Plus, Clock, CheckCircle } from 'lucide-react'
import { formatDate, getStatusBadge } from '@/lib/utils'

export default async function DeliveriesPage({
  searchParams,
}: {
  searchParams: { status?: string }
}) {
  const status = searchParams.status || 'all'
  const deliveries = await getDeliveries(status)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Delivery Orders (Outbound)</h1>
          <p className="text-xs text-slate-400 mt-1">
            Dispatch stock to customers or sales orders from source warehouse locations
          </p>
        </div>

        <Link
          href="/dashboard/deliveries/new"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-semibold shadow-md transition-colors w-fit"
        >
          <Plus className="w-4 h-4" /> Create Delivery Order
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-700 pb-3 text-xs font-semibold">
        <Link
          href="/dashboard/deliveries"
          className={`px-3 py-1.5 rounded-lg transition-colors ${
            status === 'all'
              ? 'bg-blue-600 text-white'
              : 'text-slate-400 hover:bg-slate-800 hover:text-white'
          }`}
        >
          All Deliveries
        </Link>
        <Link
          href="/dashboard/deliveries?status=draft"
          className={`px-3 py-1.5 rounded-lg transition-colors ${
            status === 'draft'
              ? 'bg-amber-600 text-white'
              : 'text-slate-400 hover:bg-slate-800 hover:text-white'
          }`}
        >
          Pending Drafts
        </Link>
        <Link
          href="/dashboard/deliveries?status=validated"
          className={`px-3 py-1.5 rounded-lg transition-colors ${
            status === 'validated'
              ? 'bg-emerald-600 text-white'
              : 'text-slate-400 hover:bg-slate-800 hover:text-white'
          }`}
        >
          Validated (Dispatched)
        </Link>
      </div>

      {/* Deliveries Table */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/60 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-700">
              <tr>
                <th className="px-5 py-3.5">Reference</th>
                <th className="px-5 py-3.5">Source Location</th>
                <th className="px-5 py-3.5">Item Summary</th>
                <th className="px-5 py-3.5">Created Date</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/60 text-slate-300">
              {deliveries.map((d) => {
                const totalUnits = d.items.reduce((sum, it) => sum + it.quantity, 0)
                return (
                  <tr key={d.id} className="hover:bg-slate-750/30">
                    <td className="px-5 py-3.5">
                      <Link
                        href={`/dashboard/deliveries/${d.id}`}
                        className="font-mono font-bold text-white hover:text-blue-400"
                      >
                        {d.reference}
                      </Link>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="font-medium text-slate-200">
                        {d.source.warehouse.name}
                      </span>
                      <span className="text-slate-400"> → {d.source.name}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="font-semibold text-white">{totalUnits} units</span>
                      <span className="text-slate-400"> ({d.items.length} items)</span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-400">{formatDate(d.createdAt)}</td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${getStatusBadge(
                          d.status
                        )}`}
                      >
                        {d.status === 'draft' ? (
                          <Clock className="w-2.5 h-2.5 mr-1" />
                        ) : (
                          <CheckCircle className="w-2.5 h-2.5 mr-1" />
                        )}
                        {d.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <Link
                        href={`/dashboard/deliveries/${d.id}`}
                        className="px-2.5 py-1 bg-slate-700 hover:bg-slate-600 text-white rounded text-[11px] font-semibold transition-colors"
                      >
                        {d.status === 'draft' ? 'Review & Validate' : 'View Details'}
                      </Link>
                    </td>
                  </tr>
                )
              })}

              {deliveries.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-500">
                    <ArrowUpFromLine className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    No delivery orders found.
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
