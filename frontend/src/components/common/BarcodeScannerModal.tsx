import React, { useState, useEffect } from 'react';
import { useInventory } from '../../context/InventoryContext';
import { sound } from '../../utils/audio';
import { Scan, X, CheckCircle, Search, ArrowDownLeft, ArrowUpRight, Shuffle, AlertCircle } from 'lucide-react';
import { Product } from '../../types/inventory';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectProductAction?: (product: Product, actionType: 'receipt' | 'delivery' | 'transfer' | 'adjustment') => void;
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  onSelectProductAction,
}) => {
  const { products, getLocationName } = useInventory();
  const [searchTerm, setSearchTerm] = useState('');
  const [scannedProduct, setScannedProduct] = useState<Product | null>(null);
  const [isScanning, setIsScanning] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setIsScanning(true);
      setScannedProduct(null);
      setSearchTerm('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSimulateScan = (product: Product) => {
    sound.playScan();
    setScannedProduct(product);
    setIsScanning(false);
  };

  const handleAction = (type: 'receipt' | 'delivery' | 'transfer' | 'adjustment') => {
    if (scannedProduct && onSelectProductAction) {
      onSelectProductAction(scannedProduct, type);
      onClose();
    }
  };

  const filtered = products.filter(
    (p) =>
      p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white border border-stone-200 rounded-3xl shadow-2xl overflow-hidden flex flex-col text-stone-900">
        {/* Terminal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 bg-stone-50/70">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-800">
              <Scan className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
                Warehouse Optical Scanner
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold">
                  Ready
                </span>
              </h3>
              <p className="text-xs text-stone-500">Point scanner at SKU / Barcode label</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-stone-700 rounded-xl hover:bg-stone-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewfinder / Scanner Area */}
        <div className="p-6 space-y-5">
          {/* Laser Viewfinder Simulator */}
          <div className="relative h-44 rounded-2xl bg-stone-950 flex flex-col items-center justify-center overflow-hidden border border-stone-800 shadow-inner group">
            {/* Viewfinder corner guides */}
            <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-emerald-400" />
            <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-emerald-400" />
            <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-emerald-400" />
            <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-emerald-400" />

            {/* Red / Emerald Laser Aim Line */}
            <div
              className={`absolute w-full h-[2px] shadow-[0_0_12px_#10b981] ${
                isScanning ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
              }`}
              style={{
                top: isScanning ? '50%' : '50%',
                transition: 'top 0.5s ease-in-out',
              }}
            />

            {scannedProduct ? (
              <div className="z-10 text-center space-y-1 p-3 bg-stone-900/90 rounded-xl border border-emerald-500/40 backdrop-blur-md animate-in zoom-in-95">
                <CheckCircle className="w-6 h-6 text-emerald-400 mx-auto" />
                <div className="font-mono text-sm font-bold text-white tracking-widest">
                  {scannedProduct.sku}
                </div>
                <div className="text-xs text-stone-300">{scannedProduct.name}</div>
              </div>
            ) : (
              <div className="z-10 text-center space-y-1">
                <div className="text-xs font-mono text-stone-400 tracking-wider uppercase">
                  Laser Target Active
                </div>
                <div className="text-[11px] text-stone-500">
                  Select a test SKU below to simulate instant optical scan
                </div>
              </div>
            )}
          </div>

          {/* Action Trigger Buttons for Scanned SKU */}
          {scannedProduct && (
            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-3 animate-in fade-in duration-150">
              <div className="flex items-center justify-between text-xs pb-2 border-b border-stone-200">
                <span className="font-semibold text-stone-800">Choose Operation for this Item:</span>
                <span className="font-mono font-bold text-stone-900">
                  Stock: {scannedProduct.totalStock} {scannedProduct.unitOfMeasure}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  onClick={() => handleAction('receipt')}
                  className="flex items-center gap-2 p-2.5 rounded-xl bg-white hover:bg-stone-100 border border-stone-200 text-stone-800 transition-colors"
                >
                  <ArrowDownLeft className="w-4 h-4 text-emerald-700" />
                  <span>Receive Intake</span>
                </button>

                <button
                  onClick={() => handleAction('delivery')}
                  className="flex items-center gap-2 p-2.5 rounded-xl bg-white hover:bg-stone-100 border border-stone-200 text-stone-800 transition-colors"
                >
                  <ArrowUpRight className="w-4 h-4 text-stone-700" />
                  <span>Pick & Dispatch</span>
                </button>

                <button
                  onClick={() => handleAction('transfer')}
                  className="flex items-center gap-2 p-2.5 rounded-xl bg-white hover:bg-stone-100 border border-stone-200 text-stone-800 transition-colors"
                >
                  <Shuffle className="w-4 h-4 text-stone-700" />
                  <span>Move Bay Location</span>
                </button>

                <button
                  onClick={() => handleAction('adjustment')}
                  className="flex items-center gap-2 p-2.5 rounded-xl bg-white hover:bg-stone-100 border border-stone-200 text-stone-800 transition-colors"
                >
                  <AlertCircle className="w-4 h-4 text-amber-700" />
                  <span>Reconcile Count</span>
                </button>
              </div>
            </div>
          )}

          {/* Quick SKU Click-to-Scan Simulator List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-stone-700">Quick Test SKUs (Click to Scan):</span>
              <span className="text-[10px] text-stone-400">{filtered.length} available</span>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Filter test SKUs..."
                className="w-full pl-8 pr-3 py-1.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:border-stone-400 font-mono"
              />
            </div>

            <div className="max-h-36 overflow-y-auto space-y-1 pt-1">
              {filtered.map((p) => (
                <button
                  key={p.id}
                  onClick={() => handleSimulateScan(p)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-stone-50 hover:bg-stone-100 border border-stone-200/80 text-left transition-colors text-xs group"
                >
                  <div>
                    <span className="font-mono font-bold text-stone-900 mr-2">{p.sku}</span>
                    <span className="text-stone-600 truncate">{p.name}</span>
                  </div>
                  <span className="font-mono text-[11px] text-stone-500">
                    {p.totalStock} {p.unitOfMeasure}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
