import { useState, useEffect, useCallback } from 'react';
import { CheckCircle, XCircle, AlertCircle, X } from 'lucide-react';

let toastCount = 0;
const listeners = new Set();

export function showToast(message, type = 'success') {
  const id = ++toastCount;
  listeners.forEach(fn => fn({ id, message, type }));
}

export function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const fn = (toast) => {
      setToasts(prev => [...prev, toast]);
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== toast.id));
      }, 4000);
    };
    listeners.add(fn);
    return () => listeners.delete(fn);
  }, []);

  const remove = (id) => setToasts(prev => prev.filter(t => t.id !== id));

  if (!toasts.length) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`flex items-start gap-3 px-4 py-3 rounded-xl shadow-lg border text-sm max-w-sm animate-slide-up ${
            toast.type === 'success'
              ? 'bg-green-50 border-green-200 text-green-800'
              : toast.type === 'error'
              ? 'bg-red-50 border-red-200 text-red-800'
              : 'bg-amber-50 border-amber-200 text-amber-800'
          }`}
        >
          {toast.type === 'success' && <CheckCircle size={18} className="text-green-600 mt-0.5 shrink-0" />}
          {toast.type === 'error' && <XCircle size={18} className="text-red-500 mt-0.5 shrink-0" />}
          {toast.type === 'warning' && <AlertCircle size={18} className="text-amber-500 mt-0.5 shrink-0" />}
          <span className="flex-1 font-medium">{toast.message}</span>
          <button onClick={() => remove(toast.id)} className="text-current opacity-50 hover:opacity-100 ml-1">
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}

