import React from 'react';
import { InlineSpinner } from './PageSpinner';
import { getAttendanceColor } from '../../utils';

// ─── StatCard ─────────────────────────────────────────────────────────────────
export function StatCard({ title, value, subtitle, icon: Icon, trend, color = 'indigo', loading }) {
  const colorMap = {
    indigo: 'from-indigo-500 to-indigo-600',
    emerald: 'from-emerald-500 to-emerald-600',
    amber: 'from-amber-500 to-amber-600',
    red: 'from-red-500 to-red-600',
    sky: 'from-sky-500 to-sky-600',
  };
  const bgMap = {
    indigo: 'bg-indigo-500/10',
    emerald: 'bg-emerald-500/10',
    amber: 'bg-amber-500/10',
    red: 'bg-red-500/10',
    sky: 'bg-sky-500/10',
  };
  const textMap = {
    indigo: 'text-indigo-400',
    emerald: 'text-emerald-400',
    amber: 'text-amber-400',
    red: 'text-red-400',
    sky: 'text-sky-400',
  };

  return (
    <div className="card p-5 flex flex-col gap-4 hover:border-slate-700/60 transition-all duration-200">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">{title}</p>
          {loading ? (
            <div className="h-9 flex items-center"><InlineSpinner /></div>
          ) : (
            <p className="text-3xl font-bold text-slate-100">{value ?? '—'}</p>
          )}
          {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
        </div>
        {Icon && (
          <div className={`w-11 h-11 rounded-xl ${bgMap[color]} flex items-center justify-center`}>
            <Icon className={`w-5 h-5 ${textMap[color]}`} />
          </div>
        )}
      </div>
      {trend !== undefined && (
        <div className="flex items-center gap-1.5 text-xs">
          <span className={trend >= 0 ? 'text-emerald-400' : 'text-red-400'}>
            {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
          <span className="text-slate-600">vs last month</span>
        </div>
      )}
    </div>
  );
}

// ─── AttendanceBar ────────────────────────────────────────────────────────────
export function AttendanceBar({ percentage, showLabel = true, height = 6 }) {
  const color = getAttendanceColor(percentage);
  const pct = Math.min(100, Math.max(0, percentage || 0));

  return (
    <div className="flex items-center gap-3 w-full">
      <div className="flex-1 rounded-full overflow-hidden" style={{ height, background: 'rgba(99,102,241,0.1)' }}>
        <div
          className="h-full rounded-full transition-all duration-1000"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      {showLabel && (
        <span className="text-xs font-semibold w-12 text-right" style={{ color }}>
          {pct.toFixed(1)}%
        </span>
      )}
    </div>
  );
}

// ─── EmptyState ───────────────────────────────────────────────────────────────
export function EmptyState({ title = 'No data', message = 'Nothing to show yet.', action, icon: Icon }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-slate-800/60 flex items-center justify-center mb-4">
        {Icon ? (
          <Icon className="w-7 h-7 text-slate-600" />
        ) : (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-7 h-7 text-slate-600">
            <circle cx="12" cy="12" r="10" /><path d="M8 12h8M12 8v8" />
          </svg>
        )}
      </div>
      <h3 className="text-base font-semibold text-slate-400 mb-1">{title}</h3>
      <p className="text-sm text-slate-600 max-w-xs mb-4">{message}</p>
      {action}
    </div>
  );
}

// ─── ConfirmDialog ────────────────────────────────────────────────────────────
export function ConfirmDialog({ isOpen, onClose, onConfirm, title, message, confirmLabel = 'Confirm', danger = false, loading }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl animate-slide-up p-6">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4 ${danger ? 'bg-red-500/15' : 'bg-indigo-500/15'}`}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={`w-6 h-6 ${danger ? 'text-red-400' : 'text-indigo-400'}`}>
            <path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-slate-100 text-center mb-2">{title}</h3>
        <p className="text-sm text-slate-400 text-center mb-6">{message}</p>
        <div className="flex gap-3">
          <button onClick={onClose} className="btn btn-secondary flex-1">Cancel</button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`btn flex-1 ${danger ? 'bg-red-600 hover:bg-red-500 text-white focus:ring-red-500' : 'btn-primary'}`}
          >
            {loading ? <InlineSpinner size="sm" /> : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Pagination ───────────────────────────────────────────────────────────────
export function Pagination({ page, totalPages, onPageChange, total, limit }) {
  if (totalPages <= 1) return null;
  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  return (
    <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-800/60">
      <p className="text-xs text-slate-500">
        Showing {from}–{to} of {total}
      </p>
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          className="btn btn-ghost btn-sm disabled:opacity-30"
        >
          ‹ Prev
        </button>
        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
          let p = i + 1;
          if (totalPages > 5) {
            if (page <= 3) p = i + 1;
            else if (page >= totalPages - 2) p = totalPages - 4 + i;
            else p = page - 2 + i;
          }
          return (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                p === page
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              {p}
            </button>
          );
        })}
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
          className="btn btn-ghost btn-sm disabled:opacity-30"
        >
          Next ›
        </button>
      </div>
    </div>
  );
}
