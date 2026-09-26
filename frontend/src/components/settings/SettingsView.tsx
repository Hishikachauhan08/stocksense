import React, { useState } from 'react';
import { useInventory } from '../../context/InventoryContext';
import { LocationZone } from '../../types/inventory';
import {
  Building2,
  Plus,
  MapPin,
  RotateCcw,
  X,
} from 'lucide-react';
import { sound } from '../../utils/audio';

export const SettingsView: React.FC = () => {
  const {
    warehouses,
    addWarehouse,
    addLocationToWarehouse,
    resetToInitialDemo,
  } = useInventory();

  const [isAddWhModalOpen, setIsAddWhModalOpen] = useState(false);
  const [isAddLocModalOpen, setIsAddLocModalOpen] = useState(false);
  const [selectedWhForLoc, setSelectedWhForLoc] = useState<string>(warehouses[0]?.id || '');

  // Form states
  const [whName, setWhName] = useState('');
  const [whCode, setWhCode] = useState('');
  const [whAddress, setWhAddress] = useState('');
  const [whManager, setWhManager] = useState('');

  // Location form states
  const [locName, setLocName] = useState('');
  const [locCode, setLocCode] = useState('');
  const [locType, setLocType] = useState<LocationZone['type']>('rack');
  const [locCapacity, setLocCapacity] = useState(500);

  const handleAddWarehouseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!whName || !whCode) return;

    addWarehouse({
      name: whName,
      code: whCode,
      address: whAddress,
      manager: whManager,
      locations: [
        {
          id: `loc-${Date.now()}-1`,
          name: 'General Rack A',
          warehouseId: '',
          code: `${whCode}-RACK-A`,
          type: 'rack',
          capacity: 500,
        },
      ],
    });

    setWhName('');
    setWhCode('');
    setWhAddress('');
    setWhManager('');
    setIsAddWhModalOpen(false);
  };

  const handleAddLocationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!locName || !selectedWhForLoc) return;

    addLocationToWarehouse(selectedWhForLoc, {
      name: locName,
      code: locCode || `${locName.toUpperCase().replace(/\s+/g, '-')}`,
      type: locType,
      capacity: Number(locCapacity),
    });

    setLocName('');
    setLocCode('');
    setIsAddLocModalOpen(false);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto text-stone-900">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-extrabold text-stone-950 tracking-tight">
              Settings & Facility Management
            </h1>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-stone-100 text-stone-700 border border-stone-200">
              MULTI-WAREHOUSE
            </span>
          </div>
          <p className="text-xs sm:text-sm text-stone-500">
            Configure warehouses, aisles, storage racks, bay zones, and data seeding defaults.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (confirm('Reset application back to the initial 4-step PDF demonstration dataset?')) {
                resetToInitialDemo();
              }
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-stone-50 border border-stone-200 text-stone-700 text-xs font-semibold shadow-xs"
          >
            <RotateCcw className="w-3.5 h-3.5 text-stone-500" />
            <span>Reset Demo Data</span>
          </button>

          <button
            onClick={() => setIsAddWhModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold shadow-xs"
          >
            <Plus className="w-4 h-4 text-amber-400" />
            <span>Add Facility</span>
          </button>
        </div>
      </div>

      {/* Warehouse Facilities List */}
      <div className="space-y-5">
        {warehouses.map((wh) => (
          <div
            key={wh.id}
            className="p-6 rounded-2xl bg-white border border-stone-200 shadow-xs space-y-4"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-stone-100 border border-stone-200 flex items-center justify-center text-stone-800">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-stone-950">{wh.name}</h3>
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-stone-100 text-stone-700 border border-stone-200">
                      {wh.code}
                    </span>
                  </div>
                  <div className="text-xs text-stone-500 mt-0.5">
                    {wh.address} · Site Manager: <strong className="text-stone-800">{wh.manager}</strong>
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  setSelectedWhForLoc(wh.id);
                  setIsAddLocModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Bay / Rack</span>
              </button>
            </div>

            {/* Storage Locations / Bays */}
            <div className="space-y-2">
              <div className="text-xs font-semibold text-stone-700 uppercase tracking-wider">
                Storage Bays & Racks ({wh.locations.length})
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {wh.locations.map((loc) => (
                  <div
                    key={loc.id}
                    className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-bold text-stone-900 text-xs">
                        <MapPin className="w-3.5 h-3.5 text-amber-700" />
                        <span>{loc.name}</span>
                      </div>
                      <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-white text-stone-600 border border-stone-200">
                        {loc.type}
                      </span>
                    </div>
                    <div className="text-[11px] font-mono text-stone-500">
                      Code: {loc.code}
                    </div>
                    <div className="text-[11px] text-stone-600 font-medium">
                      Capacity: {loc.capacity.toLocaleString()} units
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Warehouse Modal */}
      {isAddWhModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-lg bg-white border border-stone-200 rounded-3xl shadow-xl p-6 space-y-4 text-stone-900">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div>
                <h3 className="text-base font-bold">Add New Warehouse Facility</h3>
                <p className="text-xs text-stone-500">Multi-warehouse facility tracking</p>
              </div>
              <button
                onClick={() => setIsAddWhModalOpen(false)}
                className="p-1 text-stone-400 hover:text-stone-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddWarehouseSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Warehouse Name *</label>
                <input
                  type="text"
                  required
                  value={whName}
                  onChange={(e) => setWhName(e.target.value)}
                  placeholder="e.g. Eastern Logistics Center"
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-stone-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Facility Code *</label>
                  <input
                    type="text"
                    required
                    value={whCode}
                    onChange={(e) => setWhCode(e.target.value.toUpperCase())}
                    placeholder="WH-EAST-01"
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl font-mono text-stone-900"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Assigned Manager</label>
                  <input
                    type="text"
                    value={whManager}
                    onChange={(e) => setWhManager(e.target.value)}
                    placeholder="e.g. Liam Chen"
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-stone-900"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Physical Address</label>
                <input
                  type="text"
                  value={whAddress}
                  onChange={(e) => setWhAddress(e.target.value)}
                  placeholder="e.g. 500 Industrial Pkwy, Sector 4"
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-stone-900"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddWhModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-semibold shadow-xs"
                >
                  Save Warehouse
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Location Modal */}
      {isAddLocModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-md bg-white border border-stone-200 rounded-3xl shadow-xl p-6 space-y-4 text-stone-900">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div>
                <h3 className="text-base font-bold">Add Storage Bay or Rack</h3>
                <p className="text-xs text-stone-500">Configure new shelving location</p>
              </div>
              <button
                onClick={() => setIsAddLocModalOpen(false)}
                className="p-1 text-stone-400 hover:text-stone-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddLocationSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Location Name *</label>
                <input
                  type="text"
                  required
                  value={locName}
                  onChange={(e) => setLocName(e.target.value)}
                  placeholder="e.g. High-Bay Rack C3"
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-stone-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Location Type</label>
                  <select
                    value={locType}
                    onChange={(e) => setLocType(e.target.value as LocationZone['type'])}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-stone-900"
                  >
                    <option value="rack">Storage Rack</option>
                    <option value="shelf">Shelf</option>
                    <option value="aisle">Aisle</option>
                    <option value="pallet_ground">Ground Pallet</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Capacity (units)</label>
                  <input
                    type="number"
                    value={locCapacity}
                    onChange={(e) => setLocCapacity(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddLocModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-semibold shadow-xs"
                >
                  Add Bay
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
