import React from 'react'
import { Spinner } from './Spinner'

export function MetricCard({ icon, label, value, sub, loading, accent = 'purple' }) {
  const accentMap = {
    purple: {
      icon: 'bg-umbra-purple/10 text-umbra-purple-light',
      border: 'border-umbra-purple/20',
      value: 'text-umbra-purple-light',
    },
    teal: {
      icon: 'bg-umbra-teal/10 text-umbra-teal',
      border: 'border-umbra-teal/20',
      value: 'text-umbra-teal',
    },
    green: {
      icon: 'bg-umbra-success/10 text-umbra-success',
      border: 'border-umbra-success/20',
      value: 'text-umbra-success',
    },
  }
  const a = accentMap[accent] || accentMap.purple
  return (
    <div className={`bg-umbra-card border ${a.border} rounded-2xl p-5 flex items-start gap-4`}>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${a.icon}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-umbra-muted uppercase tracking-wider">{label}</p>
        {loading ? (
          <div className="mt-2">
            <Spinner size="sm" />
          </div>
        ) : (
          <p className={`text-2xl font-bold font-mono mt-0.5 ${a.value}`}>{value}</p>
        )}
        {sub && <p className="text-xs text-umbra-muted mt-1">{sub}</p>}
      </div>
    </div>
  )
}
