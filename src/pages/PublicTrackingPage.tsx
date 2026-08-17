import React, { useState } from 'react';
import { Order } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { useToast } from '../context/ToastContext';
import api from '../services/api';
import { Search, Package, MapPin, Truck, CheckCircle, ShieldAlert } from 'lucide-react';
import { SEO } from '../components/SEO';

export const PublicTrackingPage: React.FC = () => {
  const toast = useToast();
  const [trackingNum, setTrackingNum] = useState('DLM-892401-US');
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingNum.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const res: any = await api.get(`/public/tracking/${trackingNum.trim()}`);
      if (res.success && res.data) {
        setOrder(res.data);
        toast.success(`Shipment found: ${res.data.tracking_number}`);
      }
    } catch (err: any) {
      const errorMsg = err.message || 'Shipment not found. Please check tracking code.';
      setError(errorMsg);
      toast.error(errorMsg);
      setOrder(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <SEO
        title="Public Package Tracker - DLM Platform"
        description="Track shipment status and delivery progress in real time."
      />
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-extrabold text-white tracking-tight">Public Package Tracker</h2>
        <p className="text-sm text-slate-400">Track shipment status and delivery progress in real time</p>
      </div>

      {/* Search Input Box */}
      <form onSubmit={handleSearch} className="glass-panel p-2 rounded-2xl border border-slate-700/80 flex items-center gap-2 shadow-2xl">
        <div className="pl-3 text-slate-400">
          <Search className="w-5 h-5" />
        </div>
        <input
          type="text"
          value={trackingNum}
          onChange={(e) => setTrackingNum(e.target.value)}
          placeholder="Enter tracking code (e.g. DLM-892401-US)"
          className="flex-1 bg-transparent border-none text-white text-sm focus:outline-none placeholder-slate-500 font-mono py-2"
        />
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white shadow-lg flex items-center gap-2"
        >
          {loading ? 'Searching...' : 'Track Package'}
        </button>
      </form>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {order && (
        <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-800 pb-4 gap-2">
            <div>
              <span className="text-xs font-mono font-bold text-cyan-400">TRACKING NO.</span>
              <h3 className="text-xl font-extrabold text-white font-mono">{order.tracking_number}</h3>
            </div>
            <StatusBadge status={order.status} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
              <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Destination</span>
              <p className="font-bold text-white text-sm">{order.destination_address}</p>
              <p className="text-slate-300">{order.destination_city}, {order.destination_zip}</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
              <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Current Location</span>
              <p className="font-bold text-cyan-300 text-sm">
                {order.packages && order.packages[0] ? order.packages[0].current_location : 'Transit Hub'}
              </p>
              <p className="text-slate-400">Package Code: {order.packages?.[0]?.package_code}</p>
            </div>
          </div>

          {/* Stepper Timeline */}
          <div className="pt-2">
            <h4 className="text-xs font-bold text-slate-300 mb-4">Shipment Lifecycle Timeline</h4>
            <div className="flex items-center justify-between text-xs relative">
              <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-slate-800 -translate-y-1/2 z-0"></div>
              {['CREATED', 'PACKED', 'SHIPPED', 'IN_TRANSIT', 'DELIVERED'].map((st, i) => {
                const isPassed = ['CREATED', 'PACKED', 'SHIPPED', 'IN_TRANSIT', 'DELIVERED'].indexOf(order.status) >= i;
                return (
                  <div key={st} className="relative z-10 flex flex-col items-center gap-1.5 bg-slate-950 px-1">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-[10px] ${
                        isPassed ? 'bg-cyan-500 text-white shadow-lg glow-cyan' : 'bg-slate-800 text-slate-500 border border-slate-700'
                      }`}
                    >
                      {i + 1}
                    </div>
                    <span className={`text-[10px] font-bold ${isPassed ? 'text-cyan-300' : 'text-slate-500'}`}>{st}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PublicTrackingPage;
