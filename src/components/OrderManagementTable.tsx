import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  ArrowUpDown, 
  Download, 
  Plus, 
  Edit3, 
  AlertTriangle, 
  CheckCircle2, 
  Upload, 
  Truck, 
  Package, 
  Sliders, 
  ShoppingCart,
  FileSpreadsheet,
  HelpCircle,
  Calculator
} from 'lucide-react';
import { WMSItem } from '../types/wms';
import { exportReplenishmentShortagesCSV } from '../utils/csvHelper';

interface OrderManagementTableProps {
  items: WMSItem[];
  selectedSkus: Set<string>;
  onToggleSelectSku: (sku: string) => void;
  onToggleSelectAll: (skus: string[]) => void;
  onOpenUploadBalance: () => void;
  onOpenUploadExtraPO: () => void;
  onOpenPresetManager: () => void;
  onOpenGeneratePO: (targetItems?: WMSItem[]) => void;
  onQuickUpdateItem: (updatedItem: WMSItem) => void;
}

type FilterStatus = 'all' | 'insufficient' | 'critical' | 'sufficient';
type SortField = 'deficit' | 'required' | 'balance' | 'extraPo' | 'sku' | 'cost';
type SortOrder = 'asc' | 'desc';

export const OrderManagementTable: React.FC<OrderManagementTableProps> = ({
  items,
  selectedSkus,
  onToggleSelectSku,
  onToggleSelectAll,
  onOpenUploadBalance,
  onOpenUploadExtraPO,
  onOpenPresetManager,
  onOpenGeneratePO,
  onQuickUpdateItem,
}) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('insufficient');
  const [sortField, setSortField] = useState<SortField>('deficit');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{ minRequired: number; balance: number; extraPo: number }>({
    minRequired: 0,
    balance: 0,
    extraPo: 0
  });

  // Calculate items with formula metrics
  const calculatedItems = useMemo(() => {
    return items.map(item => {
      // THE WMS FORMULA: Required Stock - Stock Balance - Extra PO
      const rawDeficit = item.minRequiredStock - item.stockBalance - item.extraPoStock;
      const qtyNotSufficient = Math.max(0, rawDeficit);
      const isInsufficient = qtyNotSufficient > 0;
      const isCritical = item.stockBalance === 0 && item.extraPoStock === 0 && item.minRequiredStock > 0;
      const orderCost = qtyNotSufficient * item.unitCost;
      const totalPipeline = item.stockBalance + item.extraPoStock;

      return {
        ...item,
        rawDeficit,
        qtyNotSufficient,
        isInsufficient,
        isCritical,
        orderCost,
        totalPipeline,
      };
    });
  }, [items]);

  // Filtering
  const filteredItems = useMemo(() => {
    return calculatedItems.filter(item => {
      // Text search
      const matchesText = 
        item.sku.toLowerCase().includes(search.toLowerCase()) ||
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.supplierName.toLowerCase().includes(search.toLowerCase()) ||
        item.locationBin.toLowerCase().includes(search.toLowerCase());

      if (!matchesText) return false;

      // Category filter
      if (selectedCategory !== 'all' && item.category !== selectedCategory) {
        return false;
      }

      // Status filter
      if (statusFilter === 'insufficient') return item.isInsufficient;
      if (statusFilter === 'critical') return item.isCritical;
      if (statusFilter === 'sufficient') return !item.isInsufficient;

      return true;
    });
  }, [calculatedItems, search, selectedCategory, statusFilter]);

  // Sorting
  const sortedItems = useMemo(() => {
    return [...filteredItems].sort((a, b) => {
      let comp = 0;
      if (sortField === 'deficit') comp = a.qtyNotSufficient - b.qtyNotSufficient;
      else if (sortField === 'required') comp = a.minRequiredStock - b.minRequiredStock;
      else if (sortField === 'balance') comp = a.stockBalance - b.stockBalance;
      else if (sortField === 'extraPo') comp = a.extraPoStock - b.extraPoStock;
      else if (sortField === 'sku') comp = a.sku.localeCompare(b.sku);
      else if (sortField === 'cost') comp = a.orderCost - b.orderCost;

      return sortOrder === 'asc' ? comp : -comp;
    });
  }, [filteredItems, sortField, sortOrder]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const handleStartEdit = (item: WMSItem) => {
    setEditingItemId(item.id);
    setEditValues({
      minRequired: item.minRequiredStock,
      balance: item.stockBalance,
      extraPo: item.extraPoStock,
    });
  };

  const handleSaveEdit = (item: WMSItem) => {
    onQuickUpdateItem({
      ...item,
      minRequiredStock: Math.max(0, editValues.minRequired),
      stockBalance: Math.max(0, editValues.balance),
      extraPoStock: Math.max(0, editValues.extraPo),
      lastBalanceUpdate: 'Manual update',
      lastPoUpdate: 'Manual update'
    });
    setEditingItemId(null);
  };

  const insufficientCount = calculatedItems.filter(i => i.isInsufficient).length;
  const criticalCount = calculatedItems.filter(i => i.isCritical).length;
  const sufficientCount = calculatedItems.filter(i => !i.isInsufficient).length;

  const allVisibleSkus = sortedItems.map(i => i.sku);
  const allVisibleSelected = allVisibleSkus.length > 0 && allVisibleSkus.every(sku => selectedSkus.has(sku));

  return (
    <div className="space-y-4">
      {/* 1. Core WMS Formula Banner */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                WMS Replenishment Calculation Engine
              </span>
              <span className="text-[11px] text-slate-500 font-mono">Phase 1</span>
            </div>
            {/* The exact formula requested by the user */}
            <div className="flex flex-wrap items-center gap-2 text-xs font-mono font-medium mt-1">
              <span className="px-2 py-0.5 bg-slate-800 text-indigo-300 rounded border border-indigo-500/20">
                Required Stock (Preset)
              </span>
              <span className="text-slate-500 font-bold">−</span>
              <span className="px-2 py-0.5 bg-slate-800 text-cyan-300 rounded border border-cyan-500/20">
                Stock Balance
              </span>
              <span className="text-slate-500 font-bold">−</span>
              <span className="px-2 py-0.5 bg-slate-800 text-amber-300 rounded border border-amber-500/20">
                Extra PO Stock
              </span>
              <span className="text-slate-500 font-bold">=</span>
              <span className="px-2.5 py-0.5 bg-rose-950/60 text-rose-300 rounded border border-rose-500/40 font-bold">
                Qty Not Sufficient (Order from Supplier)
              </span>
            </div>
          </div>
        </div>

        {/* 2 Primary Upload Action Icons as requested: Icon 1 Upload Stock Balance, Icon 2 Upload Extra PO */}
        <div className="flex flex-wrap items-center gap-2 self-end md:self-center">
          {/* ICON 1: Upload Stock Balance */}
          <button
            type="button"
            onClick={onOpenUploadBalance}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-100 bg-cyan-700/80 hover:bg-cyan-600 rounded-lg border border-cyan-500/40 shadow-sm transition-all hover:scale-[1.01]"
            title="Upload Warehouse Physical Stock Balance CSV / text"
          >
            <div className="p-1 rounded bg-cyan-900/60 text-cyan-200">
              <Package className="w-3.5 h-3.5" />
            </div>
            <span>Upload Stock Balance</span>
            <Upload className="w-3.5 h-3.5 text-cyan-300" />
          </button>

          {/* ICON 2: Upload Extra PO Stock */}
          <button
            type="button"
            onClick={onOpenUploadExtraPO}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-100 bg-amber-700/80 hover:bg-amber-600 rounded-lg border border-amber-500/40 shadow-sm transition-all hover:scale-[1.01]"
            title="Upload Open Purchase Orders / Extra PO Stock CSV / text"
          >
            <div className="p-1 rounded bg-amber-900/60 text-amber-200">
              <Truck className="w-3.5 h-3.5" />
            </div>
            <span>Upload Extra PO</span>
            <Upload className="w-3.5 h-3.5 text-amber-300" />
          </button>
        </div>
      </div>

      {/* 2. Search, Status Tabs, and Bulk Actions Strip */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Left: Status Filter segmented controls */}
          <div className="flex items-center gap-1 p-1 bg-slate-950 border border-slate-800 rounded-lg overflow-x-auto">
            <button
              type="button"
              onClick={() => setStatusFilter('insufficient')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                statusFilter === 'insufficient'
                  ? 'bg-rose-950/80 text-rose-300 border border-rose-500/40 shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Need to Order ({insufficientCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('critical')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                statusFilter === 'critical'
                  ? 'bg-amber-950/80 text-amber-300 border border-amber-500/40 shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Zero Stockouts ({criticalCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('sufficient')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                statusFilter === 'sufficient'
                  ? 'bg-slate-800 text-emerald-300 border border-emerald-500/30 shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Sufficient ({sufficientCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                statusFilter === 'all'
                  ? 'bg-slate-800 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All SKUs ({items.length})
            </button>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenPresetManager}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 rounded-lg transition-colors"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Preset Stock Settings</span>
            </button>

            <button
              type="button"
              onClick={() => exportReplenishmentShortagesCSV(items)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 hover:text-white border border-slate-700 rounded-lg transition-colors"
              title="Export all shortage calculation results into CSV report"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>

            <button
              type="button"
              onClick={() => {
                const insufficient = calculatedItems.filter(i => i.isInsufficient);
                onOpenGeneratePO(insufficient);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-sm transition-all"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>Order All Insufficient ({insufficientCount})</span>
            </button>
          </div>
        </div>

        {/* Search & Category Filter Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-slate-800/60">
          <div className="flex flex-1 items-center gap-2 min-w-[260px]">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search SKU, item name, bin location, supplier..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 placeholder:text-slate-500 focus:outline-hidden focus:border-cyan-500"
              />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-300 focus:outline-hidden focus:border-cyan-500"
            >
              <option value="all">All Categories</option>
              <option value="Electronics">Electronics</option>
              <option value="Mechanical">Mechanical</option>
              <option value="Fasteners">Fasteners</option>
              <option value="Pneumatics">Pneumatics</option>
              <option value="Packaging">Packaging</option>
              <option value="Raw Materials">Raw Materials</option>
            </select>
          </div>

          {/* Bulk Selection Notice */}
          {selectedSkus.size > 0 && (
            <div className="flex items-center gap-3 px-3 py-1 bg-emerald-950/40 border border-emerald-500/30 rounded-lg text-xs">
              <span className="font-medium text-emerald-300">
                {selectedSkus.size} items selected
              </span>
              <button
                type="button"
                onClick={() => {
                  const targetItems = items.filter(i => selectedSkus.has(i.sku));
                  onOpenGeneratePO(targetItems);
                }}
                className="px-2.5 py-1 text-[11px] font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded"
              >
                Create PO for Selected
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 3. Main Operational Replenishment Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-950 text-slate-400 font-medium border-b border-slate-800">
              <tr>
                <th className="px-3 py-3 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={allVisibleSelected}
                    onChange={() => onToggleSelectAll(allVisibleSkus)}
                    className="rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-0 focus:outline-hidden cursor-pointer"
                  />
                </th>
                <th 
                  onClick={() => handleSort('sku')}
                  className="px-3 py-3 cursor-pointer hover:text-slate-200 select-none"
                >
                  <div className="flex items-center gap-1">
                    <span>SKU & Bin</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-500" />
                  </div>
                </th>
                <th className="px-3 py-3">Description & Category</th>
                <th className="px-2 py-3 text-center">UOM</th>
                <th 
                  onClick={() => handleSort('required')}
                  className="px-3 py-3 text-right cursor-pointer hover:text-indigo-300 select-none text-indigo-400 font-semibold"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Preset Required</span>
                    <ArrowUpDown className="w-3 h-3 text-indigo-500" />
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('balance')}
                  className="px-3 py-3 text-right cursor-pointer hover:text-cyan-300 select-none text-cyan-400 font-semibold"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Stock Balance</span>
                    <ArrowUpDown className="w-3 h-3 text-cyan-500" />
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('extraPo')}
                  className="px-3 py-3 text-right cursor-pointer hover:text-amber-300 select-none text-amber-400 font-semibold"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Extra PO Stock</span>
                    <ArrowUpDown className="w-3 h-3 text-amber-500" />
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('deficit')}
                  className="px-4 py-3 text-right cursor-pointer hover:text-rose-300 select-none bg-rose-950/20 text-rose-300 font-bold border-x border-rose-500/20"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Qty Not Sufficient (To Order)</span>
                    <ArrowUpDown className="w-3 h-3 text-rose-400" />
                  </div>
                </th>
                <th className="px-3 py-3">Supplier & Lead Time</th>
                <th className="px-3 py-3 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-800/60 font-mono">
              {sortedItems.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-6 py-12 text-center text-slate-500 font-sans">
                    No warehouse inventory items found matching current filters.
                  </td>
                </tr>
              ) : (
                sortedItems.map((item) => {
                  const isSelected = selectedSkus.has(item.sku);
                  const isEditing = editingItemId === item.id;

                  return (
                    <tr 
                      key={item.id}
                      className={`transition-colors ${
                        item.isCritical 
                          ? 'bg-rose-950/15 hover:bg-rose-950/25' 
                          : item.isInsufficient 
                            ? 'bg-slate-900/40 hover:bg-slate-800/40' 
                            : 'hover:bg-slate-800/20'
                      } ${isSelected ? 'bg-cyan-950/20' : ''}`}
                    >
                      {/* Checkbox */}
                      <td className="px-3 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => onToggleSelectSku(item.sku)}
                          className="rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-0 focus:outline-hidden cursor-pointer"
                        />
                      </td>

                      {/* SKU & Bin Location */}
                      <td className="px-3 py-3 whitespace-nowrap">
                        <div className="font-semibold text-slate-100">{item.sku}</div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1 font-mono">
                          <span>Bin: {item.locationBin}</span>
                        </div>
                      </td>

                      {/* Name & Category */}
                      <td className="px-3 py-3 font-sans">
                        <div className="text-slate-200 font-medium line-clamp-1">{item.name}</div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                          <span>{item.category}</span>
                          <span className="text-slate-600">·</span>
                          <span className="font-mono text-slate-400">${item.unitCost.toFixed(2)}/unit</span>
                        </div>
                      </td>

                      {/* UOM */}
                      <td className="px-2 py-3 text-center font-sans text-slate-400 text-xs">
                        {item.unit}
                      </td>

                      {/* Preset Required Stock */}
                      <td className="px-3 py-3 text-right whitespace-nowrap">
                        {isEditing ? (
                          <input
                            type="number"
                            min="0"
                            value={editValues.minRequired}
                            onChange={(e) => setEditValues(prev => ({ ...prev, minRequired: parseInt(e.target.value, 10) || 0 }))}
                            className="w-18 px-1.5 py-0.5 text-right font-mono text-xs bg-slate-950 border border-indigo-500 rounded text-indigo-300 font-bold"
                          />
                        ) : (
                          <div className="inline-flex items-center gap-1 font-bold text-indigo-300">
                            <span>{item.minRequiredStock}</span>
                            <span className="text-[10px] text-slate-500 font-sans">{item.unit}</span>
                          </div>
                        )}
                      </td>

                      {/* Stock Balance */}
                      <td className="px-3 py-3 text-right whitespace-nowrap">
                        {isEditing ? (
                          <input
                            type="number"
                            min="0"
                            value={editValues.balance}
                            onChange={(e) => setEditValues(prev => ({ ...prev, balance: parseInt(e.target.value, 10) || 0 }))}
                            className="w-18 px-1.5 py-0.5 text-right font-mono text-xs bg-slate-950 border border-cyan-500 rounded text-cyan-300 font-bold"
                          />
                        ) : (
                          <div>
                            <span className={`font-semibold ${item.stockBalance === 0 ? 'text-rose-400 font-bold' : 'text-cyan-300'}`}>
                              {item.stockBalance}
                            </span>
                            {item.lastBalanceUpdate && (
                              <div className="text-[9px] text-slate-500 font-sans truncate max-w-[80px] ml-auto">
                                {item.lastBalanceUpdate}
                              </div>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Extra PO Stock */}
                      <td className="px-3 py-3 text-right whitespace-nowrap">
                        {isEditing ? (
                          <input
                            type="number"
                            min="0"
                            value={editValues.extraPo}
                            onChange={(e) => setEditValues(prev => ({ ...prev, extraPo: parseInt(e.target.value, 10) || 0 }))}
                            className="w-18 px-1.5 py-0.5 text-right font-mono text-xs bg-slate-950 border border-amber-500 rounded text-amber-300 font-bold"
                          />
                        ) : (
                          <div>
                            <span className={`font-semibold ${item.extraPoStock > 0 ? 'text-amber-300' : 'text-slate-500'}`}>
                              +{item.extraPoStock}
                            </span>
                            {item.lastPoUpdate && (
                              <div className="text-[9px] text-slate-500 font-sans truncate max-w-[80px] ml-auto">
                                {item.lastPoUpdate}
                              </div>
                            )}
                          </div>
                        )}
                      </td>

                      {/* THE CORE RESULT COLUMN: Qty Not Sufficient (Need to Order) */}
                      <td className="px-4 py-3 text-right whitespace-nowrap bg-rose-950/20 border-x border-rose-500/20">
                        {item.isInsufficient ? (
                          <div>
                            <div className="inline-flex items-center gap-1.5">
                              <span className="text-rose-400 font-bold text-sm">
                                {item.qtyNotSufficient} {item.unit}
                              </span>
                            </div>
                            <div className="text-[10px] text-rose-300/80 font-sans font-medium mt-0.5">
                              Est. ${(item.orderCost).toFixed(0)} USD
                            </div>
                          </div>
                        ) : (
                          <div className="text-right">
                            <span className="inline-flex items-center gap-1 text-emerald-400 font-sans font-medium text-xs">
                              <CheckCircle2 className="w-3 h-3" />
                              Sufficient
                            </span>
                            <div className="text-[10px] text-slate-500 font-mono">
                              Surplus: +{Math.abs(item.rawDeficit)}
                            </div>
                          </div>
                        )}
                      </td>

                      {/* Supplier & Lead Time */}
                      <td className="px-3 py-3 font-sans">
                        <div className="text-slate-300 text-xs truncate max-w-[170px]" title={item.supplierName}>
                          {item.supplierName}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <Truck className="w-3 h-3 text-slate-500" />
                          <span>{item.leadTimeDays}d lead time</span>
                        </div>
                      </td>

                      {/* Row Actions */}
                      <td className="px-3 py-3 text-right whitespace-nowrap">
                        {isEditing ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleSaveEdit(item)}
                              className="px-2 py-1 text-[11px] font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded"
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingItemId(null)}
                              className="px-2 py-1 text-[11px] text-slate-400 hover:text-slate-200"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-1.5">
                            {item.isInsufficient ? (
                              <button
                                type="button"
                                onClick={() => onOpenGeneratePO([item])}
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded shadow-xs transition-colors"
                                title="Create Supplier Purchase Order for this item"
                              >
                                <ShoppingCart className="w-3 h-3" />
                                <span>Order</span>
                              </button>
                            ) : null}

                            <button
                              type="button"
                              onClick={() => handleStartEdit(item)}
                              className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors"
                              title="Quick edit preset, balance, or extra PO values"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Summary Footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-slate-950 border-t border-slate-800 text-xs text-slate-400 font-sans">
          <div>
            Showing <strong className="text-slate-200 font-mono">{sortedItems.length}</strong> of{' '}
            <strong className="text-slate-200 font-mono">{items.length}</strong> items in master inventory.
          </div>
          <div className="flex items-center gap-4 text-xs font-mono">
            <span className="text-rose-400 font-medium">
              Shortages Requiring Supplier Order: {insufficientCount}
            </span>
            <span className="text-slate-600">|</span>
            <span className="text-emerald-400 font-medium">
              Sufficient Inventory: {sufficientCount}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
