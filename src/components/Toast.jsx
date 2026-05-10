import React, { useEffect } from 'react'
import { CheckCircle, XCircle, AlertCircle, X } from 'lucide-react'

const ICONS = {
  success: <CheckCircle className="w-5 h-5 text-umbra-success flex-shrink-0" />,
  error: <XCircle className="w-5 h-5 text-umbra-error flex-shrink-0" />,
  warning: <AlertCircle className="w-5 h-5 text-umbra-warning flex-shrink-0" />,
}

const BG = {
  success: 'border-umbra-success/30 bg-umbra-success/10',
  error: 'border-umbra-error/30 bg-umbra-error/10',
  warning: 'border-umbra-warning/30 bg-umbra-warning/10',
}

export function Toast({ toast, onRemove }) {
  useEffect(() => {
    const t = setTimeout(() => onRemove(toast.id), toast.duration || 5000)
    return () => clearTimeout(t)
  }, [toast.id, toast.duration, onRemove])

  return (
    <div
      className={`flex items-start gap-3 px-4 py-3 rounded-xl border backdrop-blur-sm animate-fade-in ${BG[toast.type] || BG.success}`}
      style={{ minWidth: 280, maxWidth: 400 }}
    >
      {ICONS[toast.type] || ICONS.success}
      <div className="flex-1 min-w-0">
        {toast.title && (
          <p className="text-sm font-semibold text-umbra-text leading-tight">{toast.title}</p>
        )}
        {toast.message && (
          <p className="text-sm text-umbra-muted leading-snug mt-0.5">{toast.message}</p>
        )}
      </div>
      <button
        onClick={() => onRemove(toast.id)}
        className="text-umbra-muted hover:text-umbra-text transition-colors flex-shrink-0"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}

export function ToastContainer({ toasts, onRemove }) {
  if (!toasts.length) return null
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
      {toasts.map(t => (
        <Toast key={t.id} toast={t} onRemove={onRemove} />
      ))}
    </div>
  )
}
