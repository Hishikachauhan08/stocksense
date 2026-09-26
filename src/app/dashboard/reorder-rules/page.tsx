'use client'

import { useState, useEffect } from 'react'
import { getReorderRules, createReorderRule, deleteReorderRule } from '@/actions/reorder-rules'
import { getProducts } from '@/actions/products'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { AlertTriangle, Plus, Trash2, ShieldAlert, ArrowRight } from 'lucide-react'

export default function ReorderRulesPage() {
  const [rules, setRules] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const [productId, setProductId] = useState('')
  const [reorderLevel, setReorderLevel] = useState(10)
  const [reorderQty, setReorderQty] = useState(50)
  const [submitting, setSubmitting] = useState(false)

  const loadData = async () => {
    try {
      const [rData, pData] = await Promise.all([getReorderRules(), getProducts()])
      setRules(rData)
      setProducts(pData)
      if (pData.length > 0 && !productId) {
        setProductId(pData[0].id)
      }
    } catch (err) {
      toast.error('Failed to load rules')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await createReorderRule({
        productId,
        reorderLevel: Number(reorderLevel),
        reorderQty: Number(reorderQty),
      })
      toast.success('Reorder rule created')
      loadData()
    } catch (err: any) {
      toast.error(err.message || 'Failed to create rule')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this reorder rule?')) return
    try {
      await deleteReorderRule(id)
      toast.success('Reorder rule removed')
      loadData()
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete rule')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Reordering Rules</h1>
        <p className="text-xs text-slate-400 mt-1">
          Automate minimum stock alert thresholds and replenishment suggestions
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Create Rule */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 shadow-sm">
          <h2 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
            <Plus className="w-4 h-4 text-amber-400" /> New Reorder Rule
          </h2>

          <form onSubmit={handleCreate} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Select Product *
              </label>
              <select
                required
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.sku})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Minimum Stock Level (Alert Threshold) *
              </label>
              <input
                type="number"
                min="1"
                required
                value={reorderLevel}
                onChange={(e) => setReorderLevel(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <span className="text-[10px] text-slate-400">
                Product enters "Low Stock" when inventory is at or below this value
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Replenishment Reorder Quantity *
              </label>
              <input
                type="number"
                min="1"
                required
                value={reorderQty}
                onChange={(e) => setReorderQty(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2 px-3 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-semibold shadow-md transition-colors disabled:opacity-50"
            >
              {submitting ? 'Saving...' : 'Set Reorder Rule'}
            </button>
          </form>
        </div>

        {/* Existing Rules */}
        <div className="lg:col-span-2 bg-slate-800 border border-slate-700 rounded-xl overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-slate-700">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-400" /> Active Threshold Rules (
              {rules.length})
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/60 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-700">
                <tr>
                  <th className="px-4 py-3">Product Name</th>
                  <th className="px-4 py-3">SKU</th>
                  <th className="px-4 py-3 text-right">Current Stock</th>
                  <th className="px-4 py-3 text-right">Min Threshold</th>
                  <th className="px-4 py-3 text-right">Reorder Qty</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/60 text-slate-300">
                {rules.map((rule) => {
                  const currentStock = rule.product.stockBalances.reduce(
                    (s: number, b: any) => s + b.quantity,
                    0
                  )
                  const isLow = currentStock <= rule.reorderLevel

                  return (
                    <tr key={rule.id} className="hover:bg-slate-750/30">
                      <td className="px-4 py-3 font-semibold text-white">
                        <Link
                          href={`/dashboard/products/${rule.productId}`}
                          className="hover:text-blue-400"
                        >
                          {rule.product.name}
                        </Link>
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-400">{rule.product.sku}</td>
                      <td className="px-4 py-3 text-right font-bold text-white">
                        {currentStock}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-amber-400">
                        {rule.reorderLevel}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-slate-300">
                        +{rule.reorderQty}
                      </td>
                      <td className="px-4 py-3">
                        {currentStock === 0 ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-950/60 text-rose-300 border border-rose-800">
                            Out of Stock
                          </span>
                        ) : isLow ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-950/60 text-amber-300 border border-amber-800">
                            Low Stock
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-950/60 text-emerald-300 border border-emerald-800">
                            OK
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => handleDelete(rule.id)}
                          className="p-1 text-slate-500 hover:text-rose-400"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  )
                })}

                {rules.length === 0 && !loading && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                      No reorder rules configured yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
