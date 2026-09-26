import React, { useState, useMemo } from 'react';
import { useInventory } from '../../context/InventoryContext';
import { OperationType } from '../../types/inventory';
import {
  Download,
  Search,
  ArrowDownLeft,
  ArrowUpRight,
  Shuffle,
  AlertTriangle,
} from 'lucide-react';
import { sound } from '../../utils/audio';

export const MoveHistoryView: React.FC = () => {
  const { moveHistory } = useInventory();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');

  const filteredMoves = useMemo(() => {
    return moveHistory.filter((m) => {
      const matchSearch =
        m.referenceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.fromLocation.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.toLocation.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (m.notes && m.notes.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchType = selectedType === 'all' || m.operationType === selectedType;

      return matchSearch && matchType;
    });
  }, [moveHistory, searchQuery, selectedType]);

  const handleExportCSV = () => {
    sound.playSuccess();
    const headers = [
      'Timestamp',
      'Reference Number',
      'Operation Type',
      'SKU',
      'Product Name',
      'From Location',
      'To Location',
      'Quantity Change',
      'Unit',
      'Performed By',
      'Notes',
    ];

    const rows = filteredMoves.map((m) => [
      `"${m.timestamp}"`,
      `"${m.referenceNumber}"`,
      `"${m.operationType}"`,
      `"${m.sku}"`,
      `"${m.productName}"`,
      `"${m.fromLocation}"`,
      `"${m.toLocation}"`,
      m.quantity,
      `"${m.unitOfMeasure}"`,
      `"${m.performedBy}"`,
      `"${m.notes || ''}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `StockSense_Ledger_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getBadgeForType = (type: OperationType) => {
    switch (type) {
      case 'receipt':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <ArrowDownLeft className="w-3 h-3 text-emerald-700" />
            RECEIPT
          </span>
        );
      case 'delivery':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-stone-100 text-stone-800 border border-stone-200">
            <ArrowUpRight className="w-3 h-3 text-stone-700" />
            DELIVERY
          </span>
        );
      case 'internal':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-stone-100 text-stone-800 border border-stone-200">
            <Shuffle className="w-3 h-3 text-stone-700" />
            TRANSFER
          </span>
        );
      case 'adjustment':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-50 text-amber-900 border border-amber-200">
            <AlertTriangle className="w-3 h-3 text-amber-700" />
            ADJUSTMENT
          </span>
        );
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto text-stone-900">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-extrabold text-stone-950 tracking-tight">
              Move History (Stock Ledger)
            </h1>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-stone-100 text-stone-800 border border-stone-200">
              AUDIT TRAIL
            </span>
          </div>
          <p className="text-xs sm:text-sm text-stone-500">
            Immutable audit record of every receipt, delivery dispatch, bay transfer, and adjustment transaction.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-stone-50 text-stone-700 border border-stone-200 shadow-xs text-xs font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <Download className="w-4 h-4 text-stone-600" />
          <span>Export Ledger CSV</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:max-w-xs">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by doc #, SKU, location..."
            className="w-full pl-9 pr-3 py-1.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:border-stone-400"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-3 py-1.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-800 focus:outline-none focus:border-stone-400"
          >
            <option value="all">All Movement Types</option>
            <option value="receipt">Receipts (Incoming)</option>
            <option value="delivery">Deliveries (Outgoing)</option>
            <option value="internal">Transfers (Internal)</option>
            <option value="adjustment">Adjustments (Counts & Loss)</option>
          </select>
        </div>
      </div>

      {/* Audit Ledger Table */}
      <div className="rounded-2xl border border-stone-200 bg-white overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 text-stone-600 border-b border-stone-200 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">Date / Time</th>
                <th className="py-3 px-4">Doc Number</th>
                <th className="py-3 px-4">Operation</th>
                <th className="py-3 px-4">Product & SKU</th>
                <th className="py-3 px-4">From Location</th>
                <th className="py-3 px-4">To Location</th>
                <th className="py-3 px-4 text-right">Qty Impact</th>
                <th className="py-3 px-4">Operator</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredMoves.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-stone-500">
                    No movement records found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredMoves.map((m) => {
                  const isPositive = m.quantity > 0;
                  const isZero = m.quantity === 0;

                  return (
                    <tr key={m.id} className="hover:bg-stone-50 transition-colors">
                      <td className="py-3.5 px-4 font-mono text-[11px] text-stone-500">
                        {new Date(m.timestamp).toLocaleDateString()} {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-stone-900">
                        {m.referenceNumber}
                      </td>
                      <td className="py-3.5 px-4">{getBadgeForType(m.operationType)}</td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-stone-900">{m.productName}</div>
                        <div className="font-mono text-[10px] text-stone-500">{m.sku}</div>
                      </td>
                      <td className="py-3.5 px-4 text-stone-600 text-[11px]">
                        {m.fromLocation}
                      </td>
                      <td className="py-3.5 px-4 text-stone-600 text-[11px]">
                        {m.toLocation}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold">
                        <span
                          className={
                            isZero
                              ? 'text-stone-500'
                              : isPositive
                              ? 'text-emerald-700'
                              : 'text-rose-600'
                          }
                        >
                          {isPositive ? `+${m.quantity}` : m.quantity} {m.unitOfMeasure}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-stone-600 text-[11px]">
                        {m.performedBy}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
