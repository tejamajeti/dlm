import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
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
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [isSimulatorOpen, setIsSimulatorOpen] = useState<boolean>(false);
  const [ordersForSimulator, setOrdersForSimulator] = useState<Order[]>([]);

  const handleOpenSimulator = async () => {
    try {
      const res: any = await api.get('/protected/orders');
      if (res.success && res.data) {
        setOrdersForSimulator(res.data);
      }
    } catch (e) {}
    setIsSimulatorOpen(true);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewDashboard onOpenSimulator={handleOpenSimulator} />;
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
        return <OverviewDashboard onOpenSimulator={handleOpenSimulator} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} userRole={user?.role} />

      <div className="flex-1 flex flex-col min-w-0">
        <Navbar />
        <main className="flex-1 p-6 overflow-y-auto">
          {renderTabContent()}
        </main>
      </div>

      <PackageSimulatorModal
        isOpen={isSimulatorOpen}
        onClose={() => setIsSimulatorOpen(false)}
        orders={ordersForSimulator}
        onOrderUpdated={() => {}}
      />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
