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
  return `ISBN,StockBalance,LocationBin,Notes
9781108742719,25,A-01-01,Cambridge Primary English Workbook 1 floor count
9781108789943,20,A-01-02,Cambridge Primary English Workbook 2 shelf count
9781108819558,18,A-01-03,Cambridge Primary English Workbook 3 count
9781108760010,35,A-01-04,Cambridge Primary English Workbook 4 restock
9781108783514,40,A-02-01,Cambridge Teacher Resource 1 verified
9781382017206,28,B-01-01,Oxford Maths Teacher Guide 1 count
9781382017275,25,B-01-02,Oxford Maths Teacher Guide 2 count`;
}

export function getExtraPOTemplate(): string {
  return `ISBN,ExtraPoQty,PONumber,SupplierName,ExpectedDate
9781108742719,25,PO-CUP-2026-001,Cambridge University Press,2026-11-05
9781108819558,20,PO-CUP-2026-001,Cambridge University Press,2026-11-05
9781108760010,25,PO-CUP-2026-002,Cambridge University Press,2026-11-06
9781108783514,20,PO-CUP-2026-003,Cambridge University Press,2026-11-08
9781382017299,25,PO-OUP-2026-004,Oxford University Press,2026-11-10
9781382017305,20,PO-OUP-2026-005,Oxford University Press,2026-11-10`;
}

export interface ParsedBalanceRow {
  sku: string;
  isbn?: string;
  stockBalance: number;
  locationBin?: string;
  notes?: string;
  matched: boolean;
}

export interface ParsedExtraPORow {
  sku: string;
  isbn?: string;
  extraPoQty: number;
  poNumber?: string;
  supplierName?: string;
  expectedDate?: string;
  matched: boolean;
}

export function parseStockBalanceText(text: string, existingCatalog: WMSItem[]): ParsedBalanceRow[] {
  const existingIdentifiers = new Set<string>();
  existingCatalog.forEach(i => {
    if (i.isbn) existingIdentifiers.add(i.isbn.trim().toUpperCase());
    if (i.sku) existingIdentifiers.add(i.sku.trim().toUpperCase());
  });

  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
  if (lines.length === 0) return [];

  const results: ParsedBalanceRow[] = [];
  const firstLine = lines[0].toLowerCase();
  const startIndex = (firstLine.includes('isbn') || firstLine.includes('sku') || firstLine.includes('balance') || firstLine.includes('qty')) ? 1 : 0;

  for (let i = startIndex; i < lines.length; i++) {
    const rawLine = lines[i];
    const parts = rawLine.split(/[,\t;]/).map(p => p.trim().replace(/^["']|["']$/g, ''));
    if (parts.length >= 2) {
      const idRaw = parts[0].trim();
      const rawQty = parts[1].replace(/[^0-9.-]/g, '');
      const stockBalance = parseInt(rawQty, 10);
      
      if (idRaw && !isNaN(stockBalance)) {
        const isMatched = existingIdentifiers.has(idRaw.toUpperCase());
        results.push({
          sku: idRaw,
          isbn: idRaw,
          stockBalance: Math.max(0, stockBalance),
          locationBin: parts[2] || undefined,
          notes: parts[3] || undefined,
          matched: isMatched
        });
      }
    }
  }

  return results;
}

export function parseExtraPOText(text: string, existingCatalog: WMSItem[]): ParsedExtraPORow[] {
  const existingIdentifiers = new Set<string>();
  existingCatalog.forEach(i => {
    if (i.isbn) existingIdentifiers.add(i.isbn.trim().toUpperCase());
    if (i.sku) existingIdentifiers.add(i.sku.trim().toUpperCase());
  });

  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
  if (lines.length === 0) return [];

  const results: ParsedExtraPORow[] = [];
  const firstLine = lines[0].toLowerCase();
  const startIndex = (firstLine.includes('isbn') || firstLine.includes('sku') || firstLine.includes('po') || firstLine.includes('qty')) ? 1 : 0;

  for (let i = startIndex; i < lines.length; i++) {
    const rawLine = lines[i];
    const parts = rawLine.split(/[,\t;]/).map(p => p.trim().replace(/^["']|["']$/g, ''));
    if (parts.length >= 2) {
      const idRaw = parts[0].trim();
      const rawQty = parts[1].replace(/[^0-9.-]/g, '');
      const extraPoQty = parseInt(rawQty, 10);
      
      if (idRaw && !isNaN(extraPoQty)) {
        const isMatched = existingIdentifiers.has(idRaw.toUpperCase());
        results.push({
          sku: idRaw,
          isbn: idRaw,
          extraPoQty: Math.max(0, extraPoQty),
          poNumber: parts[2] || undefined,
          supplierName: parts[3] || undefined,
          expectedDate: parts[4] || undefined,
          matched: isMatched
        });
      }
    }
  }

  return results;
}

export function exportReplenishmentShortagesCSV(items: WMSItem[]): void {
  const header = ['ISBN', 'SKU', 'Book Title', 'Category', 'Unit', 'Preset Minimum Required', 'Current Stock Balance', 'Extra PO Stock', 'Qty Not Sufficient (Need to Order)', 'Unit Price ($)', 'Total Order Cost ($)', 'Supplier', 'Bin Location'];
  
  const rows = items.map(item => {
    const deficit = Math.max(0, item.minRequiredStock - item.stockBalance - item.extraPoStock);
    const orderCost = (deficit * item.unitCost).toFixed(2);
    const title = (item.title || item.name || '').replace(/"/g, '""');
    return [
      `"${item.isbn || item.sku}"`,
      `"${item.sku || item.isbn}"`,
      `"${title}"`,
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
  downloadFile(csvContent, `WMS_Book_Replenishment_Order_Report_${dateStr}.csv`);
}

export function exportPurchaseOrderCSV(po: PurchaseOrder): void {
  const meta = [
    `"Purchase Order", "${po.poNumber}"`,
    `"Supplier Publisher", "${po.supplierName}"`,
    `"Date Created", "${po.dateCreated}"`,
    `"Expected Delivery", "${po.expectedDelivery}"`,
    `"Status", "${po.status}"`,
    `"Total Order Value", "$${po.totalAmount.toFixed(2)}"`,
    ''
  ];

  const header = ['ISBN / SKU', 'Book Title', 'Unit', 'Quantity Ordered', 'Unit Price ($)', 'Line Total ($)'];
  const rows = po.items.map(i => [
    `"${i.isbn || i.sku}"`,
    `"${(i.title || i.name).replace(/"/g, '""')}"`,
    `"${i.unit}"`,
    i.qtyToOrder,
    i.unitCost.toFixed(2),
    i.lineTotal.toFixed(2)
  ].join(','));

  const csvContent = [...meta, header.join(','), ...rows].join('\n');
  downloadFile(csvContent, `${po.poNumber}_${po.supplierName.replace(/\s+/g, '_')}.csv`);
}
