import { useEffect, useState, useCallback, useRef } from 'react'
import { useWallet } from '../context/WalletContext'

export default function WalletConnectQRModal({ uri }) {
  const { disconnectWallet } = useWallet()
  const [qrDataUrl, setQrDataUrl] = useState(null)
  const [qrLoading, setQrLoading] = useState(true)
  const [qrError, setQrError] = useState(false)
  const [copied, setCopied] = useState(false)
  const [countdown, setCountdown] = useState(120) // 2 minute timeout
  const modalRef = useRef(null)

  // QR Code generation
  useEffect(() => {
    if (uri) {
      setQrLoading(true)
      setQrError(false)
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(uri)}&format=svg`
      
      // Preload image
      const img = new Image()
      img.onload = () => {
        setQrDataUrl(qrUrl)
        setQrLoading(false)
      }
      img.onerror = () => {
        setQrError(true)
        setQrLoading(false)
      }
      img.src = qrUrl
    }
  }, [uri])

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer)
          handleClose()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        handleClose()
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [])

  // Focus trap
  useEffect(() => {
    modalRef.current?.focus()
  }, [])

  const handleClose = useCallback(() => {
    disconnectWallet()
  }, [disconnectWallet])

  const copyUri = useCallback(async () => {
    if (!uri) return
    try {
      await navigator.clipboard.writeText(uri)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy URI:', err)
    }
  }, [uri])

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const mobileLink = `https://walletconnect.com/wc?uri=${encodeURIComponent(uri)}`

  const walletApps = [
    { name: 'Leather', icon: '🎒', url: 'leather://' },
    { name: 'Xverse', icon: '🔮', url: 'xverse://' },
    { name: 'Hiro', icon: '🟧', url: null },
  ]

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && handleClose()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="qr-modal-title"
    >
      <div 
        ref={modalRef}
        tabIndex={-1}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-200"
      >
        {/* Header */}
        <div className="relative bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4">
          <button
            onClick={handleClose}
            className="absolute right-4 top-4 text-white/80 hover:text-white transition-colors"
            aria-label="Close modal"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <h3 id="qr-modal-title" className="text-xl font-bold text-white">
            Connect Wallet
          </h3>
          <p className="text-white/80 text-sm mt-1">
            Scan with your Stacks wallet app
          </p>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* QR Code */}
          <div className="bg-white rounded-2xl p-4 shadow-inner mb-4 mx-auto w-fit">
            {qrLoading ? (
              <div className="w-64 h-64 flex items-center justify-center">
                <svg className="animate-spin h-8 w-8 text-indigo-600" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              </div>
            ) : qrError ? (
              <div className="w-64 h-64 flex flex-col items-center justify-center text-gray-500">
                <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm">Failed to load QR code</p>
                <button 
                  onClick={() => window.location.reload()}
                  className="mt-2 text-indigo-600 hover:text-indigo-700 text-sm font-medium"
                >
                  Try Again
                </button>
              </div>
            ) : (
              <img 
                src={qrDataUrl} 
                alt="WalletConnect QR Code" 
                className="w-64 h-64"
                draggable={false}
              />
            )}
          </div>

          {/* Timer */}
          <div className="flex items-center justify-center space-x-2 text-sm text-gray-500 dark:text-gray-400 mb-4">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Expires in {formatTime(countdown)}</span>
          </div>

          {/* Copy URI Button */}
          <button
            onClick={copyUri}
            className="w-full flex items-center justify-center space-x-2 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2.5 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors mb-4"
          >
            {copied ? (
              <>
                <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-green-600 dark:text-green-400">Copied to clipboard!</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <span>Copy Connection URI</span>
              </>
            )}
          </button>

          {/* Divider */}
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300 dark:border-gray-600" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                or open in
              </span>
            </div>
          </div>

          {/* Wallet Apps */}
          <div className="grid grid-cols-3 gap-3">
            {walletApps.map((wallet) => (
              <a
                key={wallet.name}
                href={wallet.url || mobileLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
              >
                <span className="text-2xl mb-1">{wallet.icon}</span>
                <span className="text-xs text-gray-700 dark:text-gray-300 font-medium">{wallet.name}</span>
              </a>
            ))}
          </div>

          {/* Mobile Deep Link */}
          <a
            href={mobileLink}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 flex items-center justify-center space-x-2 w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium px-4 py-3 rounded-lg transition-all shadow-md hover:shadow-lg"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            <span>Open in Mobile Wallet</span>
          </a>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 dark:bg-gray-750 px-6 py-3 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            New to Stacks?{' '}
            <a
              href="https://www.hiro.so/wallet"
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              Get a wallet →
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
