import React from 'react'

export function Spinner({ size = 'md', className = '' }) {
  const sizes = {
    sm: 'w-4 h-4 border-[2px]',
    md: 'w-6 h-6 border-[2.5px]',
    lg: 'w-10 h-10 border-[3px]',
    xl: 'w-16 h-16 border-[3px]',
  }
  return (
    <span
      className={`inline-block rounded-full border-umbra-purple/30 border-t-umbra-purple animate-spin ${sizes[size]} ${className}`}
      style={{ borderTopColor: undefined }}
    />
  )
}

export function OperationLoader({ message }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-8">
      {/* MPC spinner with outer teal ring */}
      <div className="relative">
        <span className="block w-16 h-16 rounded-full border-[3px] border-umbra-teal/20 border-t-umbra-teal animate-spin" />
        <span
          className="block absolute inset-2 rounded-full border-[2px] border-umbra-purple/20 border-b-umbra-purple animate-spin"
          style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}
        />
        <span className="absolute inset-0 flex items-center justify-center">
          <span className="block w-2 h-2 rounded-full bg-gradient-umbra animate-pulse-dot" />
        </span>
      </div>
      <p className="text-umbra-muted text-sm text-center max-w-xs">{message || 'Processing…'}</p>
      <p className="text-umbra-muted/50 text-xs text-center">Arcium MPC network — this may take 5-15 seconds</p>
    </div>
  )
}
