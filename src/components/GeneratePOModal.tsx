import React, { useState } from 'react';
import { 
  FileText, 
  X, 
  Download, 
  Send, 
  Building2, 
  Calendar, 
  CheckCircle,
  Truck,
  ArrowRight
} from 'lucide-react';
import { WMSItem, PurchaseOrder, PurchaseOrderLineItem } from '../types/wms';
import { exportPurchaseOrderCSV } from '../utils/csvHelper';

interface GeneratePOModalProps {
  isOpen: boolean;
  selectedItems: WMSItem[];
  onClose: () => void;
  onCommitPurchaseOrders: (newPOs: PurchaseOrder[], updateExtraPoStock: boolean) => void;
}

export const GeneratePOModal: React.FC<GeneratePOModalProps> = ({
  isOpen,
  selectedItems,
  onClose,
  onCommitPurchaseOrders,
}) => {
  const [updateExtraPoStock, setUpdateExtraPoStock] = useState(true);
  const [activeSupplierTab, setActiveSupplierTab] = useState<string>('');
  const [expectedDates, setExpectedDates] = useState<Record<string, string>>({});
  const [orderNotes, setOrderNotes] = useState<Record<string, string>>({});
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen || selectedItems.length === 0) return null;

  // Group items by supplier
  const supplierGroups = selectedItems.reduce<Record<string, {
    supplierId: string;
    supplierName: string;
    leadTimeDays: number;
    items: {
      item: WMSItem;
      qtyToOrder: number;
      lineTotal: number;
    }[];
  }>>((acc, item) => {
    const deficit = Math.max(0, item.minRequiredStock - item.stockBalance - item.extraPoStock);
    const qtyToOrder = deficit > 0 ? deficit : 1;
    const lineTotal = qtyToOrder * item.unitCost;

    if (!acc[item.supplierName]) {
      acc[item.supplierName] = {
        supplierId: item.supplierId,
        supplierName: item.supplierName,
        leadTimeDays: item.leadTimeDays,
        items: []
      };
    }
    acc[item.supplierName].items.push({
      item,
      qtyToOrder,
      lineTotal
    });
    return acc;
  }, {});

  const supplierNames = Object.keys(supplierGroups);
  const currentSupplier = activeSupplierTab || supplierNames[0];
  const currentGroup = supplierGroups[currentSupplier] || supplierGroups[supplierNames[0]];

  // Generate target POs
  const createdPOs: PurchaseOrder[] = supplierNames.map((name, index) => {
    const group = supplierGroups[name];
    const today = new Date();
    const delivery = new Date(today.getTime() + (group.leadTimeDays || 7) * 24 * 60 * 60 * 1000);
    const deliveryStr = expectedDates[name] || delivery.toISOString().split('T')[0];

    const lineItems: PurchaseOrderLineItem[] = group.items.map(g => ({
      sku: g.item.sku,
      name: g.item.name,
      unit: g.item.unit,
      qtyToOrder: g.qtyToOrder,
      unitCost: g.item.unitCost,
      lineTotal: g.lineTotal
    }));

    const totalAmount = lineItems.reduce((sum, i) => sum + i.lineTotal, 0);

    return {
      id: `po-${Date.now()}-${index}`,
      poNumber: `PO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      supplierId: group.supplierId,
      supplierName: group.supplierName,
      dateCreated: today.toISOString().split('T')[0],
      expectedDelivery: deliveryStr,
      items: lineItems,
      totalAmount,
      status: 'Sent to Supplier',
      notes: orderNotes[name] || `Replenishment order for insufficient stock buffer. Requested lead time: ${group.leadTimeDays} days.`
    };
  });

  const totalAllOrders = createdPOs.reduce((sum, po) => sum + po.totalAmount, 0);
  const totalItemCount = selectedItems.length;

  const handleIssueOrders = () => {
    onCommitPurchaseOrders(createdPOs, updateExtraPoStock);
    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      onClose();
    }, 700);
  };

  const handleExportCurrent = () => {
    const poToExport = createdPOs.find(p => p.supplierName === currentSupplier);
    if (poToExport) {
      exportPurchaseOrderCSV(poToExport);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
      <div 
        className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-100">
                Generate Supplier Purchase Orders
              </h2>
              <p className="text-xs text-slate-400">
                Auto-grouped by vendor for {totalItemCount} shortage items requiring supplier reorder.
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Supplier Group Tabs */}
        <div className="flex items-center gap-1.5 px-6 pt-3 pb-2 border-b border-slate-800 bg-slate-900/60 overflow-x-auto">
          {supplierNames.map((name) => {
            const count = supplierGroups[name].items.length;
            const isSelected = (currentSupplier === name);
            return (
              <button
                key={name}
                type="button"
                onClick={() => setActiveSupplierTab(name)}
                className={`inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                  isSelected 
                    ? 'bg-slate-800 text-emerald-300 border border-emerald-500/30 shadow-xs' 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>{name}</span>
                <span className="px-1.5 py-0.2 text-[10px] bg-slate-950/80 rounded font-mono text-slate-300">
                  {count} items
                </span>
              </button>
            );
          })}
        </div>

        {/* Active Supplier PO Sheet View */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {currentGroup && (
            <div className="space-y-4">
              {/* Order Meta Card */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 bg-slate-950 border border-slate-800 rounded-lg text-xs">
                <div>
                  <div className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">Supplier Vendor</div>
                  <div className="text-sm font-semibold text-slate-200 mt-0.5">{currentGroup.supplierName}</div>
                  <div className="text-slate-400 text-[11px] mt-0.5">Vendor ID: {currentGroup.supplierId}</div>
                </div>
                <div>
                  <div className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">Standard Lead Time</div>
                  <div className="flex items-center gap-1.5 text-slate-300 mt-0.5 font-medium">
                    <Truck className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{currentGroup.leadTimeDays} business days</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Direct factory dispatch</div>
                </div>
                <div>
                  <label className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    Expected Delivery ETA
                  </label>
                  <input
                    type="date"
                    value={expectedDates[currentSupplier] || new Date(Date.now() + currentGroup.leadTimeDays * 86400000).toISOString().split('T')[0]}
                    onChange={(e) => setExpectedDates(prev => ({ ...prev, [currentSupplier]: e.target.value }))}
                    className="w-full mt-1 px-2.5 py-1 text-xs bg-slate-900 border border-slate-700 rounded text-slate-200 focus:outline-hidden focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Line Items Table */}
              <div className="border border-slate-800 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-800/80 text-slate-400 font-medium border-b border-slate-800">
                    <tr>
                      <th className="px-3 py-2.5">SKU</th>
                      <th className="px-3 py-2.5">Item Description</th>
                      <th className="px-3 py-2.5 text-right">Required Deficit</th>
                      <th className="px-3 py-2.5 text-right">Order Qty</th>
                      <th className="px-3 py-2.5 text-right">Unit Price</th>
                      <th className="px-3 py-2.5 text-right">Line Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono">
                    {currentGroup.items.map((entry, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/30">
                        <td className="px-3 py-2 text-slate-200 font-semibold">{entry.item.sku}</td>
                        <td className="px-3 py-2 font-sans text-slate-300">{entry.item.name}</td>
                        <td className="px-3 py-2 text-right text-rose-400">
                          {Math.max(0, entry.item.minRequiredStock - entry.item.stockBalance - entry.item.extraPoStock)} {entry.item.unit}
                        </td>
                        <td className="px-3 py-2 text-right text-emerald-300 font-bold">
                          {entry.qtyToOrder} {entry.item.unit}
                        </td>
                        <td className="px-3 py-2 text-right text-slate-400">
                          ${entry.item.unitCost.toFixed(2)}
                        </td>
                        <td className="px-3 py-2 text-right text-slate-100 font-semibold">
                          ${entry.lineTotal.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-950 font-mono border-t border-slate-800 text-xs">
                    <tr>
                      <td colSpan={5} className="px-3 py-2.5 text-right text-slate-400 font-sans font-medium">
                        Supplier PO Subtotal:
                      </td>
                      <td className="px-3 py-2.5 text-right text-emerald-400 font-bold">
                        ${currentGroup.items.reduce((sum, i) => sum + i.lineTotal, 0).toFixed(2)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Notes */}
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">
                  PO Order Instructions & Notes to Supplier:
                </label>
                <input
                  type="text"
                  value={orderNotes[currentSupplier] || ''}
                  onChange={(e) => setOrderNotes(prev => ({ ...prev, [currentSupplier]: e.target.value }))}
                  placeholder="e.g. Please confirm delivery date and provide freight tracking number."
                  className="w-full px-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-300 placeholder:text-slate-600 focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              {/* Export PO Button for this vendor */}
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleExportCurrent}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-md transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download {currentSupplier} PO CSV</span>
                </button>
              </div>
            </div>
          )}

          {/* Integration Option: Automatically commit to Extra PO Stock */}
          <div className="p-4 bg-emerald-950/20 border border-emerald-500/30 rounded-xl space-y-1">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={updateExtraPoStock}
                onChange={(e) => setUpdateExtraPoStock(e.target.checked)}
                className="mt-0.5 rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-0 focus:outline-hidden"
              />
              <div>
                <div className="text-xs font-semibold text-emerald-300">
                  Update "Extra PO Stock" pipeline automatically upon order confirmation
                </div>
                <p className="text-[11px] text-slate-400">
                  Adds these ordered quantities into the WMS <strong>Extra PO Stock</strong> column immediately so that the shortage deficit is fulfilled in the calculation.
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-900/80">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>Total Across {supplierNames.length} Vendor POs:</span>
            <span className="font-mono text-emerald-400 font-bold text-sm">
              ${totalAllOrders.toFixed(2)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleIssueOrders}
              className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-lg shadow-emerald-950/50 transition-all"
            >
              {isSuccess ? (
                <>
                  <CheckCircle className="w-4 h-4 text-white" />
                  <span>Purchase Orders Issued!</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Issue {supplierNames.length} Purchase Order(s)</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
