# Umbra DAO Treasury

**Private treasury management for DAOs on Solana** — powered by the Umbra Privacy SDK and Arcium MPC zero-knowledge proofs.

Built for the [Umbra Side Track — Frontier Hackathon](https://superteam.fun/earn/listing/umbra-side-track).

---

## What it does

DAOs today have a problem: every payment, every treasury balance, every contributor payout is visible on-chain to anyone — including competitors. **Umbra DAO Treasury** solves this with two privacy layers:

- **Encrypted Balances (Arcium MPC)** — the treasury's USDC balance is shielded on-chain. No one can see how much the DAO holds without authorization.
- **Anonymous Payments (ZK Mixer)** — contributor payouts are sent as ZK-proof UTXOs. There is no on-chain link between the treasury wallet and the contributor's wallet.

## Features

| Feature | Umbra Primitive Used |
|---|---|
| Shield USDC into treasury | `getPublicBalanceToEncryptedBalanceDirectDepositorFunction` |
| Send private payment to contributor | `getEncryptedBalanceToReceiverClaimableUtxoCreatorFunction` |
| Contributor scans for payments | `getClaimableUtxoScannerFunction` |
| Contributor claims UTXO | `getReceiverClaimableUtxoToEncryptedBalanceClaimerFunction` |
| Query encrypted balance | `getEncryptedBalanceQueryFunction` |
| Withdraw to public wallet | `getEncryptedBalanceToPublicBalanceWithdrawerFunction` |
| Compliance viewing key | `client.monthlyViewingKey.generate(year, month)` |

## Architecture

```
Treasury Operator (DAO multisig)
  │
  ├─ Deposits public USDC → Arcium MPC → Encrypted Balance (amount hidden)
  │
  └─ Creates UTXO via ZK Mixer → Merkle Tree
                                      │
                            Contributor scans tree
                            with their X25519 key
                                      │
                            Claims UTXO via Relayer
                                      │
                            Encrypted Balance (contributor)
                                      │
                            Withdraws to public wallet
```

No on-chain link between treasury and contributor. The amount is never visible on-chain.

## Compliance

The DAO can generate **monthly viewing keys** and share them with auditors. A viewing key for a specific month reveals all UTXOs from that period — without exposing other months or the encrypted balance. This makes Umbra DAO Treasury suitable for real organizational use, not just privacy demos.

## Running locally

```bash
pnpm install
cp .env.example .env
pnpm dev
```

Then open `http://localhost:5173` and connect Phantom wallet (set to **devnet**).

To get devnet USDC: use [spl-token-faucet.com](https://spl-token-faucet.com) with mint `4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU`.

## Tech stack

- **Vite + React 18** — frontend
- **@umbra-privacy/sdk** — privacy primitives
- **@umbra-privacy/web-zk-prover** — ZK proof generation (WASM)
- **@solana/wallet-adapter-react** — Phantom wallet connection
- **Tailwind CSS** — styling
- **localStorage** — payment history (no external DB needed)

## Notes

- MPC operations take 5–15 seconds due to Arcium network roundtrips — loading states are shown throughout
- ZK proof generation runs in the browser via WASM
- All operations run on **devnet** — change `VITE_RPC_URL` for mainnet
