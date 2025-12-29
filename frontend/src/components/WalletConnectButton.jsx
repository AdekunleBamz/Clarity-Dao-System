import { useWallet } from '../context/WalletContext'
import WalletConnectQRModal from './WalletConnectQRModal'

export default function WalletConnectButton() {
  const { 
    isConnected, 
    isConnecting, 
    address, 
    connectWallet, 
    disconnectWallet,
    wcUri 
  } = useWallet()

  const formatAddress = (addr) => {
    if (!addr) return ''
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  if (isConnected) {
    return (
      <div className="flex items-center space-x-3">
        <div className="bg-green-100 dark:bg-green-900 px-3 py-1 rounded-full">
          <span className="text-green-700 dark:text-green-300 text-sm font-medium">
            {formatAddress(address)}
          </span>
        </div>
        <button
          onClick={disconnectWallet}
          className="btn-secondary text-sm"
        >
          Disconnect
        </button>
      </div>
    )
  }

  return (
    <>
      <button
        onClick={connectWallet}
        disabled={isConnecting}
        className="btn-primary"
      >
        {isConnecting ? (
          <span className="flex items-center space-x-2">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span>Connecting...</span>
          </span>
        ) : (
          'Connect Wallet'
        )}
      </button>
      
      {wcUri && <WalletConnectQRModal uri={wcUri} />}
    </>
  )
}
