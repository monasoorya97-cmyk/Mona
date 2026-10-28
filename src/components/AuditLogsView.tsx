import React from 'react';
import { Package, Truck, CheckCircle2, Clock, Trash2 } from 'lucide-react';
import { UploadBatchLog } from '../types/wms';

interface AuditLogsViewProps {
  logs: UploadBatchLog[];
  onClearLogs: () => void;
  onOpenUploadBalance: () => void;
  onOpenUploadExtraPO: () => void;
}

export const AuditLogsView: React.FC<AuditLogsViewProps> = ({
  logs,
  onClearLogs,
  onOpenUploadBalance,
  onOpenUploadExtraPO,
}) => {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-slate-900 border border-slate-800 rounded-xl">
        <div>
          <h3 className="text-sm font-semibold text-slate-100">
            Stock Data Ingestion & Upload History
          </h3>
          <p className="text-xs text-slate-400">
            Audit trail of Physical Stock Balance counts and Extra PO inbound manifests.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {logs.length > 0 && (
            <button
              type="button"
              onClick={onClearLogs}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear History</span>
            </button>
          )}
        </div>
      </div>

      {logs.length === 0 ? (
        <div className="p-12 text-center bg-slate-900/40 border border-slate-800 rounded-xl space-y-3">
          <Clock className="w-8 h-8 text-slate-600 mx-auto" />
          <div className="text-sm text-slate-300 font-medium">No upload logs recorded yet</div>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Use the "Upload Stock Balance" or "Upload Extra PO" icons to import warehouse counts and track ingestion batches.
          </p>
          <div className="flex justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={onOpenUploadBalance}
              className="px-3 py-1.5 text-xs font-semibold text-cyan-300 bg-cyan-950/60 border border-cyan-500/30 rounded-lg hover:bg-cyan-900/60 transition-colors"
            >
              Upload Stock Balance
            </button>
            <button
              type="button"
              onClick={onOpenUploadExtraPO}
              className="px-3 py-1.5 text-xs font-semibold text-amber-300 bg-amber-950/60 border border-amber-500/30 rounded-lg hover:bg-amber-900/60 transition-colors"
            >
              Upload Extra PO
            </button>
          </div>
        </div>
      ) : (
        <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-900">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 font-medium border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">Batch Type</th>
                <th className="px-4 py-3">File / Source</th>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3 text-right">Items Parsed</th>
                <th className="px-4 py-3 text-right">Successful Updates</th>
                <th className="px-4 py-3">Ingestion Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {logs.map((log) => {
                const isBalance = log.type === 'stock_balance';
                return (
                  <tr key={log.id} className="hover:bg-slate-800/30">
                    <td className="px-4 py-2.5 font-sans">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium ${
                        isBalance 
                          ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/20' 
                          : 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                      }`}>
                        {isBalance ? <Package className="w-3 h-3" /> : <Truck className="w-3 h-3" />}
                        {isBalance ? 'Stock Balance' : 'Extra PO Stock'}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-slate-200 font-mono">{log.filename}</td>
                    <td className="px-4 py-2.5 text-slate-400">{log.timestamp}</td>
                    <td className="px-4 py-2.5 text-right text-slate-300">{log.recordsCount}</td>
                    <td className="px-4 py-2.5 text-right text-emerald-400 font-semibold">{log.successCount}</td>
                    <td className="px-4 py-2.5 font-sans">
                      <span className="inline-flex items-center gap-1 text-emerald-400">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Processed & Computed
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
