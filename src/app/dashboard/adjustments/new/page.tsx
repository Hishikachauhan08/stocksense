'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { createAdjustment } from '@/actions/adjustments'
import { getProducts } from '@/actions/products'
import { getLocations } from '@/actions/warehouses'
import { ArrowLeft, Plus, Trash2, Save, Info } from 'lucide-react'

export default function NewAdjustmentPage() {
  const router = useRouter()
  const [products, setProducts] = useState<any[]>([])
  const [locations, setLocations] = useState<any[]>([])
  const [locationId, setLocationId] = useState('')
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState<{ productId: string; physicalQty: number }[]>([])
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    Promise.all([getProducts(), getLocations()]).then(([pList, lList]) => {
      setProducts(pList)
      setLocations(lList)
      if (lList.length > 0) {
        setLocationId(lList[0].id)
      }
      if (pList.length > 0) {
        setItems([{ productId: pList[0].id, physicalQty: 0 }])
      }
    })
  }, [])

  const addItemRow = () => {
    if (products.length > 0) {
      setItems([...items, { productId: products[0].id, physicalQty: 0 }])
    }
  }

  const removeItemRow = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index))
    }
  }

  const updateItem = (index: number, field: string, value: any) => {
    const updated = [...items]
    updated[index] = { ...updated[index], [field]: value }
    setItems(updated)
  }

  // Helper to determine current system stock of a product at chosen location
  const getSystemQty = (productId: string) => {
    const prod = products.find((p) => p.id === productId)
    if (!prod) return 0
    const balance = prod.stockBalances?.find((sb: any) => sb.locationId === locationId)
    return balance ? balance.quantity : 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!locationId) {
      toast.error('Location is required')
      return
    }
    if (items.length === 0) {
      toast.error('At least one item is required')
      return
    }

    setSubmitting(true)
    try {
      const adj = await createAdjustment({
        locationId,
        notes,
        items: items.map((it) => ({
          productId: it.productId,
          physicalQty: Number(it.physicalQty),
        })),
      })

      toast.success('Inventory adjustment created as draft')
      router.push(`/dashboard/adjustments/${adj.id}`)
      router.refresh()
    } catch (err: any) {
      toast.error(err.message || 'Failed to create adjustment')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/adjustments"
          className="p-2 text-slate-400 hover:text-white bg-slate-800 rounded-lg border border-slate-700"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">
            Record Physical Stock Adjustment
          </h1>
          <p className="text-xs text-slate-400">
            Reconcile physical inventory counts against system theoretical stock
          </p>
        </div>
      </div>

      <div className="p-3.5 bg-purple-950/40 border border-purple-800/50 rounded-xl flex items-start gap-2.5 text-xs text-purple-300">
        <Info className="w-4 h-4 shrink-0 text-purple-400 mt-0.5" />
        <span>
          <strong>How it works:</strong> Enter the physical quantity counted on shelf. The system
          computes the difference (Variance = Physical Count − System Stock). Upon validation, the
          stock is updated to the physical quantity and the difference is recorded in the Stock
          Ledger.
        </span>
      </div>

      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Audited Location *
              </label>
              <select
                required
                value={locationId}
                onChange={(e) => setLocationId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.warehouse.name} → {loc.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Reason / Audit Reference
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Monthly cycle count, breakage write-off..."
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Line Items */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Counted Products
              </h3>
              <button
                type="button"
                onClick={addItemRow}
                className="inline-flex items-center gap-1 text-xs font-semibold text-blue-400 hover:text-blue-300"
              >
                <Plus className="w-3.5 h-3.5" /> Add Product Row
              </button>
            </div>

            <div className="space-y-2">
              {items.map((item, index) => {
                const sysQty = getSystemQty(item.productId)
                const diff = Number(item.physicalQty) - sysQty
                return (
                  <div
                    key={index}
                    className="p-3 bg-slate-900 rounded-lg border border-slate-750 flex flex-col sm:flex-row items-center gap-3"
                  >
                    <div className="flex-1 w-full sm:w-auto">
                      <label className="block text-[10px] text-slate-400 mb-1">Product</label>
                      <select
                        value={item.productId}
                        onChange={(e) => updateItem(index, 'productId', e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({p.sku})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="w-24 text-center">
                      <span className="block text-[10px] text-slate-400 mb-1">System Qty</span>
                      <span className="font-mono text-xs font-bold text-slate-300">{sysQty}</span>
                    </div>

                    <div className="w-28">
                      <label className="block text-[10px] text-slate-400 mb-1">
                        Physical Count
                      </label>
                      <input
                        type="number"
                        min="0"
                        required
                        value={item.physicalQty}
                        onChange={(e) =>
                          updateItem(index, 'physicalQty', Math.max(0, Number(e.target.value)))
                        }
                        className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500 text-center font-bold"
                      />
                    </div>

                    <div className="w-24 text-center">
                      <span className="block text-[10px] text-slate-400 mb-1">Variance</span>
                      <span
                        className={`font-mono text-xs font-bold ${
                          diff > 0
                            ? 'text-emerald-400'
                            : diff < 0
                            ? 'text-rose-400'
                            : 'text-slate-400'
                        }`}
                      >
                        {diff > 0 ? `+${diff}` : diff}
                      </span>
                    </div>

                    <div className="pt-2 sm:pt-4">
                      <button
                        type="button"
                        onClick={() => removeItemRow(index)}
                        disabled={items.length <= 1}
                        className="p-1.5 text-slate-500 hover:text-rose-400 disabled:opacity-20"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-2 border-t border-slate-700">
            <Link
              href="/dashboard/adjustments"
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-xs font-semibold transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-semibold shadow-md transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {submitting ? 'Creating Draft...' : 'Save Draft Adjustment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
