import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: GridIcon, roles: ['admin', 'teacher', 'student'] },
  { to: '/attendance', label: 'Attendance', icon: CheckIcon, roles: ['admin', 'teacher'] },
  { to: '/students', label: 'Students', icon: UsersIcon, roles: ['admin', 'teacher'] },
  { to: '/my-attendance', label: 'My Attendance', icon: MyAttendanceIcon, roles: ['student'] },
  { to: '/analytics', label: 'Analytics', icon: ChartIcon, roles: ['admin', 'teacher', 'student'] },
  { to: '/reports', label: 'Reports', icon: ReportIcon, roles: ['admin', 'teacher'] },
  { to: '/admin/users', label: 'Users', icon: ShieldIcon, roles: ['admin'] },
];

export default function Layout() {
  const { user, logout, isAdmin } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const userNav = navItems.filter((item) => item.roles.includes(user?.role));
  const initials = user?.name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || 'U';

  return (
    <div className="flex h-screen overflow-hidden bg-slate-950">
      {/* ── Sidebar ─────────────────────────────────────────────── */}
      <aside
        className={`
          relative flex flex-col flex-shrink-0 bg-slate-900/80 backdrop-blur-md
          border-r border-slate-800/60 transition-all duration-300 ease-in-out z-20
          ${sidebarOpen ? 'w-64' : 'w-16'}
        `}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-slate-800/60">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-sky-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-indigo-500/20">
            <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-white" stroke="currentColor" strokeWidth={2}>
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              <path d="M9 12l2 2 4-4" />
            </svg>
          </div>
          {sidebarOpen && (
            <div className="overflow-hidden">
              <div className="text-sm font-bold text-slate-100 leading-tight">Attendance</div>
              <div className="text-xs text-indigo-400 font-medium">Analyzer</div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-2">
          <div className={`text-xs font-semibold text-slate-600 uppercase tracking-widest mb-2 ${sidebarOpen ? 'px-2' : 'text-center'}`}>
            {sidebarOpen ? 'Menu' : '•••'}
          </div>
          <ul className="space-y-1">
            {userNav.map(({ to, label, icon: Icon }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
                     ${isActive
                      ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/20'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    }`
                  }
                  title={!sidebarOpen ? label : undefined}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {sidebarOpen && <span>{label}</span>}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* User section */}
        <div className="p-3 border-t border-slate-800/60">
          <div
            className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-slate-800/60 cursor-pointer transition-colors"
            onClick={() => navigate('/profile')}
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {initials}
            </div>
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-slate-200 truncate">{user?.name}</div>
                <div className="text-xs text-slate-500 capitalize">{user?.role}</div>
              </div>
            )}
          </div>

          {sidebarOpen && (
            <button
              onClick={handleLogout}
              className="mt-2 w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
            >
              <LogoutIcon className="w-4 h-4" />
              Sign out
            </button>
          )}
        </div>

        {/* Toggle button */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="absolute -right-3 top-16 w-6 h-6 bg-slate-800 border border-slate-700 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-200 hover:bg-slate-700 transition-colors"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className={`w-3 h-3 transition-transform ${sidebarOpen ? '' : 'rotate-180'}`}>
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
      </aside>

      {/* ── Main content ─────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="h-16 flex items-center justify-between px-6 border-b border-slate-800/60 bg-slate-950/80 backdrop-blur-sm flex-shrink-0">
          <div className="text-sm text-slate-500">
            <span className="font-semibold text-slate-300">Runtime Rebels</span>
            <span className="mx-2 text-slate-700">·</span>
            Intelligent Attendance Pattern Analyzer
          </div>
          <div className="flex items-center gap-3">
            {isAdmin && (
              <span className="badge badge-danger text-xs">
                Admin
              </span>
            )}
            <div className="text-xs text-slate-600 font-mono">{new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

// ─── Inline icons ─────────────────────────────────────────────────────────────
function GridIcon({ className }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>;
}
function CheckIcon({ className }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/></svg>;
}
function UsersIcon({ className }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>;
}
function ChartIcon({ className }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>;
}
function ReportIcon({ className }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><path d="M9 17v-2m3 2v-4m3 4v-6M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z"/></svg>;
}
function ShieldIcon({ className }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>;
}
function LogoutIcon({ className }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>;
}
function MyAttendanceIcon({ className }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/><path d="M9 14l2 2 4-4"/></svg>;
}
