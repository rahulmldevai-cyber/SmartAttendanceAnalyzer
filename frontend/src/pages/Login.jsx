import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { InlineSpinner } from '../components/shared/PageSpinner';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.email) e.email = 'Email is required';
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = 'Enter a valid email';
    if (!form.password) e.password = 'Password is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    const result = await login(form.email.trim().toLowerCase(), form.password);
    setLoading(false);
    if (result.success) {
      toast.success(`Welcome back, ${result.user.name.split(' ')[0]}!`);
      navigate('/dashboard');
    } else {
      toast.error(result.error || 'Login failed');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
    if (errors[name]) setErrors((p) => ({ ...p, [name]: '' }));
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel - decorative */}
      <div className="hidden lg:flex flex-1 flex-col justify-between p-12 bg-gradient-to-br from-slate-900 via-indigo-950/30 to-slate-900 border-r border-slate-800/60 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-sky-600/10 rounded-full blur-3xl" />
        </div>

        <div className="relative flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-sky-500 flex items-center justify-center shadow-lg">
            <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6 text-white" stroke="currentColor" strokeWidth={2}>
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              <path d="M9 12l2 2 4-4" />
            </svg>
          </div>
          <div>
            <div className="text-lg font-bold text-slate-100">Attendance Analyzer</div>
            <div className="text-xs text-indigo-400">by Runtime Rebels</div>
          </div>
        </div>

        <div className="relative space-y-8">
          <div>
            <h1 className="text-4xl font-bold text-slate-100 leading-tight mb-4">
              Intelligent Attendance<br />
              <span className="text-gradient">Pattern Analytics</span>
            </h1>
            <p className="text-slate-400 text-lg leading-relaxed">
              Monitor, analyze, and act on attendance data with AI-powered insights.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Students Tracked', value: '500+' },
              { label: 'Pattern Detection', value: 'AI-Powered' },
              { label: 'At-Risk Alerts', value: 'Real-time' },
              { label: 'Report Export', value: 'CSV & PDF' },
            ].map((f) => (
              <div key={f.label} className="card p-4">
                <div className="text-xl font-bold text-indigo-400 mb-0.5">{f.value}</div>
                <div className="text-xs text-slate-500">{f.label}</div>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-xs text-slate-700">© 2026 Runtime Rebels · MERN Stack Project</p>
      </div>

      {/* Right panel - login form */}
      <div className="flex-1 lg:max-w-md flex items-center justify-center p-8 bg-slate-950">
        <div className="w-full max-w-sm animate-slide-up">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-sky-500 flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-white" stroke="currentColor" strokeWidth={2}>
                <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            <span className="text-lg font-bold text-slate-100">Attendance Analyzer</span>
          </div>

          <h2 className="text-2xl font-bold text-slate-100 mb-1">Welcome back</h2>
          <p className="text-sm text-slate-500 mb-8">Sign in to your account to continue</p>

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <div>
              <label className="label">Email address</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="you@example.com"
                className={`input ${errors.email ? 'input-error' : ''}`}
                autoComplete="email"
                autoFocus
              />
              {errors.email && <p className="text-xs text-red-400 mt-1">{errors.email}</p>}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="label mb-0">Password</label>
                <Link to="/forgot-password" className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Your password"
                  className={`input pr-11 ${errors.password ? 'input-error' : ''}`}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="w-5 h-5">
                      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19M1 1l22 22" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="w-5 h-5">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
              {errors.password && <p className="text-xs text-red-400 mt-1">{errors.password}</p>}
            </div>

            <button type="submit" disabled={loading} className="btn btn-primary w-full btn-lg mt-6">
              {loading ? <><InlineSpinner size="sm" /> Signing in...</> : 'Sign in'}
            </button>
          </form>

          <p className="text-center text-sm text-slate-600 mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
              Request access
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
