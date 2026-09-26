import React, { useState, useEffect, useRef } from 'react';
import { useInventory } from '../../context/InventoryContext';
import { Search, X, Package, FileText, CornerDownLeft, ArrowRight } from 'lucide-react';
import { Product } from '../../types/inventory';

interface OmniSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectProduct?: (product: Product) => void;
  onNavigateTab?: (tab: string) => void;
}

export const OmniSearchModal: React.FC<OmniSearchModalProps> = ({
  isOpen,
  onClose,
  onSelectProduct,
  onNavigateTab,
}) => {
  const { products, receipts, deliveries, transfers, getLocationName } = useInventory();
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const q = query.trim().toLowerCase();

  const matchedProducts = products.filter(
    (p) =>
      p.sku.toLowerCase().includes(q) ||
      p.name.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q)
  );

  const matchedReceipts = receipts.filter(
    (r) =>
      r.referenceNumber.toLowerCase().includes(q) ||
      r.supplier.toLowerCase().includes(q) ||
      r.items.some((it) => it.productName.toLowerCase().includes(q) || it.sku.toLowerCase().includes(q))
  );

  const matchedDeliveries = deliveries.filter(
    (d) =>
      d.referenceNumber.toLowerCase().includes(q) ||
      d.customer.toLowerCase().includes(q) ||
      d.items.some((it) => it.productName.toLowerCase().includes(q) || it.sku.toLowerCase().includes(q))
  );

  const matchedTransfers = transfers.filter(
    (t) =>
      t.referenceNumber.toLowerCase().includes(q) ||
      t.items.some((it) => it.productName.toLowerCase().includes(q) || it.sku.toLowerCase().includes(q))
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-stone-900/40 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl bg-white border border-stone-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[75vh] text-stone-900">
        {/* Search Bar Input */}
        <div className="flex items-center px-4 py-3.5 border-b border-stone-100 bg-stone-50/70">
          <Search className="w-5 h-5 text-stone-400 shrink-0 mr-3" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Quick search SKUs, product names, document numbers, suppliers..."
            className="w-full bg-transparent text-sm text-stone-900 placeholder-stone-400 focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 text-stone-400 hover:text-stone-700 mr-1"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5 text-[10px] font-mono text-stone-500 bg-white border border-stone-200 rounded">
            ESC
          </kbd>
        </div>

        {/* Results Area */}
        <div className="p-4 overflow-y-auto space-y-4 text-xs">
          {/* Products Result Section */}
          {matchedProducts.length > 0 && (
            <div className="space-y-1.5">
              <div className="text-[11px] font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1.5 px-2">
                <Package className="w-3.5 h-3.5" />
                <span>Products ({matchedProducts.length})</span>
              </div>
              <div className="space-y-1">
                {matchedProducts.slice(0, 5).map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      if (onSelectProduct) onSelectProduct(p);
                      onClose();
                    }}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-stone-50 transition-colors text-left border border-transparent hover:border-stone-200 group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg bg-stone-100 flex items-center justify-center text-stone-700">
                        <Package className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-semibold text-stone-900">{p.name}</div>
                        <div className="text-[10px] font-mono text-stone-500">
                          {p.sku} · {p.category}
                        </div>
                      </div>
                    </div>
                    <div className="text-right flex items-center gap-3">
                      <div>
                        <div className="font-mono font-bold text-stone-900">
                          {p.totalStock} {p.unitOfMeasure}
                        </div>
                        <div className="text-[10px] text-stone-500">
                          {p.locationStocks.length} locations
                        </div>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-stone-400 group-hover:text-stone-900 transition-colors" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Operations / Document Section */}
          {(matchedReceipts.length > 0 || matchedDeliveries.length > 0 || matchedTransfers.length > 0) && (
            <div className="space-y-1.5 pt-2 border-t border-stone-100">
              <div className="text-[11px] font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1.5 px-2">
                <FileText className="w-3.5 h-3.5" />
                <span>Documents & Operations</span>
              </div>
              <div className="space-y-1">
                {matchedReceipts.slice(0, 3).map((r) => (
                  <button
                    key={r.id}
                    onClick={() => {
                      if (onNavigateTab) onNavigateTab('receipts');
                      onClose();
                    }}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-stone-50 transition-colors text-left border border-transparent hover:border-stone-200"
                  >
                    <div>
                      <div className="font-mono font-bold text-stone-900">{r.referenceNumber}</div>
                      <div className="text-[10px] text-stone-500">
                        Receipt from {r.supplier} · {getLocationName(r.destLocationId)}
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-50 text-emerald-800 border border-emerald-200">
                      {r.status.toUpperCase()}
                    </span>
                  </button>
                ))}

                {matchedDeliveries.slice(0, 3).map((d) => (
                  <button
                    key={d.id}
                    onClick={() => {
                      if (onNavigateTab) onNavigateTab('deliveries');
                      onClose();
                    }}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-stone-50 transition-colors text-left border border-transparent hover:border-stone-200"
                  >
                    <div>
                      <div className="font-mono font-bold text-stone-900">{d.referenceNumber}</div>
                      <div className="text-[10px] text-stone-500">
                        Delivery to {d.customer}
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-stone-100 text-stone-700 border border-stone-200">
                      {d.status.toUpperCase()}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {matchedProducts.length === 0 &&
            matchedReceipts.length === 0 &&
            matchedDeliveries.length === 0 && (
              <div className="py-8 text-center text-stone-400">
                No inventory records match "{query}"
              </div>
            )}
        </div>

        {/* Keyboard hints footer */}
        <div className="px-4 py-2 bg-stone-50 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-500">
          <div className="flex items-center gap-2">
            <span>Press</span>
            <kbd className="px-1.5 py-0.5 rounded bg-white border border-stone-200 font-mono text-[10px]">
              ↵
            </kbd>
            <span>to open</span>
          </div>
          <div>Global SKU & Ledger Navigator</div>
        </div>
      </div>
    </div>
  );
};
