import React from 'react';
import { useInventory } from '../../context/InventoryContext';
import { Conveyor3DVisual } from './Conveyor3DVisual';
import {
  Boxes,
  ArrowRight,
  Sparkles,
  Box,
  ShieldCheck,
  CheckCircle2,
  Building2,
  Activity,
  Zap,
  ArrowDownLeft,
  ArrowUpRight,
  Shuffle,
  AlertTriangle,
  Lock,
  Layers,
  Check,
} from 'lucide-react';
import { sound } from '../../utils/audio';

interface LandingPageProps {
  onEnterApp: () => void;
  onOpenAuth: () => void;
  onOpenTour: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onEnterApp,
  onOpenAuth,
  onOpenTour,
}) => {
  const { publicSummary } = useInventory();

  const handleEnter = () => {
    sound.playSuccess();
    onEnterApp();
  };

  return (
    <div className="min-h-screen bg-[#fafaf9] text-stone-900 flex flex-col font-sans selection:bg-stone-900 selection:text-white">
      {/* Subtle Warm Ambient Lighting */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[20%] w-[600px] h-[600px] rounded-full bg-amber-100/40 blur-[130px]" />
        <div className="absolute top-[35%] right-[-5%] w-[500px] h-[500px] rounded-full bg-stone-200/50 blur-[140px]" />
      </div>

      {/* Top Navbar */}
      <header className="sticky top-0 z-40 w-full border-b border-stone-200/80 bg-white/90 backdrop-blur-xl px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-stone-900 flex items-center justify-center shadow-sm">
            <Boxes className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-lg font-extrabold tracking-tight text-stone-950">
                StockSense
              </span>
              <span className="text-[10px] font-mono text-stone-600 font-bold uppercase px-1.5 py-0.5 rounded bg-stone-100 border border-stone-200">
                IMS 3D
              </span>
            </div>
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-7 text-xs font-semibold text-stone-600">
          <a href="#conveyor" className="hover:text-stone-950 transition-colors">3D Conveyor Live</a>
          <a href="#modules" className="hover:text-stone-950 transition-colors">Core Modules</a>
          <a href="#flow" className="hover:text-stone-950 transition-colors">Operations Flow</a>
          <a href="#security" className="hover:text-stone-950 transition-colors">Access Governance</a>
        </nav>

        <div className="flex items-center gap-3">
          <button
            onClick={onOpenAuth}
            className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-stone-700 hover:text-stone-950 hover:bg-stone-100 border border-stone-200 transition-colors"
          >
            Staff Login
          </button>

          <button
            onClick={handleEnter}
            className="flex items-center gap-2 px-4 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <span>Enter System</span>
            <ArrowRight className="w-3.5 h-3.5 text-stone-300" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 relative z-10">
        {/* HERO SECTION */}
        <section className="pt-12 pb-14 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto text-center space-y-7">
          {/* Eyebrow Tag */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-stone-100 border border-stone-200/90 text-stone-700 text-xs font-medium">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span>Modern Inventory Management Dashboard · High-Fidelity Logistics</span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-6xl font-extrabold text-stone-950 tracking-tight leading-[1.1] max-w-4xl mx-auto">
            Spatial Logistics &{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-600 to-stone-900">
              Modular Inventory Flow
            </span>{' '}
            Orchestration
          </h1>

          {/* Subtitle */}
          <p className="text-sm sm:text-base text-stone-600 max-w-2xl mx-auto leading-relaxed">
            Real-time warehouse orchestration. Automate vendor receipts, pick-and-pack delivery dispatches, bay transfers, and count discrepancy reconciliation with continuous 3D digital twin tracking.
          </p>

          {/* Primary Call to Actions */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={handleEnter}
              className="flex items-center gap-2.5 px-8 py-3.5 rounded-2xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-sm shadow-md transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>Enter Inventory Dashboard</span>
              <ArrowRight className="w-4 h-4 text-amber-400" />
            </button>

            <button
              onClick={onOpenTour}
              className="flex items-center gap-2 px-5 py-3.5 rounded-2xl bg-white hover:bg-stone-50 border border-stone-200 text-stone-700 text-sm font-semibold shadow-sm transition-all hover:scale-[1.01]"
            >
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span>Simulate PDF 4-Step Flow</span>
            </button>
          </div>

          {/* Telemetry Stats Strip */}
          <div className="pt-4 grid grid-cols-2 md:grid-cols-4 gap-3 max-w-4xl mx-auto text-left">
            <div className="p-4 rounded-2xl bg-white border border-stone-200/90 shadow-sm">
              <div className="flex items-center justify-between text-[11px] font-semibold text-stone-500 uppercase">
                <span>Conveyor Velocity</span>
                <Zap className="w-3.5 h-3.5 text-amber-600" />
              </div>
              <div className="text-2xl font-black font-mono text-stone-900 mt-1">
                142 <span className="text-xs font-normal text-stone-500">items/min</span>
              </div>
              <div className="text-[10px] text-stone-500 font-mono mt-0.5">
                Active sortation rate
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-stone-200/90 shadow-sm">
              <div className="flex items-center justify-between text-[11px] font-semibold text-stone-500 uppercase">
                <span>Stock Units</span>
                <Box className="w-3.5 h-3.5 text-stone-700" />
              </div>
              <div className="text-2xl font-black font-mono text-stone-900 mt-1">
                {publicSummary.totalUnitsInStock.toLocaleString()}
              </div>
              <div className="text-[10px] text-emerald-700 font-mono mt-0.5">
                {publicSummary.totalProductsCount} SKUs monitored
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-stone-200/90 shadow-sm">
              <div className="flex items-center justify-between text-[11px] font-semibold text-stone-500 uppercase">
                <span>Facilities Online</span>
                <Building2 className="w-3.5 h-3.5 text-stone-700" />
              </div>
              <div className="text-2xl font-black font-mono text-stone-900 mt-1">
                {publicSummary.warehousesCount} Warehouses
              </div>
              <div className="text-[10px] text-stone-500 font-mono mt-0.5">
                Main Store & Production
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-stone-200/90 shadow-sm">
              <div className="flex items-center justify-between text-[11px] font-semibold text-stone-500 uppercase">
                <span>Stock Ledger Sync</span>
                <Activity className="w-3.5 h-3.5 text-emerald-600" />
              </div>
              <div className="text-2xl font-black font-mono text-emerald-700 mt-1">
                100.0%
              </div>
              <div className="text-[10px] text-stone-500 font-mono mt-0.5">
                Zero inventory drift
              </div>
            </div>
          </div>

          {/* 3D CONVEYOR SHOWCASE */}
          <div id="conveyor" className="pt-6">
            <Conveyor3DVisual height="480px" />
          </div>
        </section>

        {/* OPERATIONS LIFECYCLE (Matching the exact PDF 4-step example) */}
        <section id="flow" className="py-14 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto border-t border-stone-200 space-y-8">
          <div className="text-center space-y-2">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-700">
              PDF Operational Flow
            </span>
            <h2 className="text-3xl font-extrabold text-stone-950">
              End-to-End Stock Movement Lifecycle
            </h2>
            <p className="text-sm text-stone-600 max-w-lg mx-auto">
              How material moves through the physical and digital ledger from vendor intake to customer delivery.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Step 1 */}
            <div className="p-5 rounded-2xl bg-white border border-stone-200 hover:border-stone-400 shadow-sm transition-all space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-stone-500">STAGE 01</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-medium">
                  +100 kg
                </span>
              </div>
              <h3 className="text-base font-bold text-stone-900">Receive Goods from Vendor</h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                Vendor delivers 100 kg Steel Rods. Receipt is created and validated. Stock automatically increments in Main Store.
              </p>
              <div className="text-[11px] font-mono text-stone-500 pt-1 border-t border-stone-100">
                Doc: REC-2026-001
              </div>
            </div>

            {/* Step 2 */}
            <div className="p-5 rounded-2xl bg-white border border-stone-200 hover:border-stone-400 shadow-sm transition-all space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-stone-500">STAGE 02</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-stone-100 text-stone-800 border border-stone-200 font-medium">
                  Rebalance
                </span>
              </div>
              <h3 className="text-base font-bold text-stone-900">Move to Production Rack</h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                Internal transfer moves 30 kg from Main Store to Production Rack. Total stock remains unchanged, location balances updated.
              </p>
              <div className="text-[11px] font-mono text-stone-500 pt-1 border-t border-stone-100">
                Doc: TRF-2026-001
              </div>
            </div>

            {/* Step 3 */}
            <div className="p-5 rounded-2xl bg-white border border-stone-200 hover:border-stone-400 shadow-sm transition-all space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-stone-500">STAGE 03</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-stone-100 text-stone-800 border border-stone-200 font-medium">
                  -20 frames
                </span>
              </div>
              <h3 className="text-base font-bold text-stone-900">Deliver Finished Goods</h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                Sales order picked and packed. Validating delivery decreases 20 units of Steel Frames from inventory and creates dispatch slip.
              </p>
              <div className="text-[11px] font-mono text-stone-500 pt-1 border-t border-stone-100">
                Doc: DEL-2026-002
              </div>
            </div>

            {/* Step 4 */}
            <div className="p-5 rounded-2xl bg-white border border-stone-200 hover:border-stone-400 shadow-sm transition-all space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-stone-500">STAGE 04</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 font-medium">
                  -3 kg Scrap
                </span>
              </div>
              <h3 className="text-base font-bold text-stone-900">Adjust Damaged Items</h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                Physical count finds 3 kg damaged steel rods. Reconciliation adjustment writes down stock and stamps reason in Stock Ledger.
              </p>
              <div className="text-[11px] font-mono text-stone-500 pt-1 border-t border-stone-100">
                Doc: ADJ-2026-001
              </div>
            </div>
          </div>
        </section>

        {/* FACILITY SHOWCASE & LOGISTICS IMAGE */}
        <section id="modules" className="py-14 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto border-t border-stone-200">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div className="space-y-4">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-700">
                Modern Warehouse Architecture
              </span>
              <h2 className="text-3xl font-extrabold text-stone-950 leading-tight">
                Designed for High-Throughput Spatial Operations
              </h2>
              <p className="text-sm text-stone-600 leading-relaxed">
                From high-bay cantilever racks to automated sorting conveyors, StockSense provides complete digital visibility. Track stock per shelf, bay, and warehouse with zero discrepancies.
              </p>
              <ul className="space-y-2.5 pt-2 text-xs text-stone-700">
                <li className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                    <Check className="w-2.5 h-2.5" />
                  </div>
                  <span>Multi-Warehouse support with independent location zones</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                    <Check className="w-2.5 h-2.5" />
                  </div>
                  <span>Instant optical barcode scanning & SKU omni-search</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                    <Check className="w-2.5 h-2.5" />
                  </div>
                  <span>Low stock threshold alerts with one-click reorder generation</span>
                </li>
              </ul>
            </div>

            <div className="relative rounded-3xl overflow-hidden border border-stone-200 shadow-md">
              <img
                src="/images/hero-warehouse.jpg"
                alt="Automated High-Bay Warehouse Facility"
                className="w-full h-80 object-cover object-center"
              />
              <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-stone-200 text-[11px] font-mono text-stone-700 shadow-sm">
                Main Facility · High-Bay Automated Logistics
              </div>
            </div>
          </div>
        </section>

        {/* SECURITY & PROVISIONING GOVERNANCE SECTION */}
        <section id="security" className="py-14 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto border-t border-stone-200">
          <div className="p-8 rounded-3xl bg-white border border-stone-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="space-y-4 max-w-xl">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-amber-600" />
                <span className="text-xs font-mono font-bold uppercase text-amber-700 tracking-wider">
                  Access Governance
                </span>
              </div>
              <h3 className="text-2xl font-extrabold text-stone-950">
                Manager-Only Operator Provisioning
              </h3>
              <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                To guarantee strict custody controls, <strong className="text-stone-900">only the Inventory Manager can create accounts for warehouse staff and managers</strong>.
              </p>
              <div className="space-y-2 text-xs text-stone-600">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Managers issue temporary credentials with warehouse facility assignments.</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Warehouse staff log in with these credentials and can update their password and profile anytime!</span>
                </div>
              </div>
            </div>

            {/* Test Credentials Card */}
            <div className="p-5 rounded-2xl bg-stone-50 border border-stone-200 text-xs font-mono space-y-3 w-full md:w-80 shrink-0 shadow-sm">
              <div className="text-stone-500 text-[11px] border-b border-stone-200 pb-2 flex justify-between font-bold">
                <span>PRE-SEEDED PROFILES</span>
                <span className="text-emerald-700">READY</span>
              </div>
              <div className="space-y-1">
                <div className="text-stone-900 font-bold">1. Inventory Manager</div>
                <div className="text-stone-600 text-[11px]">m.vance@stocksense.io</div>
                <div className="text-amber-800 text-[11px]">Pass: manager123</div>
              </div>
              <div className="pt-2 border-t border-stone-200 space-y-1">
                <div className="text-stone-900 font-bold">2. Warehouse Staff (Elena)</div>
                <div className="text-stone-600 text-[11px]">elena.r@stocksense.io</div>
                <div className="text-stone-700 text-[11px]">Pass: warehouse123</div>
              </div>
            </div>
          </div>
        </section>

        {/* BOTTOM CALL TO ACTION */}
        <section className="py-16 px-4 text-center space-y-5 bg-gradient-to-b from-transparent to-stone-100/60 border-t border-stone-200">
          <h2 className="text-3xl font-extrabold text-stone-950">
            Ready to Take Control of Your Warehouse?
          </h2>
          <p className="text-sm text-stone-600 max-w-md mx-auto">
            Experience the complete modular IMS with real-time receipts, deliveries, transfers, and 3D conveyor flow.
          </p>
          <div className="pt-2">
            <button
              onClick={handleEnter}
              className="inline-flex items-center gap-2.5 px-8 py-3.5 rounded-2xl bg-stone-900 hover:bg-stone-800 text-white font-extrabold text-sm shadow-md transition-all hover:scale-[1.03] active:scale-[0.97]"
            >
              <span>Enter System Now</span>
              <ArrowRight className="w-4 h-4 text-amber-400" />
            </button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-stone-200 bg-white px-6 py-6 text-center text-xs text-stone-500 flex flex-col sm:flex-row items-center justify-between gap-4 max-w-6xl mx-auto w-full">
        <div className="flex items-center gap-2 font-bold text-stone-800">
          <Boxes className="w-4 h-4 text-amber-600" />
          <span>StockSense Modular Inventory System</span>
        </div>
        <div>
          <span>© 2026 StockSense Operations. All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
};
