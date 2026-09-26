'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  Truck,
  ArrowLeftRight,
  Scale,
  History,
  Warehouse,
  LogOut,
  Boxes,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { cn } from '@/lib/utils';

const nav = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/products', label: 'Products', icon: Package },
  { type: 'label', label: 'Operations' },
  { href: '/receipts', label: 'Receipts', icon: Truck },
  { href: '/deliveries', label: 'Deliveries', icon: Boxes },
  { href: '/transfers', label: 'Transfers', icon: ArrowLeftRight },
  { href: '/adjustments', label: 'Adjustments', icon: Scale },
  { href: '/moves', label: 'Move History', icon: History },
  { type: 'label', label: 'Settings' },
  { href: '/warehouses', label: 'Warehouses', icon: Warehouse },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <aside className="w-64 bg-dark-900 border-r border-slate-800 flex flex-col fixed h-full z-40">
      <div className="p-5 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center">
            <Package className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-bold text-lg">StockSense</h2>
            <p className="text-xs text-slate-500">IMS</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {nav.map((item, i) => {
          if (item.type === 'label') {
            return (
              <p
                key={i}
                className="px-4 pt-4 pb-1 text-xs font-semibold text-slate-500 uppercase tracking-wider"
              >
                {item.label}
              </p>
            );
          }
          const Icon = item.icon!;
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href!}
              className={cn(
                'sidebar-item w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium',
                active ? 'active text-white' : 'text-slate-400'
              )}
            >
              <Icon className="w-5 h-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-full bg-brand-600 flex items-center justify-center text-sm font-bold">
            {(user?.full_name || user?.username || 'U')[0].toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.full_name || user?.username}</p>
            <p className="text-xs text-slate-500 truncate">{user?.role}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 py-2.5 text-sm text-slate-400 hover:text-red-400 transition rounded-lg hover:bg-red-500/10"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>
    </aside>
  );
}
