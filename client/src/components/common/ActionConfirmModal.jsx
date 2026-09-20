import React from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { AlertTriangle, ShieldAlert } from 'lucide-react';

/**
 * Operation Safety Confirmation Modal
 * Used for high-impact actions (urgent broadcasts, question rejections, emergency delays).
 */
export const ActionConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Critical Action',
  message = 'Are you sure you want to execute this stage operation?',
  confirmText = 'Confirm & Execute',
  cancelText = 'Cancel',
  variant = 'danger', // 'danger' | 'warning' | 'primary'
  loading = false
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="space-y-4">
        <div className="flex items-start gap-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5 text-amber-400" />
          <div className="leading-relaxed">{message}</div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            {cancelText}
          </Button>
          <Button
            variant={variant === 'danger' ? 'danger' : 'primary'}
            onClick={onConfirm}
            loading={loading}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ActionConfirmModal;
