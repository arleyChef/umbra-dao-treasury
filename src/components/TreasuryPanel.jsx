import React, { useState, useEffect, useCallback } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import {
  Shield, Send, Download, Key, RefreshCw,
  Lock, ArrowDownToLine, ExternalLink, Copy, Check, Clock,
  Wallet, TrendingUp,
} from 'lucide-react'
import {
  initUmbraClient, initZkProver,
  shieldFunds, sendPrivatePayment, queryEncryptedBalance, generateViewingKey,
  registerWithUmbra, checkUmbraRegistration,
} from '../lib/umbra'
import { savePayment, fetchPayments } from '../lib/db'
import { MetricCard } from './MetricCard'
import { OperationLoader } from './Spinner'
import { format } from 'date-fns'

function shortenAddress(addr, chars = 4) {
  if (!addr) return ''
  return `${addr.slice(0, chars)}…${addr.slice(-chars)}`
}

function StatusBadge({ status }) {
  const map = {
    pending: 'text-umbra-warning bg-umbra-warning/10 border-umbra-warning/30',
    sent: 'text-umbra-teal bg-umbra-teal/10 border-umbra-teal/30',
    claimed: 'text-umbra-success bg-umbra-success/10 border-umbra-success/30',
    failed: 'text-umbra-error bg-umbra-error/10 border-umbra-error/30',
  }
  return (
    <span className={`px-2 py-0.5 text-[11px] font-medium rounded-full border ${map[status] || map.pending}`}>
      {status}
    </span>
  )
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
      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  )
}

export function TreasuryPanel({ addToast }) {
  const { publicKey, connected, signTransaction } = useWallet()

  const [client, setClient] = useState(null)
  const [zkProver, setZkProver] = useState(null)
  const [isRegistered, setIsRegistered] = useState(false)
  const [registering, setRegistering] = useState(false)
  const [encBalance, setEncBalance] = useState(null)
  const [payments, setPayments] = useState([])
  const [loadingClient, setLoadingClient] = useState(false)
  const [loadingBalance, setLoadingBalance] = useState(false)
  const [loadingPayments, setLoadingPayments] = useState(false)

  // Shield form
  const [shieldAmount, setShieldAmount] = useState('')
  const [shieldLoading, setShieldLoading] = useState(false)
  const [shieldMsg, setShieldMsg] = useState('')

  // Send form
  const [recipient, setRecipient] = useState('')
  const [sendAmount, setSendAmount] = useState('')
  const [sendNote, setSendNote] = useState('')
  const [sendLoading, setSendLoading] = useState(false)
  const [sendMsg, setSendMsg] = useState('')

  // Viewing key
  const [viewingKey, setViewingKey] = useState('')
  const [viewingKeyMonth, setViewingKeyMonth] = useState('')
  const [showViewingKey, setShowViewingKey] = useState(false)

  // Initialize Umbra client when wallet connects
  useEffect(() => {
    if (!connected || !publicKey || !signTransaction) return
    setLoadingClient(true)
    setShieldMsg('Initialising Arcium MPC node connection…')

    const walletAdapter = { publicKey, signTransaction }

    Promise.all([initUmbraClient(walletAdapter), initZkProver()])
      .then(async ([c, prover]) => {
        setClient(c)
        setZkProver(prover)
        setShieldMsg('Checking Umbra registration…')
        // Check if already registered, if not register automatically
        const registered = await checkUmbraRegistration(c).catch(() => false)
        if (!registered) {
          setRegistering(true)
          setShieldMsg('Registering wallet with Umbra (one-time setup)…')
          try {
            await registerWithUmbra(c)
            setIsRegistered(true)
            addToast({ type: 'success', title: 'Wallet registered', message: 'One-time Umbra registration complete.' })
          } catch (err) {
            addToast({ type: 'warning', title: 'Registration skipped', message: 'May already be registered.' })
            setIsRegistered(true) // try anyway
          } finally {
            setRegistering(false)
          }
        } else {
          setIsRegistered(true)
        }
        setShieldMsg('')
        addToast({ type: 'success', title: 'Umbra client ready', message: 'Connected to Arcium MPC network.' })
      })
      .catch(err => {
        console.error('[Umbra init]', err)
        setShieldMsg('')
        addToast({ type: 'warning', title: 'SDK unavailable', message: 'Umbra SDK not installed — demo mode active.' })
      })
      .finally(() => setLoadingClient(false))
  }, [connected, publicKey, signTransaction, addToast])

  // Load encrypted balance when client is ready
  const refreshBalance = useCallback(async () => {
    if (!client) return
    setLoadingBalance(true)
    try {
      const bal = await queryEncryptedBalance(client)
      setEncBalance(Number(bal))
    } catch (err) {
      console.error('[balance]', err)
      setEncBalance(0)
    } finally {
      setLoadingBalance(false)
    }
  }, [client])

  useEffect(() => {
    if (client) refreshBalance()
  }, [client, refreshBalance])

  // Load payment history
  const refreshPayments = useCallback(async () => {
    setLoadingPayments(true)
    try {
      const data = await fetchPayments()
      setPayments(data)
    } catch (err) {
      console.error('[payments]', err)
    } finally {
      setLoadingPayments(false)
    }
  }, [])

  useEffect(() => {
    refreshPayments()
  }, [refreshPayments])

  // Shield funds
  const handleShield = async () => {
    if (!client) {
      addToast({ type: 'warning', title: 'Not connected', message: 'Connect wallet and wait for Umbra client.' })
      return
    }
    const amt = parseFloat(shieldAmount)
    if (!amt || amt <= 0) {
      addToast({ type: 'error', title: 'Invalid amount', message: 'Enter a positive USDC amount to shield.' })
      return
    }
    setShieldLoading(true)
    setShieldMsg('Generating ZK deposit proof…')
    try {
      const tx = await shieldFunds(client, amt)
      setShieldMsg('Waiting for Arcium confirmation…')
      await refreshBalance()
      setShieldAmount('')
      addToast({ type: 'success', title: 'Funds shielded', message: `${amt} USDC encrypted into treasury.` })
    } catch (err) {
      console.error('[shield]', err)
      addToast({ type: 'error', title: 'Shield failed', message: err?.message || 'Unknown error.' })
    } finally {
      setShieldLoading(false)
      setShieldMsg('')
    }
  }

  // Send private payment
  const handleSend = async () => {
    if (!client || !zkProver) {
      addToast({ type: 'warning', title: 'Not ready', message: 'Umbra client is still initialising.' })
      return
    }
    if (!recipient.trim() || recipient.trim().length < 30) {
      addToast({ type: 'error', title: 'Invalid recipient', message: 'Enter a valid Solana address.' })
      return
    }
    const amt = parseFloat(sendAmount)
    if (!amt || amt <= 0) {
      addToast({ type: 'error', title: 'Invalid amount', message: 'Enter a positive USDC amount.' })
      return
    }
    setSendLoading(true)
    setSendMsg('Building encrypted UTXO…')
    let savedPayment = null
    try {
      savedPayment = await savePayment({ contributorAddress: recipient.trim(), amount: amt, note: sendNote })
      setSendMsg('Generating ZK payment proof via Arcium MPC…')
      const tx = await sendPrivatePayment(client, zkProver, recipient.trim(), amt)
      setSendMsg('Broadcasting to Solana…')
      const sig = tx?.signature || tx?.txSignature || null
      if (savedPayment?.id) {
        const { supabase } = await import('../lib/db')
        await import('../lib/db').then(m => m.updatePaymentStatus(savedPayment.id, 'sent'))
      }
      setRecipient('')
      setSendAmount('')
      setSendNote('')
      addToast({
        type: 'success',
        title: 'Private payment sent',
        message: `${amt} USDC privately sent to ${shortenAddress(recipient.trim())}`,
      })
      refreshPayments()
      refreshBalance()
    } catch (err) {
      console.error('[send]', err)
      if (savedPayment?.id) {
        import('../lib/db').then(m => m.updatePaymentStatus(savedPayment.id, 'failed'))
      }
      addToast({ type: 'error', title: 'Payment failed', message: err?.message || 'Unknown error.' })
    } finally {
      setSendLoading(false)
      setSendMsg('')
    }
  }

  // Generate viewing key
  const handleGenerateViewingKey = async () => {
    if (!publicKey || !client) return
    const month = viewingKeyMonth || new Date().toISOString().slice(0, 7)
    const [year, mon] = month.split('-').map(Number)
    try {
      const key = await generateViewingKey(client, year, mon)
      setViewingKey(key)
      setShowViewingKey(true)
    } catch (err) {
      addToast({ type: 'error', title: 'Key generation failed', message: err?.message })
    }
  }

  const totalSent = payments.filter(p => p.status === 'sent' || p.status === 'claimed').reduce((s, p) => s + Number(p.amount), 0)
  const paymentCount = payments.length

  if (!connected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
        <div className="w-20 h-20 rounded-2xl bg-gradient-card border border-umbra-purple/30 flex items-center justify-center glow-purple animated-border">
          <Shield className="w-10 h-10 text-umbra-purple-light" />
        </div>
        <div className="text-center">
          <h2 className="text-2xl font-bold text-umbra-text">Connect Your Treasury Wallet</h2>
          <p className="text-umbra-muted mt-2 max-w-sm">
            Connect your Solana wallet to access the private treasury — shielded by Arcium MPC zero-knowledge proofs.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-umbra-muted">
          {['ZK-Proof Payments', 'Encrypted Balances', 'On-chain Privacy', 'Compliance Reporting'].map(f => (
            <span key={f} className="flex items-center gap-1.5 px-3 py-1.5 bg-umbra-card border border-umbra-border rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-umbra-teal animate-pulse-dot" />
              {f}
            </span>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard
          icon={<Lock className="w-5 h-5" />}
          label="Encrypted Balance"
          value={encBalance !== null ? `${encBalance.toLocaleString()} USDC` : '—'}
          loading={loadingBalance || loadingClient}
          sub="Shielded by Arcium MPC"
          accent="purple"
        />
        <MetricCard
          icon={<Send className="w-5 h-5" />}
          label="Total Sent"
          value={`${totalSent.toLocaleString()} USDC`}
          loading={loadingPayments}
          sub={`${paymentCount} payments recorded`}
          accent="teal"
        />
        <MetricCard
          icon={<Wallet className="w-5 h-5" />}
          label="Connected Wallet"
          value={shortenAddress(publicKey?.toBase58(), 5)}
          sub="Treasury operator"
          accent="green"
        />
      </div>

      {/* Loading overlay for MPC init */}
      {(shieldLoading || sendLoading) && (
        <div className="bg-umbra-card border border-umbra-purple/30 rounded-2xl">
          <OperationLoader message={shieldMsg || sendMsg} />
        </div>
      )}

      {/* Two columns: Shield + Send */}
      {!shieldLoading && !sendLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Shield Funds */}
          <div className="bg-umbra-card border border-umbra-border rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-umbra-purple/10 flex items-center justify-center">
                <ArrowDownToLine className="w-4 h-4 text-umbra-purple-light" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-umbra-text">Shield Funds</h3>
                <p className="text-xs text-umbra-muted">Encrypt public USDC into treasury</p>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-umbra-muted block mb-1">Amount (USDC)</label>
                <input
                  type="number"
                  value={shieldAmount}
                  onChange={e => setShieldAmount(e.target.value)}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  className="w-full bg-umbra-surface border border-umbra-border rounded-xl px-4 py-2.5 text-umbra-text text-sm focus:outline-none focus:border-umbra-purple/60 transition-colors placeholder:text-umbra-muted/50"
                />
              </div>
              <button
                onClick={handleShield}
                disabled={!client || !shieldAmount || shieldLoading}
                className="w-full py-2.5 rounded-xl bg-gradient-umbra text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ArrowDownToLine className="w-4 h-4 inline mr-2" />
                Shield USDC
              </button>
              <p className="text-[11px] text-umbra-muted text-center">
                Calls <code className="text-umbra-teal">getPublicBalanceToEncryptedBalance</code>
              </p>
            </div>
          </div>

          {/* Send Private Payment */}
          <div className="bg-umbra-card border border-umbra-border rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-umbra-teal/10 flex items-center justify-center">
                <Send className="w-4 h-4 text-umbra-teal" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-umbra-text">Send Private Payment</h3>
                <p className="text-xs text-umbra-muted">ZK-proof USDC to contributor</p>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-umbra-muted block mb-1">Recipient Address</label>
                <input
                  type="text"
                  value={recipient}
                  onChange={e => setRecipient(e.target.value)}
                  placeholder="Solana address…"
                  className="w-full bg-umbra-surface border border-umbra-border rounded-xl px-4 py-2.5 text-umbra-text text-sm font-mono focus:outline-none focus:border-umbra-teal/60 transition-colors placeholder:text-umbra-muted/50"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-umbra-muted block mb-1">Amount (USDC)</label>
                <input
                  type="number"
                  value={sendAmount}
                  onChange={e => setSendAmount(e.target.value)}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  className="w-full bg-umbra-surface border border-umbra-border rounded-xl px-4 py-2.5 text-umbra-text text-sm focus:outline-none focus:border-umbra-teal/60 transition-colors placeholder:text-umbra-muted/50"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-umbra-muted block mb-1">Note (optional)</label>
                <input
                  type="text"
                  value={sendNote}
                  onChange={e => setSendNote(e.target.value)}
                  placeholder="e.g. Q1 contributor payout"
                  className="w-full bg-umbra-surface border border-umbra-border rounded-xl px-4 py-2.5 text-umbra-text text-sm focus:outline-none focus:border-umbra-teal/60 transition-colors placeholder:text-umbra-muted/50"
                />
              </div>
              <button
                onClick={handleSend}
                disabled={!client || !zkProver || !recipient || !sendAmount || sendLoading}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-umbra-teal to-umbra-purple text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4 inline mr-2" />
                Send via Arcium ZK
              </button>
              <p className="text-[11px] text-umbra-muted text-center">
                Calls <code className="text-umbra-teal">getEncryptedBalanceToReceiverClaimableUtxo</code>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Viewing Key Generator */}
      <div className="bg-umbra-card border border-umbra-border rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-umbra-warning/10 flex items-center justify-center">
              <Key className="w-4 h-4 text-umbra-warning" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-umbra-text">Viewing Key</h3>
              <p className="text-xs text-umbra-muted">Generate monthly compliance viewing key</p>
            </div>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <input
              type="month"
              value={viewingKeyMonth}
              onChange={e => setViewingKeyMonth(e.target.value)}
              className="w-full bg-umbra-surface border border-umbra-border rounded-xl px-4 py-2.5 text-umbra-text text-sm focus:outline-none focus:border-umbra-warning/60 transition-colors"
            />
          </div>
          <button
            onClick={handleGenerateViewingKey}
            disabled={!publicKey}
            className="px-5 py-2.5 rounded-xl bg-umbra-warning/10 border border-umbra-warning/30 text-umbra-warning text-sm font-medium hover:bg-umbra-warning/20 transition-colors disabled:opacity-40"
          >
            <Key className="w-4 h-4 inline mr-2" />
            Generate Key
          </button>
        </div>
        {showViewingKey && viewingKey && (
          <div className="mt-3 p-4 bg-umbra-surface border border-umbra-warning/20 rounded-xl animate-fade-in">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-medium text-umbra-warning">Viewing Key — {viewingKeyMonth || 'current month'}</p>
              <CopyButton text={viewingKey} />
            </div>
            <p className="text-xs font-mono text-umbra-muted break-all">{viewingKey}</p>
            <p className="text-[11px] text-umbra-muted mt-2 flex items-center gap-1">
              <Lock className="w-3 h-3" />
              Share this key with auditors only. It reveals payment amounts and addresses for this period.
            </p>
          </div>
        )}
      </div>

      {/* Payment History */}
      <div className="bg-umbra-card border border-umbra-border rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-umbra-border">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-umbra-muted" />
            <h3 className="text-sm font-semibold text-umbra-text">Payment History</h3>
            <span className="px-2 py-0.5 text-[11px] bg-umbra-surface border border-umbra-border rounded-full text-umbra-muted">
              {payments.length}
            </span>
          </div>
          <button
            onClick={refreshPayments}
            className="text-umbra-muted hover:text-umbra-text transition-colors"
            disabled={loadingPayments}
          >
            <RefreshCw className={`w-4 h-4 ${loadingPayments ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {loadingPayments ? (
          <div className="flex items-center justify-center py-10">
            <div className="flex items-center gap-2 text-umbra-muted text-sm">
              <RefreshCw className="w-4 h-4 animate-spin" />
              Loading payments…
            </div>
          </div>
        ) : payments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-2">
            <TrendingUp className="w-8 h-8 text-umbra-muted/40" />
            <p className="text-umbra-muted text-sm">No payments recorded yet</p>
            <p className="text-umbra-muted/60 text-xs">Payments will appear here after you send via ZK.</p>
          </div>
        ) : (
          <div className="divide-y divide-umbra-border">
            {payments.map(p => (
              <div key={p.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-umbra-surface/50 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-umbra-teal/10 flex items-center justify-center flex-shrink-0">
                    <Send className="w-3.5 h-3.5 text-umbra-teal" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-mono text-umbra-text truncate">{shortenAddress(p.contributor_address)}</span>
                      <CopyButton text={p.contributor_address} />
                    </div>
                    {p.note && <p className="text-xs text-umbra-muted truncate">{p.note}</p>}
                    <p className="text-[11px] text-umbra-muted/60">
                      {format(new Date(p.created_at), 'MMM d, yyyy HH:mm')}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0 ml-4">
                  <span className="text-sm font-mono font-semibold text-umbra-text">
                    {Number(p.amount).toLocaleString()} USDC
                  </span>
                  <div className="flex items-center gap-1.5">
                    <StatusBadge status={p.status} />
                    {p.tx_signature && (
                      <a
                        href={`https://solscan.io/tx/${p.tx_signature}?cluster=devnet`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-umbra-muted hover:text-umbra-teal transition-colors"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
