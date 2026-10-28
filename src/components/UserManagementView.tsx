import React, { useState } from 'react';
import { 
  Users, 
  UserPlus, 
  Shield, 
  KeyRound, 
  CheckCircle2, 
  XCircle, 
  Edit3, 
  Trash2, 
  Sliders, 
  X, 
  Save, 
  Lock, 
  Unlock,
  Building2,
  Check,
  AlertTriangle,
  Package,
  Truck,
  ShoppingCart,
  Layers,
  FileSpreadsheet
} from 'lucide-react';
import { AppUser, UserRole, UserOptions, UserPermissions } from '../types/auth';
import { ROLE_OPTION_TEMPLATES } from '../data/defaultUsers';

interface UserManagementViewProps {
  currentUser: AppUser;
  users: AppUser[];
  onUpdateUser: (updatedUser: AppUser) => void;
  onCreateUser: (newUser: AppUser) => void;
  onDeleteUser: (userId: string) => void;
}

export const UserManagementView: React.FC<UserManagementViewProps> = ({
  currentUser,
  users,
  onUpdateUser,
  onCreateUser,
  onDeleteUser,
}) => {
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // New user form state
  const [newUsername, setNewUsername] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('password123');
  const [newName, setNewName] = useState('');
  const [newDepartment, setNewDepartment] = useState('Operations');
  const [newRole, setNewRole] = useState<UserRole>('warehouse');
  const [formError, setFormError] = useState<string | null>(null);

  // Edit modal state
  const [editRole, setEditRole] = useState<UserRole>('warehouse');
  const [editPermissions, setEditPermissions] = useState<UserPermissions>(ROLE_OPTION_TEMPLATES.warehouse.permissions);
  const [editSupplierScope, setEditSupplierScope] = useState<string>('all');
  const [editCategoryScope, setEditCategoryScope] = useState<string>('all');
  const [editZone, setEditZone] = useState<string>('All Zones');
  const [editMaxPoAmount, setEditMaxPoAmount] = useState<number>(10000);
  const [editStatus, setEditStatus] = useState<'active' | 'suspended'>('active');
  const [newPasswordInput, setNewPasswordInput] = useState<string>('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleStartEdit = (user: AppUser) => {
    setEditingUser(user);
    setEditRole(user.role);
    setEditPermissions({ ...user.options.permissions });
    setEditSupplierScope(user.options.allowedSuppliers[0] || 'all');
    setEditCategoryScope(user.options.allowedCategories[0] || 'all');
    setEditZone(user.options.warehouseZone || 'All Zones');
    setEditMaxPoAmount(user.options.maxPoApprovalAmount || 0);
    setEditStatus(user.status);
    setNewPasswordInput('');
    setSaveSuccess(false);
  };

  const handleRoleChange = (role: UserRole) => {
    setEditRole(role);
    // Auto-populate permissions from template
    const template = ROLE_OPTION_TEMPLATES[role];
    if (template) {
      setEditPermissions({ ...template.permissions });
      setEditMaxPoAmount(template.maxPoApprovalAmount);
    }
  };

  const handleTogglePermission = (key: keyof UserPermissions) => {
    setEditPermissions(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
    setEditRole('custom');
  };

  const handleSaveUserOptions = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    const updated: AppUser = {
      ...editingUser,
      role: editRole,
      status: editStatus,
      passwordHash: newPasswordInput.trim() ? newPasswordInput.trim() : editingUser.passwordHash,
      options: {
        ...editingUser.options,
        permissions: editPermissions,
        allowedSuppliers: [editSupplierScope],
        allowedCategories: [editCategoryScope],
        warehouseZone: editZone,
        maxPoApprovalAmount: editMaxPoAmount,
      }
    };

    onUpdateUser(updated);
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      setEditingUser(null);
    }, 600);
  };

  const handleCreateNewUser = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!newUsername.trim() || !newName.trim()) {
      setFormError('Please fill in username and full name.');
      return;
    }

    if (users.some(u => u.username.toLowerCase() === newUsername.trim().toLowerCase())) {
      setFormError('A user with this username already exists.');
      return;
    }

    const templateOptions = ROLE_OPTION_TEMPLATES[newRole] || ROLE_OPTION_TEMPLATES.warehouse;

    const newUser: AppUser = {
      id: `user-${Date.now()}`,
      username: newUsername.trim().toLowerCase(),
      email: newEmail.trim() || `${newUsername.trim().toLowerCase()}@wms.com`,
      passwordHash: newPassword.trim() || 'password123',
      displayName: newName.trim(),
      department: newDepartment.trim(),
      role: newRole,
      options: {
        ...templateOptions,
      },
      status: 'active',
      createdDate: new Date().toISOString().split('T')[0],
      lastLogin: 'Never',
    };

    onCreateUser(newUser);
    setIsAddUserOpen(false);
    setNewUsername('');
    setNewEmail('');
    setNewName('');
  };

  const filteredUsers = users.filter(u => 
    u.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.department.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-5">
      {/* Header Banner */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-slate-100">
                User Management & Access Control (Admin)
              </h2>
              <span className="px-1.5 py-0.2 text-[10px] bg-indigo-500/20 text-indigo-300 font-mono rounded">
                Admin Exclusive
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Determine user roles, granular feature options, warehouse zones, and supplier access limits.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsAddUserOpen(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm transition-all"
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>Add New User</span>
        </button>
      </div>

      {/* Users List Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xs">
        <div className="p-3 border-b border-slate-800 flex items-center justify-between gap-3">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search users by name, username, or department..."
            className="w-72 px-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 placeholder:text-slate-500 focus:outline-hidden focus:border-indigo-500"
          />
          <span className="text-xs text-slate-400 font-mono">
            {filteredUsers.length} total registered accounts
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-950 text-slate-400 font-medium border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">User Profile</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">User Options Determined by Admin</th>
                <th className="px-4 py-3">Warehouse Scope</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {filteredUsers.map((u) => {
                const isCurrent = u.id === currentUser.id;
                const p = u.options.permissions;

                return (
                  <tr key={u.id} className="hover:bg-slate-800/20 transition-colors">
                    {/* User Profile */}
                    <td className="px-4 py-3 font-sans">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-slate-300 text-xs">
                          {u.displayName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                            <span>{u.displayName}</span>
                            {isCurrent && (
                              <span className="px-1.5 py-0.2 text-[10px] bg-cyan-500/20 text-cyan-300 font-mono rounded">
                                You
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono">
                            @{u.username} · {u.email}
                          </div>
                          <div className="text-[10px] text-slate-500">
                            {u.department}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Role */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full capitalize font-sans ${
                        u.role === 'admin' 
                          ? 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/30'
                          : u.role === 'procurement'
                            ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
                            : u.role === 'warehouse'
                              ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/30'
                              : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}>
                        {u.role === 'admin' && <Shield className="w-3 h-3" />}
                        {u.role === 'procurement' && <ShoppingCart className="w-3 h-3" />}
                        {u.role === 'warehouse' && <Package className="w-3 h-3" />}
                        <span>{u.role}</span>
                      </span>
                    </td>

                    {/* User Options Determined by Admin */}
                    <td className="px-4 py-3 font-sans">
                      <div className="flex flex-wrap gap-1.5 max-w-sm">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                          p.canUploadBalance ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-500/30' : 'bg-slate-950 text-slate-600'
                        }`}>
                          Balance Upload: {p.canUploadBalance ? 'Yes' : 'No'}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                          p.canUploadExtraPO ? 'bg-amber-950/80 text-amber-300 border border-amber-500/30' : 'bg-slate-950 text-slate-600'
                        }`}>
                          Extra PO Upload: {p.canUploadExtraPO ? 'Yes' : 'No'}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                          p.canGeneratePO ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/30' : 'bg-slate-950 text-slate-600'
                        }`}>
                          Generate PO: {p.canGeneratePO ? 'Yes' : 'No'}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                          p.canEditPresets ? 'bg-indigo-950/80 text-indigo-300 border border-indigo-500/30' : 'bg-slate-950 text-slate-600'
                        }`}>
                          Preset Edit: {p.canEditPresets ? 'Yes' : 'No'}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                          p.canReceiveStock ? 'bg-teal-950/80 text-teal-300 border border-teal-500/30' : 'bg-slate-950 text-slate-600'
                        }`}>
                          Receive Stock: {p.canReceiveStock ? 'Yes' : 'No'}
                        </span>
                      </div>
                    </td>

                    {/* Warehouse Scope */}
                    <td className="px-4 py-3 font-sans text-xs">
                      <div className="text-slate-300 font-medium">{u.options.warehouseZone}</div>
                      <div className="text-[11px] text-slate-500">
                        Suppliers: {u.options.allowedSuppliers[0] === 'all' ? 'All Publishers' : u.options.allowedSuppliers.join(', ')}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      {u.status === 'active' ? (
                        <span className="inline-flex items-center gap-1 text-emerald-400 font-sans text-xs">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-rose-400 font-sans text-xs">
                          <XCircle className="w-3.5 h-3.5" />
                          Suspended
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5 font-sans">
                        <button
                          type="button"
                          onClick={() => handleStartEdit(u)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-md border border-slate-700 transition-colors"
                        >
                          <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                          <span>Configure Options</span>
                        </button>

                        {!isCurrent && (
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm(`Delete user account "${u.displayName}"?`)) {
                                onDeleteUser(u.id);
                              }
                            }}
                            className="p-1 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors"
                            title="Delete user"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit User Options Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div 
            className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
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
                  <h3 className="text-base font-semibold text-slate-100">
                    Configure User Options: {editingUser.displayName}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Determined by Admin: Set role, granular permissions, and zone access limits.
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setEditingUser(null)}
                className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSaveUserOptions} className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* Role Selection */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-2">
                  Assign User Role
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(['admin', 'procurement', 'warehouse', 'auditor'] as UserRole[]).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => handleRoleChange(r)}
                      className={`p-2.5 rounded-lg border text-left transition-all capitalize ${
                        editRole === r 
                          ? 'bg-indigo-600/20 border-indigo-500 text-indigo-200' 
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <div className="text-xs font-bold">{r}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">Preset options</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Granular Permission Toggles (Admin Determines) */}
              <div className="space-y-2">
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Granular Feature Options (Admin Determined)
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {/* Upload Balance */}
                  <label className="flex items-center justify-between p-3 bg-slate-950 border border-slate-800 rounded-lg cursor-pointer hover:border-slate-700">
                    <div className="flex items-center gap-2.5">
                      <Package className="w-4 h-4 text-cyan-400" />
                      <div>
                        <div className="text-xs font-semibold text-slate-200">Upload Stock Balance</div>
                        <div className="text-[10px] text-slate-400">Physical on-hand counts</div>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={editPermissions.canUploadBalance}
                      onChange={() => handleTogglePermission('canUploadBalance')}
                      className="rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-0 focus:outline-hidden"
                    />
                  </label>

                  {/* Upload Extra PO */}
                  <label className="flex items-center justify-between p-3 bg-slate-950 border border-slate-800 rounded-lg cursor-pointer hover:border-slate-700">
                    <div className="flex items-center gap-2.5">
                      <Truck className="w-4 h-4 text-amber-400" />
                      <div>
                        <div className="text-xs font-semibold text-slate-200">Upload Extra PO Stock</div>
                        <div className="text-[10px] text-slate-400">Inbound purchase orders</div>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={editPermissions.canUploadExtraPO}
                      onChange={() => handleTogglePermission('canUploadExtraPO')}
                      className="rounded border-slate-700 bg-slate-900 text-amber-500 focus:ring-0 focus:outline-hidden"
                    />
                  </label>

                  {/* Generate Supplier PO */}
                  <label className="flex items-center justify-between p-3 bg-slate-950 border border-slate-800 rounded-lg cursor-pointer hover:border-slate-700">
                    <div className="flex items-center gap-2.5">
                      <ShoppingCart className="w-4 h-4 text-emerald-400" />
                      <div>
                        <div className="text-xs font-semibold text-slate-200">Generate Supplier POs</div>
                        <div className="text-[10px] text-slate-400">Order insufficient titles</div>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={editPermissions.canGeneratePO}
                      onChange={() => handleTogglePermission('canGeneratePO')}
                      className="rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-0 focus:outline-hidden"
                    />
                  </label>

                  {/* Edit Preset Stock */}
                  <label className="flex items-center justify-between p-3 bg-slate-950 border border-slate-800 rounded-lg cursor-pointer hover:border-slate-700">
                    <div className="flex items-center gap-2.5">
                      <Sliders className="w-4 h-4 text-indigo-400" />
                      <div>
                        <div className="text-xs font-semibold text-slate-200">Edit Preset Minimums</div>
                        <div className="text-[10px] text-slate-400">Safety threshold adjustments</div>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={editPermissions.canEditPresets}
                      onChange={() => handleTogglePermission('canEditPresets')}
                      className="rounded border-slate-700 bg-slate-900 text-indigo-500 focus:ring-0 focus:outline-hidden"
                    />
                  </label>

                  {/* Receive Stock */}
                  <label className="flex items-center justify-between p-3 bg-slate-950 border border-slate-800 rounded-lg cursor-pointer hover:border-slate-700">
                    <div className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-teal-400" />
                      <div>
                        <div className="text-xs font-semibold text-slate-200">Receive Inbound Stock</div>
                        <div className="text-[10px] text-slate-400">Move PO to physical balance</div>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={editPermissions.canReceiveStock}
                      onChange={() => handleTogglePermission('canReceiveStock')}
                      className="rounded border-slate-700 bg-slate-900 text-teal-500 focus:ring-0 focus:outline-hidden"
                    />
                  </label>

                  {/* Export Reports */}
                  <label className="flex items-center justify-between p-3 bg-slate-950 border border-slate-800 rounded-lg cursor-pointer hover:border-slate-700">
                    <div className="flex items-center gap-2.5">
                      <FileSpreadsheet className="w-4 h-4 text-slate-400" />
                      <div>
                        <div className="text-xs font-semibold text-slate-200">Export CSV Reports</div>
                        <div className="text-[10px] text-slate-400">Shortage audit files</div>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={editPermissions.canExportData}
                      onChange={() => handleTogglePermission('canExportData')}
                      className="rounded border-slate-700 bg-slate-900 text-slate-400 focus:ring-0 focus:outline-hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Warehouse Scopes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-800">
                <div>
                  <label className="text-[11px] text-slate-400 font-semibold uppercase block mb-1">
                    Allowed Publishers Scope
                  </label>
                  <select
                    value={editSupplierScope}
                    onChange={(e) => setEditSupplierScope(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded text-slate-200 focus:outline-hidden focus:border-indigo-500"
                  >
                    <option value="all">All Publishers (Cambridge + Oxford)</option>
                    <option value="Cambridge University Press">Cambridge University Press only</option>
                    <option value="Oxford University Press">Oxford University Press only</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 font-semibold uppercase block mb-1">
                    Warehouse Zone Access
                  </label>
                  <select
                    value={editZone}
                    onChange={(e) => setEditZone(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded text-slate-200 focus:outline-hidden focus:border-indigo-500"
                  >
                    <option value="All Zones">All Warehouse Zones</option>
                    <option value="Zone A (Cambridge)">Zone A (Cambridge primary racks)</option>
                    <option value="Zone B (Oxford)">Zone B (Oxford primary racks)</option>
                  </select>
                </div>
              </div>

              {/* Status & Password Reset */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-800">
                <div>
                  <label className="text-[11px] text-slate-400 font-semibold uppercase block mb-1">
                    Account Status
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded text-slate-200 focus:outline-hidden focus:border-indigo-500"
                  >
                    <option value="active">Active (Access Granted)</option>
                    <option value="suspended">Suspended (Access Revoked)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 font-semibold uppercase block mb-1">
                    Reset User Password (Optional)
                  </label>
                  <input
                    type="text"
                    value={newPasswordInput}
                    onChange={(e) => setNewPasswordInput(e.target.value)}
                    placeholder="Enter new password to overwrite"
                    className="w-full px-2.5 py-1.5 text-xs font-mono bg-slate-950 border border-slate-800 rounded text-slate-200 placeholder:text-slate-600 focus:outline-hidden focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm transition-all"
                >
                  {saveSuccess ? (
                    <>
                      <Check className="w-4 h-4 text-white" />
                      <span>Saved!</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      <span>Apply Options to User</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add New User Modal */}
      {isAddUserOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div 
            className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-slate-100">
                    Add New User Account
                  </h3>
                  <p className="text-xs text-slate-400">
                    Create credentials and assign initial user options.
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsAddUserOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateNewUser} className="p-6 space-y-4">
              {formError && (
                <div className="p-2.5 bg-rose-950/40 border border-rose-500/40 rounded-lg text-xs text-rose-300">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-slate-400 font-semibold uppercase block mb-1">
                    Username *
                  </label>
                  <input
                    type="text"
                    required
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    placeholder="e.g. jdoe"
                    className="w-full px-2.5 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded text-slate-200"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 font-semibold uppercase block mb-1">
                    Password *
                  </label>
                  <input
                    type="text"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs font-mono bg-slate-950 border border-slate-800 rounded text-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] text-slate-400 font-semibold uppercase block mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Jane Doe"
                  className="w-full px-2.5 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded text-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-slate-400 font-semibold uppercase block mb-1">
                    Work Email
                  </label>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="e.g. jdoe@wms.com"
                    className="w-full px-2.5 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded text-slate-200"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 font-semibold uppercase block mb-1">
                    Initial Role & Options Preset
                  </label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded text-slate-200 capitalize"
                  >
                    <option value="warehouse">Warehouse Floor</option>
                    <option value="procurement">Procurement</option>
                    <option value="auditor">Auditor</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddUserOpen(false)}
                  className="px-3.5 py-1.5 text-xs text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm"
                >
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
