import React, { useState } from 'react';
import { useInventory } from '../../context/InventoryContext';
import confetti from 'canvas-confetti';
import {
  CheckCircle2,
  Package,
  Layers,
  Truck,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  X,
} from 'lucide-react';

interface GuidedTourModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab: (tab: string) => void;
}

export const GuidedTourModal: React.FC<GuidedTourModalProps> = ({
  isOpen,
  onClose,
  onNavigateTab,
}) => {
  const {
    validateReceipt,
    validateTransfer,
    validateDelivery,
    validateAdjustment,
    createReceipt,
    createTransfer,
    createDelivery,
    createAdjustment,
    resetToInitialDemo,
  } = useInventory();

  const [currentStep, setCurrentStep] = useState<number>(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([1, 2, 3, 4]);

  if (!isOpen) return null;

  const steps = [
    {
      step: 1,
      title: 'Step 1: Receive Goods from Vendor',
      subtitle: 'Receive 100 kg Steel → Stock: +100',
      description:
        'Vendor "Apex Metal Alloys" arrives with 100 kg of Industrial Steel Rods. Receipt is created and validated. Total inventory increases automatically by +100 kg in Main Store.',
      icon: Package,
      badge: '+100 kg Stock',
      color: 'emerald',
      refDoc: 'REC-2026-001',
      details: 'Product: Steel Rods (STL-100-ROD) | Location: Main Store - Rack A',
    },
    {
      step: 2,
      title: 'Step 2: Move to Production Rack',
      subtitle: 'Internal Transfer: Main Store → Production Rack',
      description:
        '30 kg of steel is moved to the Production Floor for machining. Total company stock remains unchanged at 100 kg, but location balance reflects 70 kg in Main Store and 30 kg on the Production Rack.',
      icon: Layers,
      badge: 'Location Rebalance',
      color: 'amber',
      refDoc: 'TRF-2026-001',
      details: 'From: Main Store (Rack A) → To: Production Floor (Production Rack)',
    },
    {
      step: 3,
      title: 'Step 3: Deliver Finished Goods',
      subtitle: 'Deliver 20 steel frames → Stock: -20',
      description:
        'A customer sales order is packed and picked. Validating the delivery order decreases finished goods inventory by 20 units and creates a dispatch record in the move ledger.',
      icon: Truck,
      badge: '-20 units Stock',
      color: 'stone',
      refDoc: 'DEL-2026-002',
      details: 'Product: Steel Frames (STL-FRM-02) | Destination: Customer Vanguard',
    },
    {
      step: 4,
      title: 'Step 4: Adjust Damaged Items',
      subtitle: 'Adjust 3 kg damaged steel → Stock: -3',
      description:
        'Physical count inspection finds 3 kg of rusted/damaged steel rods on the production floor. A stock adjustment is recorded with reason "Damaged Goods", deducting 3 kg from inventory.',
      icon: AlertTriangle,
      badge: '-3 kg Scrap Write-down',
      color: 'amber',
      refDoc: 'ADJ-2026-001',
      details: 'Location: Production Rack | Recorded: 30 kg | Counted: 27 kg',
    },
  ];

  const handleStepJump = (stepNum: number) => {
    setCurrentStep(stepNum);
    if (stepNum === 1) onNavigateTab('receipts');
    else if (stepNum === 2) onNavigateTab('transfers');
    else if (stepNum === 3) onNavigateTab('deliveries');
    else if (stepNum === 4) onNavigateTab('adjustments');
  };

  const handleSimulateAll = () => {
    resetToInitialDemo();
    confetti({ particleCount: 70, spread: 80 });
    setCompletedSteps([1, 2, 3, 4]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white border border-stone-200 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-stone-900">
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-100 bg-stone-50/70 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-800">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
                PDF 4-Step Simplified Flow Walkthrough
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-stone-100 text-stone-700 font-bold border border-stone-200">
                  Interactive Guide
                </span>
              </h3>
              <p className="text-xs text-stone-500">
                Direct implementation of Pages 3 & 4: Intake, Transfer, Outbound & Scrap
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-stone-700 rounded-xl hover:bg-stone-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* 4 Step Pipeline Indicators */}
          <div className="grid grid-cols-4 gap-2">
            {steps.map((s) => {
              const isActive = currentStep === s.step;
              const isCompleted = completedSteps.includes(s.step);

              return (
                <button
                  key={s.step}
                  onClick={() => handleStepJump(s.step)}
                  className={`p-3 rounded-2xl text-left border transition-all ${
                    isActive
                      ? 'bg-stone-900 text-white border-stone-900 shadow-xs'
                      : 'bg-stone-50 hover:bg-stone-100 border-stone-200 text-stone-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-[10px] font-bold">
                      0{s.step}
                    </span>
                    {isCompleted && (
                      <CheckCircle2 className={`w-3.5 h-3.5 ${isActive ? 'text-amber-400' : 'text-emerald-600'}`} />
                    )}
                  </div>
                  <div className="text-xs font-bold truncate">
                    {s.title.split(':')[1]?.trim() || s.title}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Active Step Showcase Card */}
          {(() => {
            const activeStepObj = steps.find((s) => s.step === currentStep) || steps[0];
            const Icon = activeStepObj.icon;

            return (
              <div className="p-5 rounded-2xl bg-stone-50 border border-stone-200 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white border border-stone-200 shadow-2xs flex items-center justify-center text-stone-800">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-stone-950">
                        {activeStepObj.title}
                      </h4>
                      <p className="text-xs text-amber-800 font-semibold font-mono">
                        {activeStepObj.subtitle}
                      </p>
                    </div>
                  </div>

                  <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-white text-stone-800 border border-stone-200 shadow-2xs">
                    {activeStepObj.badge}
                  </span>
                </div>

                <p className="text-xs text-stone-600 leading-relaxed">
                  {activeStepObj.description}
                </p>

                <div className="p-3 rounded-xl bg-white border border-stone-200 space-y-1 text-xs font-mono text-stone-500">
                  <div className="flex justify-between">
                    <span>Ledger Document Ref:</span>
                    <strong className="text-stone-900">{activeStepObj.refDoc}</strong>
                  </div>
                  <div className="text-[11px] text-stone-500 pt-0.5">
                    {activeStepObj.details}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <button
                    onClick={() => {
                      if (currentStep === 1) onNavigateTab('receipts');
                      else if (currentStep === 2) onNavigateTab('transfers');
                      else if (currentStep === 3) onNavigateTab('deliveries');
                      else if (currentStep === 4) onNavigateTab('adjustments');
                      onClose();
                    }}
                    className="text-xs font-bold text-stone-900 hover:text-stone-700 flex items-center gap-1"
                  >
                    <span>Inspect this View in IMS</span>
                    <span>→</span>
                  </button>

                  <div className="flex gap-2">
                    {currentStep > 1 && (
                      <button
                        onClick={() => handleStepJump(currentStep - 1)}
                        className="px-3 py-1.5 rounded-xl bg-white hover:bg-stone-100 border border-stone-200 text-stone-700 text-xs font-semibold"
                      >
                        ← Prev Step
                      </button>
                    )}
                    {currentStep < 4 ? (
                      <button
                        onClick={() => handleStepJump(currentStep + 1)}
                        className="px-3 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold"
                      >
                        Next Step →
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          confetti({ particleCount: 50, spread: 60 });
                          onNavigateTab('ledger');
                          onClose();
                        }}
                        className="px-3.5 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-xs"
                      >
                        View Full Stock Ledger
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Quick Reseed Action */}
          <div className="flex items-center justify-between pt-2 border-t border-stone-100 text-xs">
            <span className="text-stone-500">Want to test the workflow fresh?</span>
            <button
              onClick={handleSimulateAll}
              className="flex items-center gap-1.5 text-stone-700 hover:text-stone-950 font-semibold"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset & Auto-Populate 4 Stages</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
