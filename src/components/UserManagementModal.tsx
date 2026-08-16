import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../services/api';
import { getGravatarUrl } from '../utils/gravatar';
import {
  Users,
  UserPlus,
  Edit2,
  KeyRound,
  X,
  Search,
  CheckCircle2,
  Shield,
  Clock,
  Zap,
  Copy,
  Link,
} from 'lucide-react';

interface UserManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserManagementModal: React.FC<UserManagementModalProps> = ({ isOpen, onClose }) => {
  const { impersonateUser } = useAuth();
  const toast = useToast();

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Modals state for Add / Edit
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Form state
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('Customer');
  const [phone, setPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res: any = await api.get('/protected/users');
      if (res.success && res.data) {
        setUsers(res.data);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to fetch user accounts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
    }
  }, [isOpen]);

  const resetForm = () => {
    setFullName('');
    setEmail('');
    setPassword('');
    setRole('Customer');
    setPhone('');
    setEditingUser(null);
    setShowAddModal(false);
  };

  const handleOpenEdit = (user: User) => {
    setEditingUser(user);
    setFullName(user.full_name);
    setEmail(user.email);
    setPassword('');
    setRole(user.role);
    setPhone(user.phone || '');
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res: any = await api.post('/protected/users', {
        full_name: fullName,
        email,
        password,
        role,
        phone,
      });
      if (res.success) {
        toast.success(`User account for ${fullName} created successfully.`);
        resetForm();
        fetchUsers();
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to create user account');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setIsSubmitting(true);
    try {
      const payload: any = {
        full_name: fullName,
        email,
        role,
        phone,
      };
      if (password) payload.password = password;

      const res: any = await api.put(`/protected/users/${editingUser.id}`, payload);
      if (res.success) {
        toast.success(`User profile for ${fullName} updated.`);
        resetForm();
        fetchUsers();
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to update user profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyAccessLink = async (user: User) => {
    try {
      const res: any = await api.post(`/protected/users/impersonate/${user.id}`);
      if (res.success && res.data?.token) {
        const accessUrl = `${window.location.origin}/?token=${res.data.token}`;
        await navigator.clipboard.writeText(accessUrl);
        toast.success(`📋 Access link copied for ${user.full_name}! (5 min token). Open in incognito tab or another browser to log in.`);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to generate access link');
    }
  };

  if (!isOpen) return null;

  const filteredUsers = users.filter(
    (u) =>
      u.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="glass-panel w-full max-w-4xl rounded-3xl p-6 border border-slate-700/80 shadow-2xl space-y-6 max-h-[90vh] flex flex-col justify-between overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-white tracking-tight">Admin User Management & Account Access</h2>
              <p className="text-xs text-slate-400">Manage user accounts, update RBAC roles, and generate 10-minute temporary access sessions</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white bg-slate-900 border border-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar & Search */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search user name, email, or role..."
              className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>
          <button
            onClick={() => {
              resetForm();
              setShowAddModal(true);
            }}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white shadow-lg flex items-center justify-center gap-2 glow-cyan"
          >
            <UserPlus className="w-4 h-4" />
            Add New User
          </button>
        </div>

        {/* User Table */}
        <div className="flex-1 overflow-y-auto border border-slate-800 rounded-2xl bg-slate-950/60">
          {loading ? (
            <div className="p-8 text-center text-cyan-400 font-semibold text-xs flex items-center justify-center gap-2">
              <Zap className="w-4 h-4 animate-bounce" /> Loading User Directory...
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="text-slate-400 uppercase bg-slate-900/90 border-b border-slate-800 sticky top-0 z-10">
                  <tr>
                    <th className="px-4 py-3">User Profile</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">Phone</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredUsers.map((u) => (
                    <UserRowItem
                      key={u.id}
                      user={u}
                      onEdit={() => handleOpenEdit(u)}
                      onCopyAccessLink={() => handleCopyAccessLink(u)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Inner Modal: ADD / EDIT USER */}
        {(showAddModal || editingUser) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="glass-panel w-full max-w-md rounded-2xl p-6 border border-slate-700 shadow-2xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white">
                  {editingUser ? `Modify User: ${editingUser.full_name}` : 'Create New User Account'}
                </h3>
                <button onClick={resetForm} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={editingUser ? handleUpdateUser : handleCreateUser} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Jane Doe"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Work Email {editingUser && <span className="text-[10px] text-slate-500 font-normal">(Immutable)</span>}
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="jane@company.com"
                    disabled={Boolean(editingUser)}
                    className={`w-full border rounded-xl px-3 py-2 text-xs ${
                      editingUser
                        ? 'bg-slate-800/80 text-slate-400 border-slate-700/60 cursor-not-allowed'
                        : 'bg-slate-900 text-white border-slate-700'
                    }`}
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    {editingUser ? 'New Password (leave blank to keep current)' : 'Password'}
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                    required={!editingUser}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Role</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  >
                    <option value="Admin">Admin (Full Control)</option>
                    <option value="Warehouse Manager">Warehouse Manager (Stock & Hubs)</option>
                    <option value="Driver">Driver (Fleet & Telemetry)</option>
                    <option value="Customer">Customer (Orders & Tracker)</option>
                    <option value="Operator">Operator (Audit Logs & Monitor)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-900 text-slate-300 hover:text-white border border-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 rounded-xl text-xs font-extrabold bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white shadow-lg flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    {isSubmitting ? 'Saving...' : editingUser ? 'Update User' : 'Create User'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Helper User Row Component for dynamic Gravatar loading
const UserRowItem: React.FC<{
  user: User;
  onEdit: () => void;
  onCopyAccessLink: () => void;
}> = ({ user, onEdit, onCopyAccessLink }) => {
  const [avatarUrl, setAvatarUrl] = useState<string>('');

  useEffect(() => {
    let isMounted = true;
    if (user.email) {
      getGravatarUrl(user.email, 100, 'identicon').then((url) => {
        if (isMounted) setAvatarUrl(url);
      });
    }
    return () => {
      isMounted = false;
    };
  }, [user.email]);

  return (
    <tr className="hover:bg-slate-800/40 transition">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <img
            src={avatarUrl}
            alt={user.full_name}
            className="w-8 h-8 rounded-full border border-cyan-500/30 object-cover bg-slate-900"
          />
          <div>
            <div className="font-bold text-white text-xs">{user.full_name}</div>
            <div className="text-[11px] font-mono text-slate-400">{user.email}</div>
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <span
          className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold border ${
            user.role === 'Admin'
              ? 'bg-purple-500/10 text-purple-300 border-purple-500/30'
              : user.role === 'Warehouse Manager'
              ? 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30'
              : user.role === 'Driver'
              ? 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30'
              : 'bg-slate-800 text-slate-300 border-slate-700'
          }`}
        >
          {user.role}
        </span>
      </td>
      <td className="px-4 py-3 font-mono text-slate-400">{user.phone || '—'}</td>
      <td className="px-4 py-3 text-right">
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={onEdit}
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800"
            title="Edit User Details"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onCopyAccessLink}
            className="px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[11px] font-bold flex items-center gap-1.5 transition"
            title="Copy 5-minute temporary login link to clipboard"
          >
            <Copy className="w-3.5 h-3.5" />
            Copy Access Link (5m)
          </button>
        </div>
      </td>
    </tr>
  );
};
