import { useState, useEffect, useMemo } from 'react'

const HIRO_API = 'https://api.hiro.so'

/**
 * Transaction status badge
 */
function StatusBadge({ status }) {
  const statusConfig = {
    success: {
      bg: 'bg-green-100 dark:bg-green-900/30',
      text: 'text-green-700 dark:text-green-400',
      label: 'Success',
    },
    pending: {
      bg: 'bg-yellow-100 dark:bg-yellow-900/30',
      text: 'text-yellow-700 dark:text-yellow-400',
      label: 'Pending',
    },
    abort_by_response: {
      bg: 'bg-red-100 dark:bg-red-900/30',
      text: 'text-red-700 dark:text-red-400',
      label: 'Failed',
    },
    abort_by_post_condition: {
      bg: 'bg-orange-100 dark:bg-orange-900/30',
      text: 'text-orange-700 dark:text-orange-400',
      label: 'Aborted',
    },
  }

  const config = statusConfig[status] || statusConfig.pending

  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${config.bg} ${config.text}`}>
      {config.label}
    </span>
  )
}

/**
 * Transaction type icon
 */
function TxTypeIcon({ type }) {
  const icons = {
    contract_call: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
      </svg>
    ),
    token_transfer: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
    smart_contract: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    coinbase: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  }

  return (
    <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
      {icons[type] || icons.contract_call}
    </div>
  )
}

/**
 * Transaction row component
 */
function TransactionRow({ tx }) {
  const truncateHash = (hash) => {
    if (!hash) return ''
    return `${hash.slice(0, 8)}...${hash.slice(-8)}`
  }

  const formatTime = (timestamp) => {
    if (!timestamp) return 'Pending'
    const date = new Date(timestamp * 1000)
    const now = new Date()
    const diff = now - date

    if (diff < 60000) return 'Just now'
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
    return date.toLocaleDateString()
  }

  const formatAmount = (amount) => {
    if (!amount) return null
    const stx = Number(amount) / 1000000
    return `${stx.toLocaleString(undefined, { maximumFractionDigits: 6 })} STX`
  }

  const getFunctionName = () => {
    if (tx.tx_type === 'token_transfer') return 'Token Transfer'
    if (tx.tx_type === 'smart_contract') return 'Deploy Contract'
    if (tx.tx_type === 'coinbase') return 'Coinbase'
    if (tx.contract_call) {
      return tx.contract_call.function_name?.replace(/-/g, ' ') || 'Contract Call'
    }
    return tx.tx_type
  }

  const getContractName = () => {
    if (tx.contract_call) {
      const parts = tx.contract_call.contract_id?.split('.') || []
      return parts[1] || 'Unknown Contract'
    }
    return null
  }

  return (
    <div className="flex items-center p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors border-b border-gray-100 dark:border-gray-800 last:border-b-0">
      <TxTypeIcon type={tx.tx_type} />
      
      <div className="ml-4 flex-1 min-w-0">
        <div className="flex items-center space-x-2">
          <span className="font-medium text-gray-900 dark:text-white capitalize">
            {getFunctionName()}
          </span>
          {getContractName() && (
            <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">
              {getContractName()}
            </span>
          )}
        </div>
        <div className="flex items-center space-x-2 mt-1">
          <a
            href={`https://explorer.stacks.co/txid/${tx.tx_id}?chain=mainnet`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-purple-600 dark:text-purple-400 hover:underline font-mono"
          >
            {truncateHash(tx.tx_id)}
          </a>
          <span className="text-xs text-gray-400">•</span>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {formatTime(tx.burn_block_time)}
          </span>
        </div>
      </div>

      <div className="text-right ml-4">
        {tx.tx_type === 'token_transfer' && tx.token_transfer && (
          <div className="text-sm font-medium text-gray-900 dark:text-white">
            {formatAmount(tx.token_transfer.amount)}
          </div>
        )}
        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Fee: {formatAmount(tx.fee_rate)}
        </div>
      </div>

      <div className="ml-4">
        <StatusBadge status={tx.tx_status} />
      </div>
    </div>
  )
}

/**
 * Empty state component
 */
function EmptyState() {
  return (
    <div className="text-center py-12">
      <svg className="w-12 h-12 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
      <p className="mt-4 text-gray-500 dark:text-gray-400">No transactions yet</p>
      <p className="text-sm text-gray-400 dark:text-gray-500">
        Your transaction history will appear here
      </p>
    </div>
  )
}

/**
 * Transaction filter tabs
 */
function FilterTabs({ activeFilter, onFilterChange }) {
  const filters = [
    { id: 'all', label: 'All' },
    { id: 'contract_call', label: 'Contract Calls' },
    { id: 'token_transfer', label: 'Transfers' },
  ]

  return (
    <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
      {filters.map((filter) => (
        <button
          key={filter.id}
          onClick={() => onFilterChange(filter.id)}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            activeFilter === filter.id
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          {filter.label}
        </button>
      ))}
    </div>
  )
}

/**
 * Main TransactionHistory component
 */
export default function TransactionHistory({ address, limit = 20 }) {
  const [transactions, setTransactions] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('all')
  const [offset, setOffset] = useState(0)
  const [hasMore, setHasMore] = useState(true)

  useEffect(() => {
    if (!address) {
      setIsLoading(false)
      return
    }

    const fetchTransactions = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const response = await fetch(
          `${HIRO_API}/extended/v1/address/${address}/transactions?limit=${limit}&offset=${offset}`
        )

        if (!response.ok) {
          throw new Error('Failed to fetch transactions')
        }

        const data = await response.json()
        
        if (offset === 0) {
          setTransactions(data.results || [])
        } else {
          setTransactions((prev) => [...prev, ...(data.results || [])])
        }
        
        setHasMore((data.results?.length || 0) === limit)
      } catch (err) {
        setError(err.message)
      } finally {
        setIsLoading(false)
      }
    }

    fetchTransactions()
  }, [address, limit, offset])

  const filteredTransactions = useMemo(() => {
    if (filter === 'all') return transactions
    return transactions.filter((tx) => tx.tx_type === filter)
  }, [transactions, filter])

  const handleLoadMore = () => {
    setOffset((prev) => prev + limit)
  }

  if (!address) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
        <p className="text-center text-gray-500 dark:text-gray-400">
          Connect your wallet to view transaction history
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Transaction History
        </h2>
        <FilterTabs activeFilter={filter} onFilterChange={setFilter} />
      </div>

      {/* Content */}
      <div className="divide-y divide-gray-100 dark:divide-gray-800">
        {error ? (
          <div className="p-6 text-center text-red-500">
            <p>Error loading transactions: {error}</p>
            <button
              onClick={() => setOffset(0)}
              className="mt-2 text-sm text-purple-600 hover:underline"
            >
              Try again
            </button>
          </div>
        ) : isLoading && transactions.length === 0 ? (
          <div className="p-6 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse flex items-center">
                <div className="w-9 h-9 bg-gray-200 dark:bg-gray-700 rounded-lg" />
                <div className="ml-4 flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredTransactions.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            {filteredTransactions.map((tx) => (
              <TransactionRow key={tx.tx_id} tx={tx} />
            ))}
          </>
        )}
      </div>

      {/* Load More */}
      {hasMore && transactions.length > 0 && !isLoading && (
        <div className="p-4 border-t border-gray-200 dark:border-gray-800">
          <button
            onClick={handleLoadMore}
            className="w-full py-2 text-sm font-medium text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors"
          >
            Load more transactions
          </button>
        </div>
      )}

      {isLoading && transactions.length > 0 && (
        <div className="p-4 text-center text-gray-500">
          Loading more...
        </div>
      )}
    </div>
  )
}
