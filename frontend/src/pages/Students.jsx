import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { studentsAPI } from '../services/api';
import Modal from '../components/shared/Modal';
import { EmptyState, ConfirmDialog, Pagination } from '../components/shared';
import { InlineSpinner } from '../components/shared/PageSpinner';
import { useDebounce } from '../hooks';
import toast from 'react-hot-toast';

const BRANCHES = ['CSE', 'IT', 'ECE', 'EEE', 'ME', 'CE', 'AIDS', 'AIML'];
const SECTIONS = ['A', 'B', 'C', 'D', 'E'];

const emptyForm = { name: '', email: '', rollNumber: '', phone: '', section: 'A', semester: 1, branch: 'CSE', batch: '', parentEmail: '' };

export default function Students() {
  const [students, setStudents] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState({ section: '', semester: '', branch: '' });
  const [modalOpen, setModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const debouncedSearch = useDebounce(search, 400);
  const limit = 20;

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const res = await studentsAPI.getAll({ page, limit, search: debouncedSearch, ...filter });
      setStudents(res.data.data);
      setTotal(res.data.total);
    } catch { toast.error('Failed to load students'); }
    setLoading(false);
  }, [page, debouncedSearch, filter]);

  useEffect(() => { fetchStudents(); }, [fetchStudents]);
  useEffect(() => { setPage(1); }, [debouncedSearch, filter]);

  const openAdd = () => { setEditingStudent(null); setForm(emptyForm); setFormErrors({}); setModalOpen(true); };
  const openEdit = (s) => { setEditingStudent(s); setForm({ name: s.name, email: s.email, rollNumber: s.rollNumber, phone: s.phone || '', section: s.section, semester: s.semester, branch: s.branch, batch: s.batch || '', parentEmail: s.parentEmail || '' }); setFormErrors({}); setModalOpen(true); };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Required';
    if (!form.email || !/\S+@\S+\.\S+/.test(form.email)) e.email = 'Valid email required';
    if (!form.rollNumber.trim()) e.rollNumber = 'Required';
    if (!form.section) e.section = 'Required';
    if (!form.semester || form.semester < 1 || form.semester > 8) e.semester = '1–8';
    if (!form.branch) e.branch = 'Required';
    setFormErrors(e);
    return !Object.keys(e).length;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      if (editingStudent) {
        await studentsAPI.update(editingStudent._id, form);
        toast.success('Student updated');
      } else {
        await studentsAPI.create(form);
        toast.success('Student added');
      }
      setModalOpen(false);
      fetchStudents();
    } catch (err) { toast.error(err.message); }
    setSaving(false);
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await studentsAPI.delete(deleteTarget._id);
      toast.success('Student deactivated');
      setDeleteTarget(null);
      fetchStudents();
    } catch (err) { toast.error(err.message); }
    setDeleting(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
    if (formErrors[name]) setFormErrors((p) => ({ ...p, [name]: '' }));
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Students</h1>
          <p className="page-subtitle mt-1">{total} total students</p>
        </div>
        <button onClick={openAdd} className="btn btn-primary">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Add Student
        </button>
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Search by name or roll number..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input flex-1 min-w-48 py-2 text-sm"
        />
        <select value={filter.semester} onChange={(e) => setFilter(p => ({ ...p, semester: e.target.value }))} className="input w-32 py-2 text-sm">
          <option value="">All Sems</option>
          {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>Sem {s}</option>)}
        </select>
        <select value={filter.section} onChange={(e) => setFilter(p => ({ ...p, section: e.target.value }))} className="input w-32 py-2 text-sm">
          <option value="">All Sections</option>
          {SECTIONS.map(s => <option key={s} value={s}>Section {s}</option>)}
        </select>
        <select value={filter.branch} onChange={(e) => setFilter(p => ({ ...p, branch: e.target.value }))} className="input w-32 py-2 text-sm">
          <option value="">All Branches</option>
          {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
        </select>
        {(filter.section || filter.semester || filter.branch || search) && (
          <button onClick={() => { setFilter({ section: '', semester: '', branch: '' }); setSearch(''); }} className="btn btn-ghost btn-sm text-slate-500">
            Clear
          </button>
        )}
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48"><InlineSpinner /></div>
        ) : students.length === 0 ? (
          <EmptyState title="No students found" message="Try adjusting your filters or add a new student." action={<button onClick={openAdd} className="btn btn-primary btn-sm">Add Student</button>} />
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Roll Number</th>
                  <th>Section</th>
                  <th>Semester</th>
                  <th>Branch</th>
                  <th>Contact</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => (
                  <tr key={s._id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-indigo-500/15 flex items-center justify-center text-indigo-400 text-xs font-bold flex-shrink-0">
                          {s.name?.charAt(0)}
                        </div>
                        <div>
                          <Link to={`/students/${s._id}`} className="font-medium text-slate-200 hover:text-indigo-400 transition-colors">{s.name}</Link>
                        </div>
                      </div>
                    </td>
                    <td><span className="font-mono text-xs text-slate-400">{s.rollNumber}</span></td>
                    <td><span className="badge badge-neutral">{s.section}</span></td>
                    <td><span className="text-slate-400">Sem {s.semester}</span></td>
                    <td><span className="badge badge-info">{s.branch}</span></td>
                    <td><span className="text-xs text-slate-500">{s.email}</span></td>
                    <td>
                      <div className="flex gap-1.5">
                        <button onClick={() => openEdit(s)} className="btn btn-ghost btn-sm p-1.5" title="Edit">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="w-4 h-4"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        </button>
                        <button onClick={() => setDeleteTarget(s)} className="btn btn-ghost btn-sm p-1.5 hover:text-red-400" title="Deactivate">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="w-4 h-4"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!loading && students.length > 0 && (
          <div className="px-4 pb-4">
            <Pagination page={page} totalPages={Math.ceil(total / limit)} onPageChange={setPage} total={total} limit={limit} />
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingStudent ? 'Edit Student' : 'Add Student'}
        size="lg"
        footer={<>
          <button onClick={() => setModalOpen(false)} className="btn btn-secondary">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="btn btn-primary">
            {saving ? <><InlineSpinner size="sm" /> Saving...</> : editingStudent ? 'Update' : 'Add Student'}
          </button>
        </>}
      >
        <div className="grid grid-cols-2 gap-4">
          {[
            { name: 'name', label: 'Full Name', type: 'text', placeholder: 'Adarsh Anand', colSpan: 2 },
            { name: 'email', label: 'Email', type: 'email', placeholder: 'student@college.edu' },
            { name: 'rollNumber', label: 'Roll Number', type: 'text', placeholder: '2501730360' },
            { name: 'phone', label: 'Phone', type: 'text', placeholder: '9876543210' },
            { name: 'parentEmail', label: 'Parent Email', type: 'email', placeholder: 'parent@email.com' },
            { name: 'batch', label: 'Batch', type: 'text', placeholder: '2023-2027' },
          ].map(({ name, label, type, placeholder, colSpan }) => (
            <div key={name} className={colSpan === 2 ? 'col-span-2' : ''}>
              <label className="label">{label}</label>
              <input type={type} name={name} value={form[name]} onChange={handleChange} placeholder={placeholder}
                className={`input ${formErrors[name] ? 'input-error' : ''}`} />
              {formErrors[name] && <p className="text-xs text-red-400 mt-1">{formErrors[name]}</p>}
            </div>
          ))}

          <div>
            <label className="label">Section</label>
            <select name="section" value={form.section} onChange={handleChange} className={`input ${formErrors.section ? 'input-error' : ''}`}>
              {SECTIONS.map(s => <option key={s} value={s}>Section {s}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Semester</label>
            <select name="semester" value={form.semester} onChange={handleChange} className={`input ${formErrors.semester ? 'input-error' : ''}`}>
              {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>Semester {s}</option>)}
            </select>
          </div>
          <div className="col-span-2">
            <label className="label">Branch</label>
            <select name="branch" value={form.branch} onChange={handleChange} className={`input ${formErrors.branch ? 'input-error' : ''}`}>
              {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
        </div>
      </Modal>

      {/* Delete confirm */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Deactivate Student"
        message={`Are you sure you want to deactivate ${deleteTarget?.name}? Their attendance records will be preserved.`}
        confirmLabel="Deactivate"
        danger
        loading={deleting}
      />
    </div>
  );
}
