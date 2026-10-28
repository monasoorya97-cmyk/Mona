import React, { useState, useRef, useEffect } from 'react';
import { 
  Package, 
  Truck, 
  Upload, 
  ShoppingCart, 
  Sliders, 
  Shield, 
  LogOut, 
  ChevronDown, 
  User, 
  Check, 
  Users,
  Lock
} from 'lucide-react';
import { AppUser } from '../types/auth';

interface TopNavProps {
  currentUser: AppUser;
  allUsers: AppUser[];
  activeTab: 'orders' | 'purchase_orders' | 'logs' | 'users';
  onSelectTab: (tab: 'orders' | 'purchase_orders' | 'logs' | 'users') => void;
  onOpenUploadBalance: () => void;
  onOpenUploadExtraPO: () => void;
  onOpenPresetManager: () => void;
  onOpenGeneratePO: () => void;
  onSwitchUser: (user: AppUser) => void;
  onLogout: () => void;
  insufficientCount: number;
  openPoCount: number;
}

export const TopNav: React.FC<TopNavProps> = ({
  currentUser,
  allUsers,
  activeTab,
  onSelectTab,
  onOpenUploadBalance,
  onOpenUploadExtraPO,
  onOpenPresetManager,
  onOpenGeneratePO,
  onSwitchUser,
  onLogout,
  insufficientCount,
  openPoCount,
}) => {
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const permissions = currentUser.options.permissions;
  const isAdmin = currentUser.role === 'admin' || permissions.canManageUsers;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="flex items-center justify-between gap-8 px-6 py-3.5 bg-slate-900 border-b border-slate-800 sticky top-0 z-40 backdrop-blur-md">
      {/* Zone 1: Single text wordmark */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center font-bold text-white text-sm shadow-md shadow-cyan-950/40">
          W
        </div>
        <span className="text-base font-bold tracking-tight text-white whitespace-nowrap">
          Apex WMS
        </span>
      </div>

      {/* Zone 2: Navigation Links */}
      <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-slate-400">
        <button
          type="button"
          onClick={() => onSelectTab('orders')}
          className={`hover:text-white transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
            activeTab === 'orders' ? 'text-white font-semibold' : ''
          }`}
        >
          <span>Order Management</span>
          {insufficientCount > 0 && (
            <span className="px-1.5 py-0.2 bg-rose-500/20 text-rose-300 rounded font-mono text-[10px] font-bold">
              {insufficientCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => onSelectTab('purchase_orders')}
          className={`hover:text-white transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
            activeTab === 'purchase_orders' ? 'text-white font-semibold' : ''
          }`}
        >
          <span>Purchase Orders</span>
          {openPoCount > 0 && (
            <span className="px-1.5 py-0.2 bg-emerald-500/20 text-emerald-300 rounded font-mono text-[10px] font-bold">
              {openPoCount}
            </span>
          )}
        </button>

        {permissions.canEditPresets && (
          <button
            type="button"
            onClick={onOpenPresetManager}
            className="hover:text-white transition-colors whitespace-nowrap shrink-0 flex items-center gap-1"
          >
            <Sliders className="w-3.5 h-3.5 text-indigo-400" />
            <span>Preset Minimums</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => onSelectTab('logs')}
          className={`hover:text-white transition-colors whitespace-nowrap shrink-0 ${
            activeTab === 'logs' ? 'text-white font-semibold' : ''
          }`}
        >
          <span>Upload Audit Logs</span>
        </button>

        {/* Admin Exclusive: User Management & Options */}
        {isAdmin && (
          <button
            type="button"
            onClick={() => onSelectTab('users')}
            className={`hover:text-indigo-300 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
              activeTab === 'users' ? 'text-indigo-300 font-semibold' : ''
            }`}
          >
            <Users className="w-3.5 h-3.5 text-indigo-400" />
            <span>User Management</span>
          </button>
        )}
      </nav>

      {/* Zone 3: Upload Icons, Primary Action, and User Profile Switcher */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Upload Icon 1: Stock Balance */}
        {permissions.canUploadBalance ? (
          <button
            type="button"
            onClick={onOpenUploadBalance}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-cyan-200 bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-500/30 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            title="Upload Physical Stock Balance"
          >
            <Package className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Upload Balance</span>
            <Upload className="w-3 h-3 text-cyan-400" />
          </button>
        ) : (
          <div 
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-500 bg-slate-900/50 border border-slate-800 rounded-lg whitespace-nowrap shrink-0 opacity-50 cursor-not-allowed"
            title="Balance Upload option disabled by administrator for this account"
          >
            <Lock className="w-3 h-3 text-slate-500" />
            <span className="hidden sm:inline">Upload Balance</span>
          </div>
        )}

        {/* Upload Icon 2: Extra PO Stock */}
        {permissions.canUploadExtraPO ? (
          <button
            type="button"
            onClick={onOpenUploadExtraPO}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-amber-200 bg-amber-950/60 hover:bg-amber-900/60 border border-amber-500/30 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            title="Upload Extra PO Stock"
          >
            <Truck className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Upload Extra PO</span>
            <Upload className="w-3 h-3 text-amber-400" />
          </button>
        ) : (
          <div 
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-500 bg-slate-900/50 border border-slate-800 rounded-lg whitespace-nowrap shrink-0 opacity-50 cursor-not-allowed"
            title="Extra PO upload option disabled by administrator for this account"
          >
            <Lock className="w-3 h-3 text-slate-500" />
            <span className="hidden sm:inline">Upload Extra PO</span>
          </div>
        )}

        {/* Primary Action Button: Generate POs */}
        {permissions.canGeneratePO ? (
          <button
            type="button"
            onClick={onOpenGeneratePO}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-sm transition-all whitespace-nowrap shrink-0 cursor-pointer"
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>Generate POs</span>
          </button>
        ) : null}

        {/* User Account & Switcher Dropdown */}
        <div className="relative pl-2 ml-1 border-l border-slate-800" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setUserDropdownOpen(!userDropdownOpen)}
            className="flex items-center gap-2 p-1 pl-1.5 rounded-lg hover:bg-slate-800 transition-colors select-none text-left"
          >
            <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-slate-200 text-xs">
              {currentUser.displayName.charAt(0)}
            </div>
            <div className="hidden lg:block">
              <div className="text-xs font-semibold text-slate-200 leading-tight">
                {currentUser.displayName.split(' ')[0]}
              </div>
              <div className="text-[10px] text-slate-400 capitalize">
                {currentUser.role}
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
          </button>

          {/* User Options & Role Switcher Menu */}
          {userDropdownOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-1 text-xs">
              {/* Current User Info */}
              <div className="px-3.5 py-2.5 border-b border-slate-800">
                <div className="font-semibold text-slate-200">{currentUser.displayName}</div>
                <div className="text-[11px] text-slate-400 font-mono">@{currentUser.username}</div>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                    currentUser.role === 'admin' ? 'bg-indigo-500/20 text-indigo-300' : 'bg-slate-800 text-slate-300'
                  }`}>
                    {currentUser.role}
                  </span>
                  <span className="text-[10px] text-slate-500">{currentUser.options.warehouseZone}</span>
                </div>
              </div>

              {/* Quick Role Switcher for Testing User Options */}
              <div className="py-1">
                <div className="px-3.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                  Switch Account (Test Permissions)
                </div>
                {allUsers.map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => {
                      onSwitchUser(u);
                      setUserDropdownOpen(false);
                    }}
                    className={`w-full px-3.5 py-1.5 flex items-center justify-between hover:bg-slate-800/80 text-left transition-colors ${
                      u.id === currentUser.id ? 'text-indigo-400 font-semibold' : 'text-slate-300'
                    }`}
                  >
                    <div>
                      <div>{u.displayName}</div>
                      <div className="text-[10px] text-slate-500 capitalize">{u.role}</div>
                    </div>
                    {u.id === currentUser.id && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                  </button>
                ))}
              </div>

              {/* Logout Option */}
              <div className="pt-1 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setUserDropdownOpen(false);
                    onLogout();
                  }}
                  className="w-full px-3.5 py-2 flex items-center gap-2 text-rose-400 hover:bg-rose-950/20 text-left transition-colors font-medium"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
