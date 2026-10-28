import React from 'react';
import { 
  Package, 
  Truck, 
  Layers, 
  Upload, 
  ShoppingCart,
  Sliders
} from 'lucide-react';

interface TopNavProps {
  activeTab: 'orders' | 'purchase_orders' | 'logs';
  onSelectTab: (tab: 'orders' | 'purchase_orders' | 'logs') => void;
  onOpenUploadBalance: () => void;
  onOpenUploadExtraPO: () => void;
  onOpenPresetManager: () => void;
  onOpenGeneratePO: () => void;
  insufficientCount: number;
  openPoCount: number;
}

export const TopNav: React.FC<TopNavProps> = ({
  activeTab,
  onSelectTab,
  onOpenUploadBalance,
  onOpenUploadExtraPO,
  onOpenPresetManager,
  onOpenGeneratePO,
  insufficientCount,
  openPoCount,
}) => {
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

      {/* Zone 2: 4-5 clean single-line navigation links */}
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

        <button
          type="button"
          onClick={onOpenPresetManager}
          className="hover:text-white transition-colors whitespace-nowrap shrink-0 flex items-center gap-1"
        >
          <Sliders className="w-3.5 h-3.5 text-indigo-400" />
          <span>Preset Minimums</span>
        </button>

        <button
          type="button"
          onClick={() => onSelectTab('logs')}
          className={`hover:text-white transition-colors whitespace-nowrap shrink-0 ${
            activeTab === 'logs' ? 'text-white font-semibold' : ''
          }`}
        >
          <span>Upload Audit Logs</span>
        </button>
      </nav>

      {/* Zone 3: 2 Upload Icons & Primary Order Trigger */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Upload Icon 1: Stock Balance */}
        <button
          type="button"
          onClick={onOpenUploadBalance}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-cyan-200 bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-500/30 rounded-lg transition-colors whitespace-nowrap shrink-0"
          title="Upload Physical Stock Balance"
          aria-label="Upload Stock Balance"
        >
          <Package className="w-3.5 h-3.5 text-cyan-400" />
          <span className="hidden sm:inline">Upload Balance</span>
          <Upload className="w-3 h-3 text-cyan-400" />
        </button>

        {/* Upload Icon 2: Extra PO Stock */}
        <button
          type="button"
          onClick={onOpenUploadExtraPO}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-amber-200 bg-amber-950/60 hover:bg-amber-900/60 border border-amber-500/30 rounded-lg transition-colors whitespace-nowrap shrink-0"
          title="Upload Extra PO Stock"
          aria-label="Upload Extra PO Stock"
        >
          <Truck className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden sm:inline">Upload Extra PO</span>
          <Upload className="w-3 h-3 text-amber-400" />
        </button>

        {/* Primary Action Button */}
        <button
          type="button"
          onClick={onOpenGeneratePO}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-sm transition-all whitespace-nowrap shrink-0"
        >
          <ShoppingCart className="w-3.5 h-3.5" />
          <span>Generate POs</span>
        </button>
      </div>
    </header>
  );
};
