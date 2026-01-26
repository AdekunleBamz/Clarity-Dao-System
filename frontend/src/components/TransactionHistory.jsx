import { useState, useEffect, useContext } from 'react'
import { WalletContext } from '../context/WalletContext'
import { CURRENT_NETWORK, getExplorerTxUrl } from '../utils/constants'
import { truncateAddress } from '../utils/numbers'

const TX_TYPES = {
  contract_call: { label: 'Contract Call', icon: '📜', color: 'text-purple-600' },
  token_transfer: { label: 'Transfer', icon: '💸', color: 'text-blue-600' },
  smart_contract: { label: 'Deploy', icon: '🚀', color: 'text-green-600' },
  coinbase: { label: 'Coinbase', icon: '⛏️', color: 'text-yellow-600' },
}

const TX_STATUS = {
  success: { label: 'Success', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' },
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' },
  abort_by_response: { label: 'Failed', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' },
  abort_by_post_condition: { label: 'Aborted', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' },
}

export default function TransactionHistory({ limit = 10, showAll = false }) {
  const { address, isConnected } = useContext(WalletContext)
  const [transactions, setTransactions] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!address) return

    const fetchTransactions = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const response = await fetch(
          `${CURRENT_NETWORK.apiUrl}/extended/v1/address/${address}/transactions?limit=${limit}`
        )
        
        if (!response.ok) throw new Error('Failed to fetch transactions')
        
        const data = await response.json()
        setTransactions(data.results || [])
      } catch (err) {
        console.error('Error fetching transactions:', err)
        setError(err.message)
      } finally {
        setIsLoading(false)
      }
    }

    fetchTransactions()
  }, [address, limit])

  const formatTime = (timestamp) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  if (!isConnected) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <p className="text-gray-500 dark:text-gray-400 text-center">
          Connect your wallet to view transaction history
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Transaction History
        </h3>
      </div>

      {isLoading ? (
        <div className="p-6 space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 animate-pulse">
              <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg" />
              <div className="flex-1">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-2" />
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="p-6 text-center text-red-500">
          {error}
        </div>
      ) : transactions.length === 0 ? (
        <div className="p-6 text-center text-gray-500 dark:text-gray-400">
          No transactions found
        </div>
      ) : (
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {transactions.map((tx) => {
            const txType = TX_TYPES[tx.tx_type] || TX_TYPES.contract_call
            const txStatus = TX_STATUS[tx.tx_status] || TX_STATUS.pending

            return (
              <div key={tx.tx_id} className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
                <div className="flex items-start gap-4">
                  <div className={`text-2xl ${txType.color}`}>
                    {txType.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-gray-900 dark:text-white">
                        {txType.label}
                      </span>
                      <span className={`px-2 py-0.5 text-xs rounded-full ${txStatus.color}`}>
                        {txStatus.label}
                      </span>
                    </div>
                    
                    {tx.tx_type === 'contract_call' && tx.contract_call && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                        {tx.contract_call.function_name} on{' '}
                        {truncateAddress(tx.contract_call.contract_id.split('.')[1] || tx.contract_call.contract_id)}
                      </p>
                    )}
                    
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                      <span>{formatTime(tx.burn_block_time_iso)}</span>
                      <a
                        href={getExplorerTxUrl(tx.tx_id)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                      >
                        {truncateAddress(tx.tx_id, 8, 8)}
                      </a>
                    </div>
                  </div>
                  
                  {tx.fee_rate && (
                    <div className="text-right text-sm">
                      <p className="text-gray-500 dark:text-gray-400">Fee</p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {(parseInt(tx.fee_rate) / 1_000_000).toFixed(6)} STX
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showAll && transactions.length > 0 && (
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
          <a
            href={`${CURRENT_NETWORK.explorerUrl}/address/${address}?chain=${CURRENT_NETWORK.name}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-purple-600 dark:text-purple-400 text-sm font-medium hover:underline"
          >
            View all transactions →
          </a>
        </div>
      )}
    </div>
  )
}
