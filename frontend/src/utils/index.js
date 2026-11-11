import { format, formatDistanceToNow, parseISO } from 'date-fns';

// ─── Date helpers ─────────────────────────────────────────────────────────────
export const formatDate = (date, fmt = 'dd MMM yyyy') => {
  if (!date) return '—';
  try {
    const d = typeof date === 'string' ? parseISO(date) : date;
    return format(d, fmt);
  } catch { return '—'; }
};

export const formatDateTime = (date) => formatDate(date, 'dd MMM yyyy, hh:mm a');
export const formatRelative = (date) => {
  try {
    return formatDistanceToNow(typeof date === 'string' ? parseISO(date) : date, { addSuffix: true });
  } catch { return '—'; }
};

// ─── Attendance helpers ───────────────────────────────────────────────────────
export const getAttendanceBadge = (percentage) => {
  if (percentage >= 85) return { class: 'badge-success', label: 'Excellent' };
  if (percentage >= 75) return { class: 'badge-info', label: 'Good' };
  if (percentage >= 60) return { class: 'badge-warning', label: 'At Risk' };
  return { class: 'badge-danger', label: 'Critical' };
};

export const getAttendanceColor = (percentage) => {
  if (percentage >= 85) return '#22c55e';
  if (percentage >= 75) return '#06b6d4';
  if (percentage >= 60) return '#f59e0b';
  return '#ef4444';
};

export const getAttendanceTextClass = (percentage) => {
  if (percentage >= 85) return 'text-emerald-400';
  if (percentage >= 75) return 'text-sky-400';
  if (percentage >= 60) return 'text-amber-400';
  return 'text-red-400';
};

export const getStatusBadge = (status) => {
  const map = {
    present: 'badge-success',
    absent: 'badge-danger',
    late: 'badge-warning',
    excused: 'badge-info',
  };
  return map[status] || 'badge-neutral';
};

// ─── Number helpers ───────────────────────────────────────────────────────────
export const formatPercentage = (value) =>
  `${typeof value === 'number' ? value.toFixed(1) : '0.0'}%`;

// ─── CSV download ─────────────────────────────────────────────────────────────
export const downloadCSV = (blob, filename) => {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || `report-${Date.now()}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
};

// ─── Class name helper ────────────────────────────────────────────────────────
export const cx = (...classes) => classes.filter(Boolean).join(' ');

// ─── Capitalize ───────────────────────────────────────────────────────────────
export const capitalize = (s) => s && s.charAt(0).toUpperCase() + s.slice(1);

// ─── Truncate ─────────────────────────────────────────────────────────────────
export const truncate = (str, n = 30) =>
  str && str.length > n ? str.slice(0, n) + '…' : str;
