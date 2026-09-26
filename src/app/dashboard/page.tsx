import { getDashboardStats } from '@/actions/dashboard'
import { getCategories } from '@/actions/categories'
import { getWarehouses, getLocations } from '@/actions/warehouses'
import Link from 'next/link'
import {
  Boxes,
  AlertTriangle,
  ArrowDownToLine,
  ArrowUpFromLine,
  ArrowLeftRight,
  PackageX,
  History,
  CheckCircle2,
  ArrowRight,
  Plus,
} from 'lucide-react'
import { formatDate } from '@/lib/utils'

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { category?: string; warehouse?: string; location?: string }
}) {
  const categoryId = searchParams.category || 'all'
  const warehouseId = searchParams.warehouse || 'all'
  const locationId = searchParams.location || 'all'

  const [stats, categories, warehouses, locations] = await Promise.all([
    getDashboardStats({ categoryId, warehouseId, locationId }),
    getCategories(),
    getWarehouses(),
    getLocations(),
  ])

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Inventory Dashboard</h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time stock analytics, pending operations, and inventory health
          </p>
        </div>

        {/* Quick Operations Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/dashboard/receipts/new"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Receive Stock
          </Link>
          <Link
            href="/dashboard/deliveries/new"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Deliver Stock
          </Link>
          <Link
            href="/dashboard/transfers/new"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Transfer Stock
          </Link>
        </div>
      </div>

      {/* Real-time KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Products in Stock */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Products in Stock</span>
            <div className="p-2 bg-blue-950/60 rounded-lg text-blue-400">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white">{stats.inStockCount}</span>
            <span className="text-xs text-slate-400 font-mono">/ {stats.totalProducts} total</span>
          </div>
          <div className="mt-2 text-[11px] text-emerald-400 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Healthy Stock Level
          </div>
        </div>

        {/* Low Stock Items */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Low Stock Alert</span>
            <div className="p-2 bg-amber-950/60 rounded-lg text-amber-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-amber-400">{stats.lowStockCount}</span>
            <span className="text-xs text-slate-400">under threshold</span>
          </div>
          <div className="mt-2 text-[11px] text-amber-300">
            {stats.lowStockCount > 0 ? 'Requires replenishment' : 'No low-stock alerts'}
          </div>
        </div>

        {/* Out of Stock Items */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Out of Stock</span>
            <div className="p-2 bg-rose-950/60 rounded-lg text-rose-400">
              <PackageX className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-rose-400">{stats.outOfStockCount}</span>
            <span className="text-xs text-slate-400">depleted items</span>
          </div>
          <div className="mt-2 text-[11px] text-rose-300">
            {stats.outOfStockCount > 0 ? 'Immediate reorder needed' : 'All items available'}
          </div>
        </div>

        {/* Pending Receipts */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Pending Receipts</span>
            <div className="p-2 bg-emerald-950/60 rounded-lg text-emerald-400">
              <ArrowDownToLine className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-400">{stats.pendingReceipts}</span>
            <span className="text-xs text-slate-400">draft receipts</span>
          </div>
          <Link
            href="/dashboard/receipts"
            className="mt-2 text-[11px] text-emerald-400 hover:underline flex items-center gap-1"
          >
            Review drafts <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {/* Pending Deliveries */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Pending Deliveries</span>
            <div className="p-2 bg-indigo-950/60 rounded-lg text-indigo-400">
              <ArrowUpFromLine className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-indigo-400">{stats.pendingDeliveries}</span>
            <span className="text-xs text-slate-400">draft orders</span>
          </div>
          <Link
            href="/dashboard/deliveries"
            className="mt-2 text-[11px] text-indigo-400 hover:underline flex items-center gap-1"
          >
            Review deliveries <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-3.5">
        <form className="flex flex-wrap items-center gap-3">
          <span className="text-xs font-semibold text-slate-400">Dashboard Filter:</span>

          {/* Category Filter */}
          <select
            name="category"
            defaultValue={categoryId}
            className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Warehouse Filter */}
          <select
            name="warehouse"
            defaultValue={warehouseId}
            className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="all">All Warehouses</option>
            {warehouses.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </select>

          {/* Location Filter */}
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
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition-colors"
          >
            Apply Filter
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2/3): Low & Out of Stock Alerts */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <h2 className="text-sm font-bold text-white">
                  Stock Alerts & Threshold Warnings
                </h2>
              </div>
              <span className="text-xs text-slate-400">
                {stats.lowStockItems.length + stats.outOfStockItems.length} items flagged
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/60 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-700">
                  <tr>
                    <th className="px-4 py-3">Product Name</th>
                    <th className="px-4 py-3">SKU</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3 text-right">Current Stock</th>
                    <th className="px-4 py-3 text-right">Reorder Level</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/60 text-slate-300">
                  {stats.outOfStockItems.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-750/30">
                      <td className="px-4 py-3 font-semibold text-white">{item.name}</td>
                      <td className="px-4 py-3 font-mono text-slate-400">{item.sku}</td>
                      <td className="px-4 py-3 text-slate-400">{item.category}</td>
                      <td className="px-4 py-3 text-right font-bold text-rose-400">0</td>
                      <td className="px-4 py-3 text-right text-slate-400">{item.reorderLevel}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-950/60 text-rose-300 border border-rose-800">
                          Out of Stock
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Link
                          href={`/dashboard/receipts/new?productId=${item.id}`}
                          className="text-blue-400 hover:text-blue-300 font-medium"
                        >
                          Reorder
                        </Link>
                      </td>
                    </tr>
                  ))}

                  {stats.lowStockItems.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-750/30">
                      <td className="px-4 py-3 font-semibold text-white">{item.name}</td>
                      <td className="px-4 py-3 font-mono text-slate-400">{item.sku}</td>
                      <td className="px-4 py-3 text-slate-400">{item.category}</td>
                      <td className="px-4 py-3 text-right font-bold text-amber-400">
                        {item.currentStock}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-400">{item.reorderLevel}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-950/60 text-amber-300 border border-amber-800">
                          Low Stock
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Link
                          href={`/dashboard/receipts/new?productId=${item.id}&qty=${item.reorderQty}`}
                          className="text-blue-400 hover:text-blue-300 font-medium"
                        >
                          Replenish (+{item.reorderQty})
                        </Link>
                      </td>
                    </tr>
                  ))}

                  {stats.lowStockItems.length === 0 && stats.outOfStockItems.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                        No low or out-of-stock items detected. Inventory healthy!
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column (1/3): Recent Stock Movements */}
        <div className="space-y-6">
          <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-blue-400" />
                <h2 className="text-sm font-bold text-white">Recent Stock Ledger Moves</h2>
              </div>
              <Link
                href="/dashboard/stock-ledger"
                className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
              >
                View all <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="divide-y divide-slate-700/60">
              {stats.recentMoves.map((m) => (
                <div key={m.id} className="p-3.5 hover:bg-slate-750/30 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white truncate max-w-[150px]">
                      {m.product.name}
                    </span>
                    <span
                      className={`font-mono font-bold ${
                        m.movementType === 'Receipt'
                          ? 'text-emerald-400'
                          : m.movementType === 'Delivery'
                          ? 'text-amber-400'
                          : 'text-indigo-400'
                      }`}
                    >
                      {m.movementType === 'Receipt' ? '+' : m.movementType === 'Delivery' ? '-' : '±'}
                      {m.quantity}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-1 text-[11px] text-slate-400">
                    <span className="font-mono">{m.reference}</span>
                    <span className="px-1.5 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-700">
                      {m.movementType}
                    </span>
                  </div>
                  <div className="mt-1 text-[10px] text-slate-500">
                    {formatDate(m.date)} by {m.user.name}
                  </div>
                </div>
              ))}

              {stats.recentMoves.length === 0 && (
                <div className="p-6 text-center text-slate-500 text-xs">
                  No stock movements recorded yet.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
