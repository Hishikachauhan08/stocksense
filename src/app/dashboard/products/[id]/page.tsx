import { getProduct } from '@/actions/products'
import { getCategories } from '@/actions/categories'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Package, MapPin, AlertTriangle, CheckCircle, PackageX } from 'lucide-react'
import { getStatusBadge } from '@/lib/utils'

export default async function ProductDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const product = await getProduct(params.id)
  if (!product) notFound()

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/products"
            className="p-2 text-slate-400 hover:text-white bg-slate-800 rounded-lg border border-slate-700"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white tracking-tight">{product.name}</h1>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${getStatusBadge(
                  product.stockStatus
                )}`}
              >
                {product.stockStatus}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-0.5">SKU: {product.sku}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Product Information Card */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 shadow-sm space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Product Details
          </h2>

          <div className="space-y-3 text-xs">
            <div>
              <span className="text-slate-400">Category:</span>
              <p className="font-semibold text-white mt-0.5">{product.category?.name || 'None'}</p>
            </div>

            <div>
              <span className="text-slate-400">Unit of Measure:</span>
              <p className="font-semibold text-white mt-0.5">{product.unitOfMeasure}</p>
            </div>

            <div>
              <span className="text-slate-400">Reorder Threshold:</span>
              <p className="font-semibold text-white mt-0.5">
                {product.reorderRule?.reorderLevel ?? product.reorderLevel ?? 0} {product.unitOfMeasure}
              </p>
            </div>

            <div>
              <span className="text-slate-400">Total System Stock:</span>
              <p className="text-lg font-bold text-blue-400 mt-0.5">
                {product.totalStock} {product.unitOfMeasure}
              </p>
            </div>

            {product.description && (
              <div>
                <span className="text-slate-400">Description:</span>
                <p className="text-slate-300 mt-0.5 whitespace-pre-wrap">{product.description}</p>
              </div>
            )}
          </div>
        </div>

        {/* Location Breakdown Card (2/3 width) */}
        <div className="md:col-span-2 bg-slate-800 border border-slate-700 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-blue-400" /> Stock by Warehouse & Location
            </h2>
            <span className="text-xs text-slate-400">
              {product.stockBalances.length} location records
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/60 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-700">
                <tr>
                  <th className="px-4 py-2.5">Warehouse</th>
                  <th className="px-4 py-2.5">Internal Location</th>
                  <th className="px-4 py-2.5 text-right">Available Qty</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/60 text-slate-300">
                {product.stockBalances.map((sb) => (
                  <tr key={sb.id} className="hover:bg-slate-750/30">
                    <td className="px-4 py-2.5 font-medium text-white">
                      {sb.location.warehouse.name}
                    </td>
                    <td className="px-4 py-2.5 text-slate-300">{sb.location.name}</td>
                    <td className="px-4 py-2.5 text-right font-bold text-white">
                      {sb.quantity} {product.unitOfMeasure}
                    </td>
                  </tr>
                ))}

                {product.stockBalances.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-4 py-6 text-center text-slate-500">
                      No stock balances registered across any locations yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="pt-4 border-t border-slate-700 flex flex-wrap gap-2">
            <Link
              href={`/dashboard/receipts/new?productId=${product.id}`}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold"
            >
              + Receive Stock Here
            </Link>
            <Link
              href={`/dashboard/transfers/new?productId=${product.id}`}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold"
            >
              Transfer Stock
            </Link>
            <Link
              href={`/dashboard/adjustments/new?productId=${product.id}`}
              className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-semibold"
            >
              Adjust Physical Count
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
