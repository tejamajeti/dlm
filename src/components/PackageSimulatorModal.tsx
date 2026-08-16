import React, { useState } from 'react';
import { Order, OrderStatus } from '../types';
import api from '../services/api';
import { X, Send, Radio, CheckCircle2 } from 'lucide-react';

interface PackageSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: Order[];
  onOrderUpdated: () => void;
}

export const PackageSimulatorModal: React.FC<PackageSimulatorModalProps> = ({
  isOpen,
  onClose,
  orders,
  onOrderUpdated,
}) => {
  const [selectedOrderId, setSelectedOrderId] = useState<string>(orders[0]?.id || '');
  const [newStatus, setNewStatus] = useState<OrderStatus>('SHIPPED');
  const [currentLocation, setCurrentLocation] = useState<string>('Interstate I-95 Highway Mile 42');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [lastEmittedEvent, setLastEmittedEvent] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderId) return;

    setIsSubmitting(true);
    try {
      const res: any = await api.patch(`/protected/orders/${selectedOrderId}/status`, {
        status: newStatus,
        current_location: currentLocation,
      });

      if (res.success) {
        let topic = 'order.packed';
        if (newStatus === 'SHIPPED' || newStatus === 'IN_TRANSIT') topic = 'package.shipped';
        if (newStatus === 'DELIVERED') topic = 'package.delivered';
        if (newStatus === 'CANCELLED') topic = 'order.cancelled';

        setLastEmittedEvent(topic);
        onOrderUpdated();
        setTimeout(() => {
          setLastEmittedEvent(null);
          onClose();
        }, 1500);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update order event');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="glass-panel w-full max-w-lg rounded-2xl p-6 border border-slate-700/80 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
            <Radio className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Kafka Event Dispatcher</h3>
            <p className="text-xs text-slate-400">Simulate live logistics telemetry & event topics</p>
          </div>
        </div>

        {lastEmittedEvent ? (
          <div className="p-6 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-center my-4">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
            <h4 className="font-bold text-white text-base">Kafka Topic Published!</h4>
            <p className="text-xs font-mono text-emerald-300 mt-1">Topic: {lastEmittedEvent}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Select Active Order</label>
              <select
                value={selectedOrderId}
                onChange={(e) => setSelectedOrderId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500"
              >
                {orders.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.tracking_number} ({o.status}) - ${o.total_amount}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Transition Order State</label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as OrderStatus)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="PROCESSING">PROCESSING</option>
                <option value="PACKED">PACKED (order.packed)</option>
                <option value="SHIPPED">SHIPPED (package.shipped)</option>
                <option value="IN_TRANSIT">IN_TRANSIT (package.shipped)</option>
                <option value="OUT_FOR_DELIVERY">OUT_FOR_DELIVERY</option>
                <option value="DELIVERED">DELIVERED (package.delivered)</option>
                <option value="CANCELLED">CANCELLED (order.cancelled)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Telemetry GPS Location</label>
              <input
                type="text"
                value={currentLocation}
                onChange={(e) => setCurrentLocation(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500"
                placeholder="e.g. Chicago Regional Transit Hub #3"
              />
            </div>

            <div className="pt-2 flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white shadow-lg flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                {isSubmitting ? 'Publishing Event...' : 'Emit Event to Kafka'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
