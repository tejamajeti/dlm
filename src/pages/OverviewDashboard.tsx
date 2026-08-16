import React, { useEffect, useState } from 'react';
import { MetricCard } from '../components/MetricCard';
import { StatusBadge } from '../components/StatusBadge';
import { DashboardMetrics } from '../types';
import api from '../services/api';
import {
  Package,
  Building2,
  TrendingUp,
  Truck,
  CheckCircle,
  Radio,
  Zap,
} from 'lucide-react';

interface OverviewDashboardProps {
  onOpenSimulator: () => void;
}

export const OverviewDashboard: React.FC<OverviewDashboardProps> = ({ onOpenSimulator }) => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

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
    const interval = setInterval(fetchMetrics, 5000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex items-center gap-3 text-cyan-400 font-semibold">
          <Zap className="w-6 h-6 animate-bounce" />
          <span>Connecting to DLM Backend & Analytics Engine...</span>
        </div>
      </div>
    );
  }

  const { overview, activeOrders, recentAuditLogs } = metrics || {
    overview: { totalUsers: 6, totalWarehouses: 3, totalOrders: 3, activeShipments: 2, deliveredShipments: 1, totalRevenue: 6646.99 },
    activeOrders: [],
    recentAuditLogs: [],
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">System Overview & Live Telemetry</h2>
          <p className="text-xs text-slate-400 mt-1">Real-time metrics powered by PostgreSQL & Apache Kafka event bus</p>
        </div>
        <button
          onClick={onOpenSimulator}
          className="px-4 py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white shadow-lg flex items-center gap-2 glow-cyan"
        >
          <Radio className="w-4 h-4 animate-pulse" />
          Simulate Kafka Event
        </button>
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

      {/* Active Orders & Kafka Audit Stream Grid */}
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

        {/* Live Kafka Event Log Stream */}
        <div className="glass-panel rounded-2xl p-5 border border-slate-800 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
              Kafka Stream Audit
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
    </div>
  );
};
