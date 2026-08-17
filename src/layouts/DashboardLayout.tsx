import React, { useState, Suspense } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Sidebar } from '../components/Sidebar';
import { Navbar } from '../components/Navbar';
import { PackageSimulatorModal } from '../components/PackageSimulatorModal';
import { ToastContainer } from '../components/ToastContainer';
import { Order } from '../types';
import api from '../services/api';
import { RefreshCw } from 'lucide-react';

const PATH_TAB_MAP: Record<string, string> = {
  '/': 'overview',
  '/overview': 'overview',
  '/orders': 'orders',
  '/tracking': 'tracking',
  '/warehouses': 'warehouses',
  '/inventory': 'inventory',
  '/audit': 'audit',
  '/public-tracker': 'public-tracker',
};

const TAB_PATH_MAP: Record<string, string> = {
  overview: '/',
  orders: '/orders',
  tracking: '/tracking',
  warehouses: '/warehouses',
  inventory: '/inventory',
  audit: '/audit',
  'public-tracker': '/public-tracker',
};

export const DashboardLayout: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [isSimulatorOpen, setIsSimulatorOpen] = useState<boolean>(false);
  const [ordersForSimulator, setOrdersForSimulator] = useState<Order[]>([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  const activeTab = PATH_TAB_MAP[location.pathname] || 'overview';

  const handleSetActiveTab = (tabId: string) => {
    const targetPath = TAB_PATH_MAP[tabId] || '/';
    if (location.pathname !== targetPath) {
      navigate(targetPath);
    }
  };

  const handleOpenSimulator = async () => {
    try {
      const res: any = await api.get('/protected/orders');
      if (res.success && res.data) {
        setOrdersForSimulator(res.data);
      }
    } catch (e) {}
    setIsSimulatorOpen(true);
  };

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100 relative">
      {/* Persistent Sidebar - Does NOT re-render on route changes */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={handleSetActiveTab}
        userRole={user?.role}
        isMobileOpen={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Content Area with Navbar & Suspense Outlet */}
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar
          isMobileMenuOpen={isMobileMenuOpen}
          onToggleMobileMenu={() => setIsMobileMenuOpen((prev) => !prev)}
        />
        <main className="flex-1 p-4 sm:p-6 overflow-y-auto">
          <Suspense
            fallback={
              <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3 text-cyan-400">
                <RefreshCw className="w-8 h-8 animate-spin" />
                <span className="text-sm font-semibold text-slate-300">Loading Page Module...</span>
              </div>
            }
          >
            <Outlet context={{ onOpenSimulator: handleOpenSimulator, onNavigateTab: handleSetActiveTab }} />
          </Suspense>
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

export default DashboardLayout;
