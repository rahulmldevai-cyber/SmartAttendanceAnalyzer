import React from 'react';

export default function PageSpinner({ message = 'Loading...' }) {
  return (
    <div className="fixed inset-0 bg-slate-950 flex flex-col items-center justify-center z-50">
      <div className="relative mb-6">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-sky-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
          <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8 text-white" stroke="currentColor" strokeWidth={2}>
            <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            <path d="M9 12l2 2 4-4" />
          </svg>
        </div>
        <div className="absolute -inset-1 rounded-2xl border-2 border-indigo-500/30 animate-ping" />
      </div>
      <p className="text-slate-400 text-sm font-medium">{message}</p>
    </div>
  );
}

export function InlineSpinner({ size = 'md', className = '' }) {
  const sizes = { sm: 'w-4 h-4', md: 'w-5 h-5', lg: 'w-7 h-7' };
  return (
    <div className={`${sizes[size]} border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin ${className}`} />
  );
}
