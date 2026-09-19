import React from 'react';

export const Input = ({
  label,
  error,
  type = 'text',
  className = '',
  id,
  ...props
}) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        type={type}
        className={`w-full bg-stage-900 border ${
          error ? 'border-rose-500 focus:ring-rose-500' : 'border-stage-700 focus:border-cyan-500 focus:ring-cyan-500'
        } rounded-lg px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 transition-colors ${className}`}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-rose-400">{error}</p>}
    </div>
  );
};
