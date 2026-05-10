import React from 'react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { Shield, Users } from 'lucide-react'

export function Header({ view, onViewChange }) {
  return (
    <header className="border-b border-umbra-border bg-umbra-surface/80 backdrop-blur-xl sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-umbra flex items-center justify-center glow-purple">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="text-base font-bold text-umbra-text">Umbra</span>
              <span className="ml-1 text-base font-light text-umbra-muted">DAO Treasury</span>
            </div>
            <span className="ml-2 px-2 py-0.5 text-[10px] font-mono font-medium text-umbra-teal border border-umbra-teal/30 rounded bg-umbra-teal/5">
              DEVNET
            </span>
          </div>

          {/* View toggle */}
          <div className="hidden sm:flex items-center gap-1 p-1 bg-umbra-card rounded-xl border border-umbra-border">
            <button
              onClick={() => onViewChange('treasury')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                view === 'treasury'
                  ? 'bg-gradient-umbra text-white shadow-sm glow-purple'
                  : 'text-umbra-muted hover:text-umbra-text'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              Treasury
            </button>
            <button
              onClick={() => onViewChange('contributor')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                view === 'contributor'
                  ? 'bg-gradient-umbra text-white shadow-sm glow-purple'
                  : 'text-umbra-muted hover:text-umbra-text'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              Contributor
            </button>
          </div>

          {/* Wallet */}
          <WalletMultiButton />
        </div>

        {/* Mobile view toggle */}
        <div className="flex sm:hidden items-center gap-1 p-1 bg-umbra-card rounded-xl border border-umbra-border mb-3">
          <button
            onClick={() => onViewChange('treasury')}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              view === 'treasury'
                ? 'bg-gradient-umbra text-white shadow-sm'
                : 'text-umbra-muted hover:text-umbra-text'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            Treasury
          </button>
          <button
            onClick={() => onViewChange('contributor')}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              view === 'contributor'
                ? 'bg-gradient-umbra text-white shadow-sm'
                : 'text-umbra-muted hover:text-umbra-text'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Contributor
          </button>
        </div>
      </div>
    </header>
  )
}
