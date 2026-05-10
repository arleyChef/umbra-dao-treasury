import React from 'react'
import ReactDOM from 'react-dom/client'
import { useMemo } from 'react'
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'
import App from './App'
import './index.css'

const RPC_ENDPOINT = import.meta.env.VITE_RPC_URL || 'https://api.devnet.solana.com'
const RPC_WS = import.meta.env.VITE_RPC_WS_URL || 'wss://api.devnet.solana.com'

function Root() {
  const wallets = useMemo(() => [], [])
  const connectionConfig = { commitment: 'confirmed', wsEndpoint: RPC_WS }

  return (
    <ConnectionProvider endpoint={RPC_ENDPOINT} config={connectionConfig}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <App />
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
)
