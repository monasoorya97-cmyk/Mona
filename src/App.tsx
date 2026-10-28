import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Truck, 
  Layers, 
  RotateCcw, 
  Info, 
  CheckCircle2, 
  AlertCircle,
  HelpCircle,
  ChevronRight
} from 'lucide-react';
import { WMSItem, PurchaseOrder, UploadBatchLog } from './types/wms';
import { INITIAL_WMS_ITEMS, INITIAL_PURCHASE_ORDERS } from './data/defaultCatalog';
import { TopNav } from './components/TopNav';
import { KPISummary } from './components/KPISummary';
import { OrderManagementTable } from './components/OrderManagementTable';
import { UploadModal } from './components/UploadModal';
import { PresetStockModal } from './components/PresetStockModal';
import { GeneratePOModal } from './components/GeneratePOModal';
import { PurchaseOrdersList } from './components/PurchaseOrdersList';
import { AuditLogsView } from './components/AuditLogsView';

const STORAGE_KEY_ITEMS = 'apex_wms_items_v1';
const STORAGE_KEY_POS = 'apex_wms_pos_v1';
const STORAGE_KEY_LOGS = 'apex_wms_logs_v1';

export default function App() {
  // Main Data States
  const [items, setItems] = useState<WMSItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_ITEMS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load items from localStorage', e);
    }
    return INITIAL_WMS_ITEMS;
  });

  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_POS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load POs from localStorage', e);
    }
    return INITIAL_PURCHASE_ORDERS;
  });

  const [uploadLogs, setUploadLogs] = useState<UploadBatchLog[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_LOGS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load logs from localStorage', e);
    }
    return [
      {
        id: 'log-init-1',
        type: 'stock_balance',
        filename: 'warehouse_physical_count_oct24.csv',
        timestamp: '2026-10-24 09:30',
        recordsCount: 12,
        successCount: 12,
        errorCount: 0
      },
      {
        id: 'log-init-2',
        type: 'extra_po',
        filename: 'supplier_open_po_manifest.csv',
        timestamp: '2026-10-25 14:15',
        recordsCount: 8,
        successCount: 8,
        errorCount: 0
      }
    ];
  });

  // UI Navigation & Modal states
  const [activeTab, setActiveTab] = useState<'orders' | 'purchase_orders' | 'logs'>('orders');
  const [selectedSkus, setSelectedSkus] = useState<Set<string>>(new Set());
  const [uploadType, setUploadType] = useState<'stock_balance' | 'extra_po' | null>(null);
  const [presetModalOpen, setPresetModalOpen] = useState(false);
  const [generatePoModalOpen, setGeneratePoModalOpen] = useState(false);
  const [targetPoItems, setTargetPoItems] = useState<WMSItem[]>([]);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' } | null>(null);

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_ITEMS, JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_POS, JSON.stringify(purchaseOrders));
  }, [purchaseOrders]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(uploadLogs));
  }, [uploadLogs]);

  const showToast = (text: string, type: 'success' | 'info' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Selection handlers
  const handleToggleSelectSku = (sku: string) => {
    setSelectedSkus(prev => {
      const next = new Set(prev);
      if (next.has(sku)) next.delete(sku);
      else next.add(sku);
      return next;
    });
  };

  const handleToggleSelectAll = (skus: string[]) => {
    setSelectedSkus(prev => {
      const allSelected = skus.every(s => prev.has(s));
      if (allSelected) {
        return new Set();
      } else {
        return new Set(skus);
      }
    });
  };

  // Apply Stock Balance Upload (Icon 1)
  const handleApplyStockBalance = (
    updates: { sku: string; stockBalance: number; locationBin?: string }[],
    mode: 'replace' | 'additive'
  ) => {
    const updateMap = new Map(updates.map(u => [u.sku.toUpperCase(), u]));
    const now = new Date().toISOString().replace('T', ' ').slice(0, 16);
    let matchedCount = 0;

    setItems(prevItems => {
      return prevItems.map(item => {
        const update = updateMap.get(item.sku.toUpperCase());
        if (update) {
          matchedCount += 1;
          const newBalance = mode === 'replace'
            ? update.stockBalance
            : item.stockBalance + update.stockBalance;
          return {
            ...item,
            stockBalance: Math.max(0, newBalance),
            locationBin: update.locationBin || item.locationBin,
            lastBalanceUpdate: `${now} (${mode === 'replace' ? 'Set' : '+Added'})`
          };
        }
        return item;
      });
    });

    // Add upload audit log
    const newLog: UploadBatchLog = {
      id: `log-${Date.now()}`,
      type: 'stock_balance',
      filename: `Stock_Balance_${mode === 'replace' ? 'Set' : 'Add'}_${now.split(' ')[0]}.csv`,
      timestamp: now,
      recordsCount: updates.length,
      successCount: matchedCount,
      errorCount: updates.length - matchedCount
    };
    setUploadLogs(prev => [newLog, ...prev]);

    showToast(`Successfully updated Stock Balance for ${matchedCount} warehouse items.`);
  };

  // Apply Extra PO Stock Upload (Icon 2)
  const handleApplyExtraPO = (
    updates: { sku: string; extraPoQty: number; poNumber?: string; supplierName?: string }[],
    mode: 'replace' | 'additive'
  ) => {
    const updateMap = new Map(updates.map(u => [u.sku.toUpperCase(), u]));
    const now = new Date().toISOString().replace('T', ' ').slice(0, 16);
    let matchedCount = 0;

    setItems(prevItems => {
      return prevItems.map(item => {
        const update = updateMap.get(item.sku.toUpperCase());
        if (update) {
          matchedCount += 1;
          const newPO = mode === 'replace'
            ? update.extraPoQty
            : item.extraPoStock + update.extraPoQty;
          return {
            ...item,
            extraPoStock: Math.max(0, newPO),
            lastPoUpdate: `${now} (${mode === 'replace' ? 'Set' : '+Added'})`
          };
        }
        return item;
      });
    });

    const newLog: UploadBatchLog = {
      id: `log-${Date.now()}`,
      type: 'extra_po',
      filename: `Extra_PO_Manifest_${now.split(' ')[0]}.csv`,
      timestamp: now,
      recordsCount: updates.length,
      successCount: matchedCount,
      errorCount: updates.length - matchedCount
    };
    setUploadLogs(prev => [newLog, ...prev]);

    showToast(`Successfully updated Extra PO Stock for ${matchedCount} SKUs.`);
  };

  // Commit Generated Purchase Orders
  const handleCommitPurchaseOrders = (newPOs: PurchaseOrder[], updateExtraPoStock: boolean) => {
    setPurchaseOrders(prev => [...newPOs, ...prev]);

    if (updateExtraPoStock) {
      // Accumulate ordered quantities per SKU
      const orderedQtyMap = new Map<string, number>();
      newPOs.forEach(po => {
        po.items.forEach(line => {
          const current = orderedQtyMap.get(line.sku) || 0;
          orderedQtyMap.set(line.sku, current + line.qtyToOrder);
        });
      });

      const now = new Date().toISOString().replace('T', ' ').slice(0, 16);

      setItems(prev => prev.map(item => {
        const qtyAdded = orderedQtyMap.get(item.sku);
        if (qtyAdded) {
          return {
            ...item,
            extraPoStock: item.extraPoStock + qtyAdded,
            lastPoUpdate: `${now} (+${qtyAdded} PO)`
          };
        }
        return item;
      }));

      showToast(`Created ${newPOs.length} Purchase Order(s) and automatically added ordered units to Extra PO pipeline!`);
    } else {
      showToast(`Created ${newPOs.length} Purchase Order(s) for supplier dispatch.`);
    }

    setSelectedSkus(new Set());
    setActiveTab('purchase_orders');
  };

  // Receive stock from purchase order into physical warehouse balance
  const handleReceivePO = (poId: string) => {
    const po = purchaseOrders.find(p => p.id === poId);
    if (!po) return;

    const now = new Date().toISOString().replace('T', ' ').slice(0, 16);

    // Transfer PO quantities into stockBalance and remove from extraPoStock
    setItems(prev => prev.map(item => {
      const matchLine = po.items.find(l => l.sku === item.sku);
      if (matchLine) {
        return {
          ...item,
          stockBalance: item.stockBalance + matchLine.qtyToOrder,
          extraPoStock: Math.max(0, item.extraPoStock - matchLine.qtyToOrder),
          lastBalanceUpdate: `${now} (Received ${po.poNumber})`
        };
      }
      return item;
    }));

    setPurchaseOrders(prev => prev.map(p => p.id === poId ? { ...p, status: 'Fulfilled' } : p));
    showToast(`Shipment for ${po.poNumber} received! Stock Balance credited and Extra PO pipeline updated.`);
  };

  // Quick edit single item
  const handleQuickUpdateItem = (updatedItem: WMSItem) => {
    setItems(prev => prev.map(i => i.id === updatedItem.id ? updatedItem : i));
    showToast(`Updated SKU ${updatedItem.sku}`);
  };

  // Reset to factory sample state
  const handleResetToDemo = () => {
    if (window.confirm('Reset all inventory, purchase orders, and preset stock to initial demo dataset?')) {
      setItems(INITIAL_WMS_ITEMS);
      setPurchaseOrders(INITIAL_PURCHASE_ORDERS);
      localStorage.removeItem(STORAGE_KEY_ITEMS);
      localStorage.removeItem(STORAGE_KEY_POS);
      showToast('WMS reset to initial demo dataset.');
    }
  };

  // Shortage calculation counts
  const insufficientCount = items.filter(
    i => (i.minRequiredStock - i.stockBalance - i.extraPoStock) > 0
  ).length;

  const openPoCount = purchaseOrders.filter(p => p.status !== 'Fulfilled').length;

  const openGeneratePOForItems = (target?: WMSItem[]) => {
    if (target && target.length > 0) {
      setTargetPoItems(target);
    } else if (selectedSkus.size > 0) {
      setTargetPoItems(items.filter(i => selectedSkus.has(i.sku)));
    } else {
      // Default to all items with shortage
      const shortages = items.filter(
        i => (i.minRequiredStock - i.stockBalance - i.extraPoStock) > 0
      );
      setTargetPoItems(shortages.length > 0 ? shortages : items.slice(0, 3));
    }
    setGeneratePoModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Bar Contract Compliant Navigation */}
      <TopNav
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenUploadBalance={() => setUploadType('stock_balance')}
        onOpenUploadExtraPO={() => setUploadType('extra_po')}
        onOpenPresetManager={() => setPresetModalOpen(true)}
        onOpenGeneratePO={() => openGeneratePOForItems()}
        insufficientCount={insufficientCount}
        openPoCount={openPoCount}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* KPI Strip */}
        <KPISummary
          items={items}
          onFilterInsufficient={() => setActiveTab('orders')}
          onFilterAll={() => setActiveTab('orders')}
        />

        {/* Tab Content */}
        {activeTab === 'orders' && (
          <OrderManagementTable
            items={items}
            selectedSkus={selectedSkus}
            onToggleSelectSku={handleToggleSelectSku}
            onToggleSelectAll={handleToggleSelectAll}
            onOpenUploadBalance={() => setUploadType('stock_balance')}
            onOpenUploadExtraPO={() => setUploadType('extra_po')}
            onOpenPresetManager={() => setPresetModalOpen(true)}
            onOpenGeneratePO={openGeneratePOForItems}
            onQuickUpdateItem={handleQuickUpdateItem}
          />
        )}

        {activeTab === 'purchase_orders' && (
          <PurchaseOrdersList
            purchaseOrders={purchaseOrders}
            onReceivePO={handleReceivePO}
          />
        )}

        {activeTab === 'logs' && (
          <AuditLogsView
            logs={uploadLogs}
            onClearLogs={() => setUploadLogs([])}
            onOpenUploadBalance={() => setUploadType('stock_balance')}
            onOpenUploadExtraPO={() => setUploadType('extra_po')}
          />
        )}

        {/* Informative Guidance & Reset Strip */}
        <div className="p-4 bg-slate-900/60 border border-slate-800/80 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>
              <strong>Phase 1 Logic:</strong> Qty to Order = <code>Preset Required Stock − Stock Balance − Extra PO</code>. If positive, shortage triggers supplier procurement.
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleResetToDemo}
              className="inline-flex items-center gap-1 text-slate-400 hover:text-slate-200 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Demo State</span>
            </button>
          </div>
        </div>
      </main>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2.5 px-4 py-2.5 bg-slate-900 border border-emerald-500/40 text-emerald-300 text-xs font-medium rounded-xl shadow-xl shadow-slate-950/80 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Modals */}
      <UploadModal
        isOpen={uploadType !== null}
        type={uploadType}
        catalog={items}
        onClose={() => setUploadType(null)}
        onApplyStockBalance={handleApplyStockBalance}
        onApplyExtraPO={handleApplyExtraPO}
      />

      <PresetStockModal
        isOpen={presetModalOpen}
        catalog={items}
        onClose={() => setPresetModalOpen(false)}
        onUpdateCatalog={(newCatalog) => {
          setItems(newCatalog);
          showToast('Updated preset minimum stock thresholds in system master catalog.');
        }}
      />

      <GeneratePOModal
        isOpen={generatePoModalOpen}
        selectedItems={targetPoItems}
        onClose={() => setGeneratePoModalOpen(false)}
        onCommitPurchaseOrders={handleCommitPurchaseOrders}
      />
    </div>
  );
}
