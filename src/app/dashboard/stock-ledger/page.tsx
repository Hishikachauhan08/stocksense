import { getStockMoves } from '@/actions/stock-ledger'
import { getLocations } from '@/actions/warehouses'
import { History, Search, Filter, ArrowDownToLine, ArrowUpFromLine, ArrowLeftRight, SlidersHorizontal } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export default async function StockLedgerPage({
  searchParams,
}: {
  searchParams: {
    search?: string
    type?: string
    location?: string
    start?: string
    end?: string
  }
}) {
  const search = searchParams.search || ''
  const movementType = searchParams.type || 'all'
  const locationId = searchParams.location || 'all'
  const startDate = searchParams.start || ''
  const endDate = searchParams.end || ''

  const [moves, locations] = await Promise.all([
    getStockMoves({
      search,
      movementType,
      locationId,
      startDate,
      endDate,
    }),
    getLocations(),
  ])

  const getMoveIcon = (type: string) => {
    switch (type) {
      case 'Receipt':
        return <ArrowDownToLine className="w-3.5 h-3.5 text-emerald-400" />
      case 'Delivery':
        return <ArrowUpFromLine className="w-3.5 h-3.5 text-amber-400" />
      case 'Internal Transfer':
        return <ArrowLeftRight className="w-3.5 h-3.5 text-indigo-400" />
      case 'Inventory Adjustment':
        return <SlidersHorizontal className="w-3.5 h-3.5 text-purple-400" />
      default:
        return <History className="w-3.5 h-3.5 text-slate-400" />
    }
  }

  const getMoveBadge = (type: string) => {
    switch (type) {
      case 'Receipt':
        return 'bg-emerald-950/60 text-emerald-300 border-emerald-800'
      case 'Delivery':
        return 'bg-amber-950/60 text-amber-300 border-amber-800'
      case 'Internal Transfer':
        return 'bg-indigo-950/60 text-indigo-300 border-indigo-800'
      case 'Inventory Adjustment':
        return 'bg-purple-950/60 text-purple-300 border-purple-800'
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700'
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Stock Ledger & Move History</h1>
        <p className="text-xs text-slate-400 mt-1">
          Immutable audit trail of all stock increments, decrements, transfers, and physical reconciliations
        </p>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-3.5">
        <form className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
              <Search className="h-4 w-4" />
            </div>
            <input
              type="text"
              name="search"
              defaultValue={search}
              placeholder="Search reference, product, SKU..."
              className="block w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <select
            name="type"
            defaultValue={movementType}
            className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="all">All Movement Types</option>
            <option value="Receipt">Receipts</option>
            <option value="Delivery">Deliveries</option>
            <option value="Internal Transfer">Internal Transfers</option>
            <option value="Inventory Adjustment">Inventory Adjustments</option>
          </select>

          <select
            name="location"
            defaultValue={locationId}
            className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="all">All Locations</option>
            {locations.map((loc) => (
              <option key={loc.id} value={loc.id}>
                {loc.warehouse.name} → {loc.name}
              </option>
            ))}
          </select>

          <button
            type="submit"
            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition-colors"
          >
            Apply Filters
          </button>
        </form>
      </div>

      {/* Ledger Table */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/60 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-700">
              <tr>
                <th className="px-4 py-3.5">Date & Time</th>
                <th className="px-4 py-3.5">Reference #</th>
                <th className="px-4 py-3.5">Product & SKU</th>
                <th className="px-4 py-3.5">Movement Type</th>
                <th className="px-4 py-3.5">Source Location</th>
                <th className="px-4 py-3.5">Destination Location</th>
                <th className="px-4 py-3.5 text-right">Quantity</th>
                <th className="px-4 py-3.5">Operator</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/60 text-slate-300">
              {moves.map((m) => (
                <tr key={m.id} className="hover:bg-slate-750/30">
                  <td className="px-4 py-3 text-slate-400 font-mono text-[11px]">
                    {formatDate(m.date)}
                  </td>
                  <td className="px-4 py-3 font-mono font-bold text-white">{m.reference}</td>
                  <td className="px-4 py-3">
                    <span className="font-semibold text-white">{m.product.name}</span>
                    <span className="block font-mono text-[10px] text-slate-400">
                      {m.product.sku}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${getMoveBadge(
                        m.movementType
                      )}`}
                    >
                      {getMoveIcon(m.movementType)}
                      {m.movementType}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-300">
                    {m.source ? `${m.source.warehouse.name} → ${m.source.name}` : '— (Vendor)'}
                  </td>
                  <td className="px-4 py-3 text-slate-300">
                    {m.destination
                      ? `${m.destination.warehouse.name} → ${m.destination.name}`
                      : '— (Customer)'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span
                      className={`font-mono font-bold ${
                        m.movementType === 'Receipt'
                          ? 'text-emerald-400'
                          : m.movementType === 'Delivery'
                          ? 'text-amber-400'
                          : 'text-indigo-400'
                      }`}
                    >
                      {m.movementType === 'Receipt'
                        ? `+${m.quantity}`
                        : m.movementType === 'Delivery'
                        ? `-${m.quantity}`
                        : m.quantity}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-[11px]">{m.user.name}</td>
                </tr>
              ))}

              {moves.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-slate-500">
                    <History className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    No stock ledger records found for this query.
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
