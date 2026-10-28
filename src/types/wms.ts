export interface WMSItem {
  id: string;
  sku: string;
  name: string;
  category: 'Electronics' | 'Mechanical' | 'Fasteners' | 'Packaging' | 'Raw Materials' | 'Pneumatics';
  unit: 'pcs' | 'box' | 'pack' | 'roll' | 'set' | 'kg';
  minRequiredStock: number; // Preset in system
  stockBalance: number;     // Physical warehouse on-hand stock
  extraPoStock: number;     // Extra PO / Inbound purchase order stock
  unitCost: number;         // Unit cost in USD
  supplierId: string;
  supplierName: string;
  leadTimeDays: number;
  locationBin: string;
  lastBalanceUpdate?: string;
  lastPoUpdate?: string;
}

export interface StockCalculation {
  sku: string;
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
  sku: string;
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
