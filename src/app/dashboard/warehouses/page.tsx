'use client'

import { useState, useEffect } from 'react'
import { getWarehouses, createWarehouse, createLocation } from '@/actions/warehouses'
import toast from 'react-hot-toast'
import { Warehouse, Plus, MapPin, Building2 } from 'lucide-react'

export default function WarehousesPage() {
  const [warehouses, setWarehouses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // New Warehouse form state
  const [whName, setWhName] = useState('')
  const [whAddress, setWhAddress] = useState('')
  const [whSubmitting, setWhSubmitting] = useState(false)

  // New Location form state
  const [locName, setLocName] = useState('')
  const [locWhId, setLocWhId] = useState('')
  const [locSubmitting, setLocSubmitting] = useState(false)

  const loadData = async () => {
    try {
      const data = await getWarehouses()
      setWarehouses(data)
      if (data.length > 0 && !locWhId) {
        setLocWhId(data[0].id)
      }
    } catch (err) {
      toast.error('Failed to load warehouses')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleCreateWarehouse = async (e: React.FormEvent) => {
    e.preventDefault()
    setWhSubmitting(true)
    try {
      await createWarehouse({ name: whName, address: whAddress })
      toast.success('Warehouse created')
      setWhName('')
      setWhAddress('')
      loadData()
    } catch (err: any) {
      toast.error(err.message || 'Failed to create warehouse')
    } finally {
      setWhSubmitting(false)
    }
  }

  const handleCreateLocation = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!locWhId) {
      toast.error('Select a warehouse')
      return
    }
    setLocSubmitting(true)
    try {
      await createLocation({ name: locName, warehouseId: locWhId })
      toast.success('Internal location added')
      setLocName('')
      loadData()
    } catch (err: any) {
      toast.error(err.message || 'Failed to create location')
    } finally {
      setLocSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">
          Warehouses & Internal Locations
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Manage physical storage buildings, regional distribution hubs, and internal shelf locations
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Create forms */}
        <div className="space-y-6">
          {/* New Warehouse */}
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 shadow-sm">
            <h2 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-400" /> Add Warehouse
            </h2>
            <form onSubmit={handleCreateWarehouse} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Warehouse Name *
                </label>
                <input
                  type="text"
                  required
                  value={whName}
                  onChange={(e) => setWhName(e.target.value)}
                  placeholder="e.g. South Logistics Depot"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Address / City
                </label>
                <input
                  type="text"
                  value={whAddress}
                  onChange={(e) => setWhAddress(e.target.value)}
                  placeholder="e.g. Plot 10, Shamshabad, Hyderabad"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <button
                type="submit"
                disabled={whSubmitting}
                className="w-full py-2 px-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-md transition-colors disabled:opacity-50"
              >
                {whSubmitting ? 'Adding...' : 'Create Warehouse'}
              </button>
            </form>
          </div>

          {/* New Location */}
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 shadow-sm">
            <h2 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-indigo-400" /> Add Internal Location
            </h2>
            <form onSubmit={handleCreateLocation} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Target Warehouse *
                </label>
                <select
                  required
                  value={locWhId}
                  onChange={(e) => setLocWhId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Location Name *
                </label>
                <input
                  type="text"
                  required
                  value={locName}
                  onChange={(e) => setLocName(e.target.value)}
                  placeholder="e.g. Row 4 / Shelf C, Refrigerated Bay"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <button
                type="submit"
                disabled={locSubmitting}
                className="w-full py-2 px-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-md transition-colors disabled:opacity-50"
              >
                {locSubmitting ? 'Adding...' : 'Add Location'}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column (2/3 width): Warehouse Tree */}
        <div className="lg:col-span-2 space-y-4">
          {warehouses.map((wh) => (
            <div
              key={wh.id}
              className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden shadow-sm"
            >
              <div className="px-5 py-4 border-b border-slate-700 bg-slate-850 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Warehouse className="w-4 h-4 text-blue-400" />
                    <h3 className="font-bold text-white text-sm">{wh.name}</h3>
                  </div>
                  {wh.address && (
                    <p className="text-slate-400 text-xs mt-0.5 ml-6">{wh.address}</p>
                  )}
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-mono bg-blue-950/60 text-blue-300 border border-blue-800">
                  {wh.locations.length} Locations
                </span>
              </div>

              <div className="p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {wh.locations.map((loc: any) => (
                    <div
                      key={loc.id}
                      className="p-3 bg-slate-900 rounded-lg border border-slate-750 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-indigo-400" />
                        <span className="font-semibold text-slate-200">{loc.name}</span>
                      </div>
                      <span className="text-[11px] font-mono text-slate-400">
                        {loc.stockBalances?.length || 0} product types
                      </span>
                    </div>
                  ))}

                  {wh.locations.length === 0 && (
                    <p className="text-xs text-slate-500 italic col-span-2 py-2">
                      No internal locations yet in this warehouse.
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}

          {warehouses.length === 0 && !loading && (
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-8 text-center text-slate-500 text-xs">
              No warehouses created yet.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
