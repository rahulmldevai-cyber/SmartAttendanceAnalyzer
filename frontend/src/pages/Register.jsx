import React, { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';
import { InlineSpinner } from '../components/shared/PageSpinner';

// ─── Auth layout wrapper ──────────────────────────────────────────────────────
function AuthLayout({ title, subtitle, children }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-950">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-600/5 rounded-full blur-3xl" />
      </div>
      <div className="relative w-full max-w-md animate-slide-up">
        <div className="flex items-center gap-3 justify-center mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-sky-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6 text-white" stroke="currentColor" strokeWidth={2}>
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </div>
          <span className="text-lg font-bold text-slate-100">Attendance Analyzer</span>
        </div>
        <div className="card p-8">
          <h1 className="text-2xl font-bold text-slate-100 mb-1">{title}</h1>
          <p className="text-sm text-slate-500 mb-6">{subtitle}</p>
          {children}
        </div>
      </div>
    </div>
  );
}

// ─── Register ─────────────────────────────────────────────────────────────────
export function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '', role: 'teacher', department: '' });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!form.email) e.email = 'Email is required';
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = 'Invalid email';
    if (!form.password) e.password = 'Password is required';
    else if (form.password.length < 8) e.password = 'Minimum 8 characters';
    else if (!/(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&])/.test(form.password))
      e.password = 'Must include uppercase, lowercase, number & special char';
    if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match';
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    const { confirmPassword, ...data } = form;
    const result = await register(data);
    setLoading(false);
    if (result.success) {
      toast.success('Account created! Welcome aboard.');
      navigate('/dashboard');
    } else {
      toast.error(result.error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
    if (errors[name]) setErrors((p) => ({ ...p, [name]: '' }));
  };

  return (
    <AuthLayout title="Create account" subtitle="Join the Attendance Analyzer platform">
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {[
          { name: 'name', label: 'Full Name', type: 'text', placeholder: 'Dr. John Smith' },
          { name: 'email', label: 'Email Address', type: 'email', placeholder: 'you@college.edu' },
          { name: 'department', label: 'Department (optional)', type: 'text', placeholder: 'Computer Science' },
        ].map(({ name, label, type, placeholder }) => (
          <div key={name}>
            <label className="label">{label}</label>
            <input type={type} name={name} value={form[name]} onChange={handleChange} placeholder={placeholder} className={`input ${errors[name] ? 'input-error' : ''}`} />
            {errors[name] && <p className="text-xs text-red-400 mt-1">{errors[name]}</p>}
          </div>
        ))}

        <div>
          <label className="label">Role</label>
          <select name="role" value={form.role} onChange={handleChange} className="input">
            <option value="teacher">Teacher</option>
            <option value="student">Student</option>
          </select>
        </div>

        {['password', 'confirmPassword'].map((name) => (
          <div key={name}>
            <label className="label">{name === 'password' ? 'Password' : 'Confirm Password'}</label>
            <input type="password" name={name} value={form[name]} onChange={handleChange}
              placeholder={name === 'password' ? 'Min 8 chars with uppercase, number & symbol' : 'Repeat password'}
              className={`input ${errors[name] ? 'input-error' : ''}`} />
            {errors[name] && <p className="text-xs text-red-400 mt-1">{errors[name]}</p>}
          </div>
        ))}

        <button type="submit" disabled={loading} className="btn btn-primary w-full btn-lg mt-2">
          {loading ? <><InlineSpinner size="sm" /> Creating account...</> : 'Create account'}
        </button>
      </form>
      <p className="text-center text-sm text-slate-600 mt-4">
        Already have an account?{' '}
        <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-medium">Sign in</Link>
      </p>
    </AuthLayout>
  );
}

// ─── ForgotPassword ───────────────────────────────────────────────────────────
export function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      await authAPI.forgotPassword(email.trim().toLowerCase());
      setSent(true);
    } catch {
      setSent(true); // Always show success (prevents email enumeration)
    }
    setLoading(false);
  };

  return (
    <AuthLayout title="Reset password" subtitle="We'll send you a link to reset your password">
      {sent ? (
        <div className="text-center">
          <div className="w-14 h-14 rounded-full bg-emerald-500/15 flex items-center justify-center mx-auto mb-4">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-7 h-7 text-emerald-400">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <p className="text-slate-300 text-sm mb-1 font-medium">Check your inbox</p>
          <p className="text-slate-500 text-sm mb-6">If an account exists for <span className="text-slate-300">{email}</span>, you'll receive a reset link shortly.</p>
          <Link to="/login" className="btn btn-secondary w-full justify-center">Back to login</Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Email address</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="input" autoFocus />
          </div>
          <button type="submit" disabled={loading || !email} className="btn btn-primary w-full btn-lg">
            {loading ? <><InlineSpinner size="sm" /> Sending...</> : 'Send reset link'}
          </button>
          <Link to="/login" className="btn btn-ghost w-full justify-center text-slate-500">← Back to login</Link>
        </form>
      )}
    </AuthLayout>
  );
}

// ─── ResetPassword ────────────────────────────────────────────────────────────
export function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({ password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) { setError('Passwords do not match'); return; }
    if (form.password.length < 8) { setError('Minimum 8 characters required'); return; }
    setLoading(true);
    try {
      await authAPI.resetPassword(token, form.password);
      toast.success('Password reset successfully! Please login.');
      navigate('/login');
    } catch (err) {
      setError(err.message || 'Reset link is invalid or expired.');
    }
    setLoading(false);
  };

  return (
    <AuthLayout title="New password" subtitle="Enter your new password below">
      <form onSubmit={handleSubmit} className="space-y-4">
        {['password', 'confirmPassword'].map((name) => (
          <div key={name}>
            <label className="label">{name === 'password' ? 'New Password' : 'Confirm Password'}</label>
            <input type="password" value={form[name]} onChange={(e) => setForm(p => ({ ...p, [name]: e.target.value }))}
              placeholder={name === 'password' ? 'Min 8 chars' : 'Repeat password'}
              className={`input ${error ? 'input-error' : ''}`} />
          </div>
        ))}
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button type="submit" disabled={loading} className="btn btn-primary w-full btn-lg">
          {loading ? <><InlineSpinner size="sm" /> Resetting...</> : 'Reset password'}
        </button>
      </form>
    </AuthLayout>
  );
}

export default Register;
