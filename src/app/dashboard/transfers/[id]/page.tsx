'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { getTransfer, validateTransfer } from '@/actions/transfers'
import { ArrowLeft, CheckCircle2, Clock, MapPin, Check, ArrowRight } from 'lucide-react'
import { formatDate, getStatusBadge } from '@/lib/utils'

export default function TransferDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [transfer, setTransfer] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [validating, setValidating] = useState(false)

  const loadData = async () => {
    try {
      const data = await getTransfer(params.id as string)
      setTransfer(data)
    } catch (err) {
      toast.error('Failed to load transfer')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [params.id])

  const handleValidate = async () => {
    if (!confirm('Execute this internal transfer? Stock will be deducted from source and added to destination atomically.')) {
      return
    }

    setValidating(true)
    try {
      await validateTransfer(transfer.id)
      toast.success('Transfer validated! Stock moved atomically between locations.')
      loadData()
      router.refresh()
    } catch (err: any) {
      toast.error(err.message || 'Validation failed')
    } finally {
      setValidating(false)
    }
  }

  if (loading) {
    return <div className="p-8 text-center text-slate-400 text-xs">Loading transfer details...</div>
  }

  if (!transfer) {
    return <div className="p-8 text-center text-rose-400 text-xs">Transfer record not found.</div>
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/transfers"
            className="p-2 text-slate-400 hover:text-white bg-slate-800 rounded-lg border border-slate-700"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-mono font-bold text-white tracking-tight">
                {transfer.reference}
              </h1>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${getStatusBadge(
                  transfer.status
                )}`}
              >
                {transfer.status.toUpperCase()}
              </span>
            </div>
            <p className="text-xs text-slate-400">Created by {transfer.user?.name || 'Admin'}</p>
          </div>
        </div>

        {/* Validation Action Button */}
        {transfer.status === 'draft' && (
          <button
            onClick={handleValidate}
            disabled={validating}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold shadow-lg shadow-indigo-900/30 transition-colors disabled:opacity-50"
          >
            <Check className="w-4 h-4" />
            {validating ? 'Transferring Stock...' : 'Validate Transfer (Move Stock)'}
          </button>
        )}
      </div>

      {transfer.status === 'draft' && (
        <div className="p-3.5 bg-amber-950/40 border border-amber-800/40 rounded-xl flex items-start gap-2.5 text-xs text-amber-300">
          <Clock className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
          <span>
            This transfer is currently in <strong>Draft</strong> state. Stock quantities have{' '}
            <strong>NOT</strong> yet shifted. Validating will automatically decrease source location
            stock and increase destination location stock.
          </span>
        </div>
      )}

      {transfer.status === 'validated' && (
        <div className="p-3.5 bg-emerald-950/40 border border-emerald-800/40 rounded-xl flex items-start gap-2.5 text-xs text-emerald-300">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
          <span>
            This transfer was validated on <strong>{formatDate(transfer.validatedAt)}</strong>. Stock
            relocation completed and permanently logged in the Stock Ledger. Total company inventory
            remains unchanged.
          </span>
        </div>
      )}

      {/* Movement Path Card */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-3 bg-slate-900 rounded-lg border border-slate-750">
            <span className="text-slate-400 text-[11px]">From Source Location:</span>
            <p className="font-semibold text-white mt-1 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-amber-400" />
              {transfer.source.warehouse.name} → {transfer.source.name}
            </p>
          </div>

          <div className="p-3 bg-slate-900 rounded-lg border border-slate-750">
            <span className="text-slate-400 text-[11px]">To Destination Location:</span>
            <p className="font-semibold text-white mt-1 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-emerald-400" />
              {transfer.destination.warehouse.name} → {transfer.destination.name}
            </p>
          </div>

          <div>
            <span className="text-slate-400">Created On:</span>
            <p className="font-semibold text-white mt-1">{formatDate(transfer.createdAt)}</p>
          </div>

          {transfer.notes && (
            <div>
              <span className="text-slate-400">Notes / Reason:</span>
              <p className="text-slate-300 mt-1">{transfer.notes}</p>
            </div>
          )}
        </div>

        {/* Items Table */}
        <div className="pt-4 border-t border-slate-700">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3">
            Transferred Items
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/60 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-700">
                <tr>
                  <th className="px-4 py-2.5">Product</th>
                  <th className="px-4 py-2.5">SKU</th>
                  <th className="px-4 py-2.5">Unit</th>
                  <th className="px-4 py-2.5 text-right">Transferred Quantity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/60 text-slate-300">
                {transfer.items.map((item: any) => (
                  <tr key={item.id} className="hover:bg-slate-750/30">
                    <td className="px-4 py-2.5 font-semibold text-white">
                      <Link
                        href={`/dashboard/products/${item.productId}`}
                        className="hover:text-blue-400"
                      >
                        {item.product.name}
                      </Link>
                    </td>
                    <td className="px-4 py-2.5 font-mono text-slate-400">{item.product.sku}</td>
                    <td className="px-4 py-2.5 text-slate-400">{item.product.unitOfMeasure}</td>
                    <td className="px-4 py-2.5 text-right font-bold text-indigo-400">
                      {item.quantity}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
