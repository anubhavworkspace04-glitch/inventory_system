import React from 'react';
import { CheckCircle2, AlertCircle, X, Info, AlertTriangle } from 'lucide-react';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, type = 'success', onClose }) => {
  const styles = {
    success: {
      wrapper: 'bg-white border-emerald-200 shadow-card-md',
      icon: <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0" />,
      bar: 'bg-emerald-500',
    },
    error: {
      wrapper: 'bg-white border-red-200 shadow-card-md',
      icon: <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />,
      bar: 'bg-red-500',
    },
    warning: {
      wrapper: 'bg-white border-amber-200 shadow-card-md',
      icon: <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0" />,
      bar: 'bg-amber-500',
    },
    info: {
      wrapper: 'bg-white border-brand-200 shadow-card-md',
      icon: <Info className="h-5 w-5 text-brand-500 flex-shrink-0" />,
      bar: 'bg-brand-500',
    },
  };

  const s = styles[type];

  return (
    <div className={`fixed top-4 right-4 z-50 flex items-start max-w-sm w-full border rounded-xl overflow-hidden ${s.wrapper}`}
      style={{ animation: 'slideInRight 0.25s ease' }}
    >
      {/* Colored left bar */}
      <div className={`w-1 self-stretch flex-shrink-0 ${s.bar}`} />
      <div className="flex items-center gap-3 px-4 py-3.5 flex-1">
        {s.icon}
        <p className="flex-1 text-sm font-medium text-gray-800">{message}</p>
        <button
          type="button"
          onClick={onClose}
          className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
