import React, { useState, useCallback } from 'react'
import { Header } from './components/Header'
import { TreasuryPanel } from './components/TreasuryPanel'
import { ContributorPortal } from './components/ContributorPortal'
import { ToastContainer } from './components/Toast'
import { Shield, Lock, Zap, Eye, EyeOff } from 'lucide-react'

let toastIdCounter = 0

export default function App() {
  const [view, setView] = useState('treasury')
  const [toasts, setToasts] = useState([])

  const addToast = useCallback((toast) => {
    const id = ++toastIdCounter
    setToasts(prev => [...prev, { ...toast, id }])
  }, [])

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  return (
    <div className="min-h-screen bg-umbra-bg text-umbra-text">
      {/* Background gradient */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(124,58,237,0.08) 0%, transparent 70%)',
        }}
      />

      <Header view={view} onViewChange={setView} />

      {/* Banner / hero */}
      <div className="border-b border-umbra-border bg-umbra-surface/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-umbra-text">
                {view === 'treasury' ? 'Treasury Dashboard' : 'Contributor Portal'}
              </h1>
              <p className="text-sm text-umbra-muted mt-0.5">
                {view === 'treasury'
                  ? 'Manage private DAO payments powered by Arcium MPC zero-knowledge proofs.'
                  : 'Claim your private payments and manage your encrypted USDC balance.'}
              </p>
            </div>

            {/* Privacy badges */}
            <div className="flex flex-wrap items-center gap-2">
              {[
                { icon: <Lock className="w-3 h-3" />, label: 'Encrypted Balances', color: 'text-umbra-purple-light border-umbra-purple/30 bg-umbra-purple/5' },
                { icon: <Zap className="w-3 h-3" />, label: 'Arcium MPC', color: 'text-umbra-teal border-umbra-teal/30 bg-umbra-teal/5' },
                { icon: <Shield className="w-3 h-3" />, label: 'ZK Proofs', color: 'text-umbra-success border-umbra-success/30 bg-umbra-success/5' },
                { icon: <EyeOff className="w-3 h-3" />, label: 'Privacy-First', color: 'text-umbra-warning border-umbra-warning/30 bg-umbra-warning/5' },
              ].map(badge => (
                <span
                  key={badge.label}
                  className={`flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium rounded-full border ${badge.color}`}
                >
                  {badge.icon}
                  {badge.label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 relative z-10">
        {view === 'treasury' ? (
          <TreasuryPanel key="treasury" addToast={addToast} />
        ) : (
          <ContributorPortal key="contributor" addToast={addToast} />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-umbra-border mt-12 py-6">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-umbra-muted/60" />
            <span className="text-xs text-umbra-muted/60">Umbra DAO Treasury — Private payments powered by Arcium MPC</span>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="https://www.arcium.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-umbra-muted/60 hover:text-umbra-teal transition-colors"
            >
              Arcium
            </a>
            <a
              href="https://docs.umbra.cash"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-umbra-muted/60 hover:text-umbra-teal transition-colors"
            >
              Umbra Docs
            </a>
            <span className="flex items-center gap-1 text-xs text-umbra-muted/60">
              <span className="w-1.5 h-1.5 rounded-full bg-umbra-success animate-pulse-dot" />
              Devnet
            </span>
          </div>
        </div>
      </footer>

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  )
}
