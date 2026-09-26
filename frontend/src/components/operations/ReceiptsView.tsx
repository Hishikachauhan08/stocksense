import React, { useState } from 'react';
import { useInventory } from '../../context/InventoryContext';
import { Receipt, OperationStatus, OperationItem } from '../../types/inventory';
import {
  ArrowDownLeft,
  Plus,
  CheckCircle,
  Printer,
  X,
  Building2,
  Calendar,
} from 'lucide-react';
import { sound } from '../../utils/audio';

interface ReceiptsViewProps {
  onNavigateTab: (tab: string) => void;
}

export const ReceiptsView: React.FC<ReceiptsViewProps> = () => {
  const {
    receipts,
    products,
    warehouses,
    createReceipt,
    updateReceiptStatus,
    validateReceipt,
    getLocationName,
  } = useInventory();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedReceiptForSlip, setSelectedReceiptForSlip] = useState<Receipt | null>(null);

  // Form states
  const [supplier, setSupplier] = useState('Apex Metal Alloys Ltd.');
  const [warehouseId, setWarehouseId] = useState(warehouses[0]?.id || 'wh-main');
  const [destLocationId, setDestLocationId] = useState(warehouses[0]?.locations[0]?.id || 'loc-main-rack-a');
  const [scheduledDate, setScheduledDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('Vendor shipment receipt');
  
  // Line items
  const [items, setItems] = useState<OperationItem[]>([
    {
      productId: products[0]?.id || 'prod-steel-rods',
      productName: products[0]?.name || 'Industrial Steel Rods (10mm)',
      sku: products[0]?.sku || 'STL-100-ROD',
      unitOfMeasure: products[0]?.unitOfMeasure || 'kg',
      demandQty: 50,
      doneQty: 50,
    },
  ]);

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

  const handleItemProductChange = (index: number, prodId: string) => {
    const prod = products.find((p) => p.id === prodId);
    if (!prod) return;
    const newItems = [...items];
    newItems[index] = {
      ...newItems[index],
      productId: prod.id,
      productName: prod.name,
      sku: prod.sku,
      unitOfMeasure: prod.unitOfMeasure,
    };
    setItems(newItems);
  };

  const handleItemQtyChange = (index: number, field: 'demandQty' | 'doneQty', val: number) => {
    const newItems = [...items];
    newItems[index] = {
      ...newItems[index],
      [field]: val,
    };
    setItems(newItems);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const handleCreateReceipt = (e: React.FormEvent) => {
    e.preventDefault();
    createReceipt({
      supplier,
      warehouseId,
      destLocationId,
      scheduledDate,
      items,
      notes,
    });
    setIsCreateModalOpen(false);
  };

  const getStatusBadge = (status: OperationStatus) => {
    switch (status) {
      case 'done':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
            DONE (Validated)
          </span>
        );
      case 'ready':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-50 text-amber-900 border border-amber-200">
            READY FOR INTAKE
          </span>
        );
      case 'waiting':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-stone-100 text-stone-700 border border-stone-200">
            WAITING GOODS
          </span>
        );
      case 'draft':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-stone-100 text-stone-500 border border-stone-200">
            DRAFT
          </span>
        );
      case 'canceled':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-50 text-rose-800 border border-rose-200">
            CANCELED
          </span>
        );
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto text-stone-900">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-extrabold text-stone-950 tracking-tight">
              Goods Receipts (Vendor Inbound)
            </h1>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
              PDF STAGE 01
            </span>
          </div>
          <p className="text-xs sm:text-sm text-stone-500">
            Record incoming shipments from suppliers. Validating a receipt automatically increments inventory at the destination warehouse location.
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold shadow-xs transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <Plus className="w-4 h-4 text-emerald-400" />
          <span>New Vendor Receipt</span>
        </button>
      </div>

      {/* Receipts List */}
      <div className="space-y-4">
        {receipts.map((r) => {
          const isDone = r.status === 'done';
          const isReady = r.status === 'ready';

          return (
            <div
              key={r.id}
              className="p-5 rounded-2xl bg-white border border-stone-200 shadow-xs hover:border-stone-400 transition-all space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
                    <ArrowDownLeft className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-bold text-stone-950">
                        {r.referenceNumber}
                      </span>
                      {getStatusBadge(r.status)}
                    </div>
                    <div className="text-xs text-stone-500 mt-0.5">
                      Vendor: <strong className="text-stone-800">{r.supplier}</strong>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedReceiptForSlip(r)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-medium transition-colors"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print Receiving Slip</span>
                  </button>

                  {!isDone && (
                    <button
                      onClick={() => validateReceipt(r.id)}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-xs transition-all hover:scale-[1.02]"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Validate & Increment Stock</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Line Items Grid */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-stone-50 text-stone-500 uppercase tracking-wider font-semibold">
                    <tr>
                      <th className="py-2 px-3">Product Name</th>
                      <th className="py-2 px-3">SKU</th>
                      <th className="py-2 px-3">Destination Location</th>
                      <th className="py-2 px-3">Expected Qty</th>
                      <th className="py-2 px-3">Received Qty</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {r.items.map((it, idx) => (
                      <tr key={idx} className="hover:bg-stone-50/60">
                        <td className="py-2.5 px-3 font-semibold text-stone-900">{it.productName}</td>
                        <td className="py-2.5 px-3 font-mono text-stone-600">{it.sku}</td>
                        <td className="py-2.5 px-3 text-stone-600">
                          {getLocationName(r.destLocationId)}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-medium text-stone-700">
                          {it.demandQty} {it.unitOfMeasure}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-emerald-700">
                          {it.doneQty} {it.unitOfMeasure}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Footer Meta */}
              <div className="flex flex-wrap items-center justify-between text-[11px] text-stone-400 pt-2 border-t border-stone-100">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-stone-400" />
                    <span>Scheduled: {r.scheduledDate}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Building2 className="w-3 h-3 text-stone-400" />
                    <span>Warehouse: {r.warehouseId}</span>
                  </span>
                </div>
                {r.notes && <div>Notes: {r.notes}</div>}
              </div>
            </div>
          );
        })}
      </div>

      {/* Printable Slip Modal */}
      {selectedReceiptForSlip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-lg bg-white border border-stone-200 rounded-3xl shadow-xl p-6 space-y-4 text-stone-900">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <div>
                <h3 className="text-base font-bold">StockSense Receiving Slip</h3>
                <span className="font-mono text-xs text-stone-500">
                  Ref: {selectedReceiptForSlip.referenceNumber}
                </span>
              </div>
              <button
                onClick={() => setSelectedReceiptForSlip(null)}
                className="p-1 text-stone-400 hover:text-stone-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-stone-500">Supplier:</span>
                <span className="font-semibold">{selectedReceiptForSlip.supplier}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Destination Bay:</span>
                <span className="font-semibold">
                  {getLocationName(selectedReceiptForSlip.destLocationId)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Intake Date:</span>
                <span>{selectedReceiptForSlip.scheduledDate}</span>
              </div>
            </div>

            <div className="border border-stone-200 rounded-xl overflow-hidden text-xs">
              <table className="w-full text-left">
                <thead className="bg-stone-50 text-stone-600 font-semibold border-b border-stone-200">
                  <tr>
                    <th className="p-2">Item</th>
                    <th className="p-2">SKU</th>
                    <th className="p-2 text-right">Qty Received</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {selectedReceiptForSlip.items.map((it, i) => (
                    <tr key={i}>
                      <td className="p-2 font-medium">{it.productName}</td>
                      <td className="p-2 font-mono text-stone-500">{it.sku}</td>
                      <td className="p-2 text-right font-mono font-bold text-emerald-700">
                        {it.doneQty} {it.unitOfMeasure}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="pt-2 flex gap-2">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-semibold"
              >
                Print Slip
              </button>
              <button
                onClick={() => setSelectedReceiptForSlip(null)}
                className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Receipt Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-2xl bg-white border border-stone-200 rounded-3xl shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-stone-900">Create Vendor Receipt</h3>
                <p className="text-xs text-stone-500">Record incoming stock items from a supplier</p>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateReceipt} className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Supplier Name *</label>
                  <input
                    type="text"
                    required
                    value={supplier}
                    onChange={(e) => setSupplier(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-stone-900"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Intake Date</label>
                  <input
                    type="date"
                    required
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-stone-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Target Facility</label>
                  <select
                    value={warehouseId}
                    onChange={(e) => setWarehouseId(e.target.value)}
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
                  <label className="block font-semibold text-stone-700 mb-1">Destination Bay / Rack</label>
                  <select
                    value={destLocationId}
                    onChange={(e) => setDestLocationId(e.target.value)}
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

              {/* Items Table */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-stone-800">Shipment Line Items</span>
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
                        <th className="p-2">Expected Qty</th>
                        <th className="p-2">Received Qty</th>
                        <th className="p-2 text-right">Remove</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {items.map((it, idx) => (
                        <tr key={idx}>
                          <td className="p-2">
                            <select
                              value={it.productId}
                              onChange={(e) => handleItemProductChange(idx, e.target.value)}
                              className="w-full p-1 bg-white border border-stone-200 rounded-lg text-xs"
                            >
                              {products.map((p) => (
                                <option key={p.id} value={p.id}>
                                  {p.name} ({p.sku})
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="p-2">
                            <input
                              type="number"
                              min="1"
                              value={it.demandQty}
                              onChange={(e) =>
                                handleItemQtyChange(idx, 'demandQty', Number(e.target.value))
                              }
                              className="w-20 p-1 bg-white border border-stone-200 rounded-lg font-mono text-xs"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="number"
                              min="0"
                              value={it.doneQty}
                              onChange={(e) =>
                                handleItemQtyChange(idx, 'doneQty', Number(e.target.value))
                              }
                              className="w-20 p-1 bg-white border border-stone-200 rounded-lg font-mono text-xs"
                            />
                          </td>
                          <td className="p-2 text-right">
                            {items.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveItem(idx)}
                                className="text-stone-400 hover:text-rose-600"
                              >
                                ✕
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-stone-900"
                  rows={2}
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
                  Create Receipt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
