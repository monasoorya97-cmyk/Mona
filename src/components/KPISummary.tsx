import React from 'react';
import { 
  AlertOctagon, 
  Package, 
  Truck, 
  CircleDollarSign, 
  Boxes 
} from 'lucide-react';
import { WMSItem } from '../types/wms';

interface KPISummaryProps {
  items: WMSItem[];
  onFilterInsufficient: () => void;
  onFilterAll: () => void;
}

export const KPISummary: React.FC<KPISummaryProps> = ({
  items,
  onFilterInsufficient,
  onFilterAll,
}) => {
  // Compute calculation metrics: Required - Balance - Extra PO
  let totalDeficitUnits = 0;
  let totalDeficitCost = 0;
  let insufficientItemsCount = 0;
  let totalStockBalance = 0;
  let totalExtraPoStock = 0;

  items.forEach(item => {
    totalStockBalance += item.stockBalance;
    totalExtraPoStock += item.extraPoStock;
    const deficit = item.minRequiredStock - item.stockBalance - item.extraPoStock;
    if (deficit > 0) {
      insufficientItemsCount += 1;
      totalDeficitUnits += deficit;
      totalDeficitCost += deficit * item.unitCost;
    }
  });

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
      {/* 1. Insufficient Stock (Needs Order) */}
      <div 
        onClick={onFilterInsufficient}
        className="p-4 bg-slate-900 border border-rose-500/30 rounded-xl hover:border-rose-500/60 transition-all cursor-pointer group shadow-xs relative overflow-hidden"
      >
        <div className="flex items-center justify-between text-xs text-rose-400 font-medium">
          <span>Shortage / Need to Order</span>
          <AlertOctagon className="w-4 h-4 text-rose-400" />
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-mono font-bold text-rose-400">
            {insufficientItemsCount}
          </span>
          <span className="text-xs text-slate-400">
            of {items.length} SKUs
          </span>
        </div>
        <div className="mt-1 text-[11px] text-rose-400/80">
          Required &gt; (Balance + Extra PO)
        </div>
      </div>

      {/* 2. Total Shortage Units */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
        <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
          <span>Total Shortage Units</span>
          <Boxes className="w-4 h-4 text-slate-500" />
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-mono font-bold text-amber-300">
            {totalDeficitUnits.toLocaleString()}
          </span>
          <span className="text-xs text-slate-400">units to replenish</span>
        </div>
        <div className="mt-1 text-[11px] text-slate-500">
          Net gap to hit preset minimums
        </div>
      </div>

      {/* 3. Estimated Order Cost */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
        <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
          <span>Estimated Reorder Value</span>
          <CircleDollarSign className="w-4 h-4 text-emerald-400" />
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-mono font-bold text-emerald-400">
            ${totalDeficitCost.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </span>
          <span className="text-xs text-slate-400">USD</span>
        </div>
        <div className="mt-1 text-[11px] text-slate-500">
          Based on supplier contract pricing
        </div>
      </div>

      {/* 4. Current Stock Balance */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
        <div className="flex items-center justify-between text-xs text-cyan-400 font-medium">
          <span>Physical Stock Balance</span>
          <Package className="w-4 h-4 text-cyan-400" />
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-mono font-bold text-cyan-300">
            {totalStockBalance.toLocaleString()}
          </span>
          <span className="text-xs text-slate-400">on warehouse floor</span>
        </div>
        <div className="mt-1 text-[11px] text-slate-500">
          Updated via Stock Balance upload
        </div>
      </div>

      {/* 5. Inbound Extra PO Stock */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
        <div className="flex items-center justify-between text-xs text-amber-400 font-medium">
          <span>Extra PO Pipeline</span>
          <Truck className="w-4 h-4 text-amber-400" />
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-mono font-bold text-amber-300">
            {totalExtraPoStock.toLocaleString()}
          </span>
          <span className="text-xs text-slate-400">in-transit / open POs</span>
        </div>
        <div className="mt-1 text-[11px] text-slate-500">
          Updated via Extra PO upload
        </div>
      </div>
    </div>
  );
};
