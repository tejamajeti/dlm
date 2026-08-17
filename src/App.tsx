import React, { lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ToastContainer } from './components/ToastContainer';
import { AuthPage } from './pages/AuthPage';
import { DashboardLayout } from './layouts/DashboardLayout';
import { RefreshCw } from 'lucide-react';

// Code-Splitting Page Components via React.lazy()
const OverviewDashboard = lazy(() => import('./pages/OverviewDashboard'));
const WarehousesPage = lazy(() => import('./pages/WarehousesPage'));
const OrdersPage = lazy(() => import('./pages/OrdersPage'));
const TrackingMapPage = lazy(() => import('./pages/TrackingMapPage'));
const InventoryPage = lazy(() => import('./pages/InventoryPage'));
const AuditLogsPage = lazy(() => import('./pages/AuditLogsPage'));
const PublicTrackingPage = lazy(() => import('./pages/PublicTrackingPage'));

const AppRoutes: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-cyan-400 font-bold text-sm gap-3">
        <RefreshCw className="w-8 h-8 animate-spin" />
        <span>Initializing DLM Platform...</span>
      </div>
    );
  }

  // Unauthenticated user -> Auth Screen
  if (!user) {
    return (
      <>
        <AuthPage />
        <ToastContainer />
      </>
    );
  }

  // Authenticated user -> Routes rendered inside persistent DashboardLayout via <Outlet />
  return (
    <Routes>
      <Route path="/" element={<DashboardLayout />}>
        <Route index element={<OverviewDashboard onOpenSimulator={() => {}} />} />
        <Route path="orders" element={<OrdersPage />} />
        <Route path="tracking" element={<TrackingMapPage />} />
        <Route path="warehouses" element={<WarehousesPage />} />
        <Route path="inventory" element={<InventoryPage />} />
        <Route path="audit" element={<AuditLogsPage />} />
        <Route path="public-tracker" element={<PublicTrackingPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
};

export const App: React.FC = () => {
  return (
    <HelmetProvider>
      <AuthProvider>
        <ToastProvider>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </ToastProvider>
      </AuthProvider>
    </HelmetProvider>
  );
};

export default App;
