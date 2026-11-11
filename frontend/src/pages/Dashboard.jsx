import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Line, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, ArcElement, Title, Tooltip, Legend, Filler,
} from 'chart.js';
import { analyticsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { StatCard, AttendanceBar, EmptyState } from '../components/shared';
import { InlineSpinner } from '../components/shared/PageSpinner';
import { formatDate, getAttendanceTextClass } from '../utils';
import toast from 'react-hot-toast';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Title, Tooltip, Legend, Filler);

const chartDefaults = {
  plugins: { legend: { display: false } },
  scales: {
    x: { grid: { color: 'rgba(148,163,184,0.06)' }, ticks: { color: '#64748b', font: { size: 11, family: 'Plus Jakarta Sans' } } },
    y: { grid: { color: 'rgba(148,163,184,0.06)' }, ticks: { color: '#64748b', font: { size: 11, family: 'Plus Jakarta Sans' } }, beginAtZero: true, max: 100 },
  },
  responsive: true,
  maintainAspectRatio: false,
};

// Icons
const UsersIcon = ({ className }) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>;
const ChartIcon = ({ className }) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>;
const AlertIcon = ({ className }) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;
const CheckIcon = ({ className }) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>;

export default function Dashboard() {
  const { user, isAdmin, isTeacher } = useAuth();
  const [data, setData] = useState(null);
  const [trends, setTrends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ section: '', semester: '', branch: '' });

  const fetchData = async () => {
    setLoading(true);
    try {
      const dashRes = await analyticsAPI.getDashboard(filter);
      setData(dashRes.data.data);
    } catch (err) {
      toast.error('Failed to load dashboard data');
    }
    try {
      const trendRes = await analyticsAPI.getTrends({ type: 'weekly', months: 2 });
      setTrends(trendRes.data.data || []);
    } catch (_) {}
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [filter]);

  const lineData = {
    labels: trends.map((t) => t.period),
    datasets: [{
      label: 'Attendance %',
      data: trends.map((t) => t.percentage),
      borderColor: '#6366f1',
      backgroundColor: 'rgba(99,102,241,0.08)',
      borderWidth: 2,
      pointRadius: 3,
      pointBackgroundColor: '#6366f1',
      fill: true,
      tension: 0.4,
    }],
  };

  const subjectBarData = {
    labels: (data?.subjectWise || []).map((s) => s.subject?.substring(0, 15)),
    datasets: [{
      data: (data?.subjectWise || []).map((s) => s.percentage),
      backgroundColor: (data?.subjectWise || []).map((s) =>
        s.percentage >= 85 ? 'rgba(34,197,94,0.7)' :
        s.percentage >= 75 ? 'rgba(99,102,241,0.7)' :
        s.percentage >= 60 ? 'rgba(245,158,11,0.7)' : 'rgba(239,68,68,0.7)'
      ),
      borderRadius: 6,
    }],
  };

  const doughnutData = data ? {
    labels: ['Present', 'Absent'],
    datasets: [{
      data: [data.overview.present, data.overview.absent],
      backgroundColor: ['rgba(34,197,94,0.8)', 'rgba(239,68,68,0.6)'],
      borderColor: ['#22c55e', '#ef4444'],
      borderWidth: 1,
      hoverOffset: 6,
    }],
  } : null;

  const greeting = () => {
    const h = new Date().getHours();
    return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="page-title">{greeting()}, {user?.name?.split(' ')[0]} 👋</h1>
          <p className="page-subtitle mt-1">{formatDate(new Date(), 'EEEE, MMMM do yyyy')} · Attendance Overview</p>
        </div>
        {(isAdmin || isTeacher) && (
          <div className="flex gap-3">
            <select value={filter.semester} onChange={(e) => setFilter(p => ({ ...p, semester: e.target.value }))}
              className="input w-32 py-2 text-sm">
              <option value="">All Sems</option>
              {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>Sem {s}</option>)}
            </select>
            <select value={filter.section} onChange={(e) => setFilter(p => ({ ...p, section: e.target.value }))}
              className="input w-32 py-2 text-sm">
              <option value="">All Sections</option>
              {['A','B','C','D'].map(s => <option key={s} value={s}>Section {s}</option>)}
            </select>
          </div>
        )}
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Students" value={loading ? null : data?.totalStudents ?? 0} icon={UsersIcon} color="indigo" loading={loading} subtitle="Active enrollments" />
        <StatCard title="Overall Attendance" value={loading ? null : `${data?.overview?.percentage?.toFixed(1) ?? 0}%`} icon={ChartIcon} color="emerald" loading={loading} subtitle={`${data?.overview?.present ?? 0} present today`} />
        <StatCard title="At-Risk Students" value={loading ? null : data?.atRiskCount ?? 0} icon={AlertIcon} color="amber" loading={loading} subtitle="Below 75% threshold" />
        <StatCard title="Classes Tracked" value={loading ? null : (data?.subjectWise?.length ?? 0)} icon={CheckIcon} color="sky" loading={loading} subtitle="Active subjects" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Trend line chart */}
        <div className="card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-slate-200 text-sm">Weekly Attendance Trend</h3>
              <p className="text-xs text-slate-500 mt-0.5">Last 8 weeks</p>
            </div>
            {!loading && <span className="badge badge-info text-xs">{trends.length} weeks</span>}
          </div>
          <div className="h-52">
            {loading ? (
              <div className="h-full flex items-center justify-center"><InlineSpinner /></div>
            ) : trends.length > 0 ? (
              <Line data={lineData} options={{ ...chartDefaults, plugins: { ...chartDefaults.plugins, tooltip: { callbacks: { label: (ctx) => ` ${ctx.raw}%` } } } }} />
            ) : (
              <EmptyState title="No trend data" message="Mark attendance to see trends" />
            )}
          </div>
        </div>

        {/* Doughnut */}
        <div className="card p-5">
          <h3 className="font-semibold text-slate-200 text-sm mb-4">Present vs Absent</h3>
          <div className="h-52 flex items-center justify-center">
            {loading ? <InlineSpinner /> : doughnutData ? (
              <Doughnut data={doughnutData} options={{ responsive: true, maintainAspectRatio: false, cutout: '68%', plugins: { legend: { position: 'bottom', labels: { color: '#94a3b8', font: { size: 11 }, padding: 12 } } } }} />
            ) : (
              <EmptyState title="No data" message="No attendance records" />
            )}
          </div>
          {!loading && data && (
            <div className="mt-3 pt-3 border-t border-slate-800/60 grid grid-cols-2 gap-2 text-center">
              <div><div className="text-xl font-bold text-emerald-400">{data.overview.present}</div><div className="text-xs text-slate-500">Present</div></div>
              <div><div className="text-xl font-bold text-red-400">{data.overview.absent}</div><div className="text-xs text-slate-500">Absent</div></div>
            </div>
          )}
        </div>
      </div>

      {/* Subject bar + At-risk table */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Subject-wise bars */}
        <div className="card p-5">
          <h3 className="font-semibold text-slate-200 text-sm mb-4">Subject-wise Attendance</h3>
          {loading ? (
            <div className="flex items-center justify-center h-40"><InlineSpinner /></div>
          ) : data?.subjectWise?.length > 0 ? (
            <div className="space-y-3">
              {data.subjectWise.map((s) => (
                <div key={s.subject}>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-slate-300 font-medium truncate max-w-[60%]">{s.subject}</span>
                    <span className={getAttendanceTextClass(s.percentage)}>{s.percentage}%</span>
                  </div>
                  <AttendanceBar percentage={s.percentage} showLabel={false} height={5} />
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="No subjects" message="No attendance data recorded" />
          )}
        </div>

        {/* At-risk students */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-200 text-sm">⚠️ At-Risk Students</h3>
            {!loading && data?.atRiskCount > 0 && (
              <Link to="/reports" className="text-xs text-indigo-400 hover:text-indigo-300">View all →</Link>
            )}
          </div>
          {loading ? (
            <div className="flex items-center justify-center h-40"><InlineSpinner /></div>
          ) : data?.atRiskStudents?.length > 0 ? (
            <div className="space-y-2.5">
              {data.atRiskStudents.slice(0, 6).map((s) => (
                <Link key={s._id} to={`/students/${s._id}`}
                  className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-800/60 transition-colors group">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-red-500/15 flex items-center justify-center text-red-400 text-xs font-bold">
                      {s.name?.charAt(0)}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-slate-200 group-hover:text-white">{s.name}</div>
                      <div className="text-xs text-slate-500">{s.rollNumber} · {s.section}</div>
                    </div>
                  </div>
                  <div className="text-sm font-bold text-red-400">{s.percentage}%</div>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState title="No at-risk students" message="All students are above the 75% threshold" icon={CheckIcon} />
          )}
        </div>
      </div>
    </div>
  );
}
