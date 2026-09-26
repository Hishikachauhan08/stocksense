import React, { useState } from 'react';
import { useInventory } from '../context/InventoryContext';
import {
  Search,
  Scan,
  Bell,
  Volume2,
  VolumeX,
  Sparkles,
  Building2,
  ChevronDown,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';
import { sound } from '../utils/audio';

interface NavbarProps {
  onOpenSearch: () => void;
  onOpenScanner: () => void;
  onOpenTour: () => void;
  onOpenProfile: () => void;
  onOpenAuth: () => void;
  onNavigateTab: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenSearch,
  onOpenScanner,
  onOpenTour,
  onOpenProfile,
  onNavigateTab,
}) => {
  const {
    user,
    role,
    warehouses,
    activeFilters,
    setActiveFilters,
    lowStockAlerts,
    soundEnabled,
    setSoundEnabled,
    triggerQuickReorder,
  } = useInventory();

  const [showAlertMenu, setShowAlertMenu] = useState(false);

  const handleWarehouseChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setActiveFilters((prev) => ({ ...prev, warehouseId: e.target.value }));
    sound.playBeep();
  };

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    if (next) sound.playBeep();
  };

  return (
    <header className="sticky top-0 z-40 h-16 w-full border-b border-stone-200/90 bg-white/95 backdrop-blur-md px-4 lg:px-8 flex items-center justify-between gap-4">
      {/* Left: Quick Search Bar */}
      <div className="flex-1 max-w-md">
        <button
          onClick={onOpenSearch}
          className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl bg-stone-100/90 hover:bg-stone-200/70 border border-stone-200 text-stone-500 hover:text-stone-900 transition-all text-xs group"
        >
          <div className="flex items-center gap-2.5">
            <Search className="w-4 h-4 text-stone-400 group-hover:text-stone-800 transition-colors" />
            <span>Search SKU, product, document #...</span>
          </div>
          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5 text-[10px] font-mono text-stone-500 bg-white border border-stone-200 rounded-md shadow-2xs">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Middle/Right: Actions & Controls */}
      <div className="flex items-center gap-2.5">
        {/* PDF Guided Flow Demo button */}
        <button
          onClick={onOpenTour}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100/80 border border-amber-200 text-amber-900 text-xs font-semibold shadow-xs transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-700" />
          <span className="hidden sm:inline">PDF Flow Demo</span>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-200/70 text-amber-900 font-bold">
            4-Steps
          </span>
        </button>

        {/* Optical Barcode Scanner Button */}
        <button
          onClick={onOpenScanner}
          title="Open Warehouse Barcode Scanner"
          aria-label="Open Optical Barcode Scanner"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 border border-stone-200 text-stone-700 text-xs font-medium transition-colors"
        >
          <Scan className="w-3.5 h-3.5 text-emerald-700" />
          <span className="hidden md:inline">Scanner</span>
        </button>

        {/* Multi-Warehouse Selector (PDF Requirement) */}
        <div className="relative hidden lg:flex items-center">
          <Building2 className="w-3.5 h-3.5 text-stone-500 absolute left-2.5 pointer-events-none" />
          <select
            value={activeFilters.warehouseId}
            onChange={handleWarehouseChange}
            aria-label="Filter by Warehouse"
            className="pl-8 pr-7 py-1.5 bg-stone-100 hover:bg-stone-200/70 border border-stone-200 rounded-xl text-xs text-stone-800 font-medium focus:outline-none focus:border-stone-400 transition-colors appearance-none cursor-pointer"
          >
            <option value="all">All Warehouses (Global)</option>
            {warehouses.map((wh) => (
              <option key={wh.id} value={wh.id}>
                {wh.name}
              </option>
            ))}
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-stone-500 absolute right-2 pointer-events-none" />
        </div>

        {/* Sound FX Toggle */}
        <button
          onClick={toggleSound}
          title={soundEnabled ? 'Disable UI Audio feedback' : 'Enable UI Audio feedback'}
          aria-label="Toggle UI Audio feedback"
          className="p-2 rounded-xl bg-stone-100 hover:bg-stone-200 border border-stone-200 text-stone-600 transition-colors"
        >
          {soundEnabled ? (
            <Volume2 className="w-4 h-4 text-stone-800" />
          ) : (
            <VolumeX className="w-4 h-4 text-stone-400" />
          )}
        </button>

        {/* Low Stock Alerts Notification Bell */}
        <div className="relative">
          <button
            onClick={() => setShowAlertMenu(!showAlertMenu)}
            title="Low Stock Alerts"
            aria-label="Low Stock Alerts"
            className="p-2 rounded-xl bg-stone-100 hover:bg-stone-200 border border-stone-200 text-stone-700 transition-colors relative"
          >
            <Bell className="w-4 h-4" />
            {lowStockAlerts.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-600 text-white font-mono text-[9px] font-bold flex items-center justify-center shadow-xs">
                {lowStockAlerts.length}
              </span>
            )}
          </button>

          {/* Low Stock Alert Dropdown Menu */}
          {showAlertMenu && (
            <div className="absolute right-0 mt-2 w-80 bg-white border border-stone-200 rounded-2xl shadow-xl p-4 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span className="text-xs font-bold text-stone-900 uppercase tracking-wider">
                    Low Stock Alerts ({lowStockAlerts.length})
                  </span>
                </div>
                <button
                  onClick={() => setShowAlertMenu(false)}
                  className="text-xs text-stone-400 hover:text-stone-700"
                >
                  ✕
                </button>
              </div>

              <div className="py-2 space-y-2 max-h-64 overflow-y-auto">
                {lowStockAlerts.length === 0 ? (
                  <div className="py-4 text-center text-xs text-stone-500">
                    All inventory levels are healthy!
                  </div>
                ) : (
                  lowStockAlerts.map((item) => (
                    <div
                      key={item.productId}
                      className="p-2.5 rounded-xl bg-stone-50 border border-stone-200 hover:border-amber-400 transition-colors text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[11px] font-bold text-stone-800">
                          {item.sku}
                        </span>
                        <span
                          className={`font-semibold font-mono text-[11px] ${
                            item.currentStock === 0 ? 'text-rose-600' : 'text-amber-700'
                          }`}
                        >
                          {item.currentStock} / {item.minQuantity} {item.unitOfMeasure}
                        </span>
                      </div>
                      <div className="text-stone-900 font-medium truncate mt-0.5">{item.name}</div>
                      <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-stone-200">
                        <span className="text-[10px] text-stone-500">
                          Reorder Rec: +{item.recommendedReorder}
                        </span>
                        <button
                          onClick={() => {
                            triggerQuickReorder(item.productId);
                            setShowAlertMenu(false);
                          }}
                          className="px-2 py-0.5 rounded bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-semibold transition-colors"
                        >
                          1-Click Reorder
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {lowStockAlerts.length > 0 && (
                <button
                  onClick={() => {
                    onNavigateTab('products');
                    setShowAlertMenu(false);
                  }}
                  className="w-full mt-2 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-xs font-semibold text-white flex items-center justify-center gap-1.5 transition-colors"
                >
                  <span>Manage All Reorder Rules</span>
                  <ArrowRight className="w-3 h-3 text-amber-400" />
                </button>
              )}
            </div>
          )}
        </div>

        <div className="w-px h-6 bg-stone-200 mx-1" />

        {/* User Role Pill & Avatar */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenProfile}
            title={role === 'inventory_manager' ? 'Signed in as Inventory Manager' : 'Signed in as Warehouse Staff'}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-all border shadow-2xs"
            style={{
              backgroundColor: role === 'inventory_manager' ? '#fef3c7' : '#f4f4f5',
              borderColor: role === 'inventory_manager' ? '#fde68a' : '#e4e4e7',
              color: role === 'inventory_manager' ? '#92400e' : '#27272a',
            }}
          >
            {role === 'inventory_manager' ? (
              <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
            ) : (
              <UserCheck className="w-3.5 h-3.5 text-stone-700" />
            )}
            <span>{role === 'inventory_manager' ? 'Manager' : 'Staff'}</span>
          </button>

          {/* Avatar Menu */}
          <button
            onClick={onOpenProfile}
            title="My Profile & Settings"
            className="flex items-center gap-2 p-1 rounded-xl hover:bg-stone-100 transition-colors group"
          >
            <img
              src={user.avatar}
              alt={user.name}
              className="w-8 h-8 rounded-xl object-cover ring-1 ring-stone-200 group-hover:ring-stone-400 transition-all"
            />
          </button>
        </div>
      </div>
    </header>
  );
};
