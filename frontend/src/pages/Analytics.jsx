import React, { useState, useEffect } from 'react';
import { Bar, Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { analyticsAPI } from '../services/api';
import { AttendanceBar, EmptyState } from '../components/shared';
import { InlineSpinner } from '../components/shared/PageSpinner';
import { getAttendanceTextClass, getAttendanceBadge } from '../utils';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const chartOpts = (yMax = 100) => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false }, tooltip: { backgroundColor: '#1e293b', borderColor: '#334155', borderWidth: 1, padding: 10, titleColor: '#e2e8f0', bodyColor: '#94a3b8', callbacks: { label: (c) => ` ${c.raw}%` } } },
  scales: {
    x: { grid: { color: 'rgba(148,163,184,0.05)' }, ticks: { color: '#64748b', font: { size: 10 } } },
    y: { grid: { color: 'rgba(148,163,184,0.05)' }, ticks: { color: '#64748b', font: { size: 10 }, callback: (v) => v + '%' }, beginAtZero: true, max: yMax },
  },
});

export default function Analytics() {
  const { isStudent } = useAuth();
  const [students, setStudents] = useState([]);
  const [trends, setTrends] = useState([]);
  const [loading, setLoading] = useState(!isStudent);
  const [trendsLoading, setTrendsLoading] = useState(true);
  const [filter, setFilter] = useState({ section: '', semester: '', branch: '', subject: '', threshold: '75' });
  const [trendFilter, setTrendFilter] = useState({ type: 'weekly', months: '3' });
  const [sortBy, setSortBy] = useState('percentage');

  const fetchStudents = async () => {
    if (isStudent) return;
    setLoading(true);
    try {
      const res = await analyticsAPI.getStudentAttendance(filter);
      setStudents(res.data.data || []);
    } catch { toast.error('Failed to load analytics'); }
    setLoading(false);
  };

  const fetchTrends = async () => {
    setTrendsLoading(true);
    try {
      const res = await analyticsAPI.getTrends(trendFilter);
      setTrends(res.data.data || []);
    } catch {}
    setTrendsLoading(false);
  };

  useEffect(() => { fetchStudents(); }, [filter]);
  useEffect(() => { fetchTrends(); }, [trendFilter]);

  const sorted = [...students].sort((a, b) => {
    if (sortBy === 'percentage') return a.percentage - b.percentage;
    if (sortBy === 'name') return a.name.localeCompare(b.name);
    if (sortBy === 'rollNumber') return a.rollNumber.localeCompare(b.rollNumber);
    return 0;
  });

  const atRisk = students.filter((s) => s.percentage < parseFloat(filter.threshold));
  const avgPct = students.length ? (students.reduce((a, s) => a + s.percentage, 0) / students.length).toFixed(1) : 0;

  const trendChartData = {
    labels: trends.map((t) => t.period),
    datasets: [{
      label: 'Attendance %',
      data: trends.map((t) => t.percentage),
      borderColor: '#6366f1',
      backgroundColor: 'rgba(99,102,241,0.1)',
      fill: true,
      tension: 0.4,
      borderWidth: 2,
      pointRadius: 4,
      pointBackgroundColor: '#6366f1',
    }],
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Analytics</h1>
          <p className="page-subtitle mt-1">Deep dive into attendance patterns</p>
        </div>
      </div>

      {/* Summary cards — only for admin/teacher */}
      {!isStudent && (
        <div className="grid grid-cols-3 gap-4">
          <div className="card p-4 text-center">
            <div className="text-3xl font-bold text-indigo-400 mb-1">{loading ? '—' : students.length}</div>
            <div className="text-xs text-slate-500 font-medium uppercase tracking-wide">Students</div>
          </div>
          <div className="card p-4 text-center">
            <div className={`text-3xl font-bold mb-1 ${getAttendanceTextClass(parseFloat(avgPct))}`}>{loading ? '—' : `${avgPct}%`}</div>
            <div className="text-xs text-slate-500 font-medium uppercase tracking-wide">Avg Attendance</div>
          </div>
          <div className="card p-4 text-center">
            <div className="text-3xl font-bold text-amber-400 mb-1">{loading ? '—' : atRisk.length}</div>
            <div className="text-xs text-slate-500 font-medium uppercase tracking-wide">At Risk (&lt;{filter.threshold}%)</div>
          </div>
        </div>
      )}

      {/* Trend chart */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-slate-200">Attendance Trend</h2>
          <div className="flex gap-2">
            <select value={trendFilter.type} onChange={(e) => setTrendFilter(p => ({ ...p, type: e.target.value }))} className="input py-1.5 text-xs w-28">
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
            <select value={trendFilter.months} onChange={(e) => setTrendFilter(p => ({ ...p, months: e.target.value }))} className="input py-1.5 text-xs w-28">
              <option value="1">1 month</option>
              <option value="3">3 months</option>
              <option value="6">6 months</option>
            </select>
          </div>
        </div>
        <div className="h-56">
          {trendsLoading ? (
            <div className="h-full flex items-center justify-center"><InlineSpinner /></div>
          ) : trends.length > 0 ? (
            <Line data={trendChartData} options={chartOpts()} />
          ) : (
            <EmptyState title="No trend data" message="Mark attendance to generate trends" />
          )}
        </div>
      </div>

      {/* Student-wise table — admin/teacher only */}
      {isStudent ? (
        <div className="card p-8 text-center">
          <div className="text-slate-400 text-sm">Student-wise analysis is available to teachers and admins only.</div>
          <Link to="/dashboard" className="mt-3 inline-block text-indigo-400 hover:text-indigo-300 text-sm">← Back to Dashboard</Link>
        </div>
      ) : (
        <div className="card p-5">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h2 className="text-sm font-semibold text-slate-200">Student-wise Analysis</h2>
            <div className="flex flex-wrap gap-2">
              <select value={filter.semester} onChange={(e) => setFilter(p => ({ ...p, semester: e.target.value }))} className="input py-1.5 text-xs w-24">
                <option value="">All Sems</option>
                {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>Sem {s}</option>)}
              </select>
              <select value={filter.section} onChange={(e) => setFilter(p => ({ ...p, section: e.target.value }))} className="input py-1.5 text-xs w-28">
                <option value="">All Sections</option>
                {['A','B','C','D'].map(s => <option key={s} value={s}>Section {s}</option>)}
              </select>
              <select value={filter.threshold} onChange={(e) => setFilter(p => ({ ...p, threshold: e.target.value }))} className="input py-1.5 text-xs w-32">
                <option value="75">Threshold: 75%</option>
                <option value="80">Threshold: 80%</option>
                <option value="85">Threshold: 85%</option>
              </select>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="input py-1.5 text-xs w-32">
                <option value="percentage">Sort: % (Low→High)</option>
                <option value="name">Sort: Name</option>
                <option value="rollNumber">Sort: Roll No</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-40"><InlineSpinner /></div>
          ) : sorted.length === 0 ? (
            <EmptyState title="No data" message="No attendance records found for the selected filters" />
          ) : (
            <div className="space-y-2">
              {sorted.map((s) => {
                const badge = getAttendanceBadge(s.percentage);
                return (
                  <Link key={s._id} to={`/students/${s._id}`}
                    className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-800/40 transition-colors group">
                    <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-400 flex-shrink-0">
                      {s.name?.charAt(0)}
                    </div>
                    <div className="w-40 flex-shrink-0">
                      <div className="text-sm font-medium text-slate-200 group-hover:text-indigo-300 truncate">{s.name}</div>
                      <div className="text-xs text-slate-500 font-mono">{s.rollNumber}</div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <AttendanceBar percentage={s.percentage} />
                    </div>
                    <span className={`badge ${badge.class}`}>{badge.label}</span>
                    <div className="text-xs text-slate-500 w-24 text-right flex-shrink-0">
                      {s.present}/{s.total} classes
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
