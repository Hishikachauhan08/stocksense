import React, { useState, useMemo } from 'react';
import { useInventory } from '../../context/InventoryContext';
import { Warehouse3DCanvas } from './Warehouse3DCanvas';
import {
  Package,
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  Shuffle,
  Filter,
  Plus,
  Scan,
  RotateCcw,
  ExternalLink,
} from 'lucide-react';
import { sound } from '../../utils/audio';
import { OperationType, OperationStatus, Product } from '../../types/inventory';

interface DashboardViewProps {
  onNavigateTab: (tab: string) => void;
  onOpenScanner: () => void;
  onOpenTour: () => void;
  onSelectProduct?: (product: Product) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigateTab,
  onOpenScanner,
  onSelectProduct,
}) => {
  const {
    products,
    receipts,
    deliveries,
    transfers,
    adjustments,
    warehouses,
    kpis,
    lowStockAlerts,
    activeFilters,
    setActiveFilters,
    resetFilters,
    getLocationName,
    triggerQuickReorder,
  } = useInventory();

  // Dynamic Filters matching PDF requirements:
  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => set.add(p.category));
    return Array.from(set);
  }, [products]);

  // Combine all operations into a unified filtered list for the Dashboard Snapshot
  const unifiedOperations = useMemo(() => {
    const list: Array<{
      id: string;
      refNum: string;
      docType: OperationType;
      partnerOrInfo: string;
      warehouseId: string;
      destOrLoc: string;
      status: OperationStatus;
      date: string;
      itemsCount: number;
      category?: string;
    }> = [];

    // Receipts
    receipts.forEach((r) => {
      const primaryItem = r.items[0];
      const prod = products.find((p) => p.id === primaryItem?.productId);
      list.push({
        id: r.id,
        refNum: r.referenceNumber,
        docType: 'receipt',
        partnerOrInfo: `From: ${r.supplier}`,
        warehouseId: r.warehouseId,
        destOrLoc: getLocationName(r.destLocationId),
        status: r.status,
        date: r.scheduledDate,
        itemsCount: r.items.length,
        category: prod?.category,
      });
    });

    // Deliveries
    deliveries.forEach((d) => {
      const primaryItem = d.items[0];
      const prod = products.find((p) => p.id === primaryItem?.productId);
      list.push({
        id: d.id,
        refNum: d.referenceNumber,
        docType: 'delivery',
        partnerOrInfo: `To: ${d.customer}`,
        warehouseId: d.warehouseId,
        destOrLoc: getLocationName(d.sourceLocationId),
        status: d.status,
        date: d.scheduledDate,
        itemsCount: d.items.length,
        category: prod?.category,
      });
    });

    // Transfers
    transfers.forEach((t) => {
      const primaryItem = t.items[0];
      const prod = products.find((p) => p.id === primaryItem?.productId);
      list.push({
        id: t.id,
        refNum: t.referenceNumber,
        docType: 'internal',
        partnerOrInfo: `${getLocationName(t.sourceLocationId)} → ${getLocationName(t.destLocationId)}`,
        warehouseId: t.sourceWarehouseId,
        destOrLoc: getLocationName(t.destLocationId),
        status: t.status,
        date: t.scheduledDate,
        itemsCount: t.items.length,
        category: prod?.category,
      });
    });

    // Adjustments
    adjustments.forEach((a) => {
      const prod = products.find((p) => p.id === a.productId);
      list.push({
        id: a.id,
        refNum: a.referenceNumber,
        docType: 'adjustment',
        partnerOrInfo: `${a.productName} (${a.differenceQty > 0 ? '+' : ''}${a.differenceQty} ${a.unitOfMeasure})`,
        warehouseId: a.warehouseId,
        destOrLoc: getLocationName(a.locationId),
        status: a.status,
        date: a.createdAt.split('T')[0],
        itemsCount: 1,
        category: prod?.category,
      });
    });

    // Apply Dynamic Filters
    return list.filter((item) => {
      // Document type filter
      if (activeFilters.documentType !== 'all' && item.docType !== activeFilters.documentType) {
        return false;
      }
      // Status filter
      if (activeFilters.status !== 'all' && item.status !== activeFilters.status) {
        return false;
      }
      // Warehouse filter
      if (activeFilters.warehouseId !== 'all' && item.warehouseId !== activeFilters.warehouseId) {
        return false;
      }
      // Category filter
      if (activeFilters.category !== 'all' && item.category !== activeFilters.category) {
        return false;
      }
      // Search query
      if (activeFilters.searchQuery) {
        const query = activeFilters.searchQuery.toLowerCase();
        return (
          item.refNum.toLowerCase().includes(query) ||
          item.partnerOrInfo.toLowerCase().includes(query) ||
          item.destOrLoc.toLowerCase().includes(query)
        );
      }
      return true;
    });
  }, [receipts, deliveries, transfers, adjustments, products, activeFilters, getLocationName]);

  const handleFilterChange = (key: keyof typeof activeFilters, val: string) => {
    setActiveFilters((prev) => ({ ...prev, [key]: val }));
    sound.playBeep();
  };

  const getStatusBadge = (status: OperationStatus) => {
    switch (status) {
      case 'done':
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
            DONE
          </span>
        );
      case 'ready':
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-amber-50 text-amber-900 border border-amber-200">
            READY
          </span>
        );
      case 'waiting':
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-stone-100 text-stone-800 border border-stone-200">
            WAITING
          </span>
        );
      case 'draft':
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-stone-100 text-stone-500 border border-stone-200">
            DRAFT
          </span>
        );
      case 'canceled':
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-rose-50 text-rose-800 border border-rose-200">
            CANCELED
          </span>
        );
    }
  };

  const getDocTypeIcon = (type: OperationType) => {
    switch (type) {
      case 'receipt':
        return <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-700" />;
      case 'delivery':
        return <ArrowUpRight className="w-3.5 h-3.5 text-stone-700" />;
      case 'internal':
        return <Shuffle className="w-3.5 h-3.5 text-stone-700" />;
      case 'adjustment':
        return <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />;
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-7 max-w-7xl mx-auto text-stone-900">
      {/* Top Banner / Welcome & Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-stone-950">
              Inventory Operations Dashboard
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-stone-100 text-stone-800 border border-stone-200">
              REAL-TIME
            </span>
          </div>
          <p className="text-xs sm:text-sm text-stone-500">
            Centralized hub for receiving, picking, internal shelving, and stock adjustments across all warehouses.
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onNavigateTab('receipts')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-xs transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Receipt</span>
          </button>

          <button
            onClick={() => onNavigateTab('deliveries')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold shadow-xs transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Delivery</span>
          </button>

          <button
            onClick={() => onNavigateTab('transfers')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-xs transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Shuffle className="w-3.5 h-3.5" />
            <span>Transfer</span>
          </button>

          <button
            onClick={onOpenScanner}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-stone-100 text-stone-800 text-xs font-semibold border border-stone-200 shadow-xs transition-all"
          >
            <Scan className="w-3.5 h-3.5 text-stone-700" />
            <span>Scan SKU</span>
          </button>
        </div>
      </div>

      {/* Low Stock Alert Card (If any low stock exists) */}
      {lowStockAlerts.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in duration-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-800 shrink-0">
              <AlertTriangle className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-amber-950 flex items-center gap-2">
                <span>{lowStockAlerts.length} Products Below Minimum Threshold</span>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-amber-200/70 text-amber-900 font-bold">
                  Action Required
                </span>
              </h4>
              <p className="text-xs text-amber-800 mt-0.5">
                Items like <span className="font-mono font-bold text-amber-950">{lowStockAlerts[0]?.name}</span> are at or below minimum reorder thresholds.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => triggerQuickReorder(lowStockAlerts[0]?.productId)}
              className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs transition-all"
            >
              1-Click Reorder Top Item
            </button>
            <button
              onClick={() => onNavigateTab('products')}
              className="px-3 py-1.5 rounded-xl bg-white hover:bg-stone-50 text-stone-700 text-xs font-medium border border-amber-200 transition-colors"
            >
              View All Low Stock
            </button>
          </div>
        </div>
      )}

      {/* DASHBOARD KPIS (Exact 5 KPIs Required in PDF page 1) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* KPI 1: Total Products in Stock */}
        <div className="p-4 rounded-2xl bg-white border border-stone-200/90 hover:border-stone-400 transition-all shadow-xs group relative overflow-hidden">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-semibold">Total In Stock</span>
            <div className="w-8 h-8 rounded-lg bg-stone-100 text-stone-700 border border-stone-200 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-stone-900 font-mono tabular-nums tracking-tight">
            {kpis.totalUnitsInStock.toLocaleString()}
          </div>
          <div className="flex items-center justify-between text-[11px] text-stone-500 mt-1">
            <span>{kpis.totalProductsCount} Unique SKUs</span>
            <span className="text-stone-700 font-mono font-semibold">${(kpis.totalInventoryValuation / 1000).toFixed(1)}k Val</span>
          </div>
        </div>

        {/* KPI 2: Low Stock / Out of Stock Items */}
        <div className="p-4 rounded-2xl bg-white border border-stone-200/90 hover:border-stone-400 transition-all shadow-xs group relative overflow-hidden">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-semibold">Low / Out of Stock</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-amber-700 font-mono tabular-nums tracking-tight">
            {kpis.lowStockItemsCount + kpis.outOfStockItemsCount}
          </div>
          <div className="flex items-center justify-between text-[11px] text-stone-500 mt-1">
            <span className="text-rose-600">{kpis.outOfStockItemsCount} Empty</span>
            <span className="text-amber-700">{kpis.lowStockItemsCount} Below Min</span>
          </div>
        </div>

        {/* KPI 3: Pending Receipts */}
        <div className="p-4 rounded-2xl bg-white border border-stone-200/90 hover:border-stone-400 transition-all shadow-xs group relative overflow-hidden">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-semibold">Pending Receipts</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center justify-center">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-emerald-700 font-mono tabular-nums tracking-tight">
            {kpis.pendingReceiptsCount}
          </div>
          <div className="text-[11px] text-stone-500 mt-1">Incoming vendor goods</div>
        </div>

        {/* KPI 4: Pending Deliveries */}
        <div className="p-4 rounded-2xl bg-white border border-stone-200/90 hover:border-stone-400 transition-all shadow-xs group relative overflow-hidden">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-semibold">Pending Deliveries</span>
            <div className="w-8 h-8 rounded-lg bg-stone-100 text-stone-700 border border-stone-200 flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-stone-900 font-mono tabular-nums tracking-tight">
            {kpis.pendingDeliveriesCount}
          </div>
          <div className="text-[11px] text-stone-500 mt-1">Sales orders to dispatch</div>
        </div>

        {/* KPI 5: Internal Transfers Scheduled */}
        <div className="p-4 rounded-2xl bg-white border border-stone-200/90 hover:border-stone-400 transition-all shadow-xs group relative overflow-hidden col-span-2 md:col-span-1">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-semibold">Internal Transfers</span>
            <div className="w-8 h-8 rounded-lg bg-stone-100 text-stone-700 border border-stone-200 flex items-center justify-center">
              <Shuffle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-stone-900 font-mono tabular-nums tracking-tight">
            {kpis.internalTransfersScheduledCount}
          </div>
          <div className="text-[11px] text-stone-500 mt-1">Scheduled rack movements</div>
        </div>
      </div>

      {/* 3D Warehouse Digital Twin Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <h2 className="text-base font-bold text-stone-900">
              Warehouse Facility Layout (Interactive 3D Digital Twin)
            </h2>
          </div>
          <button
            onClick={() => onNavigateTab('warehouse-3d')}
            className="text-xs font-semibold text-stone-700 hover:text-stone-950 flex items-center gap-1 transition-colors"
          >
            <span>Full-Screen 3D Mode</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="rounded-3xl border border-stone-200 overflow-hidden shadow-xs bg-white">
          <Warehouse3DCanvas
            height="420px"
            onSelectProduct={(p) => {
              if (onSelectProduct) onSelectProduct(p);
            }}
          />
        </div>
      </div>

      {/* DYNAMIC FILTERS BAR (Exact Requirements from PDF page 1) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-stone-600" />
            <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider">
              Dynamic Operations Filter
            </h3>
            <span className="text-xs text-stone-500 font-mono">
              ({unifiedOperations.length} records matching)
            </span>
          </div>

          {(activeFilters.documentType !== 'all' ||
            activeFilters.status !== 'all' ||
            activeFilters.warehouseId !== 'all' ||
            activeFilters.category !== 'all' ||
            activeFilters.searchQuery) && (
            <button
              onClick={resetFilters}
              className="flex items-center gap-1 text-xs text-stone-600 hover:text-stone-900 font-medium"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Filters</span>
            </button>
          )}
        </div>

        {/* Filter Dropdowns Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
          {/* Filter 1: By Document Type */}
          <div>
            <label className="block text-[11px] font-semibold text-stone-500 mb-1.5 uppercase tracking-wider">
              Document Type
            </label>
            <select
              value={activeFilters.documentType}
              onChange={(e) => handleFilterChange('documentType', e.target.value)}
              className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-800 font-medium focus:outline-none focus:border-stone-400"
            >
              <option value="all">All Documents</option>
              <option value="receipt">Receipts (Incoming)</option>
              <option value="delivery">Delivery Orders (Outgoing)</option>
              <option value="internal">Internal Transfers</option>
              <option value="adjustment">Stock Adjustments</option>
            </select>
          </div>

          {/* Filter 2: By Status */}
          <div>
            <label className="block text-[11px] font-semibold text-stone-500 mb-1.5 uppercase tracking-wider">
              Status
            </label>
            <select
              value={activeFilters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-800 font-medium focus:outline-none focus:border-stone-400"
            >
              <option value="all">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="waiting">Waiting</option>
              <option value="ready">Ready</option>
              <option value="done">Done (Validated)</option>
              <option value="canceled">Canceled</option>
            </select>
          </div>

          {/* Filter 3: By Warehouse Facility */}
          <div>
            <label className="block text-[11px] font-semibold text-stone-500 mb-1.5 uppercase tracking-wider">
              Warehouse Facility
            </label>
            <select
              value={activeFilters.warehouseId}
              onChange={(e) => handleFilterChange('warehouseId', e.target.value)}
              className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-800 font-medium focus:outline-none focus:border-stone-400"
            >
              <option value="all">All Warehouses</option>
              {warehouses.map((wh) => (
                <option key={wh.id} value={wh.id}>
                  {wh.name}
                </option>
              ))}
            </select>
          </div>

          {/* Filter 4: By Product Category */}
          <div>
            <label className="block text-[11px] font-semibold text-stone-500 mb-1.5 uppercase tracking-wider">
              Product Category
            </label>
            <select
              value={activeFilters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-800 font-medium focus:outline-none focus:border-stone-400"
            >
              <option value="all">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Snapshot Table of Filtered Operations */}
        <div className="rounded-2xl border border-stone-200 bg-white overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 text-stone-600 border-b border-stone-200 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">Document Ref</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Entity / Details</th>
                  <th className="py-3 px-4">Facility & Location</th>
                  <th className="py-3 px-4">Scheduled Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {unifiedOperations.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-stone-500">
                      No operations match the selected dynamic filter criteria.
                    </td>
                  </tr>
                ) : (
                  unifiedOperations.slice(0, 8).map((op) => (
                    <tr
                      key={op.id}
                      className="hover:bg-stone-50 transition-colors group cursor-pointer"
                      onClick={() => {
                        if (op.docType === 'receipt') onNavigateTab('receipts');
                        else if (op.docType === 'delivery') onNavigateTab('deliveries');
                        else if (op.docType === 'internal') onNavigateTab('transfers');
                        else if (op.docType === 'adjustment') onNavigateTab('adjustments');
                      }}
                    >
                      <td className="py-3.5 px-4 font-mono font-bold text-stone-900">
                        {op.refNum}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          {getDocTypeIcon(op.docType)}
                          <span className="capitalize text-stone-700 font-medium">
                            {op.docType}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-stone-900 font-medium max-w-xs truncate">
                        {op.partnerOrInfo}
                      </td>
                      <td className="py-3.5 px-4 text-stone-500 text-[11px]">
                        {op.destOrLoc}
                      </td>
                      <td className="py-3.5 px-4 text-stone-500 font-mono text-[11px]">
                        {op.date}
                      </td>
                      <td className="py-3.5 px-4">{getStatusBadge(op.status)}</td>
                      <td className="py-3.5 px-4 text-right">
                        <span className="text-xs font-semibold text-stone-800 group-hover:text-stone-950 inline-flex items-center gap-1">
                          View
                          <span className="group-hover:translate-x-0.5 transition-transform">→</span>
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
