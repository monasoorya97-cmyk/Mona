import { WMSItem, PurchaseOrder } from '../types/wms';

export function downloadFile(content: string, filename: string, mimeType = 'text/csv;charset=utf-8;') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function getStockBalanceTemplate(): string {
  return `SKU,StockBalance,LocationBin,Notes
SKU-ELC-1042,45,A-02-14,Physical count warehouse shelf 14
SKU-MEC-3091,85,B-05-02,Cycle count verified
SKU-FST-8812,40,C-01-09,Fastener rack count
SKU-PNM-4420,15,D-03-01,Emergency safety stock restock
SKU-RAW-9011,110,R-01-04,Weight verified
SKU-PKG-7750,30,W-09-03,Pallet bay 3`;
}

export function getExtraPOTemplate(): string {
  return `SKU,ExtraPoQty,PONumber,SupplierName,ExpectedDate
SKU-ELC-1042,50,PO-2026-0901,Omron Industrial Components Ltd,2026-11-05
SKU-MEC-3091,100,PO-2026-0902,THK Precision Motion,2026-11-08
SKU-FST-8812,30,PO-2026-0903,Wurth Fasteners Group,2026-11-02
SKU-PNM-4420,35,PO-2026-0904,SMC Pneumatics International,2026-11-10
SKU-RAW-9011,40,PO-2026-0905,Alcoa Metal Supply Corp,2026-11-12
SKU-PKG-7750,25,PO-2026-0906,PackPro Materials Inc,2026-10-31`;
}

export interface ParsedBalanceRow {
  sku: string;
  stockBalance: number;
  locationBin?: string;
  notes?: string;
  matched: boolean;
}

export interface ParsedExtraPORow {
  sku: string;
  extraPoQty: number;
  poNumber?: string;
  supplierName?: string;
  expectedDate?: string;
  matched: boolean;
}

export function parseStockBalanceText(text: string, existingCatalog: WMSItem[]): ParsedBalanceRow[] {
  const existingSkus = new Set(existingCatalog.map(i => i.sku.trim().toUpperCase()));
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
  if (lines.length === 0) return [];

  const results: ParsedBalanceRow[] = [];
  
  // Check if first line is header
  const firstLine = lines[0].toLowerCase();
  const startIndex = (firstLine.includes('sku') || firstLine.includes('balance') || firstLine.includes('qty')) ? 1 : 0;

  for (let i = startIndex; i < lines.length; i++) {
    const rawLine = lines[i];
    // Support comma, tab, or semicolon separated
    const parts = rawLine.split(/[,\t;]/).map(p => p.trim().replace(/^["']|["']$/g, ''));
    if (parts.length >= 2) {
      const sku = parts[0].trim();
      const rawQty = parts[1].replace(/[^0-9.-]/g, '');
      const stockBalance = parseInt(rawQty, 10);
      
      if (sku && !isNaN(stockBalance)) {
        results.push({
          sku,
          stockBalance: Math.max(0, stockBalance),
          locationBin: parts[2] || undefined,
          notes: parts[3] || undefined,
          matched: existingSkus.has(sku.toUpperCase())
        });
      }
    }
  }

  return results;
}

export function parseExtraPOText(text: string, existingCatalog: WMSItem[]): ParsedExtraPORow[] {
  const existingSkus = new Set(existingCatalog.map(i => i.sku.trim().toUpperCase()));
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
  if (lines.length === 0) return [];

  const results: ParsedExtraPORow[] = [];
  
  const firstLine = lines[0].toLowerCase();
  const startIndex = (firstLine.includes('sku') || firstLine.includes('po') || firstLine.includes('qty')) ? 1 : 0;

  for (let i = startIndex; i < lines.length; i++) {
    const rawLine = lines[i];
    const parts = rawLine.split(/[,\t;]/).map(p => p.trim().replace(/^["']|["']$/g, ''));
    if (parts.length >= 2) {
      const sku = parts[0].trim();
      const rawQty = parts[1].replace(/[^0-9.-]/g, '');
      const extraPoQty = parseInt(rawQty, 10);
      
      if (sku && !isNaN(extraPoQty)) {
        results.push({
          sku,
          extraPoQty: Math.max(0, extraPoQty),
          poNumber: parts[2] || undefined,
          supplierName: parts[3] || undefined,
          expectedDate: parts[4] || undefined,
          matched: existingSkus.has(sku.toUpperCase())
        });
      }
    }
  }

  return results;
}

export function exportReplenishmentShortagesCSV(items: WMSItem[]): void {
  const header = ['SKU', 'Item Name', 'Category', 'Unit', 'Preset Minimum Required', 'Current Stock Balance', 'Extra PO Stock', 'Qty Not Sufficient (Need to Order)', 'Unit Cost ($)', 'Total Order Cost ($)', 'Supplier', 'Bin Location'];
  
  const rows = items.map(item => {
    const deficit = Math.max(0, item.minRequiredStock - item.stockBalance - item.extraPoStock);
    const orderCost = (deficit * item.unitCost).toFixed(2);
    return [
      `"${item.sku}"`,
      `"${item.name.replace(/"/g, '""')}"`,
      `"${item.category}"`,
      `"${item.unit}"`,
      item.minRequiredStock,
      item.stockBalance,
      item.extraPoStock,
      deficit,
      item.unitCost.toFixed(2),
      orderCost,
      `"${item.supplierName.replace(/"/g, '""')}"`,
      `"${item.locationBin}"`
    ].join(',');
  });

  const csvContent = [header.join(','), ...rows].join('\n');
  const dateStr = new Date().toISOString().split('T')[0];
  downloadFile(csvContent, `WMS_Replenishment_Order_Report_${dateStr}.csv`);
}

export function exportPurchaseOrderCSV(po: PurchaseOrder): void {
  const meta = [
    `"Purchase Order", "${po.poNumber}"`,
    `"Supplier", "${po.supplierName}"`,
    `"Date Created", "${po.dateCreated}"`,
    `"Expected Delivery", "${po.expectedDelivery}"`,
    `"Status", "${po.status}"`,
    `"Total Order Value", "$${po.totalAmount.toFixed(2)}"`,
    ''
  ];

  const header = ['SKU', 'Item Description', 'Unit', 'Quantity Ordered', 'Unit Price ($)', 'Line Total ($)'];
  const rows = po.items.map(i => [
    `"${i.sku}"`,
    `"${i.name.replace(/"/g, '""')}"`,
    `"${i.unit}"`,
    i.qtyToOrder,
    i.unitCost.toFixed(2),
    i.lineTotal.toFixed(2)
  ].join(','));

  const csvContent = [...meta, header.join(','), ...rows].join('\n');
  downloadFile(csvContent, `${po.poNumber}_${po.supplierName.replace(/\s+/g, '_')}.csv`);
}
