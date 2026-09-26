import React, { useState } from 'react';
import { useInventory } from '../../context/InventoryContext';
import { InternalTransfer, OperationItem } from '../../types/inventory';
import {
  Shuffle,
  Plus,
  CheckCircle,
  ArrowRight,
  X,
  Calendar,
} from 'lucide-react';
import { sound } from '../../utils/audio';

interface TransfersViewProps {
  onNavigateTab: (tab: string) => void;
}

export const TransfersView: React.FC<TransfersViewProps> = () => {
  const {
    transfers,
    products,
    warehouses,
    createTransfer,
    validateTransfer,
    getLocationName,
  } = useInventory();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Form states
  const [sourceWarehouseId, setSourceWarehouseId] = useState(warehouses[0]?.id || 'wh-main');
  const [sourceLocationId, setSourceLocationId] = useState(warehouses[0]?.locations[0]?.id || 'loc-main-rack-a');
  const [destWarehouseId, setDestWarehouseId] = useState(warehouses[1]?.id || 'wh-prod');
  const [destLocationId, setDestLocationId] = useState(warehouses[1]?.locations[0]?.id || 'loc-prod-rack-1');
  const [scheduledDate, setScheduledDate] = useState(new Date().toISOString().split('T')[0]);
  const [purpose, setPurpose] = useState('Production staging transfer');

  // Items
  const [items, setItems] = useState<OperationItem[]>([
    {
      productId: products[0]?.id || 'prod-steel-rods',
      productName: products[0]?.name || 'Industrial Steel Rods (10mm)',
      sku: products[0]?.sku || 'STL-100-ROD',
      unitOfMeasure: products[0]?.unitOfMeasure || 'kg',
      demandQty: 30,
      doneQty: 30,
    },
  ]);

  const handleSourceWhChange = (whId: string) => {
    setSourceWarehouseId(whId);
    const wh = warehouses.find((w) => w.id === whId);
    if (wh && wh.locations.length > 0) {
      setSourceLocationId(wh.locations[0].id);
    }
  };

  const handleDestWhChange = (whId: string) => {
    setDestWarehouseId(whId);
    const wh = warehouses.find((w) => w.id === whId);
    if (wh && wh.locations.length > 0) {
      setDestLocationId(wh.locations[0].id);
    }
  };

  const handleAddItem = () => {
    const prod = products[0];
    if (!prod) return;
    setItems([
      ...items,
      {
        productId: prod.id,
        productName: prod.name,
        sku: prod.sku,
        unitOfMeasure: prod.unitOfMeasure,
        demandQty: 10,
        doneQty: 10,
      },
    ]);
  };

  const handleCreateTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    createTransfer({
      sourceWarehouseId,
      sourceLocationId,
      destWarehouseId,
      destLocationId,
      scheduledDate,
      purpose,
      items,
    });
    setIsCreateModalOpen(false);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto text-stone-900">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-extrabold text-stone-950 tracking-tight">
              Internal Transfers (Shelving & Bay Movements)
            </h1>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-stone-100 text-stone-800 border border-stone-200">
              PDF STAGE 02
            </span>
          </div>
          <p className="text-xs sm:text-sm text-stone-500">
            Move inventory between racks, bays, and warehouses. Total stock quantity is preserved while location balances update in real-time.
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold shadow-xs transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <Plus className="w-4 h-4 text-amber-400" />
          <span>New Internal Transfer</span>
        </button>
      </div>

      {/* Transfers List */}
      <div className="space-y-4">
        {transfers.map((t) => {
          const isDone = t.status === 'done';

          return (
            <div
              key={t.id}
              className="p-5 rounded-2xl bg-white border border-stone-200 shadow-xs hover:border-stone-400 transition-all space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-stone-100 border border-stone-200 flex items-center justify-center text-stone-800">
                    <Shuffle className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-bold text-stone-950">
                        {t.referenceNumber}
                      </span>
                      {isDone ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          DONE (Transferred)
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-50 text-amber-900 border border-amber-200">
                          SCHEDULED
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-stone-500 mt-0.5">
                      Purpose: <strong className="text-stone-800">{t.purpose}</strong>
                    </div>
                  </div>
                </div>

                {!isDone && (
                  <button
                    onClick={() => validateTransfer(t.id)}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold shadow-xs transition-all hover:scale-[1.02]"
                  >
                    <CheckCircle className="w-3.5 h-3.5 text-amber-400" />
                    <span>Execute & Rebalance Stock</span>
                  </button>
                )}
              </div>

              {/* Bay Movement Path Graphic */}
              <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 flex items-center justify-between gap-4 text-xs font-medium">
                <div className="flex items-center gap-2">
                  <span className="text-stone-500">From:</span>
                  <span className="font-bold text-stone-900">{getLocationName(t.sourceLocationId)}</span>
                </div>

                <div className="flex items-center gap-2 text-stone-400">
                  <span className="h-px w-12 bg-stone-300" />
                  <ArrowRight className="w-4 h-4 text-amber-600" />
                  <span className="h-px w-12 bg-stone-300" />
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-stone-500">To:</span>
                  <span className="font-bold text-stone-900">{getLocationName(t.destLocationId)}</span>
                </div>
              </div>

              {/* Items Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-stone-50 text-stone-500 uppercase tracking-wider font-semibold">
                    <tr>
                      <th className="py-2 px-3">Product Name</th>
                      <th className="py-2 px-3">SKU</th>
                      <th className="py-2 px-3">Transfer Quantity</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {t.items.map((it, idx) => (
                      <tr key={idx} className="hover:bg-stone-50/60">
                        <td className="py-2.5 px-3 font-semibold text-stone-900">{it.productName}</td>
                        <td className="py-2.5 px-3 font-mono text-stone-600">{it.sku}</td>
                        <td className="py-2.5 px-3 font-mono font-bold text-stone-900">
                          {it.doneQty} {it.unitOfMeasure}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between text-[11px] text-stone-400 pt-2 border-t border-stone-100">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-stone-400" />
                  <span>Scheduled: {t.scheduledDate}</span>
                </span>
                <span>Audit trail logged to Move History</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Create Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-2xl bg-white border border-stone-200 rounded-3xl shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-stone-900">Create Internal Transfer</h3>
                <p className="text-xs text-stone-500">Move material from one storage bay to another</p>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTransfer} className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Transfer Purpose</label>
                  <input
                    type="text"
                    required
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-stone-900"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Transfer Date</label>
                  <input
                    type="date"
                    required
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-stone-900"
                  />
                </div>
              </div>

              {/* Source & Destination Matrix */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-2xl bg-stone-50 border border-stone-200">
                <div className="space-y-3">
                  <div className="font-bold text-stone-800">Source (Origin)</div>
                  <div>
                    <label className="block text-[11px] text-stone-500 mb-1">Warehouse</label>
                    <select
                      value={sourceWarehouseId}
                      onChange={(e) => handleSourceWhChange(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-stone-200 rounded-xl text-stone-900"
                    >
                      {warehouses.map((w) => (
                        <option key={w.id} value={w.id}>
                          {w.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] text-stone-500 mb-1">Source Bay</label>
                    <select
                      value={sourceLocationId}
                      onChange={(e) => setSourceLocationId(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-stone-200 rounded-xl text-stone-900"
                    >
                      {warehouses
                        .find((w) => w.id === sourceWarehouseId)
                        ?.locations.map((loc) => (
                          <option key={loc.id} value={loc.id}>
                            {loc.name}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="font-bold text-stone-800">Destination (Target)</div>
                  <div>
                    <label className="block text-[11px] text-stone-500 mb-1">Warehouse</label>
                    <select
                      value={destWarehouseId}
                      onChange={(e) => handleDestWhChange(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-stone-200 rounded-xl text-stone-900"
                    >
                      {warehouses.map((w) => (
                        <option key={w.id} value={w.id}>
                          {w.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] text-stone-500 mb-1">Target Bay</label>
                    <select
                      value={destLocationId}
                      onChange={(e) => setDestLocationId(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-stone-200 rounded-xl text-stone-900"
                    >
                      {warehouses
                        .find((w) => w.id === destWarehouseId)
                        ?.locations.map((loc) => (
                          <option key={loc.id} value={loc.id}>
                            {loc.name}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Items */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-stone-800">Items to Rebalance</span>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="text-xs text-stone-800 hover:text-stone-950 font-semibold"
                  >
                    + Add Product
                  </button>
                </div>

                <div className="border border-stone-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-stone-50 text-stone-600 font-semibold border-b border-stone-200">
                      <tr>
                        <th className="p-2">Product</th>
                        <th className="p-2">Quantity to Move</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {items.map((it, idx) => (
                        <tr key={idx}>
                          <td className="p-2">
                            <select
                              value={it.productId}
                              onChange={(e) => {
                                const prod = products.find((p) => p.id === e.target.value);
                                if (!prod) return;
                                const newItems = [...items];
                                newItems[idx] = {
                                  ...newItems[idx],
                                  productId: prod.id,
                                  productName: prod.name,
                                  sku: prod.sku,
                                  unitOfMeasure: prod.unitOfMeasure,
                                };
                                setItems(newItems);
                              }}
                              className="w-full p-1 bg-white border border-stone-200 rounded-lg text-xs"
                            >
                              {products.map((p) => (
                                <option key={p.id} value={p.id}>
                                  {p.name} ({p.sku} · Avail: {p.totalStock})
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="p-2">
                            <input
                              type="number"
                              min="1"
                              value={it.doneQty}
                              onChange={(e) => {
                                const newItems = [...items];
                                newItems[idx].doneQty = Number(e.target.value);
                                newItems[idx].demandQty = Number(e.target.value);
                                setItems(newItems);
                              }}
                              className="w-24 p-1 bg-white border border-stone-200 rounded-lg font-mono text-xs"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
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
                  Create Transfer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
