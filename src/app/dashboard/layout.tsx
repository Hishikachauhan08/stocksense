'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import {
  Boxes,
  LayoutDashboard,
  Package,
  FolderTree,
  Warehouse,
  ArrowDownToLine,
  ArrowUpFromLine,
  ArrowLeftRight,
  SlidersHorizontal,
  History,
  AlertTriangle,
  User,
  LogOut,
  ChevronDown,
  Menu,
  X,
} from 'lucide-react'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [operationsOpen, setOperationsOpen] = useState(true)

  const isCurrent = (path: string) => {
    if (path === '/dashboard') return pathname === '/dashboard'
    return pathname.startsWith(path)
  }

  const navClass = (path: string) =>
    `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
      isCurrent(path)
        ? 'bg-blue-600 text-white font-semibold'
        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
    }`

  return (
    <div className="min-h-screen flex bg-slate-900 text-slate-100">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-950 border-r border-slate-800">
        <div className="flex items-center gap-3 h-16 px-6 border-b border-slate-800">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-blue-600 text-white">
            <Boxes className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-white leading-tight">
              StockSense
            </h1>
            <p className="text-[10px] text-slate-400 font-mono">Odoo x GCET 2026</p>
          </div>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
          <Link href="/dashboard" className={navClass('/dashboard')}>
            <LayoutDashboard className="w-4 h-4" />
            Dashboard
          </Link>

          <Link href="/dashboard/products" className={navClass('/dashboard/products')}>
            <Package className="w-4 h-4" />
            Products
          </Link>

          <Link href="/dashboard/categories" className={navClass('/dashboard/categories')}>
            <FolderTree className="w-4 h-4" />
            Categories
          </Link>

          <Link href="/dashboard/warehouses" className={navClass('/dashboard/warehouses')}>
            <Warehouse className="w-4 h-4" />
            Warehouses & Locations
          </Link>

          {/* Operations Dropdown */}
          <div className="pt-2">
            <button
              onClick={() => setOperationsOpen(!operationsOpen)}
              className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-slate-400 tracking-wider uppercase hover:text-slate-200"
            >
              <span>Operations</span>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-200 ${
                  operationsOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {operationsOpen && (
              <div className="mt-1 pl-2 space-y-1 border-l-2 border-slate-800 ml-3">
                <Link href="/dashboard/receipts" className={navClass('/dashboard/receipts')}>
                  <ArrowDownToLine className="w-4 h-4 text-emerald-400" />
                  Receipts
                </Link>

                <Link href="/dashboard/deliveries" className={navClass('/dashboard/deliveries')}>
                  <ArrowUpFromLine className="w-4 h-4 text-amber-400" />
                  Delivery Orders
                </Link>

                <Link href="/dashboard/transfers" className={navClass('/dashboard/transfers')}>
                  <ArrowLeftRight className="w-4 h-4 text-indigo-400" />
                  Internal Transfers
                </Link>

                <Link href="/dashboard/adjustments" className={navClass('/dashboard/adjustments')}>
                  <SlidersHorizontal className="w-4 h-4 text-purple-400" />
                  Adjustments
                </Link>
              </div>
            )}
          </div>

          <div className="pt-2">
            <p className="px-3 py-1 text-xs font-semibold text-slate-400 tracking-wider uppercase">
              Management
            </p>
            <Link href="/dashboard/stock-ledger" className={navClass('/dashboard/stock-ledger')}>
              <History className="w-4 h-4" />
              Stock Ledger
            </Link>

            <Link href="/dashboard/reorder-rules" className={navClass('/dashboard/reorder-rules')}>
              <AlertTriangle className="w-4 h-4" />
              Reordering Rules
            </Link>
          </div>
        </nav>

        {/* User profile & logout footer */}
        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center justify-between">
            <Link
              href="/dashboard/profile"
              className="flex items-center gap-2.5 hover:text-blue-400 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 font-bold text-xs">
                {session?.user?.name ? session.user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="text-left overflow-hidden">
                <p className="text-xs font-semibold text-white truncate max-w-[110px]">
                  {session?.user?.name || 'Admin'}
                </p>
                <p className="text-[10px] text-slate-400 truncate max-w-[110px]">
                  {session?.user?.email || 'admin@stocksense.com'}
                </p>
              </div>
            </Link>

            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              title="Sign Out"
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-900">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between h-14 px-4 bg-slate-950 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Boxes className="w-6 h-6 text-blue-500" />
            <span className="font-bold text-sm text-white">StockSense</span>
          </div>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 text-slate-400 hover:text-white"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </header>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-slate-950 border-b border-slate-800 px-4 py-3 space-y-1">
            <Link
              href="/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className={navClass('/dashboard')}
            >
              <LayoutDashboard className="w-4 h-4" /> Dashboard
            </Link>
            <Link
              href="/dashboard/products"
              onClick={() => setMobileMenuOpen(false)}
              className={navClass('/dashboard/products')}
            >
              <Package className="w-4 h-4" /> Products
            </Link>
            <Link
              href="/dashboard/receipts"
              onClick={() => setMobileMenuOpen(false)}
              className={navClass('/dashboard/receipts')}
            >
              <ArrowDownToLine className="w-4 h-4" /> Receipts
            </Link>
            <Link
              href="/dashboard/deliveries"
              onClick={() => setMobileMenuOpen(false)}
              className={navClass('/dashboard/deliveries')}
            >
              <ArrowUpFromLine className="w-4 h-4" /> Delivery Orders
            </Link>
            <Link
              href="/dashboard/transfers"
              onClick={() => setMobileMenuOpen(false)}
              className={navClass('/dashboard/transfers')}
            >
              <ArrowLeftRight className="w-4 h-4" /> Internal Transfers
            </Link>
            <Link
              href="/dashboard/adjustments"
              onClick={() => setMobileMenuOpen(false)}
              className={navClass('/dashboard/adjustments')}
            >
              <SlidersHorizontal className="w-4 h-4" /> Adjustments
            </Link>
            <Link
              href="/dashboard/stock-ledger"
              onClick={() => setMobileMenuOpen(false)}
              className={navClass('/dashboard/stock-ledger')}
            >
              <History className="w-4 h-4" /> Stock Ledger
            </Link>
            <Link
              href="/dashboard/warehouses"
              onClick={() => setMobileMenuOpen(false)}
              className={navClass('/dashboard/warehouses')}
            >
              <Warehouse className="w-4 h-4" /> Warehouses
            </Link>
            <Link
              href="/dashboard/reorder-rules"
              onClick={() => setMobileMenuOpen(false)}
              className={navClass('/dashboard/reorder-rules')}
            >
              <AlertTriangle className="w-4 h-4" /> Reorder Rules
            </Link>
            <div className="pt-2 border-t border-slate-800">
              <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="w-full flex items-center gap-2 px-3 py-2 text-rose-400 text-sm"
              >
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            </div>
          </div>
        )}

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  )
}
