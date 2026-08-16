import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getGravatarUrl } from '../utils/gravatar';
import { UserRole } from '../types';
import { Radio, Lock, Mail, User, ArrowRight, Sparkles } from 'lucide-react';

export const AuthPage: React.FC = () => {
  const { login, register } = useAuth();
  const toast = useToast();

  const [isLoginTab, setIsLoginTab] = useState(true);
  const [loading, setLoading] = useState(false);

  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<UserRole>('Customer');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.warning('Please enter both email and password.');
      return;
    }
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Successfully logged in!');
    } catch (err: any) {
      toast.error(err.message || 'Authentication failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !fullName) {
      toast.warning('Please fill in all required fields.');
      return;
    }
    // Prevent admin role self-registration
    if (role === ('Admin' as UserRole)) {
      toast.error('Admin role accounts cannot be created via public sign up.');
      return;
    }
    setLoading(true);
    try {
      await register(fullName, email, password, role);
      toast.success(`Account created successfully! Welcome, ${fullName}.`);
    } catch (err: any) {
      toast.error(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const [currentGravatar, setCurrentGravatar] = useState<string>('');

  React.useEffect(() => {
    let isMounted = true;
    if (email) {
      getGravatarUrl(email, 80, 'identicon').then((url) => {
        if (isMounted) setCurrentGravatar(url);
      });
    } else {
      setCurrentGravatar('');
    }
    return () => {
      isMounted = false;
    };
  }, [email]);

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 flex items-center justify-start p-4 sm:p-8 lg:p-16 relative overflow-hidden">
      {/* 3D Spline Cyber Mannequin Background Scene */}
      <div className="fixed inset-0 w-full h-full z-0 pointer-events-auto overflow-hidden">
        <iframe
          src="https://my.spline.design/cybermannequin-HszLsDs9YF2LghTrrfK6JhSW/"
          frameBorder="0"
          width="100%"
          height="100%"
          className="w-full h-full border-0 pointer-events-auto"
          title="3D Cyber Mannequin Background"
        ></iframe>

        {/* Clean Dark Bottom-Right Overlay (No pointer events) */}
        <div className="fixed bottom-0 right-0 w-44 h-14 bg-slate-950 z-20 pointer-events-none"></div>
      </div>

      {/* Gradient Backdrop Overlay for Text Contrast */}
      <div className="fixed inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/50 to-transparent pointer-events-none z-0"></div>

      {/* Left-Aligned Auth Glass Panel */}
      <div className="w-full max-w-md relative z-10 space-y-6 my-auto ml-0 md:ml-4 lg:ml-12">
        {/* Brand Logo Header */}
        <div className="text-left space-y-1.5">
          <div className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-2xl bg-slate-900/80 border border-slate-700/80 backdrop-blur-md shadow-xl mb-1">
            <Radio className="w-5 h-5 text-cyan-400 animate-pulse" />
            <span className="text-xs font-bold text-slate-200 tracking-wider">DLM OPERATIONAL CONTROL</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Logistics Portal</h1>
          <p className="text-xs text-slate-300">Distributed Operations & Telemetry Platform</p>
        </div>

        {/* Main Auth Glass Panel */}
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-700/60 backdrop-blur-2xl bg-slate-950/80 shadow-2xl space-y-6">
          {/* Tab Switcher */}
          <div className="flex bg-slate-900/90 p-1 rounded-2xl border border-slate-800">
            <button
              onClick={() => setIsLoginTab(true)}
              className={`flex-1 py-2.5 rounded-xl font-bold text-xs transition-all ${
                isLoginTab
                  ? 'bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-lg'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setIsLoginTab(false)}
              className={`flex-1 py-2.5 rounded-xl font-bold text-xs transition-all ${
                !isLoginTab
                  ? 'bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-lg'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Create Account
            </button>
          </div>

          {/* LOGIN FORM */}
          {isLoginTab ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-300">Work Email</label>
                  {email && (
                    <span className="text-[10px] text-cyan-400 font-semibold flex items-center gap-1">
                      <img src={currentGravatar} alt="Gravatar" className="w-4 h-4 rounded-full" />
                      Gravatar Linked
                    </span>
                  )}
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl font-extrabold text-xs bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white shadow-lg flex items-center justify-center gap-2 glow-cyan"
              >
                {loading ? 'Authenticating...' : 'Sign In'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          ) : (
            /* SIGNUP FORM */
            <form onSubmit={handleSignup} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Alex Mercer"
                    className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition"
                    required
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-300">Work Email</label>
                  {email && (
                    <span className="text-[10px] text-cyan-400 font-semibold flex items-center gap-1">
                      <img src={currentGravatar} alt="Gravatar" className="w-4 h-4 rounded-full" />
                      Gravatar Linked
                    </span>
                  )}
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Account Type</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="Customer">Customer (Shipment Tracking & Orders)</option>
                  <option value="Driver">Driver (Fleet Operations & Deliveries)</option>
                  <option value="Warehouse Manager">Warehouse Manager (Stock & Hubs)</option>
                </select>
                <p className="text-[10px] text-slate-400 mt-1">Admin access requires authorization from a system administrator.</p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl font-extrabold text-xs bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white shadow-lg flex items-center justify-center gap-2 glow-cyan"
              >
                {loading ? 'Creating Account...' : 'Register & Enter Platform'}
                <Sparkles className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

