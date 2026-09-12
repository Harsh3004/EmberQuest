import React from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';

const TOAST_ICONS = {
  error: <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />,
  success: <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />,
  info: <Info className="w-5 h-5 text-amber-400 shrink-0" />,
};

const TOAST_STYLES = {
  error: {
    border: '1px solid rgba(239, 68, 68, 0.35)',
    background: 'linear-gradient(135deg, rgba(24, 8, 8, 0.95), rgba(40, 10, 10, 0.92))',
    boxShadow: '0 8px 32px rgba(239, 68, 68, 0.2)',
  },
  success: {
    border: '1px solid rgba(52, 211, 153, 0.35)',
    background: 'linear-gradient(135deg, rgba(6, 24, 16, 0.95), rgba(10, 40, 24, 0.92))',
    boxShadow: '0 8px 32px rgba(52, 211, 153, 0.2)',
  },
  info: {
    border: '1px solid rgba(245, 158, 11, 0.35)',
    background: 'linear-gradient(135deg, rgba(24, 18, 6, 0.95), rgba(40, 28, 8, 0.92))',
    boxShadow: '0 8px 32px rgba(245, 158, 11, 0.2)',
  },
};

export function ToastContainer({ toasts = [], onDismiss }) {
  if (!toasts.length) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none px-4 sm:px-0">
      {toasts.map((toast) => {
        const style = TOAST_STYLES[toast.type] || TOAST_STYLES.info;
        const icon = TOAST_ICONS[toast.type] || TOAST_ICONS.info;

        return (
          <div
            key={toast.id}
            className="pointer-events-auto flex items-start justify-between gap-3 p-4 rounded-2xl backdrop-blur-xl animate-slide transition-all"
            style={style}
            role="alert"
            aria-live="assertive"
          >
            <div className="flex items-start gap-3">
              {icon}
              <div className="flex flex-col">
                {toast.title && (
                  <span className="font-cinzel font-bold text-xs text-slate-100 tracking-wide mb-0.5">
                    {toast.title}
                  </span>
                )}
                <span className="text-xs text-slate-300 leading-snug">
                  {toast.message}
                </span>
              </div>
            </div>
            <button
              onClick={() => onDismiss && onDismiss(toast.id)}
              className="text-slate-400 hover:text-slate-200 transition-colors p-0.5 rounded-lg"
              aria-label="Dismiss toast"
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
