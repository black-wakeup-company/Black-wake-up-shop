import React from 'react';
import { useBoutique } from '../../context/BoutiqueContext';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useBoutique();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm pointer-events-none">
      {toasts.map((toast) => {
        let bg = 'bg-slate-900 text-white';
        let icon = <Info className="w-4 h-4 text-sky-400 shrink-0" />;

        if (toast.type === 'success') {
          bg = 'bg-emerald-900 text-white border border-emerald-700/60';
          icon = <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />;
        } else if (toast.type === 'warning') {
          bg = 'bg-amber-950 text-amber-100 border border-amber-700/60';
          icon = <AlertTriangle className="w-4 h-4 text-amber-300 shrink-0" />;
        } else if (toast.type === 'error') {
          bg = 'bg-rose-950 text-rose-100 border border-rose-700/60';
          icon = <AlertCircle className="w-4 h-4 text-rose-300 shrink-0" />;
        }

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center justify-between gap-3 px-4 py-3 rounded-lg shadow-lg text-xs font-medium backdrop-blur-md transition-all ${bg}`}
          >
            <div className="flex items-center gap-2">
              {icon}
              <span>{toast.message}</span>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="p-1 text-slate-300 hover:text-white transition-colors"
              aria-label="Fermer la notification"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
