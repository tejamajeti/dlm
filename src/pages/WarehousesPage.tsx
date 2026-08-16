import React, { useEffect, useState } from 'react';
import { Warehouse } from '../types';
import api from '../services/api';
import { Building2, MapPin, Plus, Users, CheckCircle2 } from 'lucide-react';

export const WarehousesPage: React.FC = () => {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchWarehouses = async () => {
    try {
      const res: any = await api.get('/protected/warehouses');
      if (res.success && res.data) {
        setWarehouses(res.data);
      }
    } catch (e) {
      console.error('Error fetching warehouses:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWarehouses();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">Fulfillment Hubs & Facilities</h2>
          <p className="text-xs text-slate-400 mt-1">Regional distribution centers and capacity metrics</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {warehouses.map((wh) => {
          const occupancyRate = Math.round((wh.current_occupancy / wh.capacity) * 100);
          return (
            <div key={wh.id} className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-4 hover:border-cyan-500/40 transition">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                    {wh.code}
                  </span>
                  <h3 className="text-lg font-bold text-white mt-1.5">{wh.name}</h3>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-800 text-indigo-400">
                  <Building2 className="w-5 h-5" />
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-400">
                <MapPin className="w-4 h-4 text-slate-500 flex-shrink-0" />
                <span>{wh.address}, {wh.city}, {wh.state} {wh.zip_code}</span>
              </div>

              <div className="pt-2 border-t border-slate-800/80 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-semibold">Capacity Usage</span>
                  <span className="font-bold text-white">{wh.current_occupancy.toLocaleString()} / {wh.capacity.toLocaleString()} sqft</span>
                </div>
                <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
                  <div
                    className="bg-gradient-to-r from-cyan-500 to-indigo-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${occupancyRate}%` }}
                  ></div>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1 text-slate-400">
                <span>Coordinates: {wh.latitude}, {wh.longitude}</span>
                <span className="text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Active Hub
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
