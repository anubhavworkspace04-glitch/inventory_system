import React from 'react';
import { AlertTriangle, Info, CheckCircle2 } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: 'danger' | 'warning' | 'info';
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  variant = 'danger'
}) => {
  if (!isOpen) return null;

  const colorMap = {
    danger: {
      iconBg: 'bg-red-50 border border-red-200',
      iconColor: 'text-red-500',
      btn: 'bg-red-600 hover:bg-red-700 text-white',
      icon: <AlertTriangle className="h-5 w-5" />,
    },
    warning: {
      iconBg: 'bg-amber-50 border border-amber-200',
      iconColor: 'text-amber-500',
      btn: 'bg-amber-500 hover:bg-amber-600 text-white',
      icon: <AlertTriangle className="h-5 w-5" />,
    },
    info: {
      iconBg: 'bg-brand-100 border border-brand-200',
      iconColor: 'text-brand-600',
      btn: 'bg-brand-500 hover:bg-brand-700 text-white',
      icon: <Info className="h-5 w-5" />,
    },
  };

  const c = colorMap[variant];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white border border-gray-200 rounded-2xl shadow-card-md overflow-hidden">
        <div className="p-6 space-y-4">
          <div className="flex items-center space-x-3">
            <div className={`p-2.5 rounded-xl ${c.iconBg} ${c.iconColor}`}>
              {c.icon}
            </div>
            <h3 className="text-base font-semibold text-gray-900">{title}</h3>
          </div>
          <p className="text-sm text-gray-500 leading-relaxed pl-1">{message}</p>
        </div>
        <div className="flex items-center justify-end px-6 py-4 bg-gray-50 border-t border-gray-100 space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-600 rounded-lg border border-gray-200 bg-white hover:bg-gray-100 transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${c.btn}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
