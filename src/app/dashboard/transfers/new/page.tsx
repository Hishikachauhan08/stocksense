'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { createTransfer } from '@/actions/transfers'
import { getProducts } from '@/actions/products'
import { getLocations } from '@/actions/warehouses'
import { ArrowLeft, Plus, Trash2, Save, Info } from 'lucide-react'

export default function NewTransferPage() {
  const router = useRouter()
  const [products, setProducts] = useState<any[]>([])
  const [locations, setLocations] = useState<any[]>([])
  const [sourceId, setSourceId] = useState('')
  const [destinationId, setDestinationId] = useState('')
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState<{ productId: string; quantity: number }[]>([])
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    Promise.all([getProducts(), getLocations()]).then(([pList, lList]) => {
      setProducts(pList)
      setLocations(lList)
      if (lList.length > 1) {
        setSourceId(lList[0].id)
        setDestinationId(lList[1].id)
      } else if (lList.length === 1) {
        setSourceId(lList[0].id)
      }
      if (pList.length > 0) {
        setItems([{ productId: pList[0].id, quantity: 5 }])
      }
    })
  }, [])

  const addItemRow = () => {
    if (products.length > 0) {
      setItems([...items, { productId: products[0].id, quantity: 1 }])
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!sourceId || !destinationId) {
      toast.error('Source and destination locations are required')
      return
    }
    if (sourceId === destinationId) {
      toast.error('Source and destination locations must be different')
      return
    }
    if (items.length === 0) {
      toast.error('At least one item is required')
      return
    }

    setSubmitting(true)
    try {
      const transfer = await createTransfer({
        sourceId,
        destinationId,
        notes,
        items: items.map((it) => ({
          productId: it.productId,
          quantity: Number(it.quantity),
        })),
      })

      toast.success('Internal transfer created as draft')
      router.push(`/dashboard/transfers/${transfer.id}`)
      router.refresh()
    } catch (err: any) {
      toast.error(err.message || 'Failed to create transfer')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/transfers"
          className="p-2 text-slate-400 hover:text-white bg-slate-800 rounded-lg border border-slate-700"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Create Internal Transfer</h1>
          <p className="text-xs text-slate-400">Move products between warehouses or locations</p>
        </div>
      </div>

      <div className="p-3.5 bg-indigo-950/40 border border-indigo-800/50 rounded-xl flex items-start gap-2.5 text-xs text-indigo-300">
        <Info className="w-4 h-4 shrink-0 text-indigo-400 mt-0.5" />
        <span>
          <strong>Stock Consistency:</strong> Upon validation, stock at the source location will
          decrease by the transfer quantity, and stock at the destination location will increase by
          the exact same amount. Total company stock remains unchanged.
        </span>
      </div>

      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Source Location *
              </label>
              <select
                required
                value={sourceId}
                onChange={(e) => setSourceId(e.target.value)}
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
                Destination Location *
              </label>
              <select
                required
                value={destinationId}
                onChange={(e) => setDestinationId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id} disabled={loc.id === sourceId}>
                    {loc.warehouse.name} → {loc.name} {loc.id === sourceId ? '(Source)' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Transfer Notes / Reason
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Replenishment, bin rearrangement..."
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Line Items */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Products to Transfer
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
              {items.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3 bg-slate-900 rounded-lg border border-slate-750"
                >
                  <div className="flex-1">
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

                  <div className="w-32">
                    <label className="block text-[10px] text-slate-400 mb-1">Quantity</label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={item.quantity}
                      onChange={(e) => updateItem(index, 'quantity', Number(e.target.value))}
                      className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div className="pt-4">
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
              ))}
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-2 border-t border-slate-700">
            <Link
              href="/dashboard/transfers"
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-xs font-semibold transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-md transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {submitting ? 'Creating Draft...' : 'Save Draft Transfer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
