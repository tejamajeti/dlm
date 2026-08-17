import React, { useEffect, useState } from 'react';
import { MetricCard } from '../components/MetricCard';
import { StatusBadge } from '../components/StatusBadge';
import { UserManagementModal } from '../components/UserManagementModal';
import { SEO } from '../components/SEO';
import { DashboardMetrics, Order } from '../types';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../services/api';
import {
  Package,
  Building2,
  TrendingUp,
  Truck,
  CheckCircle,
  Radio,
  Zap,
  Boxes,
  MapPin,
  Clock,
  ShieldCheck,
  Search,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Users,
} from 'lucide-react';

interface OverviewDashboardProps {
  onOpenSimulator: () => void;
  onNavigateTab?: (tab: string) => void;
}

export const OverviewDashboard: React.FC<OverviewDashboardProps> = ({ onOpenSimulator, onNavigateTab }) => {
  const { user } = useAuth();
  const toast = useToast();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [customerTrackingInput, setCustomerTrackingInput] = useState('');
  const [isUserModalOpen, setIsUserModalOpen] = useState<boolean>(false);

  const fetchMetrics = async () => {
    try {
      const res: any = await api.get('/protected/analytics/dashboard');
      if (res.success && res.data) {
        setMetrics(res.data);
      }
    } catch (e) {
      console.error('Error loading dashboard metrics:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 6000);
    return () => clearInterval(interval);
  }, []);

  const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const res: any = await api.patch(`/protected/orders/${orderId}/status`, { status: newStatus });
      if (res.success) {
        toast.success(`Shipment status updated to ${newStatus}`);
        fetchMetrics();
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to update order status');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex items-center gap-3 text-cyan-400 font-semibold">
          <Zap className="w-6 h-6 animate-bounce" />
          <span>Connecting to DLM Backend & Operations Engine...</span>
        </div>
      </div>
    );
  }

  const { overview, activeOrders, recentAuditLogs } = metrics || {
    overview: { totalUsers: 6, totalWarehouses: 3, totalOrders: 3, activeShipments: 2, deliveredShipments: 1, totalRevenue: 6646.99 },
    activeOrders: [
      {
        id: 'ord_01',
        tracking_number: 'DLM-892401-US',
        status: 'IN_TRANSIT',
        destination_address: '742 Evergreen Terrace',
        destination_city: 'Springfield',
        destination_zip: '97477',
        total_amount: 1450.00,
        created_at: new Date().toISOString(),
      },
      {
        id: 'ord_02',
        tracking_number: 'DLM-553192-US',
        status: 'SHIPPED',
        destination_address: '100 Wilshire Blvd',
        destination_city: 'Los Angeles',
        destination_zip: '90401',
        total_amount: 3200.50,
        created_at: new Date().toISOString(),
      },
    ],
    recentAuditLogs: [],
  };

  // ----------------------------------------------------
  // ROLE 1: WAREHOUSE MANAGER DASHBOARD
  // ----------------------------------------------------
  if (user?.role === 'Warehouse Manager') {
    return (
      <div className="space-y-6">
        {/* Banner */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-extrabold text-white tracking-tight">Fulfillment & Inventory Hub</h2>
            <p className="text-xs text-slate-400 mt-1">Manage warehouse stock levels, packing queues, and order fulfillment</p>
          </div>
          <button
            onClick={onOpenSimulator}
            className="px-4 py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white shadow-lg flex items-center gap-2 glow-cyan"
          >
            <Radio className="w-4 h-4 animate-pulse" />
            Dispatch Simulator
          </button>
        </div>

        {/* Manager KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Active Warehouses"
            value={overview.totalWarehouses}
            subtitle="Fully operational distribution hubs"
            icon={<Building2 className="w-5 h-5 text-indigo-400" />}
            glowColor="indigo"
          />
          <MetricCard
            title="Pending Dispatches"
            value={overview.activeShipments}
            subtitle="Awaiting pickup & transit"
            icon={<Package className="w-5 h-5 text-amber-400" />}
            glowColor="amber"
          />
          <MetricCard
            title="Total Stock SKUs"
            value="14 Categories"
            subtitle="Tracked inventory items"
            icon={<Boxes className="w-5 h-5 text-cyan-400" />}
            glowColor="cyan"
          />
          <MetricCard
            title="Completed Fulfillment"
            value={overview.deliveredShipments}
            subtitle="Successfully dispatched orders"
            icon={<CheckCircle className="w-5 h-5 text-emerald-400" />}
            glowColor="emerald"
          />
        </div>

        {/* Warehouse Specific Actions & Active Queue */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 glass-panel rounded-2xl p-5 border border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Boxes className="w-4 h-4 text-cyan-400" />
                Warehouse Fulfillment Queue
              </h3>
              <span className="text-xs text-slate-400 font-semibold">{activeOrders.length} Shipments In Processing</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="text-slate-400 uppercase bg-slate-900/60 border-b border-slate-800">
                  <tr>
                    <th className="px-3.5 py-3">Tracking #</th>
                    <th className="px-3.5 py-3">Destination</th>
                    <th className="px-3.5 py-3">Current Status</th>
                    <th className="px-3.5 py-3">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {activeOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-slate-800/40 transition">
                      <td className="px-3.5 py-3 font-mono font-bold text-cyan-300">{order.tracking_number}</td>
                      <td className="px-3.5 py-3 text-slate-300">{order.destination_city}, {order.destination_zip}</td>
                      <td className="px-3.5 py-3"><StatusBadge status={order.status} /></td>
                      <td className="px-3.5 py-3">
                        {order.status === 'CREATED' && (
                          <button
                            onClick={() => handleUpdateOrderStatus(order.id, 'PACKED')}
                            className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30"
                          >
                            Mark Packed
                          </button>
                        )}
                        {order.status === 'PACKED' && (
                          <button
                            onClick={() => handleUpdateOrderStatus(order.id, 'SHIPPED')}
                            className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30"
                          >
                            Mark Shipped
                          </button>
                        )}
                        {['SHIPPED', 'IN_TRANSIT', 'DELIVERED'].includes(order.status) && (
                          <span className="text-[11px] font-semibold text-slate-400">Handed to Fleet</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Quick Hub Capacity Summary */}
          <div className="glass-panel rounded-2xl p-5 border border-slate-800 flex flex-col justify-between space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Building2 className="w-4 h-4 text-indigo-400" />
              Hub Capacity Overview
            </h3>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-300 font-semibold">NYC Metro Distribution Hub</span>
                  <span className="text-cyan-400 font-bold">85% Full</span>
                </div>
                <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
                  <div className="bg-gradient-to-r from-cyan-500 to-indigo-500 h-full w-[85%]"></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-300 font-semibold">LA Gateway Facility</span>
                  <span className="text-indigo-400 font-bold">64% Full</span>
                </div>
                <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
                  <div className="bg-gradient-to-r from-cyan-500 to-indigo-500 h-full w-[64%]"></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-300 font-semibold">Chicago Logistics Center</span>
                  <span className="text-emerald-400 font-bold">42% Full</span>
                </div>
                <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
                  <div className="bg-gradient-to-r from-cyan-500 to-indigo-500 h-full w-[42%]"></div>
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>Low Stock Warning: Electronic GPS Sensor Units below 50 units</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // ROLE 2: DRIVER DASHBOARD
  // ----------------------------------------------------
  if (user?.role === 'Driver') {
    return (
      <div className="space-y-6">
        {/* Banner */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-extrabold text-white tracking-tight">Driver Route & Delivery Hub</h2>
            <p className="text-xs text-slate-400 mt-1">Assigned deliveries, live route navigation, and status updates</p>
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/30">
            <Radio className="w-4 h-4 animate-pulse" />
            GPS Satellite Tracking Active
          </div>
        </div>

        {/* Driver KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <MetricCard
            title="Assigned Deliveries"
            value={activeOrders.length}
            subtitle="Packages currently in your route"
            icon={<Truck className="w-5 h-5 text-cyan-400" />}
            glowColor="cyan"
          />
          <MetricCard
            title="Completed Today"
            value="4 Packages"
            subtitle="On-time delivery record 100%"
            icon={<CheckCircle2 className="w-5 h-5 text-emerald-400" />}
            glowColor="emerald"
          />
          <MetricCard
            title="Est. Distance"
            value="42.5 km"
            subtitle="Total route distance remaining"
            icon={<MapPin className="w-5 h-5 text-amber-400" />}
            glowColor="amber"
          />
        </div>

        {/* Assigned Deliveries List with 1-Click Status Controls */}
        <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Truck className="w-4 h-4 text-cyan-400" />
            Your Assigned Delivery Route
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeOrders.map((order) => (
              <div key={order.id} className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3 hover:border-cyan-500/30 transition">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-sm text-cyan-300">{order.tracking_number}</span>
                  <StatusBadge status={order.status} />
                </div>

                <div className="text-xs space-y-1">
                  <div className="text-slate-400 font-semibold">Delivery Address:</div>
                  <div className="text-white font-bold">{order.destination_address}</div>
                  <div className="text-slate-300">{order.destination_city}, {order.destination_zip}</div>
                </div>

                <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400 font-mono">Value: ${order.total_amount}</span>
                  <div className="flex items-center gap-2">
                    {order.status !== 'IN_TRANSIT' && order.status !== 'DELIVERED' && (
                      <button
                        onClick={() => handleUpdateOrderStatus(order.id, 'IN_TRANSIT')}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30"
                      >
                        Start Transit
                      </button>
                    )}
                    {order.status === 'IN_TRANSIT' && (
                      <button
                        onClick={() => handleUpdateOrderStatus(order.id, 'DELIVERED')}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30"
                      >
                        Mark Delivered
                      </button>
                    )}
                    {order.status === 'DELIVERED' && (
                      <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Completed
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // ROLE 3: CUSTOMER DASHBOARD
  // ----------------------------------------------------
  if (user?.role === 'Customer') {
    return (
      <div className="space-y-6">
        {/* Customer Header */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-extrabold text-white tracking-tight">Customer Portal & Order Tracker</h2>
            <p className="text-xs text-slate-400 mt-1">Track your deliveries in real-time and review shipment history</p>
          </div>
        </div>

        {/* Quick Track Input */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Search className="w-4 h-4 text-cyan-400" />
            Quick Package Search
          </h3>
          <div className="flex gap-2">
            <input
              type="text"
              value={customerTrackingInput}
              onChange={(e) => setCustomerTrackingInput(e.target.value)}
              placeholder="Enter your tracking number (e.g. DLM-892401-US)"
              className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
            />
            <button
              onClick={() => {
                if (onNavigateTab) onNavigateTab('public-tracker');
              }}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-white shadow-lg flex items-center gap-1.5"
            >
              Track Package
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Active Shipments for Customer */}
        <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Package className="w-4 h-4 text-cyan-400" />
            Your Recent Orders
          </h3>

          <div className="space-y-3">
            {activeOrders.map((order) => (
              <div key={order.id} className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:border-slate-700 transition">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sm text-cyan-300">{order.tracking_number}</span>
                    <StatusBadge status={order.status} />
                  </div>
                  <p className="text-xs text-slate-300">Destination: {order.destination_address}, {order.destination_city}</p>
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold text-white">${order.total_amount}</div>
                  <div className="text-[10px] text-slate-400">Order Date: {new Date(order.created_at).toLocaleDateString()}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // ROLE 4: ADMIN / OPERATOR DASHBOARD (DEFAULT)
  // ----------------------------------------------------
  return (
    <div className="space-y-6">
      <SEO
        title="Executive Dashboard - DLM Platform"
        description="Real-time supply chain monitoring, live telemetry, and automated order routing."
      />
      {/* Top Banner */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">System Overview & Live Telemetry</h2>
          <p className="text-xs text-slate-400 mt-1">Real-time supply chain monitoring & automated order routing</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {user?.role === 'Admin' && (
            <button
              onClick={() => setIsUserModalOpen(true)}
              className="px-4 py-2.5 rounded-xl font-bold text-xs bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-slate-700 hover:border-cyan-500/40 shadow-lg flex items-center gap-2"
            >
              <Users className="w-4 h-4 text-cyan-400" />
              User & Account Access
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Active Shipments"
          value={overview.activeShipments}
          subtitle="Currently in transit across hubs"
          icon={<Truck className="w-5 h-5" />}
          trend="+12% this week"
          glowColor="cyan"
        />
        <MetricCard
          title="Fulfillment Hubs"
          value={overview.totalWarehouses}
          subtitle="Active logistics hubs"
          icon={<Building2 className="w-5 h-5 text-indigo-400" />}
          glowColor="indigo"
        />
        <MetricCard
          title="Total Orders"
          value={overview.totalOrders}
          subtitle={`${overview.deliveredShipments} successfully delivered`}
          icon={<Package className="w-5 h-5 text-emerald-400" />}
          glowColor="emerald"
        />
        <MetricCard
          title="Gross Volume"
          value={`$${overview.totalRevenue.toLocaleString()}`}
          subtitle="Processed volume"
          icon={<TrendingUp className="w-5 h-5 text-amber-400" />}
          glowColor="amber"
        />
      </div>

      {/* Active Orders & Operations Stream Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Orders Table */}
        <div className="lg:col-span-2 glass-panel rounded-2xl p-5 border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Package className="w-4 h-4 text-cyan-400" />
              Active Shipments Pipeline
            </h3>
            <span className="text-xs text-slate-400 font-medium">{activeOrders.length} Recent Records</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-slate-400 uppercase bg-slate-900/60 border-b border-slate-800">
                <tr>
                  <th className="px-3.5 py-3">Tracking #</th>
                  <th className="px-3.5 py-3">Destination</th>
                  <th className="px-3.5 py-3">Status</th>
                  <th className="px-3.5 py-3">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {activeOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-800/40 transition">
                    <td className="px-3.5 py-3 font-mono font-semibold text-cyan-300">{order.tracking_number}</td>
                    <td className="px-3.5 py-3 text-slate-300">
                      {order.destination_city}, {order.destination_zip}
                    </td>
                    <td className="px-3.5 py-3">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="px-3.5 py-3 font-bold text-white">${order.total_amount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Live System Audit Stream */}
        <div className="glass-panel rounded-2xl p-5 border border-slate-800 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
              Live Operations Stream
            </h3>
            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Live Feed
            </span>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto max-h-[340px] pr-1">
            {recentAuditLogs.map((log) => (
              <div key={log.id} className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono font-bold text-cyan-400">{log.action}</span>
                  <span className="text-[10px] text-slate-500">
                    {new Date(log.created_at).toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-slate-300 font-sans text-[11px]">
                  Actor: <span className="text-slate-100 font-semibold">{log.actor_id}</span>
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <UserManagementModal isOpen={isUserModalOpen} onClose={() => setIsUserModalOpen(false)} />
    </div>
  );
};

export default OverviewDashboard;
