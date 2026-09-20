import React from 'react';
import { Modal } from './Modal';
import { FileDown, CheckCircle2, Loader2, Sparkles, AlertCircle } from 'lucide-react';
import { Button } from './Button';

export const PdfExportModal = ({
  isOpen,
  onClose,
  step = 0, // 0: Idle, 1: Preparing, 2: Generating, 3: Downloading, 4: Complete, -1: Error
  error = null,
  onRetry
}) => {
  const steps = [
    { id: 1, label: 'Preparing Event Schedule' },
    { id: 2, label: 'Generating PDF' },
    { id: 3, label: 'Downloading' },
    { id: 4, label: 'Export Complete' }
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={step === 4 || step === -1 ? onClose : () => {}}
      title="Export Run-of-Show PDF"
      maxWidth="max-w-md"
    >
      <div className="py-4 space-y-6 text-center">
        {step === -1 ? (
          <div className="space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mx-auto glow-border-rose">
              <AlertCircle className="w-8 h-8" />
            </div>
            <div>
              <h4 className="text-base font-bold text-rose-200">Export Failed</h4>
              <p className="text-xs text-slate-400 mt-1">{error || 'An unexpected error occurred during PDF generation.'}</p>
            </div>
            <div className="flex justify-center gap-3 pt-2">
              <Button variant="secondary" size="sm" onClick={onClose}>
                Close
              </Button>
              <Button variant="danger" size="sm" onClick={onRetry}>
                Retry Export
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
              {step === 4 ? (
                <div className="w-20 h-20 rounded-3xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-xl shadow-emerald-500/20 animate-fade-in">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
              ) : (
                <div className="w-20 h-20 rounded-3xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-xl shadow-cyan-500/10 relative">
                  <FileDown className="w-9 h-9 animate-bounce" />
                  <div className="absolute inset-0 rounded-3xl border-2 border-cyan-400/40 border-t-cyan-400 animate-spin" />
                </div>
              )}
            </div>

            {/* Stepper Progress List */}
            <div className="space-y-3 max-w-xs mx-auto text-left">
              {steps.map((s) => {
                const isCurrent = step === s.id;
                const isDone = step > s.id;
                return (
                  <div
                    key={s.id}
                    className={`flex items-center gap-3 p-2.5 rounded-xl border text-xs font-semibold transition-all duration-300 ${
                      isDone
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                        : isCurrent
                        ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-200 shadow-md shadow-cyan-500/10'
                        : 'bg-[var(--bg-glass)] border-[var(--border-subtle)] text-[var(--text-muted)] opacity-60'
                    }`}
                  >
                    <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono shrink-0">
                      {isDone ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ) : isCurrent ? (
                        <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
                      ) : (
                        <span className="text-[var(--text-muted)]">{s.id}</span>
                      )}
                    </div>
                    <span>{s.label}</span>
                  </div>
                );
              })}
            </div>

            {step === 4 && (
              <div className="pt-2 animate-fade-in">
                <Button variant="primary" size="md" onClick={onClose} className="w-full">
                  Done
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </Modal>
  );
};

export default PdfExportModal;
