import React, { useState } from 'react';
import { useInventory } from '../../context/InventoryContext';
import { UserProfile, Role } from '../../types/inventory';
import {
  Users,
  UserPlus,
  Shield,
  Copy,
  Check,
  Trash2,
  X,
  Sparkles,
} from 'lucide-react';
import { sound } from '../../utils/audio';

interface StaffManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StaffManagementModal: React.FC<StaffManagementModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { user, users, role, warehouses, createStaffAccount, deleteUserAccount } = useInventory();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [staffRole, setStaffRole] = useState<Role>('warehouse_staff');
  const [warehouseId, setWarehouseId] = useState(warehouses[0]?.id || 'wh-main');
  const [customPassword, setCustomPassword] = useState('');

  const [createdCredentials, setCreatedCredentials] = useState<{
    user: UserProfile;
    temporaryPassword: string;
  } | null>(null);

  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) return;

    const result = await createStaffAccount({
      name,
      email,
      role: staffRole,
      warehouseId,
      temporaryPassword: customPassword.trim() || undefined,
    });

    if (!result) return;
    setCreatedCredentials(result);
    setName('');
    setEmail('');
    setCustomPassword('');
  };

  const handleCopyCredentials = () => {
    if (!createdCredentials) return;
    const text = `StockSense IMS Login Credentials\nEmail: ${createdCredentials.user.email}\nTemporary Password: ${createdCredentials.temporaryPassword}\nAssigned Warehouse: ${createdCredentials.user.warehouseId}\nRole: ${createdCredentials.user.role === 'inventory_manager' ? 'Inventory Manager' : 'Warehouse Staff'}\nPortal URL: ${window.location.origin}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    sound.playSuccess();
    setTimeout(() => setCopied(false), 2000);
  };

  const isManager = role === 'inventory_manager';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl bg-white border border-stone-200 rounded-3xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-100 bg-stone-50/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-800">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
                Warehouse Staff Account Provisioning
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-bold border border-amber-300">
                  Manager Only
                </span>
              </h3>
              <p className="text-xs text-stone-500">
                Only the Inventory Manager can create accounts for warehouse staff and managers
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-stone-900">
          {!isManager ? (
            <div className="p-6 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-2 text-center">
              <Shield className="w-8 h-8 text-amber-600 mx-auto" />
              <div className="font-bold text-sm">Restricted Access Control</div>
              <p className="text-stone-600">
                Only authenticated Inventory Managers can provision accounts for warehouse staff and managers. Switch to an Inventory Manager profile to create accounts.
              </p>
            </div>
          ) : (
            <>
              {/* Created Credentials Success Callout */}
              {createdCredentials && (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-3 animate-in zoom-in-95 duration-200">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-emerald-600" />
                      Staff Account Created Successfully
                    </span>
                    <button
                      onClick={handleCopyCredentials}
                      className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-xs transition-colors"
                    >
                      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? 'Copied to Clipboard' : 'Copy Credentials'}</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-white p-3 rounded-xl border border-emerald-200 shadow-2xs">
                    <div>
                      <span className="text-stone-500">Name:</span>{' '}
                      <span className="text-stone-900 font-bold">{createdCredentials.user.name}</span>
                    </div>
                    <div>
                      <span className="text-stone-500">Role:</span>{' '}
                      <span className="text-stone-900 font-bold capitalize">
                        {createdCredentials.user.role.replace('_', ' ')}
                      </span>
                    </div>
                    <div>
                      <span className="text-stone-500">Login Email:</span>{' '}
                      <span className="text-stone-900 font-bold">{createdCredentials.user.email}</span>
                    </div>
                    <div>
                      <span className="text-stone-500">Initial Password:</span>{' '}
                      <span className="text-emerald-700 font-bold font-mono">
                        {createdCredentials.temporaryPassword}
                      </span>
                    </div>
                  </div>

                  <div className="text-[11px] text-stone-600">
                    Dispatch these credentials to the operator. They can log in immediately and update their password from their profile menu.
                  </div>
                </div>
              )}

              {/* Account Creation Form */}
              <form onSubmit={handleCreate} className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-4">
                <div className="text-xs font-bold uppercase tracking-wider text-stone-800 flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-amber-700" />
                  <span>Provision New Staff Account</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Staff Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. David Miller"
                      className="w-full px-3 py-2 bg-white border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-none focus:border-stone-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Staff Work Email *
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. d.miller@stocksense.io"
                      className="w-full px-3 py-2 bg-white border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-none focus:border-stone-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">Role</label>
                    <select
                      value={staffRole}
                      onChange={(e) => setStaffRole(e.target.value as Role)}
                      className="w-full px-3 py-2 bg-white border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-none focus:border-stone-400"
                    >
                      <option value="warehouse_staff">Warehouse Staff (Floor)</option>
                      <option value="inventory_manager">Warehouse Manager (Admin)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Assigned Facility
                    </label>
                    <select
                      value={warehouseId}
                      onChange={(e) => setWarehouseId(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-none focus:border-stone-400"
                    >
                      {warehouses.map((wh) => (
                        <option key={wh.id} value={wh.id}>
                          {wh.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Initial Password (Optional)
                    </label>
                    <input
                      type="text"
                      value={customPassword}
                      onChange={(e) => setCustomPassword(e.target.value)}
                      placeholder="Auto-generated if blank"
                      className="w-full px-3 py-2 bg-white border border-stone-200 rounded-xl text-xs font-mono text-stone-900 focus:outline-none focus:border-stone-400"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-semibold text-xs shadow-xs transition-all flex items-center gap-2"
                  >
                    <UserPlus className="w-3.5 h-3.5 text-amber-400" />
                    <span>Issue Credentials & Create Account</span>
                  </button>
                </div>
              </form>

              {/* Existing Staff Roster Table */}
              <div className="space-y-3 pt-2">
                <div className="text-xs font-bold uppercase tracking-wider text-stone-700">
                  Provisioned Warehouse Accounts ({users.length})
                </div>

                <div className="rounded-2xl border border-stone-200 bg-white overflow-hidden shadow-2xs">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-stone-50 text-stone-600 border-b border-stone-200">
                      <tr>
                        <th className="py-2.5 px-3">User</th>
                        <th className="py-2.5 px-3">Role</th>
                        <th className="py-2.5 px-3">Facility</th>
                        <th className="py-2.5 px-3">Created By</th>
                        <th className="py-2.5 px-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {users.map((u) => {
                        const wh = warehouses.find((w) => w.id === u.warehouseId);
                        const isRoot = u.id === user.id;
                        return (
                          <tr key={u.id} className="hover:bg-stone-50">
                            <td className="py-2.5 px-3">
                              <div className="flex items-center gap-2">
                                <img
                                  src={u.avatar}
                                  alt={u.name}
                                  className="w-6 h-6 rounded-md object-cover ring-1 ring-stone-200"
                                />
                                <div>
                                  <div className="font-semibold text-stone-900">{u.name}</div>
                                  <div className="text-[10px] text-stone-500 font-mono">{u.email}</div>
                                </div>
                              </div>
                            </td>
                            <td className="py-2.5 px-3">
                              <span
                                className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                                  u.role === 'inventory_manager'
                                    ? 'bg-amber-100 text-amber-900 font-bold'
                                    : 'bg-stone-100 text-stone-700'
                                }`}
                              >
                                {u.role === 'inventory_manager' ? 'Manager' : 'Staff'}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-stone-600 text-[11px]">
                              {wh?.name || u.warehouseId}
                            </td>
                            <td className="py-2.5 px-3 text-stone-500 text-[11px]">
                              {u.createdBy || 'Manager'}
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              {!isRoot && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (confirm(`Revoke account for ${u.name}?`)) {
                                      deleteUserAccount(u.id);
                                    }
                                  }}
                                  title="Revoke User Account"
                                  className="p-1 text-stone-400 hover:text-rose-600 rounded"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
