import React, { useState } from 'react';

export const Tooltip = ({ text, children, position = 'top' }) => {
  const [show, setShow] = useState(false);

  const positionClasses = {
    top: 'bottom-full mb-2 left-1/2 -translate-x-1/2',
    bottom: 'top-full mt-2 left-1/2 -translate-x-1/2',
    left: 'right-full mr-2 top-1/2 -translate-y-1/2',
    right: 'left-full ml-2 top-1/2 -translate-y-1/2'
  };

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && (
        <div
          className={`absolute z-50 px-2.5 py-1 text-[11px] font-medium text-slate-100 bg-stage-900 border border-stage-700 rounded-md shadow-xl whitespace-nowrap pointer-events-none transition-opacity duration-150 animate-fade-in ${positionClasses[position]}`}
        >
          {text}
        </div>
      )}
    </div>
  );
};

export default Tooltip;
