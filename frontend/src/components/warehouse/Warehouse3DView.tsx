import React, { useState } from 'react';
import { useInventory } from '../../context/InventoryContext';
import { Warehouse3DCanvas } from '../dashboard/Warehouse3DCanvas';
import {
  Building2,
  Scan,
} from 'lucide-react';
import { Product } from '../../types/inventory';

interface Warehouse3DViewProps {
  onNavigateTab: (tab: string) => void;
  onOpenScanner: () => void;
  onSelectProduct?: (product: Product) => void;
}

export const Warehouse3DView: React.FC<Warehouse3DViewProps> = ({
  onOpenScanner,
  onSelectProduct,
}) => {
  const { warehouses, kpis } = useInventory();
  const [selectedWarehouseId, setSelectedWarehouseId] = useState(warehouses[0]?.id || 'wh-main');

  const currentWh = warehouses.find((w) => w.id === selectedWarehouseId) || warehouses[0];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto text-stone-900">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-extrabold text-stone-950 tracking-tight">
              3D Warehouse Digital Twin
            </h1>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-stone-100 text-stone-700 border border-stone-200">
              Interactive WebGL
            </span>
          </div>
          <p className="text-xs sm:text-sm text-stone-500">
            Real-time physical spatial visualizer. Inspect rack bays, view live pallet occupancy, and track autonomous forklift pathing.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Facility Selector */}
          <div className="flex items-center gap-2 bg-white border border-stone-200 shadow-2xs rounded-xl px-3 py-1.5">
            <Building2 className="w-4 h-4 text-stone-500" />
            <select
              value={selectedWarehouseId}
              onChange={(e) => setSelectedWarehouseId(e.target.value)}
              className="bg-transparent text-xs font-semibold text-stone-900 focus:outline-none cursor-pointer"
            >
              {warehouses.map((wh) => (
                <option key={wh.id} value={wh.id}>
                  {wh.name}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={onOpenScanner}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-stone-50 text-stone-700 text-xs font-semibold border border-stone-200 shadow-2xs transition-colors"
          >
            <Scan className="w-3.5 h-3.5 text-emerald-700" />
            <span>Scan Bay</span>
          </button>
        </div>
      </div>

      {/* Main 3D Model Canvas */}
      <div className="w-full rounded-3xl border border-stone-200 overflow-hidden shadow-xs bg-white">
        <Warehouse3DCanvas
          height="540px"
          onSelectProduct={onSelectProduct}
        />
      </div>

      {/* Facility Summary Strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-xs">
          <div className="text-xs text-stone-500 font-medium">Inspected Facility</div>
          <div className="text-base font-bold text-stone-900 mt-0.5">{currentWh.name}</div>
          <div className="text-[11px] text-stone-500">{currentWh.address}</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-xs">
          <div className="text-xs text-stone-500 font-medium">Bays & Racks Active</div>
          <div className="text-base font-bold text-stone-900 mt-0.5">{currentWh.locations.length} Zones</div>
          <div className="text-[11px] text-stone-500 font-mono">
            {currentWh.locations.map((l) => l.name).join(' · ')}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-xs">
          <div className="text-xs text-stone-500 font-medium">Total Facility Occupancy</div>
          <div className="text-base font-bold text-stone-900 mt-0.5 font-mono">
            {kpis.totalUnitsInStock.toLocaleString()} units
          </div>
          <div className="text-[11px] text-emerald-700">Digital twin continuously in sync</div>
        </div>
      </div>
    </div>
  );
};
