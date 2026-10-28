import React, { useState } from 'react';
import { 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  ShieldCheck, 
  AlertCircle, 
  Boxes,
  Shield,
  ShoppingCart,
  Package,
  FileSearch
} from 'lucide-react';
import { AppUser } from '../types/auth';

interface LoginScreenProps {
  users: AppUser[];
  onLogin: (user: AppUser) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ users, onLogin }) => {
  const [identifier, setIdentifier] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const trimmedId = identifier.trim().toLowerCase();
    const matched = users.find(
      u => u.username.toLowerCase() === trimmedId || u.email.toLowerCase() === trimmedId
    );

    if (!matched) {
      setErrorMsg('No user found with that username or email.');
      return;
    }

    if (matched.status === 'suspended') {
      setErrorMsg('This account has been suspended by the administrator.');
      return;
    }

    if (matched.passwordHash !== password) {
      setErrorMsg('Incorrect password. Please verify your credentials.');
      return;
    }

    onLogin(matched);
  };

  const handleQuickLogin = (user: AppUser) => {
    setIdentifier(user.username);
    setPassword(user.passwordHash);
    setErrorMsg(null);
    onLogin(user);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 selection:bg-amber-500 selection:text-slate-900">
      {/* Background Accent Gradients */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-cyan-600/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-1/4 right-1/4 w-[450px] h-[300px] bg-indigo-600/10 blur-[100px] rounded-full" />
      </div>

      <div className="relative w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-tr from-cyan-600 to-indigo-600 text-white font-bold text-xl shadow-lg shadow-cyan-950/50 mb-1">
            W
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Apex WMS Portal
          </h1>
          <p className="text-xs text-slate-400">
            Sign in to access Order Management, Stock Deficits & Supplier Procurement
          </p>
        </div>

        {/* Login Form Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-md space-y-5">
          {errorMsg && (
            <div className="p-3 bg-rose-950/40 border border-rose-500/40 rounded-lg flex items-center gap-2.5 text-xs text-rose-300">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Username or Work Email
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="e.g. admin or admin@wms.com"
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 placeholder:text-slate-600 focus:outline-hidden focus:border-cyan-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full pl-9 pr-10 py-2 text-xs font-mono bg-slate-950 border border-slate-800 rounded-lg text-slate-200 placeholder:text-slate-600 focus:outline-hidden focus:border-cyan-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="p-1.5 text-slate-500 hover:text-slate-300 absolute right-2.5 top-1/2 -translate-y-1/2"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-950 text-cyan-500 focus:ring-0 focus:outline-hidden"
                />
                <span>Remember session</span>
              </label>
              <span className="text-slate-500 text-[11px]">
                RBAC Security Protected
              </span>
            </div>

            <button
              type="submit"
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 text-xs font-semibold text-white bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 rounded-lg shadow-lg shadow-cyan-950/50 transition-all cursor-pointer"
            >
              <span>Sign In to WMS</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* Quick Demo Accounts Selector */}
          <div className="pt-4 border-t border-slate-800 space-y-2.5">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 text-center">
              1-Click Demo Accounts (Test User Options)
            </div>

            <div className="grid grid-cols-2 gap-2">
              {users.map((u) => {
                const isAdmin = u.role === 'admin';
                const isProcurement = u.role === 'procurement';
                const isWarehouse = u.role === 'warehouse';

                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => handleQuickLogin(u)}
                    className="p-2.5 bg-slate-950 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 rounded-xl text-left transition-all group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-200 group-hover:text-cyan-300 transition-colors">
                        {u.displayName.split(' ')[0]}
                      </span>
                      {isAdmin && <Shield className="w-3 h-3 text-indigo-400" />}
                      {isProcurement && <ShoppingCart className="w-3 h-3 text-emerald-400" />}
                      {isWarehouse && <Package className="w-3 h-3 text-cyan-400" />}
                      {u.role === 'auditor' && <FileSearch className="w-3 h-3 text-amber-400" />}
                    </div>
                    <div className="text-[10px] text-slate-400 capitalize mt-0.5">
                      {u.role === 'admin' ? 'Administrator' : u.role}
                    </div>
                    <div className="text-[9px] text-slate-500 font-mono mt-0.5">
                      {u.username} / {u.passwordHash}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="text-center text-[11px] text-slate-500">
          User permissions & options are configured by system administrators.
        </div>
      </div>
    </div>
  );
};
