export type UserRole = 'admin' | 'procurement' | 'warehouse' | 'auditor' | 'custom';

export interface UserPermissions {
  canUploadBalance: boolean;     // Can upload physical floor stock balance (Icon 1)
  canUploadExtraPO: boolean;     // Can upload inbound extra PO stock (Icon 2)
  canEditPresets: boolean;       // Can adjust minimum required stock preset thresholds
  canGeneratePO: boolean;        // Can create and issue supplier purchase orders
  canReceiveStock: boolean;      // Can mark shipments as received into physical balance
  canExportData: boolean;        // Can download CSV audit and replenishment reports
  canManageUsers: boolean;       // Can configure users, roles, and user options (Admin only)
}

export interface UserOptions {
  permissions: UserPermissions;
  allowedSuppliers: string[];    // e.g. ['Cambridge University Press'], or ['all']
  allowedCategories: string[];   // e.g. ['Workbook'], or ['all']
  warehouseZone: string;         // 'All Zones' | 'Zone A (Cambridge)' | 'Zone B (Oxford)'
  maxPoApprovalAmount: number;   // Max PO limit allowed without secondary approval ($)
  emailNotifications: boolean;
  notes?: string;
}

export interface AppUser {
  id: string;
  username: string;              // e.g. 'admin' or email
  email: string;
  passwordHash: string;          // Stored password (plaintext demo check)
  displayName: string;
  department: string;
  role: UserRole;
  options: UserOptions;
  status: 'active' | 'suspended';
  lastLogin?: string;
  createdDate: string;
}
