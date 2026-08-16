import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ToastContainer } from './components/ToastContainer';
import { AuthPage } from './pages/AuthPage';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { OverviewDashboard } from './pages/OverviewDashboard';
import { WarehousesPage } from './pages/WarehousesPage';
import { OrdersPage } from './pages/OrdersPage';
import { TrackingMapPage } from './pages/TrackingMapPage';
import { InventoryPage } from './pages/InventoryPage';
import { AuditLogsPage } from './pages/AuditLogsPage';
import { PublicTrackingPage } from './pages/PublicTrackingPage';
import { PackageSimulatorModal } from './components/PackageSimulatorModal';
import { Order } from './types';
import api from './services/api';

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [isSimulatorOpen, setIsSimulatorOpen] = useState<boolean>(false);
  const [ordersForSimulator, setOrdersForSimulator] = useState<Order[]>([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  const handleOpenSimulator = async () => {
    try {
      const res: any = await api.get('/protected/orders');
      if (res.success && res.data) {
        setOrdersForSimulator(res.data);
      }
    } catch (e) {}
    setIsSimulatorOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-cyan-400 font-bold text-sm">
        Initializing DLM Platform...
      </div>
    );
  }

  // If user is not logged in, display Login & Signup Auth Screen
  if (!user) {
    return (
      <>
        <AuthPage />
        <ToastContainer />
      </>
    );
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewDashboard onOpenSimulator={handleOpenSimulator} onNavigateTab={setActiveTab} />;
      case 'warehouses':
        return <WarehousesPage />;
      case 'orders':
        return <OrdersPage onOpenSimulator={handleOpenSimulator} />;
      case 'tracking':
        return <TrackingMapPage />;
      case 'inventory':
        return <InventoryPage />;
      case 'audit':
        return <AuditLogsPage />;
      case 'public-tracker':
        return <PublicTrackingPage />;
      default:
        return <OverviewDashboard onOpenSimulator={handleOpenSimulator} onNavigateTab={setActiveTab} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100 relative">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        userRole={user?.role}
        isMobileOpen={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <Navbar
          isMobileMenuOpen={isMobileMenuOpen}
          onToggleMobileMenu={() => setIsMobileMenuOpen((prev) => !prev)}
        />
        <main className="flex-1 p-4 sm:p-6 overflow-y-auto">
          {renderTabContent()}
        </main>
      </div>

      <PackageSimulatorModal
        isOpen={isSimulatorOpen}
        onClose={() => setIsSimulatorOpen(false)}
        orders={ordersForSimulator}
        onOrderUpdated={() => {}}
      />

      <ToastContainer />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </AuthProvider>
  );
};

export default App;
