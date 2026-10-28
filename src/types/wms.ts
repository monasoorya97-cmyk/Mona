export interface WMSItem {
  id: string;
  isbn: string;             // ISBN-13 book identifier (Primary key)
  sku?: string;             // Standard SKU (defaults to ISBN)
  title: string;            // Book / Product Title (Primary title)
  name?: string;            // Standard product name (defaults to Title)
  category: string;         // 'Workbook' | 'Teacher Resource' | string
  unit: string;             // 'pcs' | 'box' | 'pack' | 'set' | string
  minRequiredStock: number; // Preset minimum required stock in system
  stockBalance: number;     // Physical warehouse on-hand stock
  extraPoStock: number;     // Extra PO / Inbound purchase order stock
  unitCost: number;         // Unit cost in USD / Currency
  supplierId: string;
  supplierName: string;
  leadTimeDays: number;
  locationBin: string;
  lastBalanceUpdate?: string;
  lastPoUpdate?: string;
}

export interface StockCalculation {
  isbn: string;
  sku: string;
  title: string;
  requiredStock: number;
  stockBalance: number;
  extraPoStock: number;
  totalAvailable: number; // balance + extra PO
  netDeficit: number;     // required - balance - extra PO
  qtyToOrder: number;     // Math.max(0, netDeficit)
  isInsufficient: boolean;
  status: 'critical' | 'insufficient' | 'warning' | 'sufficient';
  estimatedCost: number;
}

export interface PurchaseOrderLineItem {
  isbn?: string;
  sku: string;
  title?: string;
  name: string;
  unit: string;
  qtyToOrder: number;
  unitCost: number;
  lineTotal: number;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplierId: string;
  supplierName: string;
  dateCreated: string;
  expectedDelivery: string;
  items: PurchaseOrderLineItem[];
  totalAmount: number;
  status: 'Draft' | 'Sent to Supplier' | 'Partially Received' | 'Fulfilled';
  notes?: string;
}

export interface UploadBatchLog {
  id: string;
  type: 'stock_balance' | 'extra_po';
  filename: string;
  timestamp: string;
  recordsCount: number;
  successCount: number;
  errorCount: number;
}
