import React from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, UserCheck, Truck, ShoppingBag, User } from 'lucide-react';
import { UserRole } from '../types';

export const Navbar: React.FC = () => {
  const { user, switchRoleDemo } = useAuth();

  const roleOptions: { role: UserRole; icon: React.ReactNode; label: string }[] = [
    { role: 'Admin', icon: <ShieldCheck className="w-4 h-4 text-rose-400" />, label: 'Admin View' },
    { role: 'Warehouse Manager', icon: <UserCheck className="w-4 h-4 text-amber-400" />, label: 'Manager View' },
    { role: 'Driver', icon: <Truck className="w-4 h-4 text-cyan-400" />, label: 'Driver View' },
    { role: 'Customer', icon: <ShoppingBag className="w-4 h-4 text-emerald-400" />, label: 'Customer View' },
  ];

  return (
    <header className="h-16 glass-panel border-b border-slate-800/80 px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Search / Title */}
      <div className="flex items-center gap-3">
        <h2 className="text-base font-bold text-white tracking-wide">
          Logistics Control Center
        </h2>
        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
          PostgreSQL + Kafka Event Engine
        </span>
      </div>

      {/* Role Switcher & Active User Profile */}
      <div className="flex items-center gap-4">
        {/* Role Quick Switcher */}
        <div className="flex items-center bg-slate-900/90 p-1 rounded-xl border border-slate-800">
          {roleOptions.map((item) => {
            const isCurrentRole = user?.role === item.role;
            return (
              <button
                key={item.role}
                onClick={() => switchRoleDemo(item.role)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  isCurrentRole
                    ? 'bg-slate-800 text-white shadow border border-slate-700'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title={`Switch to ${item.label}`}
              >
                {item.icon}
                <span className="hidden md:inline">{item.role}</span>
              </button>
            );
          })}
        </div>

        {/* User Badge */}
        {user && (
          <div className="flex items-center gap-2.5 pl-3 border-l border-slate-800">
            <img
              src={user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80'}
              alt={user.full_name}
              className="w-8 h-8 rounded-full border border-cyan-500/40 object-cover"
            />
            <div className="hidden sm:block text-left">
              <div className="text-xs font-bold text-slate-100">{user.full_name}</div>
              <div className="text-[10px] text-cyan-400 font-semibold">{user.role}</div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
