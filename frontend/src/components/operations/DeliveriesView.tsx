import React, { useState } from 'react';
import { useInventory } from '../../context/InventoryContext';
import { DeliveryOrder, OperationItem } from '../../types/inventory';
import {
  ArrowUpRight,
  Plus,
  CheckCircle,
  PackageCheck,
  Printer,
  X,
  Truck,
  MapPin,
  Calendar,
} from 'lucide-react';
import { sound } from '../../utils/audio';

interface DeliveriesViewProps {
  onNavigateTab: (tab: string) => void;
}

export const DeliveriesView: React.FC<DeliveriesViewProps> = () => {
  const {
    deliveries,
    products,
    warehouses,
    createDelivery,
    updateDeliveryPicking,
    updateDeliveryPacking,
    validateDelivery,
    getLocationName,
  } = useInventory();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedDeliveryForSlip, setSelectedDeliveryForSlip] = useState<DeliveryOrder | null>(null);

  // Form states
  const [customer, setCustomer] = useState('Apex Modern Workspaces Inc.');
  const [warehouseId, setWarehouseId] = useState(warehouses[0]?.id || 'wh-main');
  const [sourceLocationId, setSourceLocationId] = useState(warehouses[0]?.locations[0]?.id || 'loc-main-bay-1');
  const [scheduledDate, setScheduledDate] = useState(new Date().toISOString().split('T')[0]);
  const [shippingAddress, setShippingAddress] = useState('400 Enterprise Way, Suite 200, Tech Park');
  const [notes, setNotes] = useState('Sales order customer fulfillment');

  // Line items
  const [items, setItems] = useState<OperationItem[]>([
    {
      productId: products[2]?.id || 'prod-office-chair',
      productName: products[2]?.name || 'Ergonomic Task Chairs (Mesh Pro)',
      sku: products[2]?.sku || 'CHR-ERG-01',
      unitOfMeasure: products[2]?.unitOfMeasure || 'units',
      demandQty: 10,
      doneQty: 10,
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
        demandQty: 5,
        doneQty: 5,
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

  const handleCreateDelivery = (e: React.FormEvent) => {
    e.preventDefault();
    createDelivery({
      customer,
      warehouseId,
      sourceLocationId,
      scheduledDate,
      shippingAddress,
      items,
      notes,
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
              Delivery Orders (Outgoing Goods)
            </h1>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-stone-100 text-stone-800 border border-stone-200">
              PDF STAGE 03
            </span>
          </div>
          <p className="text-xs sm:text-sm text-stone-500">
            Fulfill customer shipments with pick-and-pack workflow. Validating a delivery decreases inventory and produces printable dispatch slips.
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold shadow-xs transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <Plus className="w-4 h-4 text-amber-400" />
          <span>New Delivery Order</span>
        </button>
      </div>

      {/* Deliveries List */}
      <div className="space-y-4">
        {deliveries.map((d) => {
          const isDone = d.status === 'done';

          return (
            <div
              key={d.id}
              className="p-5 rounded-2xl bg-white border border-stone-200 shadow-xs hover:border-stone-400 transition-all space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-stone-100 border border-stone-200 flex items-center justify-center text-stone-800">
                    <ArrowUpRight className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-bold text-stone-950">
                        {d.referenceNumber}
                      </span>
                      {isDone ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          DONE (Dispatched)
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-50 text-amber-900 border border-amber-200">
                          PENDING DISPATCH
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-stone-500 mt-0.5">
                      Customer: <strong className="text-stone-800">{d.customer}</strong>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedDeliveryForSlip(d)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-medium transition-colors"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Packing Slip</span>
                  </button>

                  {!isDone && (
                    <button
                      onClick={() => validateDelivery(d.id)}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold shadow-xs transition-all hover:scale-[1.02]"
                    >
                      <CheckCircle className="w-3.5 h-3.5 text-amber-400" />
                      <span>Validate & Dispatch</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Picking & Packing Steps Bar (PDF Requirement) */}
              <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    disabled={isDone}
                    onClick={() => updateDeliveryPicking(d.id, !d.isPicked)}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-semibold transition-all ${
                      d.isPicked
                        ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                        : 'bg-white text-stone-600 border border-stone-200 hover:border-stone-400'
                    }`}
                  >
                    <PackageCheck className="w-3.5 h-3.5" />
                    <span>Step 1: {d.isPicked ? 'Picked' : 'Pick Items'}</span>
                  </button>

                  <button
                    type="button"
                    disabled={isDone || !d.isPicked}
                    onClick={() => updateDeliveryPacking(d.id, !d.isPacked)}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-semibold transition-all ${
                      d.isPacked
                        ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                        : 'bg-white text-stone-600 border border-stone-200 hover:border-stone-400 disabled:opacity-40'
                    }`}
                  >
                    <Truck className="w-3.5 h-3.5" />
                    <span>Step 2: {d.isPacked ? 'Packed' : 'Pack in Box'}</span>
                  </button>
                </div>

                <div className="text-[11px] text-stone-500 font-mono">
                  Origin: {getLocationName(d.sourceLocationId)}
                </div>
              </div>

              {/* Items Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-stone-50 text-stone-500 uppercase tracking-wider font-semibold">
                    <tr>
                      <th className="py-2 px-3">Product Name</th>
                      <th className="py-2 px-3">SKU</th>
                      <th className="py-2 px-3">Ordered Qty</th>
                      <th className="py-2 px-3">Dispatched Qty</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {d.items.map((it, idx) => (
                      <tr key={idx} className="hover:bg-stone-50/60">
                        <td className="py-2.5 px-3 font-semibold text-stone-900">{it.productName}</td>
                        <td className="py-2.5 px-3 font-mono text-stone-600">{it.sku}</td>
                        <td className="py-2.5 px-3 font-mono text-stone-700">
                          {it.demandQty} {it.unitOfMeasure}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-stone-900">
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
                    <span>Dispatch Date: {d.scheduledDate}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-stone-400" />
                    <span>Destination: {d.shippingAddress}</span>
                  </span>
                </div>
                {d.notes && <div>{d.notes}</div>}
              </div>
            </div>
          );
        })}
      </div>

      {/* Packing Slip Modal */}
      {selectedDeliveryForSlip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-lg bg-white border border-stone-200 rounded-3xl shadow-xl p-6 space-y-4 text-stone-900">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <div>
                <h3 className="text-base font-bold">StockSense Official Packing Slip</h3>
                <span className="font-mono text-xs text-stone-500">
                  Order Ref: {selectedDeliveryForSlip.referenceNumber}
                </span>
              </div>
              <button
                onClick={() => setSelectedDeliveryForSlip(null)}
                className="p-1 text-stone-400 hover:text-stone-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-stone-500">Customer:</span>
                <span className="font-semibold">{selectedDeliveryForSlip.customer}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Ship To Address:</span>
                <span>{selectedDeliveryForSlip.shippingAddress}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Dispatch Location:</span>
                <span>{getLocationName(selectedDeliveryForSlip.sourceLocationId)}</span>
              </div>
            </div>

            <div className="border border-stone-200 rounded-xl overflow-hidden text-xs">
              <table className="w-full text-left">
                <thead className="bg-stone-50 text-stone-600 font-semibold border-b border-stone-200">
                  <tr>
                    <th className="p-2">Item Description</th>
                    <th className="p-2">SKU</th>
                    <th className="p-2 text-right">Packed Qty</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {selectedDeliveryForSlip.items.map((it, i) => (
                    <tr key={i}>
                      <td className="p-2 font-medium">{it.productName}</td>
                      <td className="p-2 font-mono text-stone-500">{it.sku}</td>
                      <td className="p-2 text-right font-mono font-bold text-stone-900">
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
                Print Official Slip
              </button>
              <button
                onClick={() => setSelectedDeliveryForSlip(null)}
                className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Delivery Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-2xl bg-white border border-stone-200 rounded-3xl shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-stone-900">New Outgoing Delivery Order</h3>
                <p className="text-xs text-stone-500">Pick and ship inventory items to customer</p>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateDelivery} className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Customer Name *</label>
                  <input
                    type="text"
                    required
                    value={customer}
                    onChange={(e) => setCustomer(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-stone-900"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Scheduled Date</label>
                  <input
                    type="date"
                    required
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-stone-900"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Shipping Destination Address</label>
                <input
                  type="text"
                  required
                  value={shippingAddress}
                  onChange={(e) => setShippingAddress(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-stone-900"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Origin Facility</label>
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
                  <label className="block font-semibold text-stone-700 mb-1">Source Pick Bay / Rack</label>
                  <select
                    value={sourceLocationId}
                    onChange={(e) => setSourceLocationId(e.target.value)}
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
                  <span className="font-bold text-stone-800">Dispatch Order Items</span>
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
                        <th className="p-2">Ordered Qty</th>
                        <th className="p-2">Pack Qty</th>
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
                                  {p.name} ({p.sku} · Avail: {p.totalStock})
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
                <label className="block font-semibold text-stone-700 mb-1">Dispatch Notes</label>
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
                  Create Delivery Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
