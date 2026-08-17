import React, { useEffect, useState, useMemo } from 'react';
import { Order } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { NumericInput } from '../components/NumericInput';
import { CustomSelect } from '../components/CustomSelect';
import { Modal } from '../components/Modal';
import { SEO } from '../components/SEO';
import { useToast } from '../context/ToastContext';
import api from '../services/api';
import {
  Package,
  Plus,
  Copy,
  CheckCircle2,
  MapPin,
  Tag,
  Calendar,
  RefreshCw,
  DollarSign,
  Send,
  Search,
  Filter,
  X,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  RotateCcw,
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

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [sortColumn, setSortColumn] = useState<'created_at' | 'total_amount' | 'tracking_number'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

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
  const [isSubmittingOrder, setIsSubmittingOrder] = useState<boolean>(false);

  const getCurrencySymbol = (currCode?: string) => {
    const match = CURRENCY_OPTIONS.find((c) => c.value === (currCode || 'USD'));
    return match ? match.symbol : '$';
  };

  const formatAmount = (val: any) => {
    const num = Number(val);
    return isNaN(num) ? '0.00' : num.toFixed(2);
  };

  const fetchOrders = async () => {
    setLoading(true);
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

  // Filtered & Sorted Orders calculation
  const filteredOrders = useMemo(() => {
    return orders
      .filter((order) => {
        // Search query filter
        const query = searchQuery.toLowerCase().trim();
        const pkgCode = order.packages?.[0]?.package_code || 'PKG-DEFAULT';
        const matchesSearch =
          !query ||
          order.tracking_number.toLowerCase().includes(query) ||
          order.destination_address.toLowerCase().includes(query) ||
          order.destination_city.toLowerCase().includes(query) ||
          order.destination_zip.toLowerCase().includes(query) ||
          pkgCode.toLowerCase().includes(query);

        // Status filter
        const matchesStatus = statusFilter === 'ALL' || order.status === statusFilter;

        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        let valA: any = a[sortColumn];
        let valB: any = b[sortColumn];

        if (sortColumn === 'created_at') {
          valA = new Date(a.created_at).getTime();
          valB = new Date(b.created_at).getTime();
        } else if (sortColumn === 'total_amount') {
          valA = Number(a.total_amount) || 0;
          valB = Number(b.total_amount) || 0;
        } else if (sortColumn === 'tracking_number') {
          valA = a.tracking_number;
          valB = b.tracking_number;
        }

        if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
        if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
  }, [orders, searchQuery, statusFilter, sortColumn, sortOrder]);

  const handleSortToggle = (col: 'created_at' | 'total_amount' | 'tracking_number') => {
    if (sortColumn === col) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(col);
      setSortOrder('desc');
    }
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setStatusFilter('ALL');
    setSortColumn('created_at');
    setSortOrder('desc');
  };

  const hasActiveFilters = searchQuery !== '' || statusFilter !== 'ALL';

  const handleOpenOrderModal = (order: Order) => {
    setSelectedOrder(order);
    setSelectedStatus(order.status);
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingOrder(true);
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
    } finally {
      setIsSubmittingOrder(false);
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
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      <SEO
        title="Shipment Orders Pipeline - DLM Platform"
        description="Manage shipment order lifecycle state transitions, package dispatches, and order valuation."
      />
      {/* Top Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 glass-panel rounded-3xl border border-slate-800/80 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Package className="w-5 h-5" />
            </div>
            <h2 className="text-2xl font-extrabold text-white tracking-tight">Shipment Orders Pipeline</h2>
          </div>
          <p className="text-xs text-slate-400 pl-0.5">
            Manage order lifecycle state transitions, package dispatches, and track shipment status
          </p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={fetchOrders}
            className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition shadow-sm cursor-pointer"
            title="Refresh Orders"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-5 py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white shadow-lg flex items-center justify-center gap-2 glow-cyan transition active:scale-95 cursor-pointer w-full sm:w-auto"
          >
            <Plus className="w-4 h-4" />
            Create Shipment
          </button>
        </div>
      </div>

      {/* Table Control & Filter Toolbar */}
      <div className="glass-panel p-4 rounded-3xl border border-slate-800/80 shadow-lg space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Real-time Search Input */}
          <div className="relative flex-1 min-w-[280px]">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by tracking #, destination city, address, package code..."
              className="w-full bg-slate-900/90 border border-slate-700/80 rounded-2xl pl-10 pr-9 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/40 transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filters Bar */}
          <div className="flex items-center gap-3">
            {/* Status Filter Dropdown */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-400 shrink-0 flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-cyan-400" />
                Filter Status:
              </span>
              <CustomSelect
                value={statusFilter}
                onChange={setStatusFilter}
                options={[
                  { value: 'ALL', label: 'All Statuses' },
                  ...AVAILABLE_STATUSES.map((st) => ({
                    value: st,
                    label: st.replace(/_/g, ' '),
                  })),
                ]}
                style={{ minWidth: 160 }}
              />
            </div>

            {/* Reset Filters Button */}
            {hasActiveFilters && (
              <button
                onClick={handleResetFilters}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 flex items-center gap-1.5 transition cursor-pointer shrink-0"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Filter Summary & Active Filter Badges */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2 pt-2.5 border-t border-slate-800/60 text-xs">
            <span className="text-slate-400 font-medium">Active filters:</span>
            {searchQuery && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 text-[11px] font-semibold">
                Query: "{searchQuery}"
                <button onClick={() => setSearchQuery('')} className="hover:text-white cursor-pointer ml-0.5">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {statusFilter !== 'ALL' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 text-[11px] font-semibold">
                Status: {statusFilter.replace(/_/g, ' ')}
                <button onClick={() => setStatusFilter('ALL')} className="hover:text-white cursor-pointer ml-0.5">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            <span className="ml-auto text-slate-400 font-mono text-[11px]">
              Showing {filteredOrders.length} of {orders.length} orders
            </span>
          </div>
        )}
      </div>

      {/* Orders Table Container */}
      <div className="glass-panel rounded-3xl border border-slate-800/80 shadow-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse min-w-[960px]">
            <thead className="text-slate-400 text-xs uppercase font-bold tracking-wider bg-slate-900/90 border-b border-slate-800 select-none">
              <tr>
                <th
                  onClick={() => handleSortToggle('tracking_number')}
                  className="px-6 py-4 align-middle cursor-pointer hover:text-white transition whitespace-nowrap"
                >
                  <div className="flex items-center gap-2">
                    <span>Tracking #</span>
                    {sortColumn === 'tracking_number' ? (
                      sortOrder === 'asc' ? (
                        <ArrowUp className="w-3.5 h-3.5 text-cyan-400" />
                      ) : (
                        <ArrowDown className="w-3.5 h-3.5 text-cyan-400" />
                      )
                    ) : (
                      <ArrowUpDown className="w-3.5 h-3.5 text-slate-600 opacity-60 hover:opacity-100" />
                    )}
                  </div>
                </th>
                <th className="px-6 py-4 align-middle whitespace-nowrap">Destination Address</th>
                <th className="px-6 py-4 align-middle whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <span>Status</span>
                    {statusFilter !== 'ALL' && (
                      <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                    )}
                  </div>
                </th>
                <th className="px-6 py-4 align-middle whitespace-nowrap">Package Code</th>
                <th
                  onClick={() => handleSortToggle('total_amount')}
                  className="px-6 py-4 align-middle cursor-pointer hover:text-white transition whitespace-nowrap"
                >
                  <div className="flex items-center gap-2">
                    <span>Total Value</span>
                    {sortColumn === 'total_amount' ? (
                      sortOrder === 'asc' ? (
                        <ArrowUp className="w-3.5 h-3.5 text-cyan-400" />
                      ) : (
                        <ArrowDown className="w-3.5 h-3.5 text-cyan-400" />
                      )
                    ) : (
                      <ArrowUpDown className="w-3.5 h-3.5 text-slate-600" />
                    )}
                  </div>
                </th>
                <th
                  onClick={() => handleSortToggle('created_at')}
                  className="px-6 py-4 align-middle cursor-pointer hover:text-white transition whitespace-nowrap"
                >
                  <div className="flex items-center gap-2">
                    <span>Created Date</span>
                    {sortColumn === 'created_at' ? (
                      sortOrder === 'asc' ? (
                        <ArrowUp className="w-3.5 h-3.5 text-cyan-400" />
                      ) : (
                        <ArrowDown className="w-3.5 h-3.5 text-cyan-400" />
                      )
                    ) : (
                      <ArrowUpDown className="w-3.5 h-3.5 text-slate-600" />
                    )}
                  </div>
                </th>
                <th className="px-6 py-4 align-middle text-center whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400 align-middle">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <RefreshCw className="w-6 h-6 animate-spin text-cyan-400" />
                      <span className="text-sm font-semibold text-slate-300">Loading Shipment Orders...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500 align-middle">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Package className="w-8 h-8 text-slate-600" />
                      <span className="text-sm font-medium text-slate-400">
                        {orders.length === 0
                          ? 'No shipment orders found.'
                          : 'No shipment orders match your selected filters.'}
                      </span>
                      {hasActiveFilters && (
                        <button
                          onClick={handleResetFilters}
                          className="mt-2 px-4 py-2 rounded-xl text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 hover:bg-cyan-500/20 transition cursor-pointer"
                        >
                          Clear Active Filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr
                    key={order.id}
                    onClick={() => handleOpenOrderModal(order)}
                    className="hover:bg-slate-800/50 cursor-pointer transition-colors duration-150 group"
                  >
                    <td className="px-6 py-5 align-middle whitespace-nowrap">
                      <div className="flex items-center gap-2.5 font-mono font-bold text-cyan-300 group-hover:text-cyan-200 transition">
                        <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 shrink-0">
                          <Package className="w-4 h-4 text-cyan-400" />
                        </div>
                        <span>{order.tracking_number}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 align-middle text-slate-200 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-slate-500 shrink-0" />
                        <span className="font-medium text-slate-200">
                          {order.destination_address}, {order.destination_city} ({order.destination_zip})
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5 align-middle whitespace-nowrap">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="px-6 py-5 align-middle font-mono text-slate-400 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Tag className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span>{order.packages && order.packages[0] ? order.packages[0].package_code : 'PKG-DEFAULT'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 align-middle font-bold text-white text-base whitespace-nowrap">
                      {getCurrencySymbol(order.currency)}{formatAmount(order.total_amount)}
                    </td>
                    <td className="px-6 py-5 align-middle text-slate-400 font-mono text-xs whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span>{new Date(order.created_at).toLocaleDateString()}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 align-middle text-center whitespace-nowrap">
                      <div className="flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={(e) => handleCopyTracking(e, order.tracking_number)}
                          className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 hover:border-slate-700 transition cursor-pointer"
                          title="Copy Tracking #"
                        >
                          <Copy className="w-4 h-4" />
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
      <Modal
        isOpen={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        title="Order Status & Lifecycle Control"
        subtitle={selectedOrder ? `Tracking #: ${selectedOrder.tracking_number}` : ''}
        icon={<Package className="w-6 h-6 text-cyan-400" />}
        maxWidth="xl"
      >
        {selectedOrder && (
          <form onSubmit={handleUpdateStatus} className="space-y-6">
            {/* Summary Metadata Grid */}
            <div className="grid grid-cols-2 gap-4 p-5 rounded-2xl bg-slate-950/70 border border-slate-800 text-xs">
              <div className="space-y-1">
                <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider block">
                  Destination Address
                </span>
                <span className="text-slate-200 font-medium text-sm block leading-snug">
                  {selectedOrder.destination_address}, {selectedOrder.destination_city} ({selectedOrder.destination_zip})
                </span>
              </div>
              <div className="space-y-1">
                <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider block">
                  Order Total Valuation
                </span>
                <span className="text-white font-extrabold text-base block">
                  {getCurrencySymbol(selectedOrder.currency)}{formatAmount(selectedOrder.total_amount)}{' '}
                  <span className="text-xs text-slate-400 font-normal">({selectedOrder.currency || 'USD'})</span>
                </span>
              </div>
              <div className="space-y-1">
                <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider block">
                  Package Code
                </span>
                <span className="font-mono text-cyan-300 text-sm font-semibold block">
                  {selectedOrder.packages?.[0]?.package_code || 'PKG-DEFAULT'}
                </span>
              </div>
              <div className="space-y-1">
                <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider block">
                  Current Lifecycle Status
                </span>
                <div className="mt-1">
                  <StatusBadge status={selectedOrder.status} />
                </div>
              </div>
            </div>

            {/* Select Status Options */}
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                Select New Order Lifecycle State
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {AVAILABLE_STATUSES.map((statusOption) => {
                  const isSelected = selectedStatus === statusOption;
                  return (
                    <button
                      key={statusOption}
                      type="button"
                      onClick={() => setSelectedStatus(statusOption)}
                      className={`p-3 rounded-2xl border text-xs font-bold transition-all flex items-center justify-between gap-2 cursor-pointer ${
                        isSelected
                          ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/80 shadow-lg ring-2 ring-cyan-500/30'
                          : 'bg-slate-900/80 hover:bg-slate-800/80 text-slate-400 hover:text-slate-200 border-slate-800'
                      }`}
                    >
                      <span className="truncate">{statusOption.replace(/_/g, ' ')}</span>
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Modal Actions Footer */}
            <div className="flex items-center justify-end gap-3 pt-5 border-t border-slate-800/80">
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isUpdatingStatus || selectedStatus === selectedOrder.status}
                className="px-6 py-2.5 rounded-xl text-xs font-extrabold bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 disabled:opacity-50 text-white shadow-lg flex items-center gap-2 transition active:scale-95 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                {isUpdatingStatus ? 'Updating Status...' : 'Save & Update Status'}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Modal to Create Order */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create & Dispatch New Shipment"
        subtitle="Fill in destination address details and total order amount valuation."
        icon={<Send className="w-6 h-6 text-cyan-400" />}
        maxWidth="xl"
      >
        <form onSubmit={handleCreateOrder} className="space-y-5">
          {/* Section: Destination Address */}
          <div className="space-y-4 p-4 rounded-2xl bg-slate-950/40 border border-slate-800/80">
            <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Destination Information
            </h4>
            
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Street Address
              </label>
              <input
                type="text"
                value={destAddress}
                onChange={(e) => setDestAddress(e.target.value)}
                placeholder="e.g. 500 5th Ave"
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 transition"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  City
                </label>
                <input
                  type="text"
                  value={destCity}
                  onChange={(e) => setDestCity(e.target.value)}
                  placeholder="e.g. New York"
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 transition"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Zip Code
                </label>
                <input
                  type="text"
                  value={destZip}
                  onChange={(e) => setDestZip(e.target.value)}
                  placeholder="e.g. 10110"
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 transition"
                  required
                />
              </div>
            </div>
          </div>

          {/* Section: Financials & Currency */}
          <div className="space-y-4 p-4 rounded-2xl bg-slate-950/40 border border-slate-800/80">
            <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Financial & Valuation Details
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
              <div className="sm:col-span-1 space-y-1.5">
                <label className="block text-xs font-semibold text-slate-300">
                  Currency
                </label>
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
              <div className="sm:col-span-2 space-y-1.5">
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
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setShowCreateModal(false)}
              className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmittingOrder}
              className="px-6 py-2.5 rounded-xl text-xs font-extrabold bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 disabled:opacity-50 text-white shadow-lg transition active:scale-95 flex items-center gap-2 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              {isSubmittingOrder ? 'Dispatching...' : 'Dispatch Order'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default OrdersPage;
