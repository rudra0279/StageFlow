import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export const Drawer = ({
  isOpen,
  onClose,
  title,
  children,
  position = 'right', // 'right' | 'left'
  width = 'max-w-md'
}) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className={`fixed inset-y-0 ${position === 'right' ? 'right-0' : 'left-0'} flex max-w-full pl-10`}>
        <div
          className={`w-screen ${width} bg-stage-900 border-l border-stage-700 shadow-2xl flex flex-col justify-between transform transition-transform duration-300 ease-in-out`}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-stage-800 bg-stage-850">
            <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
              {title}
            </h3>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-stage-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6">{children}</div>
        </div>
      </div>
    </div>
  );
};

export default Drawer;
