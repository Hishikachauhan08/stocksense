import React from 'react';
import { useInventory } from '../context/InventoryContext';
import {
  LayoutDashboard,
  Package,
  ArrowDownLeft,
  ArrowUpRight,
  Shuffle,
  AlertTriangle,
  History,
  Box,
  Settings,
  User,
  LogOut,
  Boxes,
  Users,
  ExternalLink,
} from 'lucide-react';
import { sound } from '../utils/audio';

interface SidebarProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  onOpenProfile: () => void;
  onOpenAuth: () => void;
  onOpenTour: () => void;
  onOpenStaffManagement: () => void;
  onGoToLanding: () => void;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  onOpenProfile,
  onOpenAuth,
  onOpenTour,
  onOpenStaffManagement,
  onGoToLanding,
  onLogout,
}) => {
  const { user, role, lowStockAlerts, receipts, deliveries, transfers } = useInventory();

  const pendingReceipts = receipts.filter((r) => r.status !== 'done' && r.status !== 'canceled').length;
  const pendingDeliveries = deliveries.filter((d) => d.status !== 'done' && d.status !== 'canceled').length;
  const scheduledTransfers = transfers.filter((t) => t.status !== 'done' && t.status !== 'canceled').length;

  const handleTabClick = (tabId: string) => {
    onSelectTab(tabId);
    sound.playBeep();
  };

  const isManager = role === 'inventory_manager';

  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'warehouse-3d',
      label: '3D Digital Twin',
      icon: Box,
      badge: 'LIVE 3D',
      badgeColor: 'bg-stone-100 text-stone-700 border border-stone-200',
    },
    {
      id: 'products',
      label: 'Products',
      icon: Package,
      badge: lowStockAlerts.length > 0 ? `${lowStockAlerts.length} Low` : null,
      badgeColor: 'bg-amber-100 text-amber-800 border border-amber-300 font-bold',
    },
  ];

  const operationsItems = [
    {
      id: 'receipts',
      label: 'Receipts',
      sublabel: 'Incoming Stock',
      icon: ArrowDownLeft,
      badge: pendingReceipts > 0 ? pendingReceipts : null,
      badgeColor: 'bg-emerald-50 text-emerald-800 border border-emerald-200',
    },
    {
      id: 'deliveries',
      label: 'Delivery Orders',
      sublabel: 'Outgoing Stock',
      icon: ArrowUpRight,
      badge: pendingDeliveries > 0 ? pendingDeliveries : null,
      badgeColor: 'bg-stone-100 text-stone-800 border border-stone-200',
    },
    {
      id: 'transfers',
      label: 'Internal Transfers',
      sublabel: 'Store → Rack',
      icon: Shuffle,
      badge: scheduledTransfers > 0 ? scheduledTransfers : null,
      badgeColor: 'bg-stone-100 text-stone-800 border border-stone-200',
    },
    {
      id: 'adjustments',
      label: 'Stock Adjustments',
      sublabel: 'Count & Damage',
      icon: AlertTriangle,
      badge: null,
    },
  ];

  const secondaryItems = [
    {
      id: 'ledger',
      label: 'Move History',
      sublabel: 'Stock Ledger',
      icon: History,
    },
    {
      id: 'settings',
      label: 'Settings',
      sublabel: 'Warehouses & Rules',
      icon: Settings,
    },
  ];

  return (
    <aside className="w-64 shrink-0 border-r border-stone-200/90 bg-white flex flex-col justify-between h-screen sticky top-0 select-none">
      {/* Brand Header */}
      <div>
        <div className="h-16 px-5 border-b border-stone-200/80 flex items-center justify-between">
          <button
            onClick={onGoToLanding}
            title="Return to StockSense Landing Page"
            className="flex items-center gap-2.5 text-left group transition-transform active:scale-95"
          >
            <div className="w-8 h-8 rounded-xl bg-stone-900 flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
              <Boxes className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-base font-extrabold tracking-tight text-stone-900">
                  StockSense
                </span>
                <span className="text-[9px] font-mono text-stone-600 font-bold uppercase px-1 py-0.2 rounded bg-stone-100 border border-stone-200">
                  IMS
                </span>
              </div>
              <span className="text-[10px] text-stone-400 group-hover:text-stone-900 flex items-center gap-0.5 transition-colors">
                <span>← Home Page</span>
              </span>
            </div>
          </button>
        </div>

        {/* Navigation Sections */}
        <div className="p-3 space-y-5 overflow-y-auto max-h-[calc(100vh-14rem)]">
          {/* Main Group */}
          <div className="space-y-1">
            <div className="px-3 pb-1 text-[11px] font-bold uppercase tracking-wider text-stone-400">
              Overview
            </div>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleTabClick(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all group ${
                    isActive
                      ? 'bg-stone-900 text-white shadow-sm'
                      : 'text-stone-600 hover:text-stone-950 hover:bg-stone-100'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-amber-400' : 'text-stone-400 group-hover:text-stone-800'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full ${isActive ? 'bg-stone-800 text-stone-200' : item.badgeColor}`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Operations Group (Core Process from PDF) */}
          <div className="space-y-1">
            <div className="px-3 pb-1 text-[11px] font-bold uppercase tracking-wider text-stone-400">
              Operations
            </div>
            {operationsItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleTabClick(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all group ${
                    isActive
                      ? 'bg-stone-900 text-white shadow-sm'
                      : 'text-stone-600 hover:text-stone-950 hover:bg-stone-100'
                  }`}
                >
                  <div className="flex items-center gap-2.5 text-left">
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-amber-400' : 'text-stone-400 group-hover:text-stone-800'}`} />
                    <div>
                      <div>{item.label}</div>
                      <div className={`text-[10px] font-normal ${isActive ? 'text-stone-300' : 'text-stone-400'}`}>
                        {item.sublabel}
                      </div>
                    </div>
                  </div>
                  {item.badge !== null && (
                    <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full ${isActive ? 'bg-stone-800 text-stone-200' : item.badgeColor}`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Audit & Governance Group */}
          <div className="space-y-1">
            <div className="px-3 pb-1 text-[11px] font-bold uppercase tracking-wider text-stone-400">
              Audit & Governance
            </div>
            {secondaryItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleTabClick(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all group ${
                    isActive
                      ? 'bg-stone-900 text-white shadow-sm'
                      : 'text-stone-600 hover:text-stone-950 hover:bg-stone-100'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-amber-400' : 'text-stone-400 group-hover:text-stone-800'}`} />
                    <div>
                      <div>{item.label}</div>
                      {item.sublabel && (
                        <div className={`text-[10px] font-normal ${isActive ? 'text-stone-300' : 'text-stone-400'}`}>
                          {item.sublabel}
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}

            {/* Manager-only Staff Provisioning Button */}
            {isManager && (
              <button
                onClick={() => {
                  sound.playBeep();
                  onOpenStaffManagement();
                }}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-amber-900 hover:text-stone-950 bg-amber-50 hover:bg-amber-100/80 border border-amber-200/80 transition-all group mt-2"
              >
                <div className="flex items-center gap-2.5">
                  <Users className="w-4 h-4 text-amber-700 group-hover:scale-110 transition-transform" />
                  <div className="text-left">
                    <div>Staff Accounts</div>
                    <div className="text-[10px] text-amber-700">Provision Users</div>
                  </div>
                </div>
                <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-200/70 text-amber-900">
                  MANAGER
                </span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Profile Menu (Left Sidebar - Specifically Requested in PDF page 2) */}
      <div className="p-3 border-t border-stone-200 bg-stone-50/70">
        <div className="p-2.5 rounded-2xl bg-white border border-stone-200 shadow-xs space-y-2">
          <div className="flex items-center gap-3">
            <img
              src={user.avatar}
              alt={user.name}
              className="w-9 h-9 rounded-xl object-cover ring-1 ring-stone-200"
            />
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold text-stone-900 truncate">{user.name}</div>
              <div className="text-[10px] text-stone-500 capitalize">
                {role === 'inventory_manager' ? 'Inventory Manager' : 'Warehouse Staff'}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-1.5 pt-1 border-t border-stone-100">
            <button
              onClick={onOpenProfile}
              className="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 hover:text-stone-900 text-[11px] font-medium transition-colors"
            >
              <User className="w-3.5 h-3.5" />
              <span>My Profile</span>
            </button>
            <button
              onClick={onLogout}
              className="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-stone-100 hover:bg-rose-50 text-stone-700 hover:text-rose-700 text-[11px] font-medium transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};
