import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Order } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { NumericInput } from '../components/NumericInput';
import { CustomSelect } from '../components/CustomSelect';
import { useToast } from '../context/ToastContext';
import api from '../services/api';
import {
  Package,
  Plus,
  Copy,
  X,
  CheckCircle2,
  Clock,
  Truck,
  MapPin,
  DollarSign,
  Tag,
  Calendar,
  Edit3,
} from 'lucide-react';

interface OrdersPageProps {
  onOpenSimulator?: () => void;
}

const AVAILABLE_STATUSES = [
  'CREATED',
  'PROCESSING',
  'PACKED',
  'IN_TRANSIT',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'CANCELLED',
];

const CURRENCY_OPTIONS = [
  { value: 'USD', label: 'USD ($)', symbol: '$' },
  { value: 'EUR', label: 'EUR (€)', symbol: '€' },
  { value: 'GBP', label: 'GBP (£)', symbol: '£' },
  { value: 'INR', label: 'INR (₹)', symbol: '₹' },
  { value: 'CAD', label: 'CAD (C$)', symbol: 'C$' },
  { value: 'AUD', label: 'AUD (A$)', symbol: 'A$' },
  { value: 'JPY', label: 'JPY (¥)', symbol: '¥' },
];

export const OrdersPage: React.FC<OrdersPageProps> = () => {
  const toast = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<boolean>(false);

  // Form State for new order
  const [destAddress, setDestAddress] = useState('500 5th Ave');
  const [destCity, setDestCity] = useState('New York');
  const [destZip, setDestZip] = useState('10110');
  const [amount, setAmount] = useState('1250.00');
  const [currency, setCurrency] = useState('USD');

  const getCurrencySymbol = (currCode?: string) => {
    const match = CURRENCY_OPTIONS.find((c) => c.value === (currCode || 'USD'));
    return match ? match.symbol : '$';
  };

  const formatAmount = (val: any) => {
    const num = Number(val);
    return isNaN(num) ? '0.00' : num.toFixed(2);
  };

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

  const handleOpenOrderModal = (order: Order) => {
    setSelectedOrder(order);
    setSelectedStatus(order.status);
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res: any = await api.post('/protected/orders', {
        origin_warehouse_id: 'wh_nyc_01',
        destination_address: destAddress,
        destination_city: destCity,
        destination_zip: destZip,
        total_amount: parseFloat(amount),
        currency: currency,
      });

      if (res.success) {
        toast.success(`Shipment created in ${currency} and queued for dispatch!`);
        setShowCreateModal(false);
        fetchOrders();
      }
    } catch (err: any) {
      toast.error(err.message || 'Error creating shipment');
    }
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;
    setIsUpdatingStatus(true);
    try {
      const res: any = await api.patch(`/protected/orders/${selectedOrder.id}/status`, {
        status: selectedStatus,
      });

      if (res.success) {
        toast.success(`Shipment #${selectedOrder.tracking_number} status updated to ${selectedStatus}`);
        setSelectedOrder(null);
        fetchOrders();
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to update order status');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleCopyTracking = (e: React.MouseEvent, trackingNum: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(trackingNum);
    toast.info(`Copied tracking code ${trackingNum} to clipboard`);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">Shipment Orders Pipeline</h2>
          <p className="text-xs text-slate-400 mt-1">Manage order lifecycle state transitions and package dispatches</p>
        </div>
        <div className="flex items-center gap-3">
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
          <table className="w-full text-left text-xs border-collapse">
            <thead className="text-slate-400 uppercase bg-slate-900/80 border-b border-slate-800">
              <tr>
                <th className="px-4 py-3.5 align-middle">Tracking #</th>
                <th className="px-4 py-3.5 align-middle">Destination Address</th>
                <th className="px-4 py-3.5 align-middle">Status</th>
                <th className="px-4 py-3.5 align-middle">Package Code</th>
                <th className="px-4 py-3.5 align-middle">Total Value</th>
                <th className="px-4 py-3.5 align-middle">Created Date</th>
                <th className="px-4 py-3.5 align-middle text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-cyan-400 font-semibold align-middle">
                    Loading Shipment Orders...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500 font-semibold align-middle">
                    No shipment orders found.
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr
                    key={order.id}
                    onClick={() => handleOpenOrderModal(order)}
                    className="hover:bg-slate-800/50 cursor-pointer transition"
                  >
                    <td className="px-4 py-3.5 align-middle">
                      <div className="flex items-center gap-2 font-mono font-bold text-cyan-300">
                        <Package className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        <span>{order.tracking_number}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 align-middle text-slate-300">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span>
                          {order.destination_address}, {order.destination_city} ({order.destination_zip})
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 align-middle">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="px-4 py-3.5 align-middle font-mono text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <Tag className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span>{order.packages && order.packages[0] ? order.packages[0].package_code : 'PKG-DEFAULT'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 align-middle font-bold text-white">
                      {getCurrencySymbol(order.currency)}{formatAmount(order.total_amount)}
                    </td>
                    <td className="px-4 py-3.5 align-middle text-slate-400 font-mono">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span>{new Date(order.created_at).toLocaleDateString()}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 align-middle text-center">
                      <div className="flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={(e) => handleCopyTracking(e, order.tracking_number)}
                          className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition"
                          title="Copy Tracking #"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: View Order Details & Update Status */}
      {selectedOrder &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <div className="glass-panel w-full max-w-lg rounded-3xl p-6 border border-slate-700/80 shadow-2xl space-y-5 my-auto max-h-[95vh] overflow-y-auto">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                    <Package className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-extrabold text-white">Order Status & Lifecycle Control</h3>
                    <p className="font-mono text-xs text-cyan-400 font-bold">{selectedOrder.tracking_number}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="p-2 rounded-xl text-slate-400 hover:text-white bg-slate-900 border border-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Order Details Summary Grid */}
              <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 text-xs">
                <div>
                  <span className="text-[10px] text-slate-500 font-semibold uppercase block">Destination</span>
                  <span className="text-slate-200 font-medium">
                    {selectedOrder.destination_address}, {selectedOrder.destination_city} ({selectedOrder.destination_zip})
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-semibold uppercase block">Order Total</span>
                  <span className="text-white font-bold text-sm">
                    {getCurrencySymbol(selectedOrder.currency)}{formatAmount(selectedOrder.total_amount)} ({selectedOrder.currency || 'USD'})
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-semibold uppercase block">Package Code</span>
                  <span className="font-mono text-cyan-300">
                    {selectedOrder.packages?.[0]?.package_code || 'PKG-DEFAULT'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-semibold uppercase block">Current Status</span>
                  <div className="mt-0.5">
                    <StatusBadge status={selectedOrder.status} />
                  </div>
                </div>
              </div>

              {/* Form to Update Status */}
              <form onSubmit={handleUpdateStatus} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-2">Select New Order Status</label>
                  <div className="grid grid-cols-2 gap-2">
                    {AVAILABLE_STATUSES.map((statusOption) => (
                      <button
                        key={statusOption}
                        type="button"
                        onClick={() => setSelectedStatus(statusOption)}
                        className={`p-2.5 rounded-xl border text-xs font-bold transition flex items-center justify-between ${
                          selectedStatus === statusOption
                            ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500 shadow-md ring-1 ring-cyan-500/50'
                            : 'bg-slate-900 hover:bg-slate-800 text-slate-400 border-slate-800'
                        }`}
                      >
                        <span>{statusOption.replace(/_/g, ' ')}</span>
                        {selectedStatus === statusOption && <CheckCircle2 className="w-4 h-4 text-cyan-400" />}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 pt-4 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setSelectedOrder(null)}
                    className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-900 text-slate-400 hover:text-white border border-slate-800 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isUpdatingStatus || selectedStatus === selectedOrder.status}
                    className="px-5 py-2.5 rounded-xl text-xs font-extrabold bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 disabled:opacity-50 text-white shadow-lg flex items-center gap-1.5 transition active:scale-95"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    {isUpdatingStatus ? 'Updating Status...' : 'Save & Update Status'}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

      {/* Modal to Create Order */}
      {showCreateModal &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <div className="glass-panel w-full max-w-md rounded-3xl p-6 border border-slate-700/80 shadow-2xl space-y-4 my-auto max-h-[95vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-base font-extrabold text-white">Create & Dispatch New Shipment</h3>
                <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
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

                {/* Multi-Currency & Order Value Section */}
                <div className="grid grid-cols-3 gap-3 items-end">
                  <div className="col-span-1">
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Currency</label>
                    <CustomSelect
                      value={currency}
                      onChange={setCurrency}
                      options={CURRENCY_OPTIONS.map((c) => ({
                        value: c.value,
                        label: `${c.value} (${c.symbol})`,
                      }))}
                      style={{ width: '100%' }}
                    />
                  </div>
                  <div className="col-span-2">
                    <NumericInput
                      label={`Order Amount (${currency})`}
                      prefix={getCurrencySymbol(currency)}
                      value={amount}
                      onChange={setAmount}
                      min={0}
                      step={50}
                      required
                    />
                  </div>
                </div>

                <div className="pt-4 flex justify-between gap-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-900 text-slate-400 hover:text-white border border-slate-800 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl text-xs font-extrabold bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white shadow-lg transition active:scale-95"
                  >
                    Dispatch Order
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};
