import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { authAPI, usersAPI } from '../services/api';
import { InlineSpinner } from '../components/shared/PageSpinner';
import { EmptyState, ConfirmDialog, Pagination } from '../components/shared';
import { useApi } from '../hooks';
import { formatDate, formatRelative, capitalize } from '../utils';
import toast from 'react-hot-toast';

// ─── Profile Page ─────────────────────────────────────────────────────────────
export function Profile() {
  const { user } = useAuth();
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [saving, setSaving] = useState(false);
  const [pwError, setPwError] = useState('');

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirmPassword) { setPwError('Passwords do not match'); return; }
    if (pwForm.newPassword.length < 8) { setPwError('Minimum 8 characters'); return; }
    setPwError('');
    setSaving(true);
    try {
      await authAPI.updatePassword({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
      toast.success('Password updated successfully');
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setPwError(err.message);
    }
    setSaving(false);
  };

  const initials = user?.name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || 'U';

  return (
    <div className="space-y-5 max-w-2xl">
      <div>
        <h1 className="page-title">Profile</h1>
        <p className="page-subtitle mt-1">Manage your account settings</p>
      </div>

      {/* Profile info */}
      <div className="card p-6">
        <div className="flex items-center gap-5 mb-6 pb-6 border-b border-slate-800/60">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
            {initials}
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-100">{user?.name}</h2>
            <p className="text-sm text-slate-500">{user?.email}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className={`badge ${user?.role === 'admin' ? 'badge-danger' : user?.role === 'teacher' ? 'badge-info' : 'badge-neutral'}`}>
                {capitalize(user?.role)}
              </span>
              {user?.isEmailVerified && <span className="badge badge-success">✓ Verified</span>}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {[
            { label: 'Full Name', value: user?.name },
            { label: 'Email', value: user?.email },
            { label: 'Department', value: user?.department || '—' },
            { label: 'Employee ID', value: user?.employeeId || '—' },
            { label: 'Last Login', value: user?.lastLogin ? formatRelative(user.lastLogin) : 'First login' },
            { label: 'Member Since', value: formatDate(user?.createdAt) },
          ].map(({ label, value }) => (
            <div key={label} className="bg-slate-950/40 rounded-xl p-3">
              <div className="text-xs text-slate-500 mb-1">{label}</div>
              <div className="text-sm font-medium text-slate-200">{value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Change password */}
      <div className="card p-6">
        <h3 className="font-semibold text-slate-200 mb-4">Change Password</h3>
        <form onSubmit={handlePasswordChange} className="space-y-4">
          {[
            { name: 'currentPassword', label: 'Current Password' },
            { name: 'newPassword', label: 'New Password' },
            { name: 'confirmPassword', label: 'Confirm New Password' },
          ].map(({ name, label }) => (
            <div key={name}>
              <label className="label">{label}</label>
              <input type="password" value={pwForm[name]} onChange={(e) => setPwForm(p => ({ ...p, [name]: e.target.value }))}
                className={`input ${pwError ? 'input-error' : ''}`} placeholder="••••••••" />
            </div>
          ))}
          {pwError && <p className="text-sm text-red-400">{pwError}</p>}
          <button type="submit" disabled={saving} className="btn btn-primary">
            {saving ? <><InlineSpinner size="sm" /> Updating...</> : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Admin Users Page ─────────────────────────────────────────────────────────
export function AdminUsers() {
  const { data, loading, refetch } = useApi((p) => usersAPI.getAll(p), { params: {} });
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [saving, setSaving] = useState(false);

  const users = data?.data || [];

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await usersAPI.delete(deleteTarget._id);
      toast.success('User deleted');
      setDeleteTarget(null);
      refetch();
    } catch (err) { toast.error(err.message); }
    setDeleting(false);
  };

  const handleToggleActive = async (user) => {
    try {
      await usersAPI.update(user._id, { isActive: !user.isActive });
      toast.success(`User ${user.isActive ? 'deactivated' : 'activated'}`);
      refetch();
    } catch (err) { toast.error(err.message); }
  };

  const ROLE_BADGE = { admin: 'badge-danger', teacher: 'badge-info', student: 'badge-neutral' };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="page-title">User Management</h1>
        <p className="page-subtitle mt-1">{users.length} registered users</p>
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48"><InlineSpinner /></div>
        ) : users.length === 0 ? (
          <EmptyState title="No users" message="No users registered yet" />
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Department</th>
                  <th>Status</th>
                  <th>Last Login</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u._id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-indigo-500/15 flex items-center justify-center text-indigo-400 text-xs font-bold">
                          {u.name?.charAt(0)}
                        </div>
                        <div>
                          <div className="font-medium text-slate-200 text-sm">{u.name}</div>
                          <div className="text-xs text-slate-500">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td><span className={`badge ${ROLE_BADGE[u.role] || 'badge-neutral'} capitalize`}>{u.role}</span></td>
                    <td><span className="text-slate-400 text-sm">{u.department || '—'}</span></td>
                    <td>
                      <span className={`badge ${u.isActive ? 'badge-success' : 'badge-danger'}`}>
                        {u.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="text-slate-500 text-xs">{u.lastLogin ? formatRelative(u.lastLogin) : 'Never'}</td>
                    <td className="text-slate-500 text-xs">{formatDate(u.createdAt)}</td>
                    <td>
                      <div className="flex gap-1.5">
                        <button onClick={() => handleToggleActive(u)} className="btn btn-ghost btn-sm p-1.5 text-xs" title={u.isActive ? 'Deactivate' : 'Activate'}>
                          {u.isActive ? '🔒' : '🔓'}
                        </button>
                        <button onClick={() => setDeleteTarget(u)} className="btn btn-ghost btn-sm p-1.5 hover:text-red-400" title="Delete">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="w-4 h-4">
                            <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/>
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete User"
        message={`Are you sure you want to permanently delete ${deleteTarget?.name}? This cannot be undone.`}
        confirmLabel="Delete"
        danger
        loading={deleting}
      />
    </div>
  );
}

// ─── 404 Page ─────────────────────────────────────────────────────────────────
export function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 p-8 text-center">
      <div className="text-8xl font-black text-gradient mb-4">404</div>
      <h1 className="text-2xl font-bold text-slate-200 mb-2">Page not found</h1>
      <p className="text-slate-500 mb-8">The page you're looking for doesn't exist or has been moved.</p>
      <a href="/dashboard" className="btn btn-primary">Go to Dashboard</a>
    </div>
  );
}

export default Profile;
