import React, { useState } from 'react';
import { attendanceAPI } from '../services/api';
import { InlineSpinner } from '../components/shared/PageSpinner';
import { EmptyState } from '../components/shared';
import toast from 'react-hot-toast';
import { formatDate } from '../utils';

const SUBJECTS = ['Mathematics', 'Physics', 'Chemistry', 'Data Structures', 'DBMS', 'OS', 'CN', 'OOP', 'Web Dev', 'ML'];
const BRANCHES = ['CSE', 'IT', 'ECE', 'EEE', 'ME', 'CE', 'AIDS', 'AIML'];
const STATUSES = ['present', 'absent', 'late', 'excused'];
const STATUS_COLORS = { present: 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400', absent: 'bg-red-500/20 border-red-500/40 text-red-400', late: 'bg-amber-500/20 border-amber-500/40 text-amber-400', excused: 'bg-sky-500/20 border-sky-500/40 text-sky-400' };

export default function Attendance() {
  const [config, setConfig] = useState({ section: 'A', semester: '1', branch: 'CSE', subject: '', date: new Date().toISOString().split('T')[0] });
  const [roster, setRoster] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [rosterLoaded, setRosterLoaded] = useState(false);
  const [saved, setSaved] = useState(false);

  const canFetch = config.section && config.semester && config.branch && config.subject && config.date;

  const fetchRoster = async () => {
    if (!canFetch) return toast.error('Please fill all fields');
    setLoading(true);
    setRosterLoaded(false);
    setSaved(false);
    try {
      const res = await attendanceAPI.getClassRoster(config);
      const students = res.data.data.students;
      setRoster(students);
      // Pre-fill with existing attendance or default to present
      const initialAttendance = {};
      students.forEach((s) => {
        initialAttendance[s._id] = s.status || 'present';
      });
      setAttendance(initialAttendance);
      setRosterLoaded(true);
    } catch (err) {
      toast.error(err.message || 'Failed to load roster');
    }
    setLoading(false);
  };

  const markAll = (status) => {
    const updated = {};
    roster.forEach((s) => { updated[s._id] = status; });
    setAttendance(updated);
  };

  const handleSave = async () => {
    if (!roster.length) return;
    setSaving(true);
    try {
      const records = roster.map((s) => ({
        student: s._id,
        subject: config.subject,
        date: config.date,
        status: attendance[s._id] || 'absent',
        section: config.section,
        semester: parseInt(config.semester),
        branch: config.branch,
      }));

      await attendanceAPI.markBulk(records);
      toast.success(`Attendance saved for ${records.length} students`);
      setSaved(true);
    } catch (err) {
      toast.error(err.message || 'Failed to save attendance');
    }
    setSaving(false);
  };

  const presentCount = Object.values(attendance).filter((s) => s === 'present' || s === 'late').length;
  const absentCount = Object.values(attendance).filter((s) => s === 'absent').length;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="page-title">Mark Attendance</h1>
        <p className="page-subtitle mt-1">Select class details and mark attendance</p>
      </div>

      {/* Config panel */}
      <div className="card p-5">
        <h2 className="text-sm font-semibold text-slate-300 mb-4">Class Configuration</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-4">
          <div>
            <label className="label text-xs">Date</label>
            <input type="date" value={config.date} max={new Date().toISOString().split('T')[0]}
              onChange={(e) => setConfig(p => ({ ...p, date: e.target.value }))} className="input py-2 text-sm" />
          </div>
          <div>
            <label className="label text-xs">Section</label>
            <select value={config.section} onChange={(e) => setConfig(p => ({ ...p, section: e.target.value }))} className="input py-2 text-sm">
              {['A','B','C','D','E'].map(s => <option key={s} value={s}>Section {s}</option>)}
            </select>
          </div>
          <div>
            <label className="label text-xs">Semester</label>
            <select value={config.semester} onChange={(e) => setConfig(p => ({ ...p, semester: e.target.value }))} className="input py-2 text-sm">
              {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>Sem {s}</option>)}
            </select>
          </div>
          <div>
            <label className="label text-xs">Branch</label>
            <select value={config.branch} onChange={(e) => setConfig(p => ({ ...p, branch: e.target.value }))} className="input py-2 text-sm">
              {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          <div>
            <label className="label text-xs">Subject</label>
            <select value={config.subject} onChange={(e) => setConfig(p => ({ ...p, subject: e.target.value }))} className="input py-2 text-sm">
              <option value="">Select Subject</option>
              {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
        <button onClick={fetchRoster} disabled={!canFetch || loading} className="btn btn-primary">
          {loading ? <><InlineSpinner size="sm" /> Loading...</> : 'Load Class Roster'}
        </button>
      </div>

      {/* Roster */}
      {rosterLoaded && (
        <div className="card p-5 space-y-4">
          {/* Summary bar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h2 className="text-sm font-semibold text-slate-300">
                {config.subject} · {config.section} · Sem {config.semester}
                <span className="text-slate-500 font-normal ml-2">({formatDate(config.date)})</span>
              </h2>
            </div>
            <div className="flex items-center gap-3">
              <span className="badge badge-success">{presentCount} Present</span>
              <span className="badge badge-danger">{absentCount} Absent</span>
            </div>
          </div>

          {/* Quick mark buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-slate-500 mr-1">Mark all:</span>
            {STATUSES.map((s) => (
              <button key={s} onClick={() => markAll(s)} className={`btn btn-sm border capitalize ${STATUS_COLORS[s]}`}>
                {s}
              </button>
            ))}
          </div>

          {/* Students grid */}
          {roster.length === 0 ? (
            <EmptyState title="No students found" message="No students match this class configuration" />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {roster.map((student) => {
                const status = attendance[student._id] || 'present';
                return (
                  <div key={student._id}
                    className={`relative rounded-xl border p-3 transition-all duration-150 ${STATUS_COLORS[status]}`}>
                    {/* Already marked indicator */}
                    {student.isMarked && (
                      <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-sky-400" title="Already marked" />
                    )}
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-800/60 flex items-center justify-center text-slate-300 text-xs font-bold">
                        {student.name?.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-slate-100 truncate">{student.name}</div>
                        <div className="text-xs text-slate-500 font-mono">{student.rollNumber}</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      {STATUSES.map((s) => (
                        <button
                          key={s}
                          onClick={() => setAttendance((p) => ({ ...p, [student._id]: s }))}
                          className={`py-1 px-2 rounded-lg text-xs font-medium capitalize transition-all border
                            ${status === s ? STATUS_COLORS[s] + ' font-bold' : 'border-slate-700/40 text-slate-500 hover:text-slate-300 hover:border-slate-600/60 bg-slate-900/40'}`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Save button */}
          {roster.length > 0 && (
            <div className="flex items-center justify-between pt-4 border-t border-slate-800/60">
              <p className="text-xs text-slate-500">
                {presentCount}/{roster.length} students present ({((presentCount / roster.length) * 100).toFixed(1)}%)
              </p>
              <button onClick={handleSave} disabled={saving || saved} className={`btn ${saved ? 'btn-secondary text-emerald-400' : 'btn-primary'}`}>
                {saving ? (
                  <><InlineSpinner size="sm" /> Saving...</>
                ) : saved ? (
                  <>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4 text-emerald-400">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Saved
                  </>
                ) : (
                  <>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                      <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>
                    </svg>
                    Save Attendance
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
