import React, { useState, useMemo } from 'react';
import { useInventory } from '../../context/InventoryContext';
import { Product, UnitOfMeasure } from '../../types/inventory';
import {
  Package,
  Plus,
  Search,
  AlertTriangle,
  Edit2,
  Trash2,
  MapPin,
  Barcode,
  Layers,
  CheckCircle,
  X,
} from 'lucide-react';
import { sound } from '../../utils/audio';

interface ProductsViewProps {
  onNavigateTab: (tab: string) => void;
  selectedProductToOpen?: Product | null;
}

export const ProductsView: React.FC<ProductsViewProps> = ({
  onNavigateTab,
  selectedProductToOpen,
}) => {
  const {
    products,
    warehouses,
    addProduct,
    updateProduct,
    deleteProduct,
    getLocationName,
    triggerQuickReorder,
    role,
  } = useInventory();

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [filterStockStatus, setFilterStockStatus] = useState<'all' | 'low' | 'out'>('all');

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [viewingLocationStock, setViewingLocationStock] = useState<Product | null>(null);
  const [barcodeModalProduct, setBarcodeModalProduct] = useState<Product | null>(null);

  // Form states for Create/Edit
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    category: 'Raw Materials',
    unitOfMeasure: 'units' as UnitOfMeasure,
    price: 50,
    cost: 30,
    description: '',
    minQuantity: 20,
    maxQuantity: 100,
    reorderQuantity: 50,
    autoReorderEnabled: true,
    initialStockWarehouseId: warehouses[0]?.id || 'wh-main',
    initialStockLocationId: warehouses[0]?.locations[0]?.id || 'loc-main-rack-a',
    initialQuantity: 50,
  });

  // Extract unique categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => set.add(p.category));
    return Array.from(set);
  }, [products]);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchSearch =
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.category.toLowerCase().includes(searchTerm.toLowerCase());

      const matchCategory = selectedCategory === 'all' || p.category === selectedCategory;

      let matchStock = true;
      if (filterStockStatus === 'low') {
        matchStock = p.totalStock <= p.reorderingRule.minQuantity && p.totalStock > 0;
      } else if (filterStockStatus === 'out') {
        matchStock = p.totalStock === 0;
      }

      return matchSearch && matchCategory && matchStock;
    });
  }, [products, searchTerm, selectedCategory, filterStockStatus]);

  const handleOpenCreateModal = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      sku: `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
      category: 'Metals & Steel',
      unitOfMeasure: 'kg',
      price: 65,
      cost: 40,
      description: '',
      minQuantity: 25,
      maxQuantity: 200,
      reorderQuantity: 80,
      autoReorderEnabled: true,
      initialStockWarehouseId: warehouses[0]?.id || 'wh-main',
      initialStockLocationId: warehouses[0]?.locations[0]?.id || 'loc-main-rack-a',
      initialQuantity: 100,
    });
    setIsCreateModalOpen(true);
  };

  const handleOpenEditModal = (p: Product) => {
    setEditingProduct(p);
    setFormData({
      name: p.name,
      sku: p.sku,
      category: p.category,
      unitOfMeasure: p.unitOfMeasure as UnitOfMeasure,
      price: p.price,
      cost: p.cost,
      description: p.description || '',
      minQuantity: p.reorderingRule.minQuantity,
      maxQuantity: p.reorderingRule.maxQuantity,
      reorderQuantity: p.reorderingRule.reorderQuantity,
      autoReorderEnabled: p.reorderingRule.autoReorderEnabled,
      initialStockWarehouseId: warehouses[0]?.id || 'wh-main',
      initialStockLocationId: warehouses[0]?.locations[0]?.id || 'loc-main-rack-a',
      initialQuantity: 0,
    });
    setIsCreateModalOpen(true);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingProduct) {
      updateProduct(editingProduct.id, {
        name: formData.name,
        sku: formData.sku,
        category: formData.category,
        unitOfMeasure: formData.unitOfMeasure,
        price: Number(formData.price),
        cost: Number(formData.cost),
        description: formData.description,
        reorderingRule: {
          minQuantity: Number(formData.minQuantity),
          maxQuantity: Number(formData.maxQuantity),
          reorderQuantity: Number(formData.reorderQuantity),
          autoReorderEnabled: formData.autoReorderEnabled,
        },
      });
    } else {
      addProduct({
        name: formData.name,
        sku: formData.sku,
        category: formData.category,
        unitOfMeasure: formData.unitOfMeasure,
        price: Number(formData.price),
        cost: Number(formData.cost),
        description: formData.description,
        reorderingRule: {
          minQuantity: Number(formData.minQuantity),
          maxQuantity: Number(formData.maxQuantity),
          reorderQuantity: Number(formData.reorderQuantity),
          autoReorderEnabled: formData.autoReorderEnabled,
        },
        locationStocks: [],
        initialLocationStocks:
          formData.initialQuantity > 0
            ? [
                {
                  warehouseId: formData.initialStockWarehouseId,
                  locationId: formData.initialStockLocationId,
                  quantity: Number(formData.initialQuantity),
                },
              ]
            : [],
      });
    }

    setIsCreateModalOpen(false);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto text-stone-900">
      {/* Header & New Product Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-extrabold text-stone-950 tracking-tight">Product Catalog</h1>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-stone-100 text-stone-700 border border-stone-200">
              {products.length} Products
            </span>
          </div>
          <p className="text-xs sm:text-sm text-stone-500">
            Manage SKUs, categories, units of measure, reorder thresholds, and per-location inventory.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleOpenCreateModal}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold shadow-xs transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="w-4 h-4 text-amber-400" />
            <span>Create Product</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Strip */}
      <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:max-w-xs">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by SKU, name..."
            className="w-full pl-9 pr-3 py-1.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:border-stone-400"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-1.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-800 focus:outline-none focus:border-stone-400"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          {/* Stock Level Filter */}
          <select
            value={filterStockStatus}
            onChange={(e) => setFilterStockStatus(e.target.value as 'all' | 'low' | 'out')}
            className="px-3 py-1.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-800 focus:outline-none focus:border-stone-400"
          >
            <option value="all">All Stock Levels</option>
            <option value="low">Low Stock (≤ Min)</option>
            <option value="out">Out of Stock (0)</option>
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="rounded-2xl border border-stone-200 bg-white overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 text-stone-600 border-b border-stone-200 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3.5 px-4">SKU / Code</th>
                <th className="py-3.5 px-4">Product Name</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Total Stock</th>
                <th className="py-3.5 px-4">Reordering Rule</th>
                <th className="py-3.5 px-4">Per Location</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-stone-500">
                    No products found matching your search.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const isLow = p.totalStock <= p.reorderingRule.minQuantity && p.totalStock > 0;
                  const isOut = p.totalStock === 0;

                  return (
                    <tr key={p.id} className="hover:bg-stone-50 transition-colors group">
                      {/* SKU */}
                      <td className="py-3.5 px-4 font-mono font-bold text-stone-900">
                        <div className="flex items-center gap-2">
                          <span>{p.sku}</span>
                          <button
                            onClick={() => setBarcodeModalProduct(p)}
                            title="Generate Barcode"
                            className="p-1 text-stone-400 hover:text-stone-800 rounded hover:bg-stone-100 transition-colors"
                          >
                            <Barcode className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>

                      {/* Product Name */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-stone-900 group-hover:text-stone-950">
                          {p.name}
                        </div>
                        {p.description && (
                          <div className="text-[11px] text-stone-500 truncate max-w-xs mt-0.5">
                            {p.description}
                          </div>
                        )}
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-stone-100 text-stone-700 border border-stone-200">
                          {p.category}
                        </span>
                      </td>

                      {/* Total Stock */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-mono text-sm font-bold tabular-nums ${
                              isOut
                                ? 'text-rose-600'
                                : isLow
                                ? 'text-amber-700'
                                : 'text-emerald-700'
                            }`}
                          >
                            {p.totalStock} {p.unitOfMeasure}
                          </span>
                          {isOut ? (
                            <span className="text-[9px] uppercase font-mono px-1.5 py-0.5 rounded bg-rose-50 text-rose-800 border border-rose-200">
                              Out
                            </span>
                          ) : isLow ? (
                            <span className="text-[9px] uppercase font-mono px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                              Low
                            </span>
                          ) : null}
                        </div>
                      </td>

                      {/* Reordering Rules */}
                      <td className="py-3.5 px-4 font-mono text-[11px] text-stone-500">
                        <div>Min: {p.reorderingRule.minQuantity} | Max: {p.reorderingRule.maxQuantity}</div>
                        <div className="text-[10px] text-stone-400">Reorder Batch: +{p.reorderingRule.reorderQuantity}</div>
                      </td>

                      {/* Per Location Breakdown Button */}
                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => setViewingLocationStock(p)}
                          className="flex items-center gap-1 text-[11px] text-stone-700 hover:text-stone-950 font-medium px-2 py-1 rounded bg-stone-100 hover:bg-stone-200 transition-colors"
                        >
                          <MapPin className="w-3 h-3 text-stone-500" />
                          <span>{p.locationStocks.length} Locations</span>
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {isLow && (
                            <button
                              onClick={() => triggerQuickReorder(p.id)}
                              title="Generate 1-Click Reorder"
                              className="px-2 py-1 rounded bg-amber-100 hover:bg-amber-200 text-amber-900 text-[10px] font-semibold transition-colors"
                            >
                              Reorder
                            </button>
                          )}
                          <button
                            onClick={() => handleOpenEditModal(p)}
                            title="Edit Product"
                            className="p-1.5 text-stone-400 hover:text-stone-800 rounded hover:bg-stone-100 transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Delete ${p.name}?`)) deleteProduct(p.id);
                            }}
                            title="Delete Product"
                            className="p-1.5 text-stone-400 hover:text-rose-600 rounded hover:bg-stone-100 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Per Location Stock Modal */}
      {viewingLocationStock && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-md bg-white border border-stone-200 rounded-3xl shadow-xl overflow-hidden text-stone-900">
            <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-stone-900">Per-Location Stock Breakdown</h3>
                <p className="text-xs text-stone-500 font-mono">{viewingLocationStock.name}</p>
              </div>
              <button
                onClick={() => setViewingLocationStock(null)}
                className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-3">
              {viewingLocationStock.locationStocks.map((ls, idx) => {
                const wh = warehouses.find((w) => w.id === ls.warehouseId);
                return (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-stone-50 border border-stone-200 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-semibold text-stone-900">{getLocationName(ls.locationId)}</div>
                      <div className="text-[10px] text-stone-500">{wh?.name || ls.warehouseId}</div>
                    </div>
                    <span className="font-mono font-bold text-sm text-stone-900">
                      {ls.quantity} {viewingLocationStock.unitOfMeasure}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Barcode Viewer Modal */}
      {barcodeModalProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-sm bg-white border border-stone-200 rounded-3xl shadow-xl overflow-hidden text-center p-6 space-y-4">
            <button
              onClick={() => setBarcodeModalProduct(null)}
              className="absolute top-4 right-4 text-stone-400 hover:text-stone-700"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="pt-2">
              <h3 className="text-base font-bold text-stone-900">{barcodeModalProduct.name}</h3>
              <p className="text-xs text-stone-500 font-mono">SKU: {barcodeModalProduct.sku}</p>
            </div>

            {/* Simulated Code-128 Barcode Graphic */}
            <div className="p-4 bg-white rounded-2xl border border-stone-200 flex flex-col items-center justify-center space-y-2">
              <div className="flex items-center gap-0.5 h-16 w-full justify-center">
                {Array.from({ length: 48 }).map((_, i) => (
                  <div
                    key={i}
                    className="bg-stone-900 h-full"
                    style={{
                      width: `${(i % 3) + 1.5}px`,
                      opacity: (i * 7) % 5 === 0 ? 0.3 : 1,
                    }}
                  />
                ))}
              </div>
              <div className="font-mono text-xs tracking-widest text-stone-800 font-bold">
                *{barcodeModalProduct.sku}*
              </div>
            </div>

            <button
              onClick={() => {
                window.print();
              }}
              className="w-full py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-semibold shadow-xs"
            >
              Print Label Slip
            </button>
          </div>
        </div>
      )}

      {/* Create / Edit Product Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-2xl bg-white border border-stone-200 rounded-3xl shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-stone-900">
                  {editingProduct ? 'Edit Product Details' : 'Create New Inventory Product'}
                </h3>
                <p className="text-xs text-stone-500">
                  Configure SKU, unit of measure, initial warehouse location, and reorder rules
                </p>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Product Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Industrial Steel Rods (10mm)"
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 focus:outline-none focus:border-stone-400"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">SKU Code *</label>
                  <input
                    type="text"
                    required
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    placeholder="STL-100-ROD"
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl font-mono text-stone-900 focus:outline-none focus:border-stone-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 focus:outline-none focus:border-stone-400"
                  >
                    <option value="Raw Materials">Raw Materials</option>
                    <option value="Finished Goods">Finished Goods</option>
                    <option value="Metals & Steel">Metals & Steel</option>
                    <option value="Fasteners & Hardware">Fasteners & Hardware</option>
                    <option value="Electronics">Electronics</option>
                    <option value="Furniture">Furniture</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Unit of Measure</label>
                  <select
                    value={formData.unitOfMeasure}
                    onChange={(e) => setFormData({ ...formData, unitOfMeasure: e.target.value as UnitOfMeasure })}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 focus:outline-none focus:border-stone-400"
                  >
                    <option value="kg">kg (Kilograms)</option>
                    <option value="units">units</option>
                    <option value="meters">meters</option>
                    <option value="liters">liters</option>
                    <option value="boxes">boxes</option>
                    <option value="pcs">pcs</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Unit Cost ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.cost}
                    onChange={(e) => setFormData({ ...formData, cost: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 focus:outline-none focus:border-stone-400"
                  />
                </div>
              </div>

              {/* Reordering Rules Section */}
              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-3">
                <div className="font-bold text-stone-900 flex items-center justify-between">
                  <span>Reordering Rules & Thresholds (PDF Requirement)</span>
                  <label className="flex items-center gap-1.5 text-[11px] font-normal cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.autoReorderEnabled}
                      onChange={(e) => setFormData({ ...formData, autoReorderEnabled: e.target.checked })}
                      className="rounded border-stone-300 text-stone-900"
                    />
                    <span>Auto-Reorder Alerts</span>
                  </label>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] text-stone-500 mb-1">Min Threshold</label>
                    <input
                      type="number"
                      value={formData.minQuantity}
                      onChange={(e) => setFormData({ ...formData, minQuantity: Number(e.target.value) })}
                      className="w-full px-3 py-1.5 bg-white border border-stone-200 rounded-xl font-mono text-stone-900"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-stone-500 mb-1">Max Ceiling</label>
                    <input
                      type="number"
                      value={formData.maxQuantity}
                      onChange={(e) => setFormData({ ...formData, maxQuantity: Number(e.target.value) })}
                      className="w-full px-3 py-1.5 bg-white border border-stone-200 rounded-xl font-mono text-stone-900"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-stone-500 mb-1">Reorder Batch</label>
                    <input
                      type="number"
                      value={formData.reorderQuantity}
                      onChange={(e) => setFormData({ ...formData, reorderQuantity: Number(e.target.value) })}
                      className="w-full px-3 py-1.5 bg-white border border-stone-200 rounded-xl font-mono text-stone-900"
                    />
                  </div>
                </div>
              </div>

              {/* Initial Stock (Only for new products) */}
              {!editingProduct && (
                <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-3">
                  <div className="font-bold text-stone-900">Initial Stock Allocation</div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] text-stone-500 mb-1">Facility</label>
                      <select
                        value={formData.initialStockWarehouseId}
                        onChange={(e) => setFormData({ ...formData, initialStockWarehouseId: e.target.value })}
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
                      <label className="block text-[11px] text-stone-500 mb-1">Location Bay</label>
                      <select
                        value={formData.initialStockLocationId}
                        onChange={(e) => setFormData({ ...formData, initialStockLocationId: e.target.value })}
                        className="w-full px-3 py-1.5 bg-white border border-stone-200 rounded-xl text-stone-900"
                      >
                        {warehouses
                          .find((w) => w.id === formData.initialStockWarehouseId)
                          ?.locations.map((loc) => (
                            <option key={loc.id} value={loc.id}>
                              {loc.name}
                            </option>
                          ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] text-stone-500 mb-1">Initial Qty</label>
                      <input
                        type="number"
                        value={formData.initialQuantity}
                        onChange={(e) => setFormData({ ...formData, initialQuantity: Number(e.target.value) })}
                        className="w-full px-3 py-1.5 bg-white border border-stone-200 rounded-xl font-mono text-stone-900"
                      />
                    </div>
                  </div>
                </div>
              )}

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
                  {editingProduct ? 'Save Changes' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
