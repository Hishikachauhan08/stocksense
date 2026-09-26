import React, { useState, useEffect } from 'react';
import { useInventory } from './context/InventoryContext';
import { LandingPage } from './components/landing/LandingPage';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { DashboardView } from './components/dashboard/DashboardView';
import { ProductsView } from './components/products/ProductsView';
import { ReceiptsView } from './components/operations/ReceiptsView';
import { DeliveriesView } from './components/operations/DeliveriesView';
import { TransfersView } from './components/operations/TransfersView';
import { AdjustmentsView } from './components/operations/AdjustmentsView';
import { MoveHistoryView } from './components/operations/MoveHistoryView';
import { SettingsView } from './components/settings/SettingsView';
import { Warehouse3DView } from './components/warehouse/Warehouse3DView';
import { AuthModal } from './components/auth/AuthModal';
import { ProfileModal } from './components/profile/ProfileModal';
import { StaffManagementModal } from './components/profile/StaffManagementModal';
import { OmniSearchModal } from './components/common/OmniSearchModal';
import { BarcodeScannerModal } from './components/common/BarcodeScannerModal';
import { GuidedTourModal } from './components/common/GuidedTourModal';
import { Product } from './types/inventory';

function App() {
  const { activeView, setActiveView } = useInventory();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup' | 'reset'>('login');
  const [profileOpen, setProfileOpen] = useState(false);
  const [staffOpen, setStaffOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [tourOpen, setTourOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const handleEnterApp = () => {
    setActiveView('app');
    setActiveTab('dashboard');
  };

  const handleGoToLanding = () => setActiveView('landing');

  const handleSelectTab = (tab: string) => {
    setActiveTab(tab);
    setSelectedProduct(null);
  };

  const handleLogout = () => {
    setProfileOpen(false);
    setActiveView('landing');
  };

  const openAuth = (mode: 'login' | 'signup' | 'reset' = 'login') => {
    setAuthMode(mode);
    setAuthOpen(true);
  };

  const renderView = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <DashboardView
            onNavigateTab={handleSelectTab}
            onOpenScanner={() => setScannerOpen(true)}
            onOpenTour={() => setTourOpen(true)}
            onSelectProduct={(p) => {
              setSelectedProduct(p);
              setActiveTab('products');
            }}
          />
        );
      case 'products':
        return (
          <ProductsView
            onNavigateTab={handleSelectTab}
            selectedProductToOpen={selectedProduct}
          />
        );
      case 'receipts':
        return <ReceiptsView onNavigateTab={handleSelectTab} />;
      case 'deliveries':
        return <DeliveriesView onNavigateTab={handleSelectTab} />;
      case 'transfers':
        return <TransfersView onNavigateTab={handleSelectTab} />;
      case 'adjustments':
        return <AdjustmentsView onNavigateTab={handleSelectTab} />;
      case 'moves':
        return <MoveHistoryView />;
      case 'settings':
        return <SettingsView />;
      case 'warehouse-3d':
        return (
          <Warehouse3DView
            onNavigateTab={handleSelectTab}
            onOpenScanner={() => setScannerOpen(true)}
            onSelectProduct={(p) => {
              setSelectedProduct(p);
              setActiveTab('products');
            }}
          />
        );
      default:
        return (
          <DashboardView
            onNavigateTab={handleSelectTab}
            onOpenScanner={() => setScannerOpen(true)}
            onOpenTour={() => setTourOpen(true)}
          />
        );
    }
  };

  if (activeView === 'landing') {
    return (
      <>
        <LandingPage
          onEnterApp={handleEnterApp}
          onOpenAuth={() => openAuth('login')}
          onOpenTour={() => setTourOpen(true)}
        />
        <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} defaultMode={authMode} />
        <GuidedTourModal
          isOpen={tourOpen}
          onClose={() => setTourOpen(false)}
          onNavigateTab={(tab) => {
            setTourOpen(false);
            handleEnterApp();
            setActiveTab(tab);
          }}
        />
      </>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#f8f9fa]">
      <Sidebar
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        onOpenProfile={() => setProfileOpen(true)}
        onOpenAuth={() => openAuth('login')}
        onOpenTour={() => setTourOpen(true)}
        onOpenStaffManagement={() => setStaffOpen(true)}
        onGoToLanding={handleGoToLanding}
      />
      <div className="flex-1 flex flex-col min-w-0 lg:ml-64">
        <Navbar
          onOpenSearch={() => setSearchOpen(true)}
          onOpenScanner={() => setScannerOpen(true)}
          onOpenTour={() => setTourOpen(true)}
          onOpenProfile={() => setProfileOpen(true)}
          onOpenAuth={() => openAuth('login')}
          onNavigateTab={handleSelectTab}
        />
        <main className="flex-1 overflow-y-auto">{renderView()}</main>
      </div>

      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} defaultMode={authMode} />
      <ProfileModal
        isOpen={profileOpen}
        onClose={() => setProfileOpen(false)}
        onLogout={handleLogout}
        onOpenStaffManagement={() => {
          setProfileOpen(false);
          setStaffOpen(true);
        }}
      />
      <StaffManagementModal isOpen={staffOpen} onClose={() => setStaffOpen(false)} />
      <OmniSearchModal
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        onSelectProduct={(p) => {
          setSelectedProduct(p);
          setActiveTab('products');
          setSearchOpen(false);
        }}
        onNavigateTab={(tab) => {
          setActiveTab(tab);
          setSearchOpen(false);
        }}
      />
      <BarcodeScannerModal
        isOpen={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onSelectProductAction={(product, actionType) => {
          setSelectedProduct(product);
          setScannerOpen(false);
          if (actionType === 'receipt') setActiveTab('receipts');
          else if (actionType === 'delivery') setActiveTab('deliveries');
          else if (actionType === 'transfer') setActiveTab('transfers');
          else if (actionType === 'adjustment') setActiveTab('adjustments');
          else setActiveTab('products');
        }}
      />
      <GuidedTourModal
        isOpen={tourOpen}
        onClose={() => setTourOpen(false)}
        onNavigateTab={(tab) => {
          setTourOpen(false);
          setActiveTab(tab);
        }}
      />
    </div>
  );
}

export default App;
