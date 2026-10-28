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
  ChevronRight,
  ShieldAlert
} from 'lucide-react';
import { WMSItem, PurchaseOrder, UploadBatchLog } from './types/wms';
import { AppUser } from './types/auth';
import { INITIAL_WMS_ITEMS, INITIAL_PURCHASE_ORDERS } from './data/defaultCatalog';
import { INITIAL_USERS } from './data/defaultUsers';
import { TopNav } from './components/TopNav';
import { KPISummary } from './components/KPISummary';
import { OrderManagementTable } from './components/OrderManagementTable';
import { UploadModal } from './components/UploadModal';
import { PresetStockModal } from './components/PresetStockModal';
import { GeneratePOModal } from './components/GeneratePOModal';
import { PurchaseOrdersList } from './components/PurchaseOrdersList';
import { AuditLogsView } from './components/AuditLogsView';
import { LoginScreen } from './components/LoginScreen';
import { UserManagementView } from './components/UserManagementView';

const STORAGE_KEY_ITEMS = 'apex_wms_book_inventory_v1';
const STORAGE_KEY_POS = 'apex_wms_book_pos_v1';
const STORAGE_KEY_LOGS = 'apex_wms_book_logs_v1';
const STORAGE_KEY_USERS = 'apex_wms_users_v2';
const STORAGE_KEY_ACTIVE_USER = 'apex_wms_active_user_v2';

export default function App() {
  // Authentication & User Management States
  const [users, setUsers] = useState<AppUser[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_USERS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load users from localStorage', e);
    }
    return INITIAL_USERS;
  });

  const [currentUser, setCurrentUser] = useState<AppUser | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_ACTIVE_USER);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load active user from localStorage', e);
    }
    // Return null so users see the login page first with username & password
    return null;
  });

  // Main WMS Data States
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
    return [];
  });

  // UI Navigation & Modal states
  const [activeTab, setActiveTab] = useState<'orders' | 'purchase_orders' | 'logs' | 'users'>('orders');
  const [selectedSkus, setSelectedSkus] = useState<Set<string>>(new Set());
  const [uploadType, setUploadType] = useState<'stock_balance' | 'extra_po' | null>(null);
  const [presetModalOpen, setPresetModalOpen] = useState(false);
  const [generatePoModalOpen, setGeneratePoModalOpen] = useState(false);
  const [targetPoItems, setTargetPoItems] = useState<WMSItem[]>([]);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

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

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(STORAGE_KEY_ACTIVE_USER, JSON.stringify(currentUser));
    } else {
      localStorage.removeItem(STORAGE_KEY_ACTIVE_USER);
    }
  }, [currentUser]);

  const showToast = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Auth Handlers
  const handleLogin = (user: AppUser) => {
    const now = new Date().toISOString().replace('T', ' ').slice(0, 16);
    const updatedUser = { ...user, lastLogin: now };
    setCurrentUser(updatedUser);
    setUsers(prev => prev.map(u => u.id === user.id ? updatedUser : u));
    showToast(`Signed in successfully as ${user.displayName} (${user.role.toUpperCase()})`);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    showToast('Signed out of WMS session.', 'info');
  };

  const handleSwitchUser = (user: AppUser) => {
    setCurrentUser(user);
    showToast(`Switched active user to ${user.displayName} (${user.role})`);
    if (activeTab === 'users' && user.role !== 'admin' && !user.options.permissions.canManageUsers) {
      setActiveTab('orders');
    }
  };

  const handleUpdateUser = (updatedUser: AppUser) => {
    setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
    if (currentUser && currentUser.id === updatedUser.id) {
      setCurrentUser(updatedUser);
    }
    showToast(`User options updated for ${updatedUser.displayName}`);
  };

  const handleCreateUser = (newUser: AppUser) => {
    setUsers(prev => [...prev, newUser]);
    showToast(`New user ${newUser.displayName} created with ${newUser.role} options.`);
  };

  const handleDeleteUser = (userId: string) => {
    setUsers(prev => prev.filter(u => u.id !== userId));
    showToast('User account removed.', 'info');
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

  // Permission verification guards
  const handleRequestUploadBalance = () => {
    if (!currentUser?.options.permissions.canUploadBalance) {
      showToast('Permission Denied: Stock Balance upload is disabled by Administrator for your account.', 'error');
      return;
    }
    setUploadType('stock_balance');
  };

  const handleRequestUploadExtraPO = () => {
    if (!currentUser?.options.permissions.canUploadExtraPO) {
      showToast('Permission Denied: Extra PO upload is disabled by Administrator for your account.', 'error');
      return;
    }
    setUploadType('extra_po');
  };

  const handleRequestPresetManager = () => {
    if (!currentUser?.options.permissions.canEditPresets) {
      showToast('Permission Denied: Preset minimums editing is restricted by Administrator.', 'error');
      return;
    }
    setPresetModalOpen(true);
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
        const update = 
          (item.sku && updateMap.get(item.sku.toUpperCase())) || 
          (item.isbn && updateMap.get(item.isbn.toUpperCase()));
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

    showToast(`Successfully updated Stock Balance for ${matchedCount} book titles.`);
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
        const update = 
          (item.sku && updateMap.get(item.sku.toUpperCase())) || 
          (item.isbn && updateMap.get(item.isbn.toUpperCase()));
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

    showToast(`Successfully updated Extra PO Stock for ${matchedCount} titles.`);
  };

  // Commit Generated Purchase Orders
  const handleCommitPurchaseOrders = (newPOs: PurchaseOrder[], updateExtraPoStock: boolean) => {
    setPurchaseOrders(prev => [...newPOs, ...prev]);

    if (updateExtraPoStock) {
      const orderedQtyMap = new Map<string, number>();
      newPOs.forEach(po => {
        po.items.forEach(line => {
          const key = (line.isbn || line.sku).toUpperCase();
          const current = orderedQtyMap.get(key) || 0;
          orderedQtyMap.set(key, current + line.qtyToOrder);
          if (line.sku) {
            orderedQtyMap.set(line.sku.toUpperCase(), (orderedQtyMap.get(line.sku.toUpperCase()) || 0) + line.qtyToOrder);
          }
        });
      });

      const now = new Date().toISOString().replace('T', ' ').slice(0, 16);

      setItems(prev => prev.map(item => {
        const qtyAdded = 
          (item.isbn && orderedQtyMap.get(item.isbn.toUpperCase())) ||
          (item.sku && orderedQtyMap.get(item.sku.toUpperCase()));
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
    if (!currentUser?.options.permissions.canReceiveStock) {
      showToast('Permission Denied: Stock receipt is disabled by Administrator for your account.', 'error');
      return;
    }

    const po = purchaseOrders.find(p => p.id === poId);
    if (!po) return;

    const now = new Date().toISOString().replace('T', ' ').slice(0, 16);

    setItems(prev => prev.map(item => {
      const matchLine = po.items.find(l => 
        (item.isbn && l.isbn === item.isbn) || 
        (item.sku && l.sku === item.sku) ||
        (item.isbn && l.sku === item.isbn)
      );
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
    if (!currentUser?.options.permissions.canEditPresets) {
      showToast('Permission Denied: Editing stock values is restricted by Administrator.', 'error');
      return;
    }
    setItems(prev => prev.map(i => i.id === updatedItem.id ? updatedItem : i));
    showToast(`Updated ${updatedItem.isbn || updatedItem.sku || 'item'}`);
  };

  // Reset to factory sample state
  const handleResetToDemo = () => {
    if (window.confirm('Reset all inventory, purchase orders, and user permissions to initial demo state?')) {
      setItems(INITIAL_WMS_ITEMS);
      setPurchaseOrders(INITIAL_PURCHASE_ORDERS);
      setUsers(INITIAL_USERS);
      setCurrentUser(INITIAL_USERS[0]);
      localStorage.removeItem(STORAGE_KEY_ITEMS);
      localStorage.removeItem(STORAGE_KEY_POS);
      localStorage.removeItem(STORAGE_KEY_LOGS);
      localStorage.removeItem(STORAGE_KEY_USERS);
      setUploadLogs([]);
      showToast('WMS reset to initial educational book dataset.');
    }
  };

  // Shortage calculation counts
  const insufficientCount = items.filter(
    i => (i.minRequiredStock - i.stockBalance - i.extraPoStock) > 0
  ).length;

  const openPoCount = purchaseOrders.filter(p => p.status !== 'Fulfilled').length;

  const openGeneratePOForItems = (target?: WMSItem[]) => {
    if (!currentUser?.options.permissions.canGeneratePO) {
      showToast('Permission Denied: Supplier PO generation is disabled by Administrator for your account.', 'error');
      return;
    }

    if (target && target.length > 0) {
      setTargetPoItems(target);
    } else if (selectedSkus.size > 0) {
      setTargetPoItems(items.filter(i => (i.sku && selectedSkus.has(i.sku)) || (i.isbn && selectedSkus.has(i.isbn))));
    } else {
      const shortages = items.filter(
        i => (i.minRequiredStock - i.stockBalance - i.extraPoStock) > 0
      );
      setTargetPoItems(shortages.length > 0 ? shortages : items.slice(0, 3));
    }
    setGeneratePoModalOpen(true);
  };

  // If not authenticated, render Login Screen
  if (!currentUser) {
    return <LoginScreen users={users} onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Bar Compliant Navigation with User Switcher */}
      <TopNav
        currentUser={currentUser}
        allUsers={users}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenUploadBalance={handleRequestUploadBalance}
        onOpenUploadExtraPO={handleRequestUploadExtraPO}
        onOpenPresetManager={handleRequestPresetManager}
        onOpenGeneratePO={() => openGeneratePOForItems()}
        onSwitchUser={handleSwitchUser}
        onLogout={handleLogout}
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
            currentUser={currentUser}
            items={items}
            selectedSkus={selectedSkus}
            onToggleSelectSku={handleToggleSelectSku}
            onToggleSelectAll={handleToggleSelectAll}
            onOpenUploadBalance={handleRequestUploadBalance}
            onOpenUploadExtraPO={handleRequestUploadExtraPO}
            onOpenPresetManager={handleRequestPresetManager}
            onOpenGeneratePO={openGeneratePOForItems}
            onQuickUpdateItem={handleQuickUpdateItem}
          />
        )}

        {activeTab === 'purchase_orders' && (
          <PurchaseOrdersList
            purchaseOrders={purchaseOrders}
            onReceivePO={handleReceivePO}
            canReceiveStock={currentUser.options.permissions.canReceiveStock}
            canExportData={currentUser.options.permissions.canExportData}
          />
        )}

        {activeTab === 'logs' && (
          <AuditLogsView
            logs={uploadLogs}
            onClearLogs={() => setUploadLogs([])}
            onOpenUploadBalance={handleRequestUploadBalance}
            onOpenUploadExtraPO={handleRequestUploadExtraPO}
          />
        )}

        {activeTab === 'users' && (
          <UserManagementView
            currentUser={currentUser}
            users={users}
            onUpdateUser={handleUpdateUser}
            onCreateUser={handleCreateUser}
            onDeleteUser={handleDeleteUser}
          />
        )}

        {/* Informative Guidance & Active User Options Indicator */}
        <div className="p-4 bg-slate-900/60 border border-slate-800/80 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>
              <strong>Active Account:</strong> {currentUser.displayName} (<span className="capitalize text-slate-200">{currentUser.role}</span>) · Scope: <span className="text-slate-300 font-mono">{currentUser.options.warehouseZone}</span> · User options determined by Administrator.
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleResetToDemo}
              className="inline-flex items-center gap-1 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Demo State</span>
            </button>
          </div>
        </div>
      </main>

      {/* Toast Notification */}
      {toastMessage && (
        <div className={`fixed bottom-5 right-5 z-50 flex items-center gap-2.5 px-4 py-2.5 bg-slate-900 border rounded-xl shadow-xl shadow-slate-950/80 animate-in fade-in slide-in-from-bottom-2 ${
          toastMessage.type === 'error'
            ? 'border-rose-500/50 text-rose-300'
            : toastMessage.type === 'info'
              ? 'border-cyan-500/50 text-cyan-300'
              : 'border-emerald-500/50 text-emerald-300'
        }`}>
          {toastMessage.type === 'error' ? (
            <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          )}
          <span className="text-xs font-medium">{toastMessage.text}</span>
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
