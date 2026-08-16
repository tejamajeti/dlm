import React from 'react';
import {
  LayoutDashboard,
  Building2,
  Package,
  MapPin,
  Boxes,
  ScrollText,
  Search,
  Truck,
  Sparkles,
  X,
} from 'lucide-react';
import { UserRole } from '../types';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  userRole?: UserRole;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  userRole = 'Admin',
  isMobileOpen = false,
  onCloseMobile,
}) => {
  const menuItems = [
    { id: 'overview', label: 'Executive Dashboard', icon: <LayoutDashboard className="w-5 h-5" />, roles: ['Admin', 'Warehouse Manager', 'Driver', 'Customer', 'Operator'] },
    { id: 'orders', label: 'Shipment Orders', icon: <Package className="w-5 h-5" />, roles: ['Admin', 'Warehouse Manager', 'Driver', 'Customer', 'Operator'] },
    { id: 'tracking', label: 'Fleet & Driver GPS', icon: <MapPin className="w-5 h-5" />, roles: ['Admin', 'Warehouse Manager', 'Driver', 'Operator'] },
    { id: 'warehouses', label: 'Fulfillment Hubs', icon: <Building2 className="w-5 h-5" />, roles: ['Admin', 'Warehouse Manager'] },
    { id: 'inventory', label: 'Stock & Inventory', icon: <Boxes className="w-5 h-5" />, roles: ['Admin', 'Warehouse Manager'] },
    { id: 'audit', label: 'Live Audit Trail', icon: <ScrollText className="w-5 h-5" />, roles: ['Admin', 'Operator'] },
    { id: 'public-tracker', label: 'Order Tracker', icon: <Search className="w-5 h-5" />, roles: ['Admin', 'Warehouse Manager', 'Driver', 'Customer', 'Operator'] },
  ];

  const handleSelectTab = (tabId: string) => {
    setActiveTab(tabId);
    if (onCloseMobile) onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40 md:hidden transition-opacity"
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed md:sticky top-0 left-0 z-50 md:z-40 w-64 glass-panel border-r border-slate-800/80 flex flex-col h-screen transition-transform duration-300 ease-in-out ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="p-5 sm:p-6 flex items-center justify-between border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-cyan-600 to-indigo-600 text-white shadow-lg glow-cyan">
              <Truck className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h1 className="font-extrabold text-lg text-white tracking-wide flex items-center gap-1.5">
                DLM <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">v1.0</span>
              </h1>
              <p className="text-[11px] font-medium text-slate-400">Distributed Logistics</p>
            </div>
          </div>
          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-white bg-slate-900 border border-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navigation List */}
        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">Navigation</div>
          {menuItems
            .filter((item) => item.roles.includes(userRole))
            .map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelectTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl font-medium text-sm transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-cyan-500/20 to-indigo-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50'
                  }`}
                >
                  <span className={isActive ? 'text-cyan-400' : 'text-slate-400'}>{item.icon}</span>
                  {item.label}
                </button>
              );
            })}
        </nav>

        {/* System Status Footer */}
        <div className="p-4 border-t border-slate-800/80">
          <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span className="text-xs font-semibold text-slate-300">Telemetry Stream: Active</span>
            </div>
            <Sparkles className="w-4 h-4 text-cyan-400" />
          </div>
        </div>
      </aside>
    </>
  );
};

