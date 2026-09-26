import React, { useEffect, useState } from 'react';
import { useInventory } from '../../context/InventoryContext';
import {
  User,
  ShieldCheck,
  UserCheck,
  Users,
  KeyRound,
  X,
  CheckCircle,
  Volume2,
  VolumeX,
} from 'lucide-react';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
  onOpenStaffManagement?: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  onLogout,
  onOpenStaffManagement,
}) => {
  const { user, role, warehouses, soundEnabled, setSoundEnabled, updateMyProfile } = useInventory();

  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [warehouseId, setWarehouseId] = useState(user.warehouseId);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Load the latest profile values each time the modal opens
  useEffect(() => {
    if (!isOpen) return;
    setName(user.name);
    setEmail(user.email);
    setWarehouseId(user.warehouseId);
    setCurrentPassword('');
    setNewPassword('');
  }, [isOpen, user.name, user.email, user.warehouseId]);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const ok = await updateMyProfile({
      name,
      email,
      warehouseId: warehouseId || undefined,
      ...(newPassword ? { currentPassword, newPassword } : {}),
    });
    setIsSaving(false);
    if (!ok) return;
    setCurrentPassword('');
    setNewPassword('');
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  const isManager = role === 'inventory_manager';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg bg-white border border-stone-200 rounded-3xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-100 bg-stone-50/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-800">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-stone-900">My Profile & Security</h3>
              <p className="text-xs text-stone-500">Manage credentials, password, and assigned facility</p>
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
        <div className="p-6 overflow-y-auto space-y-5 text-stone-900">
          {/* User Avatar & Role Switcher */}
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-stone-50 border border-stone-200">
            <img
              src={user.avatar}
              alt={user.name}
              className="w-14 h-14 rounded-2xl object-cover ring-1 ring-stone-300"
            />
            <div className="flex-1 min-w-0">
              <h4 className="text-base font-bold text-stone-950 truncate">{user.name}</h4>
              <p className="text-xs text-stone-500 truncate">{user.email}</p>
              <div className="flex items-center gap-2 mt-2">
                <span
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    role === 'inventory_manager'
                      ? 'bg-stone-900 text-white shadow-xs'
                      : 'bg-white text-stone-400 border border-stone-200'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                  <span>Manager</span>
                </span>

                <span
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    role === 'warehouse_staff'
                      ? 'bg-stone-900 text-white shadow-xs'
                      : 'bg-white text-stone-400 border border-stone-200'
                  }`}
                >
                  <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Warehouse Staff</span>
                </span>
              </div>
            </div>
          </div>

          {/* Manager Action: Staff Account Provisioning */}
          {isManager && onOpenStaffManagement && (
            <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Users className="w-4 h-4 text-amber-700" />
                <div>
                  <div className="text-xs font-bold text-amber-950">Staff Account Provisioning</div>
                  <div className="text-[10px] text-amber-800">Only managers can create accounts for operators</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenStaffManagement();
                }}
                className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-xs transition-colors"
              >
                Manage Staff
              </button>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-none focus:border-stone-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Login Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-none focus:border-stone-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Primary Assigned Warehouse
              </label>
              <select
                value={warehouseId}
                onChange={(e) => setWarehouseId(e.target.value)}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-none focus:border-stone-400"
              >
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} ({w.code})
                  </option>
                ))}
              </select>
            </div>

            {/* Change Password / Credentials (Specifically requested by user) */}
            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-bold text-stone-900 uppercase tracking-wider">
                <KeyRound className="w-4 h-4 text-amber-600" />
                <span>Security & Password Credentials</span>
              </div>
              <p className="text-[11px] text-stone-500">
                Warehouse managers and staff can update their password and credentials at any time.
              </p>

              {user.mustChangePassword && (
                <p className="text-[11px] font-semibold text-amber-800">
                  You are using a temporary password. Please set a new one.
                </p>
              )}

              <div>
                <label className="block text-[11px] font-medium text-stone-600 mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required={Boolean(newPassword)}
                  placeholder="Required to change your password"
                  autoComplete="current-password"
                  className="w-full px-3 py-2 bg-white border border-stone-200 rounded-xl text-xs text-stone-900 placeholder-stone-400 font-mono focus:outline-none focus:border-stone-400"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-stone-600 mb-1">
                  Change to New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  minLength={6}
                  autoComplete="new-password"
                  className="w-full px-3 py-2 bg-white border border-stone-200 rounded-xl text-xs text-stone-900 placeholder-stone-400 font-mono focus:outline-none focus:border-stone-400"
                />
              </div>
            </div>

            {/* Audio Feedback Toggle */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-stone-50 border border-stone-200">
              <div className="flex items-center gap-3">
                {soundEnabled ? (
                  <Volume2 className="w-4 h-4 text-stone-800" />
                ) : (
                  <VolumeX className="w-4 h-4 text-stone-400" />
                )}
                <div>
                  <div className="text-xs font-semibold text-stone-800">
                    Audio UI Feedback
                  </div>
                  <div className="text-[10px] text-stone-500">
                    Synthesizer audio for barcode scans and order validations
                  </div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={soundEnabled}
                onChange={(e) => setSoundEnabled(e.target.checked)}
                className="w-4 h-4 rounded border-stone-300 text-stone-900 cursor-pointer"
              />
            </div>

            {isSaved && (
              <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span>Credentials updated successfully!</span>
              </div>
            )}

            <div className="pt-2 flex justify-between items-center">
              <button
                type="button"
                onClick={() => {
                  onLogout();
                  onClose();
                }}
                className="px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-800 text-xs font-semibold transition-colors"
              >
                Logout Session
              </button>

              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 disabled:opacity-60 text-xs font-semibold text-white shadow-xs transition-all"
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
