import React, { useEffect, useState } from 'react';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  PointElement, LineElement, Title, Tooltip, Legend, Filler,
} from 'chart.js';
import { analyticsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { AttendanceBar, EmptyState } from '../components/shared';
import { InlineSpinner } from '../components/shared/PageSpinner';
import { formatDate, getAttendanceBadge, getAttendanceTextClass, getStatusBadge } from '../utils';
import toast from 'react-hot-toast';

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const chartOpts = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: '#1e293b', borderColor: '#334155', borderWidth: 1,
      titleColor: '#e2e8f0', bodyColor: '#94a3b8',
      callbacks: { label: (c) => ` ${c.raw}%` },
    },
  },
  scales: {
    x: { grid: { color: 'rgba(148,163,184,0.05)' }, ticks: { color: '#64748b', font: { size: 10 } } },
    y: { grid: { color: 'rgba(148,163,184,0.05)' }, ticks: { color: '#64748b', font: { size: 10 }, callback: (v) => v + '%' }, beginAtZero: true, max: 100 },
  },
};

function PredictionWidget({ prediction, threshold, onThresholdChange }) {
  const { isAboveThreshold, classesNeeded, canSkip, percentageAfter } = prediction.prediction;
  const { total, present, percentage } = prediction.current;
  const thNum = parseFloat(threshold);

  return (
    <div className={`card p-5 border ${isAboveThreshold ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-amber-500/30 bg-amber-500/5'}`}>
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">{isAboveThreshold ? '🎯' : '📊'}</span>
          <div>
            <h3 className="text-sm font-bold text-slate-200">Attendance Predictor</h3>
            <p className="text-xs text-slate-500">Based on {total} total classes so far</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">Threshold:</span>
          <select value={threshold} onChange={(e) => onThresholdChange(e.target.value)} className="input py-1 px-2 text-xs w-24">
            <option value="75">75%</option>
            <option value="80">80%</option>
            <option value="85">85%</option>
            <option value="90">90%</option>
          </select>
        </div>
      </div>

      <div className="mb-5">
        <div className="flex justify-between text-xs mb-1.5">
          <span className="text-slate-400">Current Attendance</span>
          <span className={getAttendanceTextClass(percentage)}>{percentage}%</span>
        </div>
        <div className="relative h-3 bg-slate-800 rounded-full overflow-hidden">
          <div
            className={`absolute left-0 top-0 h-full rounded-full transition-all duration-700 ${
              percentage >= 85 ? 'bg-emerald-500' :
              percentage >= 75 ? 'bg-indigo-500' :
              percentage >= 60 ? 'bg-amber-500' : 'bg-red-500'
            }`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
          <div className="absolute top-0 h-full w-0.5 bg-white/50" style={{ left: `${thNum}%` }} />
        </div>
        <div className="flex justify-between text-xs mt-1">
          <span className="text-slate-600">{present} present / {total} total</span>
          <span className="text-slate-600">Target: {threshold}%</span>
        </div>
      </div>

      {isAboveThreshold ? (
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-emerald-400 mb-1">✓</div>
            <div className="text-xs text-emerald-300 font-semibold">Above {threshold}%</div>
            <div className="text-xs text-slate-500 mt-1">You're eligible for exams</div>
          </div>
          <div className="bg-slate-800/60 border border-slate-700/40 rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-amber-400 mb-1">{canSkip}</div>
            <div className="text-xs text-slate-300 font-semibold">Classes you can miss</div>
            <div className="text-xs text-slate-500 mt-1">And still stay above {threshold}%</div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-red-400 mb-1">{classesNeeded}</div>
            <div className="text-xs text-red-300 font-semibold">Consecutive classes needed</div>
            <div className="text-xs text-slate-500 mt-1">To reach {threshold}% attendance</div>
          </div>
          <div className="bg-slate-800/60 border border-slate-700/40 rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-indigo-400 mb-1">{percentageAfter}%</div>
            <div className="text-xs text-slate-300 font-semibold">Attendance after attending</div>
            <div className="text-xs text-slate-500 mt-1">{classesNeeded} more classes</div>
          </div>
        </div>
      )}

      <div className="bg-slate-900/60 rounded-xl p-3 text-xs text-slate-500 space-y-1.5">
        <div className="text-slate-400 font-semibold mb-2">📐 How this is calculated</div>
        {isAboveThreshold ? (
          <>
            <div>Current: <span className="text-slate-300">{present} present ÷ {total} total = {percentage}%</span></div>
            <div>Max missable: <span className="text-slate-300">floor({present} ÷ {thNum/100} − {total}) = {canSkip} classes</span></div>
            <div className="text-slate-600 italic">If you miss more than {canSkip} classes, you'll drop below {threshold}%</div>
          </>
        ) : (
          <>
            <div>Current: <span className="text-slate-300">{present} present ÷ {total} total = {percentage}%</span></div>
            <div>Formula: <span className="text-slate-300">({thNum/100} × {total} − {present}) ÷ (1 − {thNum/100}) = {classesNeeded}</span></div>
            <div>After: <span className="text-slate-300">({present}+{classesNeeded}) ÷ ({total}+{classesNeeded}) = {percentageAfter}%</span></div>
            <div className="text-slate-600 italic">Attend {classesNeeded} classes in a row without missing any</div>
          </>
        )}
      </div>
    </div>
  );
}

function SubjectPredictionTable({ subjects, threshold }) {
  return (
    <div className="card overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-800/60 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-200">Subject-wise Prediction</h3>
        <span className="text-xs text-slate-500">Target: {threshold}%</span>
      </div>
      <div className="divide-y divide-slate-800/50">
        {subjects.map((s) => (
          <div key={s.subject} className="px-5 py-4">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${s.safe ? 'bg-emerald-400' : 'bg-red-400'}`} />
                  <span className="text-sm font-medium text-slate-200 truncate">{s.subject}</span>
                  <span className="text-xs text-slate-600 font-mono">{s.subjectCode}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-500 mb-2">
                  <span>{s.present} present / {s.total} total</span>
                  <span className={`font-semibold ${getAttendanceTextClass(s.percentage)}`}>{s.percentage}%</span>
                </div>
                <AttendanceBar percentage={s.percentage} showLabel={false} height={4} />
              </div>
              <div className="flex-shrink-0 text-right min-w-24">
                {s.safe ? (
                  <>
                    <div className="text-xs text-slate-500 mb-1">Can miss</div>
                    <div className="text-2xl font-bold text-amber-400">{s.canSkip}</div>
                    <div className="text-xs text-slate-600">more classes</div>
                  </>
                ) : (
                  <>
                    <div className="text-xs text-slate-500 mb-1">Must attend</div>
                    <div className="text-2xl font-bold text-red-400">{s.classesNeeded}</div>
                    <div className="text-xs text-slate-600">in a row</div>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function MyAttendance() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notLinked, setNotLinked] = useState(false);
  const [threshold, setThreshold] = useState('75');

  const fetchPrediction = async (t) => {
    try {
      const res = await analyticsAPI.getPrediction({ threshold: t });
      setPrediction(res.data.data);
    } catch (_) {}
  };

  useEffect(() => {
    const fetchMyData = async () => {
      setLoading(true);
      try {
        const meRes = await analyticsAPI.getMyProfile();
        if (!meRes.data.data) { setNotLinked(true); setLoading(false); return; }
        const studentId = meRes.data.data._id;
        const [detailRes, predRes] = await Promise.all([
          analyticsAPI.getStudentDetails(studentId),
          analyticsAPI.getPrediction({ threshold }),
        ]);
        setData(detailRes.data.data);
        setPrediction(predRes.data.data);
      } catch (err) {
        if (err.message?.includes('not found') || err.message?.includes('profile')) {
          setNotLinked(true);
        } else {
          toast.error('Failed to load your attendance');
        }
      }
      setLoading(false);
    };
    fetchMyData();
  }, []);

  const handleThresholdChange = (t) => {
    setThreshold(t);
    fetchPrediction(t);
  };

  if (loading) return <div className="flex items-center justify-center h-64"><InlineSpinner /></div>;

  if (notLinked) {
    return (
      <div className="space-y-5">
        <div>
          <h1 className="page-title">My Attendance</h1>
          <p className="page-subtitle mt-1">Your personal attendance records</p>
        </div>
        <div className="card p-10 text-center space-y-3">
          <div className="text-4xl">🔗</div>
          <h2 className="text-slate-200 font-semibold">Profile Not Linked</h2>
          <p className="text-slate-500 text-sm max-w-md mx-auto">
            Your login account hasn't been linked to a student profile yet.
            Please contact your teacher or admin to link your account.
          </p>
          <p className="text-xs text-slate-600 font-mono">Logged in as: {user?.email}</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { student, overall, subjectBreakdown, monthlyTrend, dailyHistory, isAtRisk } = data;
  const badge = getAttendanceBadge(overall?.percentage || 0);

  const monthlyChart = {
    labels: monthlyTrend.map((m) => m.month),
    datasets: [{
      label: 'Attendance %',
      data: monthlyTrend.map((m) => m.percentage),
      borderColor: '#6366f1',
      backgroundColor: 'rgba(99,102,241,0.1)',
      fill: true, tension: 0.4, borderWidth: 2, pointRadius: 4,
      pointBackgroundColor: '#6366f1',
    }],
  };

  const subjectChart = {
    labels: subjectBreakdown.map((s) => s.subject?.substring(0, 12)),
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

  return (
    <div className="space-y-5">
      <div>
        <h1 className="page-title">My Attendance</h1>
        <p className="page-subtitle mt-1">Your personal attendance records & predictions</p>
      </div>

      <div className="card p-6 flex items-start gap-5">
        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold flex-shrink-0 ${isAtRisk ? 'bg-red-500/15 text-red-400' : 'bg-indigo-500/15 text-indigo-400'}`}>
          {student?.name?.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h2 className="text-xl font-bold text-slate-100">{student?.name}</h2>
              <p className="text-sm text-slate-500 font-mono mt-0.5">{student?.rollNumber}</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {isAtRisk && <span className="badge badge-danger">⚠️ At Risk</span>}
              <span className={`badge ${badge.class}`}>{badge.label}</span>
              <span className="badge badge-neutral">{student?.branch}</span>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            {[
              { label: 'Section', value: `Section ${student?.section}` },
              { label: 'Semester', value: `Semester ${student?.semester}` },
              { label: 'Branch', value: student?.branch },
              { label: 'Batch', value: student?.batch || '—' },
            ].map(({ label, value }) => (
              <div key={label}>
                <div className="text-xs text-slate-500 mb-0.5">{label}</div>
                <div className="text-sm text-slate-200 truncate">{value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Overall Attendance', value: `${(overall?.percentage || 0).toFixed(1)}%`, color: isAtRisk ? 'text-red-400' : 'text-emerald-400' },
          { label: 'Classes Present', value: overall?.present || 0, color: 'text-indigo-400' },
          { label: 'Classes Absent', value: (overall?.total || 0) - (overall?.present || 0), color: 'text-amber-400' },
          { label: 'Total Classes', value: overall?.total || 0, color: 'text-sky-400' },
        ].map(({ label, value, color }) => (
          <div key={label} className="card p-5">
            <div className={`text-3xl font-bold ${color} mb-1`}>{value}</div>
            <div className="text-xs text-slate-500 font-medium uppercase tracking-wide">{label}</div>
          </div>
        ))}
      </div>

      {prediction && (
        <PredictionWidget
          prediction={prediction}
          threshold={threshold}
          onThresholdChange={handleThresholdChange}
        />
      )}

      {prediction?.subjectPredictions?.length > 0 && (
        <SubjectPredictionTable subjects={prediction.subjectPredictions} threshold={threshold} />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-slate-200 mb-4">Monthly Trend</h3>
          <div className="h-48">
            {monthlyTrend.length > 0 ? <Line data={monthlyChart} options={chartOpts} /> : <EmptyState title="No trend data" message="Not enough records" />}
          </div>
        </div>
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-slate-200 mb-4">Subject-wise Attendance</h3>
          <div className="h-48">
            {subjectBreakdown.length > 0 ? <Bar data={subjectChart} options={chartOpts} /> : <EmptyState title="No subject data" />}
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-800/60">
          <h3 className="text-sm font-semibold text-slate-200">Subject-wise Breakdown</h3>
        </div>
        {subjectBreakdown.length === 0 ? <EmptyState title="No subjects" message="No attendance recorded yet" /> : (
          <div className="divide-y divide-slate-800/50">
            {subjectBreakdown.map((s) => (
              <div key={s.subject} className="flex items-center gap-4 px-5 py-3">
                <div className="w-40 flex-shrink-0">
                  <div className="text-sm font-medium text-slate-200 truncate">{s.subject}</div>
                  <div className="text-xs text-slate-500">{s.subjectCode || 'N/A'}</div>
                </div>
                <div className="flex-1"><AttendanceBar percentage={s.percentage} /></div>
                <div className="text-xs text-slate-500 w-20 text-right flex-shrink-0">{s.present}/{s.total}</div>
                <span className={`badge ${getAttendanceBadge(s.percentage).class} flex-shrink-0`}>{s.percentage}%</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-800/60">
          <h3 className="text-sm font-semibold text-slate-200">Recent Attendance History</h3>
        </div>
        {dailyHistory.length === 0 ? <EmptyState title="No history" /> : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead><tr><th>Date</th><th>Subject</th><th>Status</th></tr></thead>
              <tbody>
                {dailyHistory.slice(0, 30).map((r) => (
                  <tr key={r._id}>
                    <td className="text-slate-400 font-mono text-xs">{formatDate(r.date)}</td>
                    <td className="text-slate-300">{r.subject}</td>
                    <td><span className={`badge ${getStatusBadge(r.status)} capitalize`}>{r.status}</span></td>
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
