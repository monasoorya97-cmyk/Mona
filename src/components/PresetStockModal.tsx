import React, { useState } from 'react';
import { 
  Sliders, 
  Plus, 
  X, 
  Save, 
  RotateCcw, 
  Search, 
  TrendingUp, 
  Check, 
  FileSpreadsheet
} from 'lucide-react';
import { WMSItem } from '../types/wms';
import { INITIAL_WMS_ITEMS } from '../data/defaultCatalog';
import { downloadFile } from '../utils/csvHelper';

interface PresetStockModalProps {
  isOpen: boolean;
  catalog: WMSItem[];
  onClose: () => void;
  onUpdateCatalog: (newCatalog: WMSItem[]) => void;
}

export const PresetStockModal: React.FC<PresetStockModalProps> = ({
  isOpen,
  catalog,
  onClose,
  onUpdateCatalog,
}) => {
  const [items, setItems] = useState<WMSItem[]>(catalog);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // New item form state
  const [newSku, setNewSku] = useState('');
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState<WMSItem['category']>('Electronics');
  const [newUnit, setNewUnit] = useState<WMSItem['unit']>('pcs');
  const [newMinStock, setNewMinStock] = useState<number>(50);
  const [newCost, setNewCost] = useState<number>(10);
  const [newSupplier, setNewSupplier] = useState('Apex Industrial Global');

  if (!isOpen) return null;

  const handleMinStockChange = (id: string, value: number) => {
    const val = Math.max(0, isNaN(value) ? 0 : value);
    setItems(prev => prev.map(item => item.id === id ? { ...item, minRequiredStock: val } : item));
  };

  const handleApplyBuffer = (percent: number) => {
    setItems(prev => prev.map(item => ({
      ...item,
      minRequiredStock: Math.round(item.minRequiredStock * (1 + percent / 100))
    })));
  };

  const handleResetToDefault = () => {
    if (window.confirm('Reset all preset minimum stock thresholds to default system presets?')) {
      setItems(INITIAL_WMS_ITEMS);
    }
  };

  const handleAddNewItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSku.trim() || !newName.trim()) return;

    const newItem: WMSItem = {
      id: `item-${Date.now()}`,
      sku: newSku.trim().toUpperCase(),
      name: newName.trim(),
      category: newCategory,
      unit: newUnit,
      minRequiredStock: Math.max(0, newMinStock),
      stockBalance: 0,
      extraPoStock: 0,
      unitCost: Math.max(0.1, newCost),
      supplierId: `SUP-${Date.now().toString().slice(-4)}`,
      supplierName: newSupplier.trim(),
      leadTimeDays: 7,
      locationBin: 'GEN-01',
      lastBalanceUpdate: 'Just added',
      lastPoUpdate: 'Just added'
    };

    setItems(prev => [newItem, ...prev]);
    setShowAddForm(false);
    setNewSku('');
    setNewName('');
    setNewMinStock(50);
  };

  const handleSaveAll = () => {
    onUpdateCatalog(items);
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      onClose();
    }, 600);
  };

  const handleExportPresets = () => {
    const header = ['SKU', 'Item Name', 'Category', 'Unit', 'Preset Minimum Required Stock', 'Unit Cost ($)', 'Supplier', 'Bin'];
    const rows = items.map(i => [
      `"${i.sku}"`,
      `"${i.name.replace(/"/g, '""')}"`,
      `"${i.category}"`,
      `"${i.unit}"`,
      i.minRequiredStock,
      i.unitCost.toFixed(2),
      `"${i.supplierName}"`,
      `"${i.locationBin}"`
    ].join(','));
    const content = [header.join(','), ...rows].join('\n');
    downloadFile(content, 'wms_preset_minimum_stock_catalog.csv');
  };

  const filteredItems = items.filter(item => 
    item.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-100">
                Preset Minimum Required Stock Management
              </h2>
              <p className="text-xs text-slate-400">
                Configured baseline safety thresholds for warehouse order calculations.
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

        {/* Toolbar Strip */}
        <div className="p-4 border-b border-slate-800 bg-slate-900/60 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Search */}
            <div className="relative flex-1 min-w-[220px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search SKU or item name..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 placeholder:text-slate-500 focus:outline-hidden focus:border-indigo-500"
              />
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleApplyBuffer(10)}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-md border border-slate-700 transition-colors"
                title="Increase all preset thresholds by 10% for demand surge"
              >
                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                +10% Buffer
              </button>
              <button
                type="button"
                onClick={() => handleApplyBuffer(25)}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-md border border-slate-700 transition-colors"
                title="Increase all preset thresholds by 25% for peak season"
              >
                <TrendingUp className="w-3.5 h-3.5 text-indigo-400" />
                +25% Buffer
              </button>
              <button
                type="button"
                onClick={handleResetToDefault}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-400 hover:text-slate-200 bg-slate-800/60 hover:bg-slate-800 rounded-md border border-slate-800 transition-colors"
                title="Reset to initial factory presets"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset Defaults
              </button>
              <button
                type="button"
                onClick={handleExportPresets}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-md border border-slate-700 transition-colors"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                Export CSV
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(!showAddForm)}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-md transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Item
              </button>
            </div>
          </div>

          {/* Add Item Form (Collapsible) */}
          {showAddForm && (
            <form onSubmit={handleAddNewItem} className="p-4 bg-slate-950 border border-indigo-500/30 rounded-lg space-y-3">
              <div className="text-xs font-semibold text-indigo-300 uppercase tracking-wider">
                Add New Master Catalog Item with Preset Stock
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div>
                  <label className="text-[11px] text-slate-400">SKU Code *</label>
                  <input
                    type="text"
                    required
                    value={newSku}
                    onChange={(e) => setNewSku(e.target.value)}
                    placeholder="e.g. SKU-ELC-9901"
                    className="w-full mt-1 px-2.5 py-1.5 text-xs font-mono bg-slate-900 border border-slate-800 rounded text-slate-200"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-[11px] text-slate-400">Description *</label>
                  <input
                    type="text"
                    required
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="e.g. Servo Motor Controller 400W"
                    className="w-full mt-1 px-2.5 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded text-slate-200"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="w-full mt-1 px-2.5 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded text-slate-200"
                  >
                    <option value="Electronics">Electronics</option>
                    <option value="Mechanical">Mechanical</option>
                    <option value="Fasteners">Fasteners</option>
                    <option value="Pneumatics">Pneumatics</option>
                    <option value="Packaging">Packaging</option>
                    <option value="Raw Materials">Raw Materials</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <label className="text-[11px] text-slate-400">Preset Min Required *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={newMinStock}
                    onChange={(e) => setNewMinStock(parseInt(e.target.value, 10))}
                    className="w-full mt-1 px-2.5 py-1.5 text-xs font-mono bg-slate-900 border border-slate-800 rounded text-slate-200 font-bold"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400">Unit of Measure</label>
                  <select
                    value={newUnit}
                    onChange={(e) => setNewUnit(e.target.value as any)}
                    className="w-full mt-1 px-2.5 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded text-slate-200"
                  >
                    <option value="pcs">pcs</option>
                    <option value="box">box</option>
                    <option value="pack">pack</option>
                    <option value="roll">roll</option>
                    <option value="set">set</option>
                    <option value="kg">kg</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] text-slate-400">Unit Cost ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.1"
                    value={newCost}
                    onChange={(e) => setNewCost(parseFloat(e.target.value))}
                    className="w-full mt-1 px-2.5 py-1.5 text-xs font-mono bg-slate-900 border border-slate-800 rounded text-slate-200"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400">Supplier Name</label>
                  <input
                    type="text"
                    value={newSupplier}
                    onChange={(e) => setNewSupplier(e.target.value)}
                    className="w-full mt-1 px-2.5 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded text-slate-200"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-3 py-1 text-xs text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded"
                >
                  Confirm & Add SKU
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Catalog Table */}
        <div className="flex-1 overflow-y-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-800/80 text-slate-400 font-medium border-b border-slate-800 sticky top-0 z-10">
              <tr>
                <th className="px-4 py-2.5">SKU Code</th>
                <th className="px-4 py-2.5">Item Description</th>
                <th className="px-4 py-2.5">Category</th>
                <th className="px-4 py-2.5">Supplier</th>
                <th className="px-4 py-2.5 text-right w-40">Preset Min Required</th>
                <th className="px-4 py-2.5 text-right">Unit Price</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {filteredItems.map((item) => (
                <tr key={item.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-4 py-2 font-semibold text-slate-200">{item.sku}</td>
                  <td className="px-4 py-2 font-sans text-slate-300 font-medium">
                    {item.name}
                  </td>
                  <td className="px-4 py-2 font-sans text-slate-400 text-[11px]">
                    {item.category}
                  </td>
                  <td className="px-4 py-2 font-sans text-slate-400 text-[11px] truncate max-w-[140px]">
                    {item.supplierName}
                  </td>
                  <td className="px-4 py-2 text-right">
                    <div className="inline-flex items-center gap-1.5 justify-end">
                      <input
                        type="number"
                        min="0"
                        value={item.minRequiredStock}
                        onChange={(e) => handleMinStockChange(item.id, parseInt(e.target.value, 10))}
                        className="w-20 px-2 py-1 text-right font-mono font-bold text-xs bg-slate-950 border border-slate-700 rounded text-indigo-300 focus:outline-hidden focus:border-indigo-500"
                      />
                      <span className="text-[11px] text-slate-500 font-sans">{item.unit}</span>
                    </div>
                  </td>
                  <td className="px-4 py-2 text-right text-slate-400">
                    ${item.unitCost.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-900/80">
          <div className="text-xs text-slate-400">
            Total {items.length} items preset in system catalog.
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
              onClick={handleSaveAll}
              className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-lg shadow-indigo-950/50 transition-colors"
            >
              {saveSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-300" />
                  <span>Saved!</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Preset Minimums</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
