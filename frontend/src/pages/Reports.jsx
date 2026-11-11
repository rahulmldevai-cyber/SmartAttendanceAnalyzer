import React, { useState } from 'react';
import { reportsAPI } from '../services/api';
import { AttendanceBar, EmptyState } from '../components/shared';
import { InlineSpinner } from '../components/shared/PageSpinner';
import { getAttendanceBadge, downloadCSV, formatDate } from '../utils';
import toast from 'react-hot-toast';

const BRANCHES = ['CSE', 'IT', 'ECE', 'EEE', 'ME', 'CE', 'AIDS', 'AIML'];

export default function Reports() {
  const [filter, setFilter] = useState({ section: '', semester: '', branch: '', subject: '', startDate: '', endDate: '' });
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [activeTab, setActiveTab] = useState('attendance');

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const endpoint = activeTab === 'atRisk' ? reportsAPI.getAtRiskReport : reportsAPI.getAttendanceReport;
      const res = await endpoint(filter);
      setReport(res.data);
    } catch (err) {
      toast.error(err.message || 'Failed to generate report');
    }
    setLoading(false);
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await reportsAPI.downloadCSV(filter);
      downloadCSV(res.data, `attendance-report-${Date.now()}.csv`);
      toast.success('CSV exported successfully');
    } catch (err) {
      toast.error('Export failed: ' + err.message);
    }
    setExporting(false);
  };

  const data = report?.data || [];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Reports</h1>
          <p className="page-subtitle mt-1">Generate and export attendance reports</p>
        </div>
        {report && (
          <button onClick={handleExport} disabled={exporting} className="btn btn-secondary">
            {exporting ? <><InlineSpinner size="sm" /> Exporting...</> : (
              <><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="w-4 h-4"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>Export CSV</>
            )}
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 card p-1 w-fit">
        {[{ id: 'attendance', label: 'Attendance Report' }, { id: 'atRisk', label: '⚠️ At-Risk Students' }].map((t) => (
          <button key={t.id} onClick={() => { setActiveTab(t.id); setReport(null); }}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${activeTab === t.id ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="card p-5">
        <h2 className="text-sm font-semibold text-slate-300 mb-4">Report Filters</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-4">
          <div>
            <label className="label text-xs">Section</label>
            <select value={filter.section} onChange={(e) => setFilter(p => ({ ...p, section: e.target.value }))} className="input py-2 text-sm">
              <option value="">All</option>
              {['A','B','C','D'].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="label text-xs">Semester</label>
            <select value={filter.semester} onChange={(e) => setFilter(p => ({ ...p, semester: e.target.value }))} className="input py-2 text-sm">
              <option value="">All</option>
              {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>Sem {s}</option>)}
            </select>
          </div>
          <div>
            <label className="label text-xs">Branch</label>
            <select value={filter.branch} onChange={(e) => setFilter(p => ({ ...p, branch: e.target.value }))} className="input py-2 text-sm">
              <option value="">All</option>
              {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          <div>
            <label className="label text-xs">Start Date</label>
            <input type="date" value={filter.startDate} onChange={(e) => setFilter(p => ({ ...p, startDate: e.target.value }))} className="input py-2 text-sm" />
          </div>
          <div>
            <label className="label text-xs">End Date</label>
            <input type="date" value={filter.endDate} onChange={(e) => setFilter(p => ({ ...p, endDate: e.target.value }))} className="input py-2 text-sm" />
          </div>
          <div className="flex items-end">
            <button onClick={handleGenerate} disabled={loading} className="btn btn-primary w-full">
              {loading ? <><InlineSpinner size="sm" /> Generating...</> : 'Generate'}
            </button>
          </div>
        </div>
      </div>

      {/* Results */}
      {report && (
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-800/60 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-slate-200 text-sm">
                {activeTab === 'atRisk' ? 'At-Risk Students' : 'Attendance Report'}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Generated {formatDate(new Date(), 'dd MMM yyyy, hh:mm a')} · {data.length} records
              </p>
            </div>
            {activeTab === 'atRisk' && report.threshold && (
              <span className="badge badge-warning">Threshold: &lt;{report.threshold}%</span>
            )}
          </div>

          {data.length === 0 ? (
            <EmptyState title="No records found" message="Try adjusting your filter criteria" />
          ) : (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Roll No</th>
                    <th>Section</th>
                    <th>Branch</th>
                    <th>Present</th>
                    <th>Absent</th>
                    <th>Total</th>
                    <th>Attendance</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((s, i) => {
                    const badge = getAttendanceBadge(s.percentage);
                    return (
                      <tr key={s._id || i}>
                        <td>
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-400 flex-shrink-0">
                              {s.name?.charAt(0)}
                            </div>
                            <span className="font-medium text-slate-200">{s.name}</span>
                          </div>
                        </td>
                        <td><span className="font-mono text-xs text-slate-400">{s.rollNumber}</span></td>
                        <td>{s.section}</td>
                        <td><span className="badge badge-neutral text-xs">{s.branch}</span></td>
                        <td className="text-emerald-400 font-medium">{s.present}</td>
                        <td className="text-red-400 font-medium">{s.absent}</td>
                        <td className="text-slate-400">{s.total}</td>
                        <td className="min-w-32">
                          <AttendanceBar percentage={s.percentage} height={4} />
                        </td>
                        <td><span className={badge.class}>{badge.label}</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {!report && !loading && (
        <div className="card flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-800/60 flex items-center justify-center mb-4">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-7 h-7 text-slate-600">
              <path d="M9 17v-2m3 2v-4m3 4v-6M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z"/>
            </svg>
          </div>
          <h3 className="text-base font-semibold text-slate-400 mb-1">No report generated</h3>
          <p className="text-sm text-slate-600">Set your filters and click Generate to view the report.</p>
        </div>
      )}
    </div>
  );
}
