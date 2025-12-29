import { useEffect, useState } from 'react'

export default function WalletConnectQRModal({ uri, onClose }) {
  const [qrDataUrl, setQrDataUrl] = useState(null)

  useEffect(() => {
    if (uri) {
      // Generate QR code using API
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=${encodeURIComponent(uri)}`
      setQrDataUrl(qrUrl)
    }
  }, [uri])

  const mobileLink = `https://walletconnect.com/wc?uri=${encodeURIComponent(uri)}`

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-sm w-full">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Connect Wallet
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Scan with your Stacks wallet app
          </p>

          {qrDataUrl ? (
            <div className="bg-white p-4 rounded-xl inline-block mb-4">
              <img src={qrDataUrl} alt="WalletConnect QR Code" className="w-48 h-48" />
            </div>
          ) : (
            <div className="w-48 h-48 bg-gray-100 dark:bg-gray-700 rounded-xl animate-pulse mx-auto mb-4" />
          )}

          <p className="text-xs text-gray-400 mb-4">
            Open your wallet app and scan this QR code
          </p>

          <div className="space-y-2">
            <a
              href={mobileLink}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full btn-primary text-center"
            >
              Open in Wallet App
            </a>
            
            {onClose && (
              <button
                onClick={onClose}
                className="block w-full btn-secondary"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
