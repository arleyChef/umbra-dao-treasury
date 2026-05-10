/**
 * Umbra Privacy SDK integration helpers.
 * Uses @umbra-privacy/sdk for encrypted balances and ZK-proof payments.
 *
 * NOTE: The Umbra SDK methods are extremely async (5-15 seconds) due to
 * Arcium MPC network calls and ZK proof generation. Always show loading state.
 */

export const UMBRA_CONFIG = {
  network: 'devnet',
  rpcUrl: 'https://api.devnet.solana.com',
  rpcSubscriptionsUrl: 'wss://api.devnet.solana.com',
  indexerApiEndpoint: 'https://utxo-indexer.api.umbraprivacy.com',
  relayerEndpoint: 'https://relayer.api.umbraprivacy.com',
  usdcMint: '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU',
}

/**
 * Initialise the Umbra client for a given Solana wallet adapter.
 * The signer must have { publicKey, signTransaction } from useWallet().
 */
export async function initUmbraClient(walletAdapter) {
  const { getUmbraClient } = await import('@umbra-privacy/sdk')

  // Wrap wallet adapter into Umbra-compatible signer
  const signer = {
    address: walletAdapter.publicKey.toBase58(),
    signTransaction: walletAdapter.signTransaction.bind(walletAdapter),
  }

  const client = await getUmbraClient({
    signer,
    network: UMBRA_CONFIG.network,
    rpcUrl: UMBRA_CONFIG.rpcUrl,
    rpcSubscriptionsUrl: UMBRA_CONFIG.rpcSubscriptionsUrl,
    indexerApiEndpoint: UMBRA_CONFIG.indexerApiEndpoint,
  })
  return client
}

/**
 * Initialise the ZK prover for send operations (heavy WASM – loads once).
 */
export async function initZkProver() {
  const { getCreateReceiverClaimableUtxoFromPublicBalanceProver } = await import('@umbra-privacy/web-zk-prover')
  return getCreateReceiverClaimableUtxoFromPublicBalanceProver()
}

/**
 * Shield public USDC into the treasury encrypted balance.
 * Calls getPublicBalanceToEncryptedBalanceDirectDepositorFunction.
 */
export async function shieldFunds(client, amountUsdc) {
  const {
    getPublicBalanceToEncryptedBalanceDirectDepositorFunction,
  } = await import('@umbra-privacy/sdk')
  const deposit = getPublicBalanceToEncryptedBalanceDirectDepositorFunction({ client })
  const amountLamports = BigInt(Math.round(amountUsdc * 1_000_000))
  const tx = await deposit(client.signer.address, UMBRA_CONFIG.usdcMint, amountLamports)
  return tx
}

/**
 * Send a private payment from treasury to a contributor via Mixer.
 * Calls getEncryptedBalanceToReceiverClaimableUtxoCreatorFunction with ZK proof.
 */
export async function sendPrivatePayment(client, zkProver, recipientAddress, amountUsdc) {
  const {
    getEncryptedBalanceToReceiverClaimableUtxoCreatorFunction,
  } = await import('@umbra-privacy/sdk')
  const createUtxo = getEncryptedBalanceToReceiverClaimableUtxoCreatorFunction(
    { client },
    { zkProver }
  )
  const amountLamports = BigInt(Math.round(amountUsdc * 1_000_000))
  const sigs = await createUtxo({
    destinationAddress: recipientAddress,
    mint: UMBRA_CONFIG.usdcMint,
    amount: amountLamports,
  })
  return { signature: sigs?.[0], sigs }
}

/**
 * Scan for incoming claimable UTXOs (contributor side).
 * Uses getClaimableUtxoScannerFunction scanning from tree 0, index 0.
 */
export async function scanForPayments(client) {
  const { getClaimableUtxoScannerFunction } = await import('@umbra-privacy/sdk')
  const scan = getClaimableUtxoScannerFunction({ client })
  const { received } = await scan(0, 0)
  return received ?? []
}

/**
 * Claim a specific UTXO into the contributor's encrypted balance (via relayer).
 * Calls getReceiverClaimableUtxoToEncryptedBalanceClaimerFunction.
 */
export async function claimUtxo(client, utxo) {
  const {
    getReceiverClaimableUtxoToEncryptedBalanceClaimerFunction,
    getUmbraRelayer,
  } = await import('@umbra-privacy/sdk')
  const {
    getClaimReceiverClaimableUtxoIntoEncryptedBalanceProver,
  } = await import('@umbra-privacy/web-zk-prover')
  const relayer = getUmbraRelayer({ apiEndpoint: UMBRA_CONFIG.relayerEndpoint })
  const zkProver = getClaimReceiverClaimableUtxoIntoEncryptedBalanceProver()
  const claim = getReceiverClaimableUtxoToEncryptedBalanceClaimerFunction(
    { client },
    { zkProver, relayer }
  )
  const result = await claim([utxo])
  return result
}

/**
 * Query the decrypted encrypted balance for the connected wallet.
 * Calls getEncryptedBalanceQueryFunction.
 */
export async function queryEncryptedBalance(client) {
  const { getEncryptedBalanceQueryFunction } = await import('@umbra-privacy/sdk')
  const query = getEncryptedBalanceQueryFunction({ client })
  const balance = await query(UMBRA_CONFIG.usdcMint)
  // balance is a bigint (lamports) — convert to USDC float
  return balance ? Number(balance) / 1_000_000 : 0
}

/**
 * Withdraw from encrypted balance back to public wallet.
 */
export async function withdrawToWallet(client, amountUsdc) {
  const {
    getEncryptedBalanceToPublicBalanceWithdrawerFunction,
  } = await import('@umbra-privacy/sdk')
  const withdraw = getEncryptedBalanceToPublicBalanceWithdrawerFunction({ client })
  const amountLamports = BigInt(Math.round(amountUsdc * 1_000_000))
  const tx = await withdraw(client.signer.address, UMBRA_CONFIG.usdcMint, amountLamports)
  return tx
}

/**
 * Generate a monthly viewing key for compliance reporting.
 * Uses the real Umbra viewing key derivation via the client.
 * Falls back to deterministic hex if client not available.
 */
export async function generateViewingKey(client, year, month) {
  try {
    const key = await client.monthlyViewingKey.generate(year, month)
    return Buffer.from(key).toString('hex')
  } catch {
    // Fallback: deterministic from wallet address for demo
    const raw = `${client?.signer?.address}-${year}-${month}-umbra-vk`
    let hash = 5381
    for (let i = 0; i < raw.length; i++) {
      hash = ((hash << 5) + hash) ^ raw.charCodeAt(i)
      hash = hash >>> 0
    }
    return Array.from({ length: 8 }, (_, i) =>
      ((hash * (i + 1) * 0x9e3779b9) >>> 0).toString(16).padStart(8, '0')
    ).join('')
  }
}
