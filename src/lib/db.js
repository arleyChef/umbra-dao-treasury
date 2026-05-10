/**
 * Simple localStorage-based payment store.
 * No external DB credentials needed — works out of the box.
 */

const STORAGE_KEY = 'umbra_dao_payments'

function loadPayments() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
  } catch {
    return []
  }
}

function savePayments(payments) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payments))
}

export async function savePayment({ contributorAddress, amount, txSignature, note }) {
  const payments = loadPayments()
  const payment = {
    id: `pay_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    contributor_address: contributorAddress,
    amount,
    status: txSignature ? 'sent' : 'pending',
    tx_signature: txSignature || null,
    note: note || null,
    created_at: new Date().toISOString(),
  }
  payments.unshift(payment)
  savePayments(payments)
  return payment
}

export async function fetchPayments() {
  return loadPayments()
}

export async function updatePaymentStatus(id, status) {
  const payments = loadPayments()
  const idx = payments.findIndex(p => p.id === id)
  if (idx !== -1) {
    payments[idx].status = status
    savePayments(payments)
  }
}
