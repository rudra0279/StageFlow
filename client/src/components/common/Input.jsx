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
          className="block text-xs font-semibold uppercase tracking-wider text-[var(--form-label-text)] mb-1.5"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        type={type}
        className={`w-full theme-input rounded-xl px-3.5 py-2.5 text-sm font-medium focus:outline-none transition-all ${
          error ? '!border-rose-500 !focus:ring-rose-500' : ''
        } ${className}`}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-rose-400 font-semibold">{error}</p>}
    </div>
  );
};

