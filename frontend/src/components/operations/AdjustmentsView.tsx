import React, { useState } from 'react';
import { useInventory } from '../../context/InventoryContext';
import { AdjustmentReason } from '../../types/inventory';
import {
  AlertTriangle,
  Plus,
  CheckCircle,
  Calculator,
  X,
  Calendar,
} from 'lucide-react';
import { sound } from '../../utils/audio';

interface AdjustmentsViewProps {
  onNavigateTab: (tab: string) => void;
}

export const AdjustmentsView: React.FC<AdjustmentsViewProps> = () => {
  const {
    adjustments,
    products,
    warehouses,
    createAdjustment,
    validateAdjustment,
    getLocationName,
  } = useInventory();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Form states
  const [selectedProductId, setSelectedProductId] = useState(products[0]?.id || 'prod-steel-rods');
  const [warehouseId, setWarehouseId] = useState(warehouses[1]?.id || 'wh-prod');
  const [locationId, setLocationId] = useState(warehouses[1]?.locations[0]?.id || 'loc-prod-rack-1');
  const [countedQty, setCountedQty] = useState(30);
  const [reason, setReason] = useState<AdjustmentReason>('damaged');
  const [notes, setNotes] = useState('Step 4 in PDF: 3 kg steel damaged -> Stock: -3');

  const selectedProd = products.find((p) => p.id === selectedProductId);

  // Find recorded stock in that location
  const currentLocationStock = selectedProd?.locationStocks.find(
    (ls) => ls.warehouseId === warehouseId && ls.locationId === locationId
  );
  const recordedQty = currentLocationStock ? currentLocationStock.quantity : 0;
  const difference = countedQty - recordedQty;

  const handleWarehouseChange = (whId: string) => {
    setWarehouseId(whId);
    const wh = warehouses.find((w) => w.id === whId);
    if (wh && wh.locations.length > 0) {
      setLocationId(wh.locations[0].id);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProd) return;

    // Record the count and apply it right away
    const ok = await createAdjustment({
      warehouseId,
      locationId,
      productId: selectedProd.id,
      productName: selectedProd.name,
      sku: selectedProd.sku,
      unitOfMeasure: selectedProd.unitOfMeasure,
      recordedQty,
      countedQty,
      reason,
      notes,
    }, { validate: true });

    if (ok) setIsCreateModalOpen(false);
  };

  const getReasonBadge = (r: AdjustmentReason) => {
    switch (r) {
      case 'damaged':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-50 text-amber-900 border border-amber-200">
            DAMAGED GOODS
          </span>
        );
      case 'physical_count':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-stone-100 text-stone-800 border border-stone-200">
            PHYSICAL COUNT
          </span>
        );
      case 'scrap':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-50 text-rose-800 border border-rose-200">
            SCRAP DISPOSAL
          </span>
        );
      case 'loss_theft':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-stone-100 text-stone-800 border border-stone-200">
            LOSS / SHRINKAGE
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-stone-100 text-stone-800 border border-stone-200">
            OTHER
          </span>
        );
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto text-stone-900">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-extrabold text-stone-950 tracking-tight">
              Stock Adjustments & Count Discrepancies
            </h1>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-900 border border-amber-200">
              PDF STAGE 04
            </span>
          </div>
          <p className="text-xs sm:text-sm text-stone-500">
            Resolve count discrepancies between recorded system quantities and physical warehouse counts. Writes down scrap and damages with complete ledger audit stamps.
          </p>
        </div>

        <button
          onClick={() => {
            sound.playBeep();
            setIsCreateModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold shadow-xs transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <Plus className="w-4 h-4 text-amber-400" />
          <span>New Stock Adjustment</span>
        </button>
      </div>

      {/* Adjustments List */}
      <div className="space-y-4">
        {adjustments.map((a) => {
          const isDone = a.status === 'done';
          const isNegative = a.differenceQty < 0;

          return (
            <div
              key={a.id}
              className="p-5 rounded-2xl bg-white border border-stone-200 shadow-xs hover:border-stone-400 transition-all space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-800">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-bold text-stone-950">
                        {a.referenceNumber}
                      </span>
                      {getReasonBadge(a.reason)}
                      {isDone ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          RECONCILED
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-50 text-amber-900 border border-amber-200">
                          PENDING APPROVAL
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-stone-700 font-semibold mt-0.5">
                      Product: {a.productName} ({a.sku})
                    </div>
                  </div>
                </div>

                {!isDone && (
                  <button
                    onClick={() => validateAdjustment(a.id)}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold shadow-xs"
                  >
                    <CheckCircle className="w-3.5 h-3.5 text-amber-400" />
                    <span>Apply Adjustment</span>
                  </button>
                )}
              </div>

              {/* Count Delta Calculation Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-stone-50 p-3 rounded-xl border border-stone-200 text-xs">
                <div>
                  <span className="text-[10px] text-stone-500 block uppercase font-semibold">Bay Location</span>
                  <span className="font-semibold text-stone-900">{getLocationName(a.locationId)}</span>
                </div>

                <div>
                  <span className="text-[10px] text-stone-500 block uppercase font-semibold">Recorded Qty</span>
                  <span className="font-mono text-stone-800">
                    {a.recordedQty} {a.unitOfMeasure}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-stone-500 block uppercase font-semibold">Physical Count</span>
                  <span className="font-mono text-stone-800">
                    {a.countedQty} {a.unitOfMeasure}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-stone-500 block uppercase font-semibold">Discrepancy</span>
                  <span
                    className={`font-mono font-bold text-sm ${
                      isNegative ? 'text-rose-600' : 'text-emerald-700'
                    }`}
                  >
                    {a.differenceQty > 0 ? `+${a.differenceQty}` : a.differenceQty} {a.unitOfMeasure}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-stone-400 pt-2 border-t border-stone-100">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-stone-400" />
                  <span>Logged: {a.createdAt.split('T')[0]}</span>
                </span>
                {a.notes && <div>Audit Note: {a.notes}</div>}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-lg bg-white border border-stone-200 rounded-3xl shadow-xl p-6 space-y-4 text-stone-900">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div>
                <h3 className="text-base font-bold">New Inventory Reconciliation</h3>
                <p className="text-xs text-stone-500">Record physical stock count and resolve differences</p>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 text-stone-400 hover:text-stone-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Select Product *</label>
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-stone-900"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.sku})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Facility</label>
                  <select
                    value={warehouseId}
                    onChange={(e) => handleWarehouseChange(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-stone-900"
                  >
                    {warehouses.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Storage Location Bay</label>
                  <select
                    value={locationId}
                    onChange={(e) => setLocationId(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-stone-900"
                  >
                    {warehouses
                      .find((w) => w.id === warehouseId)
                      ?.locations.map((loc) => (
                        <option key={loc.id} value={loc.id}>
                          {loc.name}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              {/* Dynamic Count Difference Calculator */}
              <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 space-y-2">
                <div className="flex items-center justify-between font-semibold">
                  <span className="flex items-center gap-1.5">
                    <Calculator className="w-4 h-4 text-amber-700" />
                    <span>Difference Calculation</span>
                  </span>
                  <span className="font-mono text-stone-500">
                    Recorded: {recordedQty} {selectedProd?.unitOfMeasure}
                  </span>
                </div>

                <div>
                  <label className="block text-[11px] text-stone-500 mb-1">
                    Physical Counted Quantity
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={countedQty}
                    onChange={(e) => setCountedQty(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white border border-stone-200 rounded-xl font-mono text-sm text-stone-900"
                  />
                </div>

                <div className="flex items-center justify-between text-xs pt-1 border-t border-stone-200">
                  <span className="text-stone-600 font-medium">Net Discrepancy:</span>
                  <span
                    className={`font-mono font-bold text-sm ${
                      difference < 0 ? 'text-rose-600' : 'text-emerald-700'
                    }`}
                  >
                    {difference > 0 ? `+${difference}` : difference} {selectedProd?.unitOfMeasure}
                  </span>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Reason for Discrepancy</label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value as AdjustmentReason)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-stone-900"
                >
                  <option value="damaged">Damaged Goods (Scrap)</option>
                  <option value="physical_count">Physical Count Mismatch</option>
                  <option value="scrap">Scrap & Waste Removal</option>
                  <option value="loss_theft">Loss & Shrinkage</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Audit Notes</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Reason for adjustment"
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-stone-900"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-semibold shadow-xs"
                >
                  Apply & Record in Ledger
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
