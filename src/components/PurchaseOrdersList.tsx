import React, { useState } from 'react';
import { 
  Building2, 
  Calendar, 
  Download, 
  CheckCircle2, 
  Clock, 
  ArrowUpRight,
  PackageCheck,
  ChevronDown,
  ChevronUp,
  Search
} from 'lucide-react';
import { PurchaseOrder } from '../types/wms';
import { exportPurchaseOrderCSV } from '../utils/csvHelper';

interface PurchaseOrdersListProps {
  purchaseOrders: PurchaseOrder[];
  onReceivePO: (poId: string) => void;
  canReceiveStock?: boolean;
  canExportData?: boolean;
}

export const PurchaseOrdersList: React.FC<PurchaseOrdersListProps> = ({
  purchaseOrders,
  onReceivePO,
  canReceiveStock = true,
  canExportData = true,
}) => {
  const [expandedId, setExpandedId] = useState<string | null>(purchaseOrders[0]?.id || null);
  const [search, setSearch] = useState('');

  const filteredOrders = purchaseOrders.filter(po => 
    po.poNumber.toLowerCase().includes(search.toLowerCase()) ||
    po.supplierName.toLowerCase().includes(search.toLowerCase()) ||
    po.items.some(i => i.sku.toLowerCase().includes(search.toLowerCase()) || i.name.toLowerCase().includes(search.toLowerCase()))
  );

  const totalValue = purchaseOrders.reduce((sum, p) => sum + p.totalAmount, 0);

  return (
    <div className="space-y-4">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-slate-900 border border-slate-800 rounded-xl">
        <div className="flex items-center gap-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-100">
              Supplier Purchase Orders & Inbound Tracking
            </h3>
            <p className="text-xs text-slate-400">
              Issued replenishment orders contributing to Extra PO Stock pipeline.
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-2 pl-4 border-l border-slate-800 text-xs text-slate-400">
            <span>Total Inbound Orders:</span>
            <span className="font-mono text-emerald-400 font-semibold">{purchaseOrders.length}</span>
            <span className="text-slate-600">·</span>
            <span>Value:</span>
            <span className="font-mono text-slate-200 font-semibold">${totalValue.toFixed(2)}</span>
          </div>
        </div>

        <div className="relative w-64">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter PO# or Supplier..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 placeholder:text-slate-500 focus:outline-hidden focus:border-cyan-500"
          />
        </div>
      </div>

      {/* PO Cards / Rows */}
      {filteredOrders.length === 0 ? (
        <div className="p-8 text-center bg-slate-900/40 border border-slate-800 rounded-xl">
          <p className="text-sm text-slate-400">No purchase orders found matching your search.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredOrders.map((po) => {
            const isExpanded = expandedId === po.id;
            const isFulfilled = po.status === 'Fulfilled';

            return (
              <div 
                key={po.id}
                className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden transition-all"
              >
                {/* Header Row */}
                <div 
                  onClick={() => setExpandedId(isExpanded ? null : po.id)}
                  className="flex flex-wrap items-center justify-between gap-4 p-4 cursor-pointer hover:bg-slate-800/40 select-none"
                >
                  <div className="flex items-center gap-3">
                    <button 
                      type="button" 
                      className="text-slate-400 p-0.5"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-sm text-cyan-400">{po.poNumber}</span>
                        <span className="text-slate-600">·</span>
                        <span className="text-xs font-semibold text-slate-200">{po.supplierName}</span>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-0.5">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-500" />
                          Created: {po.dateCreated}
                        </span>
                        <span className="text-slate-600">·</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-amber-500" />
                          Expected: {po.expectedDelivery}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-xs text-slate-400">{po.items.length} line items</div>
                      <div className="text-sm font-mono font-bold text-slate-100">
                        ${po.totalAmount.toFixed(2)}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full ${
                        isFulfilled 
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}>
                        {isFulfilled ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                        {po.status}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="p-4 pt-0 border-t border-slate-800/80 bg-slate-950/40 space-y-4">
                    {po.notes && (
                      <p className="text-xs text-slate-400 italic pt-3">
                        Note: {po.notes}
                      </p>
                    )}

                    <div className="overflow-x-auto border border-slate-800/80 rounded-lg">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-900 text-slate-400 border-b border-slate-800">
                          <tr>
                            <th className="px-3 py-2">ISBN / SKU</th>
                            <th className="px-3 py-2">Book Title</th>
                            <th className="px-3 py-2 text-right">Quantity Ordered</th>
                            <th className="px-3 py-2 text-right">Unit Price</th>
                            <th className="px-3 py-2 text-right">Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60 font-mono">
                          {po.items.map((item, idx) => (
                            <tr key={idx} className="hover:bg-slate-900/40">
                              <td className="px-3 py-2 font-semibold text-slate-200">{item.isbn || item.sku}</td>
                              <td className="px-3 py-2 font-sans text-slate-300 font-medium">{item.title || item.name}</td>
                              <td className="px-3 py-2 text-right text-cyan-300 font-bold">
                                {item.qtyToOrder} {item.unit}
                              </td>
                              <td className="px-3 py-2 text-right text-slate-400">
                                ${item.unitCost.toFixed(2)}
                              </td>
                              <td className="px-3 py-2 text-right text-slate-200 font-semibold">
                                ${item.lineTotal.toFixed(2)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                      {canExportData && (
                        <button
                          type="button"
                          onClick={() => exportPurchaseOrderCSV(po)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-md border border-slate-700 transition-colors cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" />
                          Download PO CSV
                        </button>
                      )}

                      {!isFulfilled && canReceiveStock && (
                        <button
                          type="button"
                          onClick={() => onReceivePO(po.id)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-md shadow-xs transition-colors cursor-pointer"
                          title="Transfer this PO stock into Physical Stock Balance and mark PO fulfilled"
                        >
                          <PackageCheck className="w-3.5 h-3.5" />
                          Receive Shipment into Stock Balance
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
