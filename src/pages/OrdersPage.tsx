import React, { useEffect, useState } from 'react';
import { Order } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import api from '../services/api';
import { Package, Plus, Search, Radio, Filter } from 'lucide-react';

interface OrdersPageProps {
  onOpenSimulator: () => void;
}

export const OrdersPage: React.FC<OrdersPageProps> = ({ onOpenSimulator }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);

  // Form State
  const [destAddress, setDestAddress] = useState('500 5th Ave');
  const [destCity, setDestCity] = useState('New York');
  const [destZip, setDestZip] = useState('10110');
  const [amount, setAmount] = useState('1250.00');

  const fetchOrders = async () => {
    try {
      const res: any = await api.get('/protected/orders');
      if (res.success && res.data) {
        setOrders(res.data);
      }
    } catch (e) {
      console.error('Error fetching orders:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res: any = await api.post('/protected/orders', {
        origin_warehouse_id: 'wh_nyc_01',
        destination_address: destAddress,
        destination_city: destCity,
        destination_zip: destZip,
        total_amount: parseFloat(amount),
      });

      if (res.success) {
        setShowCreateModal(false);
        fetchOrders();
      }
    } catch (err: any) {
      alert(err.message || 'Error creating order');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">Shipment Orders Pipeline</h2>
          <p className="text-xs text-slate-400 mt-1">Manage lifecycle state transitions and package dispatches</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenSimulator}
            className="px-4 py-2.5 rounded-xl font-bold text-xs bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30 flex items-center gap-2"
          >
            <Radio className="w-4 h-4 text-cyan-400" />
            Kafka Event Simulator
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white shadow-lg flex items-center gap-2 glow-cyan"
          >
            <Plus className="w-4 h-4" />
            Create Shipment
          </button>
        </div>
      </div>

      {/* Orders Table */}
      <div className="glass-panel rounded-2xl p-5 border border-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-slate-400 uppercase bg-slate-900/80 border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">Tracking #</th>
                <th className="px-4 py-3">Destination Address</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Package Code</th>
                <th className="px-4 py-3">Total Value</th>
                <th className="px-4 py-3">Created Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-slate-800/40 transition">
                  <td className="px-4 py-3 font-mono font-bold text-cyan-300">{order.tracking_number}</td>
                  <td className="px-4 py-3 text-slate-300">
                    {order.destination_address}, {order.destination_city} ({order.destination_zip})
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={order.status} />
                  </td>
                  <td className="px-4 py-3 font-mono text-slate-400">
                    {order.packages && order.packages[0] ? order.packages[0].package_code : 'PKG-DEFAULT'}
                  </td>
                  <td className="px-4 py-3 font-bold text-white">${order.total_amount}</td>
                  <td className="px-4 py-3 text-slate-500">
                    {new Date(order.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal to Create Order */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-md rounded-2xl p-6 border border-slate-700/80 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-white">Create & Dispatch New Shipment</h3>
            <form onSubmit={handleCreateOrder} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Destination Address</label>
                <input
                  type="text"
                  value={destAddress}
                  onChange={(e) => setDestAddress(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">City</label>
                  <input
                    type="text"
                    value={destCity}
                    onChange={(e) => setDestCity(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Zip Code</label>
                  <input
                    type="text"
                    value={destZip}
                    onChange={(e) => setDestZip(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Order Value ($)</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  required
                />
              </div>

              <div className="pt-3 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-cyan-500 text-white hover:bg-cyan-400"
                >
                  Dispatch Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
