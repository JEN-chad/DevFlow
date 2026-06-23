import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

/**
 * Toast item component - renders a single notification
 */
const ToastItem = ({ toast, onRemove }) => {
  const [exiting, setExiting] = useState(false);

  const handleClose = useCallback(() => {
    setExiting(true);
    setTimeout(() => onRemove(toast.id), 280);
  }, [toast.id, onRemove]);

  useEffect(() => {
    const duration = toast.duration ?? 4000;
    const timer = setTimeout(() => handleClose(), duration);
    return () => clearTimeout(timer);
  }, [toast.id, handleClose]);

  const configs = {
    success: {
      icon: CheckCircle,
      containerClass: 'bg-white dark:bg-slate-900 border-emerald-200 dark:border-emerald-900/60',
      iconClass: 'text-emerald-500',
      barClass: 'bg-emerald-500',
    },
    error: {
      icon: AlertCircle,
      containerClass: 'bg-white dark:bg-slate-900 border-red-200 dark:border-red-900/60',
      iconClass: 'text-red-500',
      barClass: 'bg-red-500',
    },
    warning: {
      icon: AlertTriangle,
      containerClass: 'bg-white dark:bg-slate-900 border-amber-200 dark:border-amber-900/60',
      iconClass: 'text-amber-500',
      barClass: 'bg-amber-500',
    },
    info: {
      icon: Info,
      containerClass: 'bg-white dark:bg-slate-900 border-blue-200 dark:border-blue-900/60',
      iconClass: 'text-blue-500',
      barClass: 'bg-blue-500',
    },
  };

  const config = configs[toast.type] || configs.info;
  const Icon = config.icon;

  return (
    <div
      className={`toast-item relative flex items-start gap-3 rounded-xl border p-4 shadow-lg overflow-hidden ${config.containerClass} ${
        exiting ? 'animate-[toastExit_0.28s_ease-in_forwards]' : 'animate-toast-enter'
      }`}
      role="alert"
    >
      {/* Progress bar */}
      <div className={`absolute bottom-0 left-0 h-0.5 ${config.barClass} animate-[progressShrink_4s_linear_forwards]`}
        style={{ width: '100%' }}
      />

      <div className={`mt-0.5 shrink-0 ${config.iconClass}`}>
        <Icon className="h-4.5 w-4.5" />
      </div>
      <div className="flex-1 min-w-0">
        {toast.title && (
          <p className="text-sm font-semibold text-slate-900 dark:text-white">{toast.title}</p>
        )}
        <p className={`text-sm text-slate-600 dark:text-slate-300 ${toast.title ? 'mt-0.5' : 'font-medium'}`}>
          {toast.message}
        </p>
      </div>
      <button
        onClick={handleClose}
        className="shrink-0 rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
};

/**
 * Toast container - renders all toasts via portal
 */
export const ToastContainer = ({ toasts, removeToast }) => {
  return createPortal(
    <div className="toast-container">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
      ))}
    </div>,
    document.body
  );
};

/**
 * useToast hook - manage toast state in any component
 *
 * Usage:
 * const { toasts, removeToast, toast } = useToast();
 * toast.success('Saved!');
 * toast.error('Something went wrong');
 */
export const useToast = () => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((opts) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setToasts((prev) => [...prev, { ...opts, id }]);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = {
    success: (message, opts = {}) => addToast({ type: 'success', message, ...opts }),
    error:   (message, opts = {}) => addToast({ type: 'error',   message, ...opts }),
    warning: (message, opts = {}) => addToast({ type: 'warning', message, ...opts }),
    info:    (message, opts = {}) => addToast({ type: 'info',    message, ...opts }),
  };

  return { toasts, removeToast, toast };
};

export default ToastContainer;
