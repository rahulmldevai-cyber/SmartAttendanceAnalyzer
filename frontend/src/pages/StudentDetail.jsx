import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Line, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { analyticsAPI } from '../services/api';
import { AttendanceBar, EmptyState, StatCard } from '../components/shared';
import { InlineSpinner } from '../components/shared/PageSpinner';
import { formatDate, getAttendanceBadge, getAttendanceTextClass, getStatusBadge } from '../utils';
import toast from 'react-hot-toast';

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const ChartIcon = ({ className }) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>;
const BookIcon = ({ className }) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/></svg>;
const AlertIcon = ({ className }) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/></svg>;
const CalIcon = ({ className }) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>;

export default function StudentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    analyticsAPI.getStudentDetails(id)
      .then((res) => setData(res.data.data))
      .catch((err) => { toast.error('Failed to load student details'); navigate('/students'); })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="flex items-center justify-center h-64"><InlineSpinner /></div>;
  if (!data) return null;

  const { student, overall, subjectBreakdown, monthlyTrend, dailyHistory, isAtRisk } = data;

  const monthlyChart = {
    labels: monthlyTrend.map((m) => m.month),
    datasets: [{
      label: 'Attendance %',
      data: monthlyTrend.map((m) => m.percentage),
      borderColor: '#6366f1',
      backgroundColor: 'rgba(99,102,241,0.1)',
      fill: true,
      tension: 0.4,
      borderWidth: 2,
    }],
  };

  const subjectChart = {
    labels: subjectBreakdown.map((s) => s.subject?.substring(0, 10)),
    datasets: [{
      data: subjectBreakdown.map((s) => s.percentage),
      backgroundColor: subjectBreakdown.map((s) =>
        s.percentage >= 85 ? 'rgba(34,197,94,0.7)' :
        s.percentage >= 75 ? 'rgba(99,102,241,0.7)' :
        s.percentage >= 60 ? 'rgba(245,158,11,0.7)' : 'rgba(239,68,68,0.7)'
      ),
      borderRadius: 6,
    }],
  };

  const chartOpts = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { backgroundColor: '#1e293b', borderColor: '#334155', borderWidth: 1, titleColor: '#e2e8f0', bodyColor: '#94a3b8', callbacks: { label: (c) => ` ${c.raw}%` } } },
    scales: {
      x: { grid: { color: 'rgba(148,163,184,0.05)' }, ticks: { color: '#64748b', font: { size: 10 } } },
      y: { grid: { color: 'rgba(148,163,184,0.05)' }, ticks: { color: '#64748b', font: { size: 10 }, callback: (v) => v + '%' }, beginAtZero: true, max: 100 },
    },
  };

  const badge = getAttendanceBadge(overall.percentage);

  return (
    <div className="space-y-5">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Link to="/students" className="hover:text-slate-300 transition-colors">Students</Link>
        <span>/</span>
        <span className="text-slate-300">{student.name}</span>
      </div>

      {/* Student header card */}
      <div className="card p-6 flex items-start gap-5">
        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold flex-shrink-0 ${isAtRisk ? 'bg-red-500/15 text-red-400' : 'bg-indigo-500/15 text-indigo-400'}`}>
          {student.name?.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-xl font-bold text-slate-100">{student.name}</h1>
              <p className="text-sm text-slate-500 font-mono mt-0.5">{student.rollNumber}</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {isAtRisk && <span className="badge badge-danger">⚠️ At Risk</span>}
              <span className={badge.class}>{badge.label}</span>
              <span className="badge badge-neutral">{student.branch}</span>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            {[
              { label: 'Section', value: `Section ${student.section}` },
              { label: 'Semester', value: `Semester ${student.semester}` },
              { label: 'Email', value: student.email },
              { label: 'Phone', value: student.phone || '—' },
            ].map(({ label, value }) => (
              <div key={label}>
                <div className="text-xs text-slate-500 mb-0.5">{label}</div>
                <div className="text-sm text-slate-200 truncate">{value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Overall Attendance" value={`${overall.percentage?.toFixed(1)}%`} icon={ChartIcon} color={isAtRisk ? 'red' : 'emerald'} />
        <StatCard title="Classes Present" value={overall.present} icon={CalIcon} color="indigo" />
        <StatCard title="Classes Absent" value={overall.total - overall.present} icon={AlertIcon} color="amber" />
        <StatCard title="Total Classes" value={overall.total} icon={BookIcon} color="sky" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-slate-200 mb-4">Monthly Trend</h3>
          <div className="h-48">
            {monthlyTrend.length > 0 ? (
              <Line data={monthlyChart} options={chartOpts} />
            ) : (
              <EmptyState title="No trend data" message="Not enough attendance records" />
            )}
          </div>
        </div>
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-slate-200 mb-4">Subject-wise Attendance</h3>
          <div className="h-48">
            {subjectBreakdown.length > 0 ? (
              <Bar data={subjectChart} options={chartOpts} />
            ) : (
              <EmptyState title="No subject data" />
            )}
          </div>
        </div>
      </div>

      {/* Subject breakdown table */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-800/60">
          <h3 className="text-sm font-semibold text-slate-200">Subject-wise Breakdown</h3>
        </div>
        {subjectBreakdown.length === 0 ? (
          <EmptyState title="No subjects" message="No attendance recorded yet" />
        ) : (
          <div className="divide-y divide-slate-800/50">
            {subjectBreakdown.map((s) => (
              <div key={s.subject} className="flex items-center gap-4 px-5 py-3">
                <div className="w-36 flex-shrink-0">
                  <div className="text-sm font-medium text-slate-200 truncate">{s.subject}</div>
                  <div className="text-xs text-slate-500">{s.subjectCode || 'N/A'}</div>
                </div>
                <div className="flex-1">
                  <AttendanceBar percentage={s.percentage} />
                </div>
                <div className="text-xs text-slate-500 w-20 text-right flex-shrink-0">{s.present}/{s.total}</div>
                <span className={`${getAttendanceBadge(s.percentage).class} flex-shrink-0`}>{s.percentage}%</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent history */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-800/60">
          <h3 className="text-sm font-semibold text-slate-200">Recent Attendance History</h3>
        </div>
        {dailyHistory.length === 0 ? (
          <EmptyState title="No history" />
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Subject</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {dailyHistory.slice(0, 20).map((r) => (
                  <tr key={r._id}>
                    <td className="text-slate-400 font-mono text-xs">{formatDate(r.date)}</td>
                    <td className="text-slate-300">{r.subject}</td>
                    <td><span className={getStatusBadge(r.status) + ' badge capitalize'}>{r.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
