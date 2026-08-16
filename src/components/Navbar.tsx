import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getGravatarUrl } from '../utils/gravatar';
import { LogOut, Radio, Menu, X, ShieldAlert, CornerUpLeft } from 'lucide-react';

interface NavbarProps {
  isMobileMenuOpen?: boolean;
  onToggleMobileMenu?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ isMobileMenuOpen, onToggleMobileMenu }) => {
  const { user, logout, isImpersonating, stopImpersonating } = useAuth();
  const toast = useToast();
  const [avatarUrl, setAvatarUrl] = useState<string>('');

  useEffect(() => {
    let isMounted = true;
    if (user?.email) {
      getGravatarUrl(user.email, 150, 'identicon').then((url) => {
        if (isMounted) setAvatarUrl(url);
      });
    } else {
      setAvatarUrl('https://www.gravatar.com/avatar/0000000000000000000000000000000000000000000000000000000000000000?d=identicon&s=150');
    }
    return () => {
      isMounted = false;
    };
  }, [user]);

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
  };

  const handleStopImpersonating = async () => {
    await stopImpersonating();
    toast.success('Exited temporary account access. Restored Admin session.');
  };

  return (
    <>
      {/* IMPERSONATION ALERT BAR */}
      {isImpersonating && (
        <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-rose-600 text-white px-4 py-2 text-xs font-bold flex items-center justify-between shadow-lg sticky top-0 z-40 animate-pulse">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-200" />
            <span>
              ⚠️ TEMPORARY ACCOUNT ACCESS ACTIVE (10m SESSION): Logged in as <span className="underline">{user?.full_name}</span> ({user?.role})
            </span>
          </div>
          <button
            onClick={handleStopImpersonating}
            className="px-3 py-1 rounded-lg bg-black/40 hover:bg-black/60 text-amber-200 border border-amber-300/40 text-[11px] font-extrabold flex items-center gap-1.5 transition"
          >
            <CornerUpLeft className="w-3.5 h-3.5" />
            Exit & Return to Admin
          </button>
        </div>
      )}

      <header className="h-16 glass-panel border-b border-slate-800/80 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30">
        {/* Mobile Toggle & Title */}
        <div className="flex items-center gap-3">
          {onToggleMobileMenu && (
            <button
              onClick={onToggleMobileMenu}
              className="md:hidden p-2 rounded-xl bg-slate-900 text-slate-300 hover:text-white border border-slate-800 focus:outline-none"
              aria-label="Toggle navigation menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5 text-cyan-400" /> : <Menu className="w-5 h-5" />}
            </button>
          )}
          <h2 className="text-sm sm:text-base font-extrabold text-white tracking-wide truncate max-w-[180px] sm:max-w-none">
            Logistics Operations Center
          </h2>
          <span className="hidden lg:inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
            <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
            Operational Telemetry Active
          </span>
        </div>

        {/* Active User Profile & Sign Out */}
        <div className="flex items-center gap-3 sm:gap-4">
          {user && (
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="relative group">
                <img
                  src={avatarUrl}
                  alt={user.full_name}
                  className="w-8 h-8 rounded-full border border-cyan-500/40 object-cover shadow-sm bg-slate-800"
                />
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-slate-950" title="Gravatar Sync Active"></div>
              </div>
              <div className="hidden sm:block text-left">
                <div className="text-xs font-bold text-slate-100 truncate max-w-[120px] lg:max-w-none">{user.full_name}</div>
                <div className="text-[10px] text-cyan-400 font-semibold">{user.role}</div>
              </div>
              {isImpersonating ? (
                <button
                  onClick={handleStopImpersonating}
                  className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 transition flex items-center gap-1.5 text-xs font-bold"
                  title="Exit Impersonation"
                >
                  <CornerUpLeft className="w-4 h-4" />
                  <span className="hidden sm:inline">Exit Access</span>
                </button>
              ) : (
                <button
                  onClick={handleLogout}
                  className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-slate-900 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-slate-800 hover:border-rose-500/40 transition flex items-center gap-1.5 text-xs font-semibold"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Sign Out</span>
                </button>
              )}
            </div>
          )}
        </div>
      </header>
    </>
  );
};


