import React from 'react';
import { OrderStatus } from '../types';

interface StatusBadgeProps {
  status: OrderStatus | string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const getStyle = (st: string) => {
    switch (st) {
      case 'CREATED':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      case 'PROCESSING':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'PACKED':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
      case 'SHIPPED':
      case 'IN_TRANSIT':
        return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30 animate-pulse';
      case 'OUT_FOR_DELIVERY':
        return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30';
      case 'DELIVERED':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'CANCELLED':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/30';
    }
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getStyle(status)}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5"></span>
      {status.replace(/_/g, ' ')}
    </span>
  );
};
