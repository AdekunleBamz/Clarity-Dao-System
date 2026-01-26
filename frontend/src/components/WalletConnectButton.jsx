import { useState, useCallback } from 'react'
import { useWallet } from '../context/WalletContext'
import WalletConnectQRModal from './WalletConnectQRModal'

export default function WalletConnectButton() {
  const { 
    isConnected, 
    isConnecting, 
    address, 
    stxBalance,
    connectWallet, 
    disconnectWallet,
    wcUri,
    error,
    clearError
  } = useWallet()

  const [showDropdown, setShowDropdown] = useState(false)
  const [copySuccess, setCopySuccess] = useState(false)

  const formatAddress = (addr) => {
    if (!addr) return ''
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  const formatBalance = (balance) => {
    if (!balance) return '0.00'
    const stx = parseFloat(balance) / 1_000_000
    return stx.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })
  }

  const copyAddress = useCallback(async () => {
    if (!address) return
    try {
      await navigator.clipboard.writeText(address)
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    } catch (err) {
      console.error('Failed to copy address:', err)
    }
  }, [address])

  const handleConnect = useCallback(async () => {
    clearError?.()
    try {
      await connectWallet()
    } catch (err) {
      // Error is handled by context
      console.error('Connection failed:', err)
    }
  }, [connectWallet, clearError])

  const handleDisconnect = useCallback(() => {
    setShowDropdown(false)
    disconnectWallet()
  }, [disconnectWallet])

  const viewOnExplorer = useCallback(() => {
    if (!address) return
    window.open(`https://explorer.stacks.co/address/${address}?chain=mainnet`, '_blank', 'noopener,noreferrer')
    setShowDropdown(false)
  }, [address])

  // Connected state with dropdown menu
  if (isConnected) {
    return (
      <div className="relative">
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="flex items-center space-x-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-4 py-2 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
          aria-expanded={showDropdown}
          aria-haspopup="true"
        >
          <div className="w-2 h-2 bg-green-200 rounded-full animate-pulse" />
          <span className="font-medium">{formatAddress(address)}</span>
          <svg 
            className={`w-4 h-4 transition-transform duration-200 ${showDropdown ? 'rotate-180' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Dropdown Menu */}
        {showDropdown && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setShowDropdown(false)}
              aria-hidden="true"
            />
            
            {/* Menu */}
            <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden">
              {/* Balance Section */}
              <div className="px-4 py-3 bg-gray-50 dark:bg-gray-750 border-b border-gray-200 dark:border-gray-700">
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Balance</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  {formatBalance(stxBalance)} <span className="text-sm font-normal text-gray-500">STX</span>
                </p>
              </div>

              {/* Menu Items */}
              <div className="py-1">
                <button
                  onClick={copyAddress}
                  className="w-full flex items-center space-x-3 px-4 py-2.5 text-left text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  {copySuccess ? (
                    <>
                      <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-green-600 dark:text-green-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      <span>Copy Address</span>
                    </>
                  )}
                </button>

                <button
                  onClick={viewOnExplorer}
                  className="w-full flex items-center space-x-3 px-4 py-2.5 text-left text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  <span>View on Explorer</span>
                </button>

                <div className="border-t border-gray-200 dark:border-gray-700 my-1" />

                <button
                  onClick={handleDisconnect}
                  className="w-full flex items-center space-x-3 px-4 py-2.5 text-left text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span>Disconnect Wallet</span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center space-x-2">
        <div className="bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-lg px-3 py-2 flex items-center space-x-2">
          <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-sm text-red-700 dark:text-red-300 max-w-[150px] truncate" title={error}>
            {error}
          </span>
        </div>
        <button
          onClick={handleConnect}
          className="btn-primary text-sm"
          aria-label="Retry wallet connection"
        >
          Retry
        </button>
      </div>
    )
  }

  // Default connect state
  return (
    <>
      <button
        onClick={handleConnect}
        disabled={isConnecting}
        className="relative overflow-hidden bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-medium px-6 py-2.5 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg disabled:cursor-not-allowed disabled:shadow-none"
        aria-busy={isConnecting}
      >
        {isConnecting ? (
          <span className="flex items-center space-x-2">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span>Connecting...</span>
          </span>
        ) : (
          <span className="flex items-center space-x-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span>Connect Wallet</span>
          </span>
        )}
      </button>
      
      {wcUri && <WalletConnectQRModal uri={wcUri} />}
    </>
  )
}
