import React from 'react';

export const SectionHeader = ({
  title,
  subtitle,
  badge,
  action,
  className = ''
}) => {
  return (
    <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 ${className}`}>
      <div>
        <div className="flex items-center gap-2.5">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-100">
            {title}
          </h2>
          {badge}
        </div>
        {subtitle && (
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            {subtitle}
          </p>
        )}
      </div>
      {action && <div className="flex items-center gap-2 shrink-0">{action}</div>}
    </div>
  );
};

export default SectionHeader;
