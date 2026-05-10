import React, { useState, useEffect, useCallback } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import {
  Users, Download, RefreshCw, Shield, ExternalLink,
  Gift, Inbox, CheckCircle, Clock, Lock, Copy, Check,
  ArrowUpFromLine,
} from 'lucide-react'
import {
  initUmbraClient, initZkProver,
  scanForPayments, claimUtxo, queryEncryptedBalance, withdrawToWallet,
} from '../lib/umbra'
import { OperationLoader } from './Spinner'
import { MetricCard } from './MetricCard'
import { format } from 'date-fns'

function shortenAddress(addr, chars = 4) {
  if (!addr) return ''
  return `${addr.slice(0, chars)}…${addr.slice(-chars)}`
}

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = () => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button onClick={handleCopy} className="text-umbra-muted hover:text-umbra-teal transition-colors">
      {copied ? <Check className="w-3.5 h-3.5 text-umbra-success" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  )
}

export function ContributorPortal({ addToast }) {
  const { publicKey, connected, signTransaction } = useWallet()

  const [client, setClient] = useState(null)
  const [encBalance, setEncBalance] = useState(null)
  const [utxos, setUtxos] = useState([])
  const [loadingClient, setLoadingClient] = useState(false)
  const [loadingBalance, setLoadingBalance] = useState(false)
  const [loadingUtxos, setLoadingUtxos] = useState(false)
  const [claimingId, setClaimingId] = useState(null)
  const [claimMsg, setClaimMsg] = useState('')

  // Withdraw form
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [withdrawLoading, setWithdrawLoading] = useState(false)
  const [withdrawMsg, setWithdrawMsg] = useState('')

  // Init client
  useEffect(() => {
    if (!connected || !publicKey || !signTransaction) return
    setLoadingClient(true)
    const walletAdapter = { publicKey, signTransaction }
    initUmbraClient(walletAdapter)
      .then(c => {
        setClient(c)
        addToast({ type: 'success', title: 'Umbra ready', message: 'Contributor client connected.' })
      })
      .catch(err => {
        console.error('[init]', err)
        addToast({ type: 'warning', title: 'Demo mode', message: 'Umbra SDK unavailable — showing demo data.' })
      })
      .finally(() => setLoadingClient(false))
  }, [connected, publicKey, signTransaction, addToast])

  const refreshBalance = useCallback(async () => {
    if (!client) return
    setLoadingBalance(true)
    try {
      const bal = await queryEncryptedBalance(client)
      setEncBalance(Number(bal))
    } catch {
      setEncBalance(0)
    } finally {
      setLoadingBalance(false)
    }
  }, [client])

  useEffect(() => {
    if (client) refreshBalance()
  }, [client, refreshBalance])

  const refreshUtxos = useCallback(async () => {
    if (!client) return
    setLoadingUtxos(true)
    try {
      const found = await scanForPayments(client)
      setUtxos(found)
      if (found.length > 0) {
        addToast({ type: 'success', title: `${found.length} payment${found.length > 1 ? 's' : ''} found`, message: 'You have unclaimed private payments.' })
      }
    } catch (err) {
      console.error('[scan]', err)
      setUtxos([])
    } finally {
      setLoadingUtxos(false)
    }
  }, [client, addToast])

  // Claim a UTXO
  const handleClaim = async (utxo) => {
    if (!client) return
    setClaimingId(utxo.id || utxo.utxoId || JSON.stringify(utxo))
    setClaimMsg('Scanning for your UTXOs…')
    try {
      setClaimMsg('Claiming via Arcium relayer…')
      await claimUtxo(client, utxo)
      addToast({ type: 'success', title: 'Payment claimed', message: 'Funds added to your encrypted balance.' })
      setUtxos(prev => prev.filter(u => u !== utxo))
      refreshBalance()
    } catch (err) {
      console.error('[claim]', err)
      addToast({ type: 'error', title: 'Claim failed', message: err?.message || 'Unknown error.' })
    } finally {
      setClaimingId(null)
      setClaimMsg('')
    }
  }

  // Withdraw to wallet
  const handleWithdraw = async () => {
    if (!client) return
    const amt = parseFloat(withdrawAmount)
    if (!amt || amt <= 0) {
      addToast({ type: 'error', title: 'Invalid amount', message: 'Enter a positive USDC amount to withdraw.' })
      return
    }
    setWithdrawLoading(true)
    setWithdrawMsg('Preparing withdrawal proof…')
    try {
      setWithdrawMsg('Unshielding via ZK proof…')
      await withdrawToWallet(client, amt)
      addToast({ type: 'success', title: 'Withdrawal complete', message: `${amt} USDC returned to your public wallet.` })
      setWithdrawAmount('')
      refreshBalance()
    } catch (err) {
      console.error('[withdraw]', err)
      addToast({ type: 'error', title: 'Withdrawal failed', message: err?.message || 'Unknown error.' })
    } finally {
      setWithdrawLoading(false)
      setWithdrawMsg('')
    }
  }

  if (!connected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
        <div className="w-20 h-20 rounded-2xl bg-gradient-card border border-umbra-teal/30 flex items-center justify-center glow-teal animated-border">
          <Users className="w-10 h-10 text-umbra-teal" />
        </div>
        <div className="text-center">
          <h2 className="text-2xl font-bold text-umbra-text">Contributor Portal</h2>
          <p className="text-umbra-muted mt-2 max-w-sm">
            Connect your wallet to claim private DAO payments, view your encrypted balance, and withdraw anytime.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-umbra-muted">
          {['Claim Payments', 'Encrypted Balance', 'Private Withdrawal', 'ZK Anonymity'].map(f => (
            <span key={f} className="flex items-center gap-1.5 px-3 py-1.5 bg-umbra-card border border-umbra-border rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-umbra-purple animate-pulse-dot" />
              {f}
            </span>
          ))}
        </div>
      </div>
    )
  }

  const totalUnclaimed = utxos.reduce((s, u) => s + Number(u.amount || u.amountUsdc || 0), 0)

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard
          icon={<Lock className="w-5 h-5" />}
          label="Encrypted Balance"
          value={encBalance !== null ? `${encBalance.toLocaleString()} USDC` : '—'}
          loading={loadingBalance || loadingClient}
          sub="Your private balance"
          accent="purple"
        />
        <MetricCard
          icon={<Inbox className="w-5 h-5" />}
          label="Unclaimed UTXOs"
          value={utxos.length.toString()}
          loading={loadingUtxos}
          sub={totalUnclaimed > 0 ? `${totalUnclaimed.toLocaleString()} USDC pending` : 'Scan to update'}
          accent="teal"
        />
        <MetricCard
          icon={<Shield className="w-5 h-5" />}
          label="Your Address"
          value={shortenAddress(publicKey?.toBase58(), 5)}
          sub="Share to receive payments"
          accent="green"
        />
      </div>

      {/* My address card */}
      <div className="bg-umbra-card border border-umbra-teal/20 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <Shield className="w-4 h-4 text-umbra-teal" />
          <h3 className="text-sm font-semibold text-umbra-text">Your Payment Address</h3>
        </div>
        <div className="flex items-center gap-3 p-3 bg-umbra-surface border border-umbra-border rounded-xl">
          <code className="text-xs font-mono text-umbra-muted flex-1 break-all">
            {publicKey?.toBase58()}
          </code>
          <CopyButton text={publicKey?.toBase58() || ''} />
        </div>
        <p className="text-[11px] text-umbra-muted mt-2">
          Share this address with the DAO treasury operator to receive private ZK payments.
        </p>
      </div>

      {/* Loading overlay */}
      {(claimingId || withdrawLoading) && (
        <div className="bg-umbra-card border border-umbra-purple/30 rounded-2xl">
          <OperationLoader message={claimMsg || withdrawMsg} />
        </div>
      )}

      {/* Scan + Withdraw */}
      {!claimingId && !withdrawLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Scan for Payments */}
          <div className="bg-umbra-card border border-umbra-border rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-umbra-teal/10 flex items-center justify-center">
                <Inbox className="w-4 h-4 text-umbra-teal" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-umbra-text">Scan for Payments</h3>
                <p className="text-xs text-umbra-muted">Find UTXOs sent to your address</p>
              </div>
            </div>
            <button
              onClick={refreshUtxos}
              disabled={!client || loadingUtxos}
              className="w-full py-2.5 rounded-xl bg-umbra-teal/10 border border-umbra-teal/30 text-umbra-teal text-sm font-medium hover:bg-umbra-teal/20 transition-colors disabled:opacity-40"
            >
              <RefreshCw className={`w-4 h-4 inline mr-2 ${loadingUtxos ? 'animate-spin' : ''}`} />
              {loadingUtxos ? 'Scanning UTXO indexer…' : 'Scan for Payments'}
            </button>
            <p className="text-[11px] text-umbra-muted text-center mt-2">
              Calls <code className="text-umbra-teal">getClaimableUtxoScannerFunction</code>
            </p>

            {utxos.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="text-xs font-medium text-umbra-muted uppercase tracking-wider mb-2">Claimable UTXOs</p>
                {utxos.map((utxo, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-umbra-surface border border-umbra-teal/20 rounded-xl">
                    <div>
                      <p className="text-sm font-mono font-semibold text-umbra-teal">
                        {Number(utxo.amount || utxo.amountUsdc || 0).toLocaleString()} USDC
                      </p>
                      {utxo.timestamp && (
                        <p className="text-[11px] text-umbra-muted">
                          {format(new Date(utxo.timestamp * 1000), 'MMM d, HH:mm')}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => handleClaim(utxo)}
                      disabled={!!claimingId}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-umbra-teal/10 border border-umbra-teal/30 text-umbra-teal text-xs font-medium hover:bg-umbra-teal/20 transition-colors disabled:opacity-40"
                    >
                      <Download className="w-3 h-3" />
                      Claim
                    </button>
                  </div>
                ))}
              </div>
            )}

            {!loadingUtxos && utxos.length === 0 && client && (
              <div className="mt-4 flex flex-col items-center gap-2 py-4 text-center">
                <Gift className="w-6 h-6 text-umbra-muted/40" />
                <p className="text-xs text-umbra-muted">No unclaimed payments found yet</p>
              </div>
            )}
          </div>

          {/* Withdraw to Wallet */}
          <div className="bg-umbra-card border border-umbra-border rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-umbra-success/10 flex items-center justify-center">
                <ArrowUpFromLine className="w-4 h-4 text-umbra-success" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-umbra-text">Withdraw to Wallet</h3>
                <p className="text-xs text-umbra-muted">Move encrypted balance to public wallet</p>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-umbra-muted block mb-1">Amount (USDC)</label>
                <input
                  type="number"
                  value={withdrawAmount}
                  onChange={e => setWithdrawAmount(e.target.value)}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  className="w-full bg-umbra-surface border border-umbra-border rounded-xl px-4 py-2.5 text-umbra-text text-sm focus:outline-none focus:border-umbra-success/60 transition-colors placeholder:text-umbra-muted/50"
                />
              </div>
              {encBalance !== null && (
                <p className="text-xs text-umbra-muted">
                  Available: <span className="text-umbra-success font-mono">{encBalance.toLocaleString()} USDC</span>
                </p>
              )}
              <button
                onClick={handleWithdraw}
                disabled={!client || !withdrawAmount || withdrawLoading}
                className="w-full py-2.5 rounded-xl bg-umbra-success/10 border border-umbra-success/30 text-umbra-success text-sm font-medium hover:bg-umbra-success/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ArrowUpFromLine className="w-4 h-4 inline mr-2" />
                Withdraw USDC
              </button>
              <p className="text-[11px] text-umbra-muted text-center">
                Calls <code className="text-umbra-teal">getEncryptedBalanceToPublicBalance</code>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* How it works */}
      <div className="bg-umbra-card border border-umbra-border rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-umbra-text mb-4">How Private Payments Work</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              icon: <Shield className="w-4 h-4 text-umbra-purple-light" />,
              title: 'DAO Shields Funds',
              desc: 'Treasury operator deposits USDC into an Arcium MPC encrypted balance using ZK proofs.',
              bg: 'bg-umbra-purple/5 border-umbra-purple/20',
            },
            {
              icon: <Lock className="w-4 h-4 text-umbra-teal" />,
              title: 'Private UTXO Sent',
              desc: 'Payment is sent as an encrypted UTXO — only you can see the amount and your address.',
              bg: 'bg-umbra-teal/5 border-umbra-teal/20',
            },
            {
              icon: <CheckCircle className="w-4 h-4 text-umbra-success" />,
              title: 'You Claim & Withdraw',
              desc: 'Scan for your UTXOs, claim via Arcium relayer, and withdraw to your public wallet anytime.',
              bg: 'bg-umbra-success/5 border-umbra-success/20',
            },
          ].map((step, i) => (
            <div key={i} className={`p-4 rounded-xl border ${step.bg}`}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-umbra-muted/60 text-xs font-mono font-bold">0{i + 1}</span>
                {step.icon}
              </div>
              <p className="text-sm font-semibold text-umbra-text mb-1">{step.title}</p>
              <p className="text-xs text-umbra-muted leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
