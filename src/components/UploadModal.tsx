import React, { useState, useRef } from 'react';
import { 
  Upload, 
  FileText, 
  Download, 
  CheckCircle2, 
  AlertTriangle, 
  X, 
  Sparkles,
  Layers,
  ArrowRight
} from 'lucide-react';
import { WMSItem } from '../types/wms';
import { 
  getStockBalanceTemplate, 
  getExtraPOTemplate, 
  parseStockBalanceText, 
  parseExtraPOText,
  downloadFile,
  ParsedBalanceRow,
  ParsedExtraPORow
} from '../utils/csvHelper';

interface UploadModalProps {
  isOpen: boolean;
  type: 'stock_balance' | 'extra_po' | null;
  catalog: WMSItem[];
  onClose: () => void;
  onApplyStockBalance: (updates: { sku: string; stockBalance: number; locationBin?: string }[], mode: 'replace' | 'additive') => void;
  onApplyExtraPO: (updates: { sku: string; extraPoQty: number; poNumber?: string; supplierName?: string }[], mode: 'replace' | 'additive') => void;
}

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  type,
  catalog,
  onClose,
  onApplyStockBalance,
  onApplyExtraPO,
}) => {
  const [inputText, setInputText] = useState('');
  const [mode, setMode] = useState<'replace' | 'additive'>('replace');
  const [fileName, setFileName] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen || !type) return null;

  const isBalance = type === 'stock_balance';
  const title = isBalance ? 'Upload Stock Balance (On-Hand)' : 'Upload Extra PO Stock (Inbound Orders)';
  const subtitle = isBalance 
    ? 'Update physical warehouse inventory counts from floor audit or ERP exports.'
    : 'Import supplier open purchase orders, in-transit shipments, or factory replenishment POs.';

  const parsedBalanceRows = isBalance ? parseStockBalanceText(inputText, catalog) : [];
  const parsedExtraRows = !isBalance ? parseExtraPOText(inputText, catalog) : [];

  const totalParsed = isBalance ? parsedBalanceRows.length : parsedExtraRows.length;
  const matchedCount = isBalance 
    ? parsedBalanceRows.filter(r => r.matched).length 
    : parsedExtraRows.filter(r => r.matched).length;
  const unmatchedCount = totalParsed - matchedCount;

  const handleDownloadTemplate = () => {
    if (isBalance) {
      downloadFile(getStockBalanceTemplate(), 'wms_stock_balance_template.csv');
    } else {
      downloadFile(getExtraPOTemplate(), 'wms_extra_po_template.csv');
    }
  };

  const handleLoadSample = () => {
    if (isBalance) {
      setInputText(getStockBalanceTemplate());
      setFileName('sample_physical_count.csv');
    } else {
      setInputText(getExtraPOTemplate());
      setFileName('sample_inbound_po_data.csv');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        if (content) {
          setInputText(content);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        if (content) {
          setInputText(content);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleConfirm = () => {
    if (totalParsed === 0) return;

    if (isBalance) {
      onApplyStockBalance(
        parsedBalanceRows.map(r => ({
          sku: r.sku,
          stockBalance: r.stockBalance,
          locationBin: r.locationBin
        })),
        mode
      );
    } else {
      onApplyExtraPO(
        parsedExtraRows.map(r => ({
          sku: r.sku,
          extraPoQty: r.extraPoQty,
          poNumber: r.poNumber,
          supplierName: r.supplierName
        })),
        mode
      );
    }
    onClose();
    setInputText('');
    setFileName(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
      <div 
        className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isBalance ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-100">{title}</h2>
              <p className="text-xs text-slate-400">{subtitle}</p>
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

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Action Strip: Download Template & Sample Data */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-800/60 border border-slate-800 rounded-lg">
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <FileText className="w-4 h-4 text-slate-400" />
              <span>Format: <strong>SKU, {isBalance ? 'StockBalance' : 'ExtraPoQty'}</strong> (CSV or Tab-Delimited)</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 hover:text-white border border-slate-700 rounded-md transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                Download CSV Template
              </button>
              <button
                type="button"
                onClick={handleLoadSample}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-md transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Fill Sample Data
              </button>
            </div>
          </div>

          {/* Drag & Drop Zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-colors ${
              dragActive 
                ? 'border-cyan-500 bg-cyan-500/5' 
                : 'border-slate-700 hover:border-slate-600 bg-slate-900/50'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.txt"
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="flex flex-col items-center justify-center gap-2">
              <div className="p-2.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                <Upload className="w-5 h-5" />
              </div>
              <div className="text-sm font-medium text-slate-200">
                {fileName ? (
                  <span className="text-cyan-400 font-mono">{fileName} loaded</span>
                ) : (
                  <span>Click to browse or drag & drop CSV file</span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                Supports .csv or .txt spreadsheets exported from Excel or ERP
              </p>
            </div>
          </div>

          {/* Direct Text / CSV Input Area */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Raw CSV / Text Data
              </label>
              {inputText && (
                <button
                  type="button"
                  onClick={() => { setInputText(''); setFileName(null); }}
                  className="text-xs text-rose-400 hover:underline"
                >
                  Clear Content
                </button>
              )}
            </div>
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={`SKU,${isBalance ? 'StockBalance' : 'ExtraPoQty'}\nSKU-ELC-1042,50\nSKU-MEC-3091,100`}
              rows={4}
              className="w-full px-3 py-2 text-xs font-mono bg-slate-950 border border-slate-800 rounded-lg text-slate-200 placeholder:text-slate-600 focus:outline-hidden focus:border-cyan-500/80 resize-none"
            />
          </div>

          {/* Update Mode: Replace vs Additive */}
          <div className="p-3 bg-slate-800/40 border border-slate-800 rounded-lg flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-slate-200">Application Mode</div>
              <p className="text-xs text-slate-400">
                {mode === 'replace'
                  ? `Overwrite current ${isBalance ? 'stock balance' : 'extra PO'} with uploaded values.`
                  : `Add uploaded quantity onto existing ${isBalance ? 'stock balance' : 'extra PO'}.`}
              </p>
            </div>
            <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-md">
              <button
                type="button"
                onClick={() => setMode('replace')}
                className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                  mode === 'replace' ? 'bg-slate-700 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Set / Overwrite
              </button>
              <button
                type="button"
                onClick={() => setMode('additive')}
                className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                  mode === 'additive' ? 'bg-slate-700 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                + Add Quantity
              </button>
            </div>
          </div>

          {/* Live Preview Table */}
          {totalParsed > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <span>Data Mapping Preview ({totalParsed} rows)</span>
                  <span className="text-emerald-400 font-mono">({matchedCount} matched)</span>
                  {unmatchedCount > 0 && (
                    <span className="text-amber-400 font-mono">({unmatchedCount} unmatched)</span>
                  )}
                </div>
              </div>

              <div className="border border-slate-800 rounded-lg overflow-hidden max-h-48 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-800/80 text-slate-400 font-medium border-b border-slate-800 sticky top-0">
                    <tr>
                      <th className="px-3 py-2">Status</th>
                      <th className="px-3 py-2">SKU</th>
                      <th className="px-3 py-2 text-right">
                        {isBalance ? 'Uploaded Balance' : 'Uploaded Extra PO'}
                      </th>
                      <th className="px-3 py-2">
                        {isBalance ? 'Location / Note' : 'PO# / Vendor'}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono">
                    {isBalance ? (
                      parsedBalanceRows.map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-800/40">
                          <td className="px-3 py-1.5 whitespace-nowrap">
                            {row.matched ? (
                              <span className="inline-flex items-center gap-1 text-emerald-400">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Valid
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-amber-400">
                                <AlertTriangle className="w-3.5 h-3.5" />
                                Unknown SKU
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-1.5 font-semibold text-slate-200">{row.sku}</td>
                          <td className="px-3 py-1.5 text-right text-cyan-300 font-semibold">{row.stockBalance}</td>
                          <td className="px-3 py-1.5 text-slate-400 font-sans">{row.locationBin || row.notes || '—'}</td>
                        </tr>
                      ))
                    ) : (
                      parsedExtraRows.map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-800/40">
                          <td className="px-3 py-1.5 whitespace-nowrap">
                            {row.matched ? (
                              <span className="inline-flex items-center gap-1 text-emerald-400">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Valid
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-amber-400">
                                <AlertTriangle className="w-3.5 h-3.5" />
                                Unknown SKU
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-1.5 font-semibold text-slate-200">{row.sku}</td>
                          <td className="px-3 py-1.5 text-right text-amber-300 font-semibold">+{row.extraPoQty}</td>
                          <td className="px-3 py-1.5 text-slate-400 font-sans">{row.poNumber || row.supplierName || '—'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-900/80">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={totalParsed === 0 || matchedCount === 0}
            onClick={handleConfirm}
            className={`inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold rounded-lg transition-all ${
              totalParsed > 0 && matchedCount > 0
                ? isBalance
                  ? 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-950/50'
                  : 'bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-950/50'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            <span>Apply {matchedCount} Updates to WMS</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
