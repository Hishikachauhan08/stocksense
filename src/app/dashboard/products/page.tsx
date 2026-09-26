import { getProducts } from '@/actions/products'
import { getCategories } from '@/actions/categories'
import Link from 'next/link'
import { Package, Plus, Search, Filter, AlertTriangle, CheckCircle, PackageX } from 'lucide-react'
import { getStatusBadge } from '@/lib/utils'

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: { search?: string; category?: string }
}) {
  const search = searchParams.search || ''
  const categoryId = searchParams.category || 'all'

  const [products, categories] = await Promise.all([
    getProducts(search, categoryId),
    getCategories(),
  ])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Products Catalog</h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage products, SKU tracking, reorder thresholds, and location quantities
          </p>
        </div>

        <Link
          href="/dashboard/products/new"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-md transition-colors w-fit"
        >
          <Plus className="w-4 h-4" /> Add New Product
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-3.5">
        <form className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
              <Search className="h-4 w-4" />
            </div>
            <input
              type="text"
              name="search"
              defaultValue={search}
              placeholder="Search product name or SKU..."
              className="block w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              name="category"
              defaultValue={categoryId}
              className="w-full sm:w-48 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            <button
              type="submit"
              className="px-3.5 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-xs font-semibold transition-colors shrink-0"
            >
              Filter
            </button>
          </div>
        </form>
      </div>

      {/* Products Table */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/60 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-700">
              <tr>
                <th className="px-5 py-3.5">Product Name</th>
                <th className="px-5 py-3.5">SKU</th>
                <th className="px-5 py-3.5">Category</th>
                <th className="px-5 py-3.5">Unit</th>
                <th className="px-5 py-3.5 text-right">Available Stock</th>
                <th className="px-5 py-3.5 text-right">Reorder Level</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/60 text-slate-300">
              {products.map((p) => (
                <tr key={p.id} className="hover:bg-slate-750/30">
                  <td className="px-5 py-3.5">
                    <Link
                      href={`/dashboard/products/${p.id}`}
                      className="font-semibold text-white hover:text-blue-400 transition-colors"
                    >
                      {p.name}
                    </Link>
                  </td>
                  <td className="px-5 py-3.5 font-mono text-slate-400">{p.sku}</td>
                  <td className="px-5 py-3.5 text-slate-400">{p.category?.name || 'Unassigned'}</td>
                  <td className="px-5 py-3.5 text-slate-400">{p.unitOfMeasure}</td>
                  <td className="px-5 py-3.5 text-right font-bold text-white">
                    {p.totalStock}
                  </td>
                  <td className="px-5 py-3.5 text-right font-mono text-slate-400">
                    {p.reorderRule?.reorderLevel ?? p.reorderLevel ?? 0}
                  </td>
                  <td className="px-5 py-3.5">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${getStatusBadge(
                        p.stockStatus
                      )}`}
                    >
                      {p.stockStatus === 'In Stock' && <CheckCircle className="w-2.5 h-2.5 mr-1" />}
                      {p.stockStatus === 'Low Stock' && <AlertTriangle className="w-2.5 h-2.5 mr-1" />}
                      {p.stockStatus === 'Out of Stock' && <PackageX className="w-2.5 h-2.5 mr-1" />}
                      {p.stockStatus}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    <Link
                      href={`/dashboard/products/${p.id}`}
                      className="text-blue-400 hover:text-blue-300 font-semibold"
                    >
                      View & Locations
                    </Link>
                  </td>
                </tr>
              ))}

              {products.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-slate-500">
                    <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    No products found matching your filter criteria.
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
