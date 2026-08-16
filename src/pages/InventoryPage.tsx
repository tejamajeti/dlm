import React, { useEffect, useState } from 'react';
import { InventoryItem } from '../types';
import api from '../services/api';
import { Boxes, AlertTriangle, RefreshCw, CheckCircle2 } from 'lucide-react';

export const InventoryPage: React.FC = () => {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchInventory = async () => {
    try {
      const res: any = await api.get('/protected/inventory');
      if (res.success && res.data) {
        setInventory(res.data);
      }
    } catch (e) {
      console.error('Error loading inventory:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const handleStockAdjust = async (id: string, currentQty: number, delta: number) => {
    try {
      const newQty = Math.max(0, currentQty + delta);
      const res: any = await api.patch(`/protected/inventory/${id}/stock`, { quantity: newQty });
      if (res.success) {
        fetchInventory();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to adjust stock');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">Stock & Warehouse Inventory</h2>
          <p className="text-xs text-slate-400 mt-1">Real-time stock management with automated low stock reorder thresholds</p>
        </div>
      </div>

      <div className="glass-panel rounded-2xl p-5 border border-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-slate-400 uppercase bg-slate-900/80 border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">Product Name</th>
                <th className="px-4 py-3">SKU Code</th>
                <th className="px-4 py-3">Hub Location</th>
                <th className="px-4 py-3">Current Stock</th>
                <th className="px-4 py-3">Reorder Threshold</th>
                <th className="px-4 py-3">Quick Adjust</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {inventory.map((item) => {
                const isLowStock = item.quantity <= item.reorder_level;
                return (
                  <tr key={item.id} className="hover:bg-slate-800/40 transition">
                    <td className="px-4 py-3 font-bold text-white">
                      {item.product ? item.product.name : item.product_id}
                    </td>
                    <td className="px-4 py-3 font-mono text-cyan-300">
                      {item.product ? item.product.sku : 'SKU-UNKNOWN'}
                    </td>
                    <td className="px-4 py-3 text-slate-300 font-semibold">{item.warehouse_id}</td>
                    <td className="px-4 py-3 font-extrabold text-sm">
                      <span className={isLowStock ? 'text-rose-400 flex items-center gap-1.5' : 'text-emerald-400'}>
                        {isLowStock && <AlertTriangle className="w-4 h-4 text-rose-400 animate-pulse" />}
                        {item.quantity} units
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400">{item.reorder_level} units</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleStockAdjust(item.id, item.quantity, -10)}
                          className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-rose-400 font-bold border border-slate-700"
                        >
                          -10
                        </button>
                        <button
                          onClick={() => handleStockAdjust(item.id, item.quantity, 50)}
                          className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-emerald-400 font-bold border border-slate-700"
                        >
                          +50
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
