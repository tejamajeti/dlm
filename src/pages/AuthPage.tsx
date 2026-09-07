import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getGravatarUrl } from '../utils/gravatar';
import { UserRole } from '../types';
import { Radio, Lock, Mail, User, ArrowRight, Sparkles, Package, Truck, Warehouse, CheckCircle2, X } from 'lucide-react';
import { SEO } from '../components/SEO';

export const AuthPage: React.FC = () => {
  const { login, register, loginWithGoogle } = useAuth();
  const toast = useToast();

  const [isLoginTab, setIsLoginTab] = useState(true);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [pendingGoogleAuth, setPendingGoogleAuth] = useState<{
    credential?: string;
    accessToken?: string;
    profile?: { name: string; email: string; avatar?: string };
  } | null>(null);
  const [selectedOnboardingRole, setSelectedOnboardingRole] = useState<UserRole>('Customer');

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

  const handleGoogleCredentialResponse = async (credential: string) => {
    setGoogleLoading(true);
    try {
      const res = await loginWithGoogle({ credential });
      if (res && res.isNewUser) {
        setPendingGoogleAuth({
          credential,
          profile: res.profile,
        });
      } else {
        toast.success('Successfully authenticated with Google!');
      }
    } catch (err: any) {
      toast.error(err.message || 'Google authentication failed.');
    } finally {
      setGoogleLoading(false);
    }
  };

  React.useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) return;

    const initOneTap = () => {
      const google = (window as any).google;
      if (!google?.accounts?.id) return;

      google.accounts.id.initialize({
        client_id: clientId,
        callback: async (response: any) => {
          if (response?.credential) {
            await handleGoogleCredentialResponse(response.credential);
          }
        },
        auto_select: false,
        cancel_on_tap_outside: true,
      });

      // Auto-trigger Google One Tap prompt on page load
      google.accounts.id.prompt();
    };

    if (typeof window !== 'undefined') {
      if (!document.getElementById('google-gsi-client')) {
        const script = document.createElement('script');
        script.id = 'google-gsi-client';
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        script.onload = () => {
          initOneTap();
        };
        document.head.appendChild(script);
      } else {
        initOneTap();
      }
    }
  }, []);

  const handleGoogleSignIn = async () => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) {
      toast.info('Google Client ID is not Configured....');
      return;
    }

    const google = (window as any).google;
    if (!google?.accounts?.id) {
      toast.error('Google Sign-In service is loading. Please try again.');
      return;
    }

    setGoogleLoading(true);
    try {
      google.accounts.id.initialize({
        client_id: clientId,
        callback: async (response: any) => {
          if (response?.credential) {
            await handleGoogleCredentialResponse(response.credential);
          } else {
            setGoogleLoading(false);
          }
        },
      });

      google.accounts.id.prompt((notification: any) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          try {
            const tokenClient = google.accounts.oauth2.initTokenClient({
              client_id: clientId,
              scope: 'email profile openid',
              callback: async (tokenResp: any) => {
                if (tokenResp?.access_token) {
                  try {
                    const res = await loginWithGoogle({ accessToken: tokenResp.access_token });
                    if (res && res.isNewUser) {
                      setPendingGoogleAuth({
                        accessToken: tokenResp.access_token,
                        profile: res.profile,
                      });
                    } else {
                      toast.success('Successfully authenticated with Google!');
                    }
                  } catch (err: any) {
                    toast.error(err.message || 'Google authentication failed.');
                  }
                }
                setGoogleLoading(false);
              },
              error_callback: () => {
                setGoogleLoading(false);
              },
            });
            tokenClient.requestAccessToken();
          } catch {
            setGoogleLoading(false);
          }
        }
      });
    } catch (err: any) {
      toast.error(err.message || 'Failed to initialize Google Sign In');
      setGoogleLoading(false);
    }
  };

  const handleCompleteGoogleOnboarding = async () => {
    if (!pendingGoogleAuth) return;
    setGoogleLoading(true);
    try {
      await loginWithGoogle({
        credential: pendingGoogleAuth.credential,
        accessToken: pendingGoogleAuth.accessToken,
        role: selectedOnboardingRole,
      });
      toast.success(
        `Welcome to Synapship, ${pendingGoogleAuth.profile?.name || 'User'}! Account created as ${selectedOnboardingRole}.`
      );
      setPendingGoogleAuth(null);
    } catch (err: any) {
      toast.error(err.message || 'Failed to complete registration.');
    } finally {
      setGoogleLoading(false);
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
      <SEO
        title="Authentication & Sign In - Synapship"
        description="Sign in or register for the Synapship Distributed Logistics Platform."
      />
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
            <span className="text-xs font-bold text-slate-200 tracking-wider">SYNAPSHIP OPERATIONAL CONTROL</span>
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
                disabled={loading || googleLoading}
                className="w-full py-3 rounded-xl font-extrabold text-xs bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white shadow-lg flex items-center justify-center gap-2 glow-cyan"
              >
                {loading ? 'Authenticating...' : 'Sign In'}
                <ArrowRight className="w-4 h-4" />
              </button>

              {/* Divider */}
              <div className="relative my-3">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-700/80" />
                </div>
                <div className="relative flex justify-center text-[11px]">
                  <span className="bg-slate-950/80 px-2 text-slate-400">or</span>
                </div>
              </div>

              {/* Continue with Google Button */}
              <div>
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={loading || googleLoading}
                  className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 bg-slate-900/90 hover:bg-slate-800/90 active:bg-slate-800 text-white border border-slate-700/80 rounded-xl text-xs font-semibold shadow-sm transition duration-150 cursor-pointer disabled:opacity-50"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.16 0 9.98 0 12s.45 3.84 1.25 5.42l4.03-3.15z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                    />
                  </svg>
                  <span>{googleLoading ? 'Connecting to Google...' : 'Continue with Google'}</span>
                </button>
              </div>
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
                disabled={loading || googleLoading}
                className="w-full py-3 rounded-xl font-extrabold text-xs bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white shadow-lg flex items-center justify-center gap-2 glow-cyan"
              >
                {loading ? 'Creating Account...' : 'Register & Enter Platform'}
                <Sparkles className="w-4 h-4" />
              </button>

              {/* Divider */}
              <div className="relative my-3">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-700/80" />
                </div>
                <div className="relative flex justify-center text-[11px]">
                  <span className="bg-slate-950/90 px-2 text-slate-400">or</span>
                </div>
              </div>

              {/* Continue with Google Button */}
              <div>
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={loading || googleLoading}
                  className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 bg-slate-900/90 hover:bg-slate-800/90 active:bg-slate-800 text-white border border-slate-700/80 rounded-xl text-xs font-semibold shadow-sm transition duration-150 cursor-pointer disabled:opacity-50"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.16 0 9.98 0 12s.45 3.84 1.25 5.42l4.03-3.15z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                    />
                  </svg>
                  <span>{googleLoading ? 'Connecting to Google...' : 'Continue with Google'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* First-Time Google Onboarding Modal */}
      {pendingGoogleAuth && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
          <div className="max-w-md w-full bg-slate-900 border border-slate-700/80 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5 text-white relative">
            {/* Close Button */}
            <button
              onClick={() => setPendingGoogleAuth(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Profile Header */}
            <div className="text-center space-y-2">
              {pendingGoogleAuth.profile?.avatar ? (
                <img
                  src={pendingGoogleAuth.profile.avatar}
                  alt={pendingGoogleAuth.profile.name}
                  className="w-16 h-16 rounded-full mx-auto border-2 border-cyan-400 shadow-md object-cover"
                />
              ) : (
                <div className="w-16 h-16 rounded-full mx-auto bg-slate-800 border-2 border-cyan-400 flex items-center justify-center text-cyan-400 text-xl font-bold">
                  {pendingGoogleAuth.profile?.name?.charAt(0) || 'U'}
                </div>
              )}
              <h2 className="text-lg sm:text-xl font-extrabold tracking-tight text-white">
                Welcome, {pendingGoogleAuth.profile?.name || 'Partner'}!
              </h2>
              <p className="text-xs text-slate-300">
                To finalize your registration, select your operational role. This configures your platform workspace.
              </p>
            </div>

            {/* Role Options */}
            <div className="space-y-2.5">
              {/* Customer */}
              <button
                type="button"
                onClick={() => setSelectedOnboardingRole('Customer')}
                className={`w-full text-left p-3.5 rounded-2xl border transition-all flex items-center gap-3.5 cursor-pointer ${
                  selectedOnboardingRole === 'Customer'
                    ? 'border-cyan-400 bg-cyan-500/10 shadow-lg shadow-cyan-500/10'
                    : 'border-slate-800 bg-slate-950/60 hover:border-slate-700 hover:bg-slate-800/40'
                }`}
              >
                <div className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-400 shrink-0">
                  <Package className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">Customer</span>
                    {selectedOnboardingRole === 'Customer' && <CheckCircle2 className="w-4 h-4 text-cyan-400" />}
                  </div>
                  <p className="text-[11px] text-slate-400 truncate">Shipment booking, orders & live tracking</p>
                </div>
              </button>

              {/* Driver */}
              <button
                type="button"
                onClick={() => setSelectedOnboardingRole('Driver')}
                className={`w-full text-left p-3.5 rounded-2xl border transition-all flex items-center gap-3.5 cursor-pointer ${
                  selectedOnboardingRole === 'Driver'
                    ? 'border-emerald-400 bg-emerald-500/10 shadow-lg shadow-emerald-500/10'
                    : 'border-slate-800 bg-slate-950/60 hover:border-slate-700 hover:bg-slate-800/40'
                }`}
              >
                <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 shrink-0">
                  <Truck className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">Driver</span>
                    {selectedOnboardingRole === 'Driver' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                  </div>
                  <p className="text-[11px] text-slate-400 truncate">Fleet telemetry, GPS routes & delivery completion</p>
                </div>
              </button>

              {/* Warehouse Manager */}
              <button
                type="button"
                onClick={() => setSelectedOnboardingRole('Warehouse Manager')}
                className={`w-full text-left p-3.5 rounded-2xl border transition-all flex items-center gap-3.5 cursor-pointer ${
                  selectedOnboardingRole === 'Warehouse Manager'
                    ? 'border-amber-400 bg-amber-500/10 shadow-lg shadow-amber-500/10'
                    : 'border-slate-800 bg-slate-950/60 hover:border-slate-700 hover:bg-slate-800/40'
                }`}
              >
                <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 shrink-0">
                  <Warehouse className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">Warehouse Manager</span>
                    {selectedOnboardingRole === 'Warehouse Manager' && <CheckCircle2 className="w-4 h-4 text-amber-400" />}
                  </div>
                  <p className="text-[11px] text-slate-400 truncate">Inventory levels, hub storage & dispatch schedules</p>
                </div>
              </button>
            </div>

            {/* Confirm CTA */}
            <button
              type="button"
              onClick={handleCompleteGoogleOnboarding}
              disabled={googleLoading}
              className="w-full py-3 px-4 rounded-xl font-bold text-xs bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white shadow-lg flex items-center justify-center gap-2 transition duration-150 cursor-pointer disabled:opacity-50"
            >
              {googleLoading ? 'Finalizing Profile...' : `Continue as ${selectedOnboardingRole}`}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuthPage;

