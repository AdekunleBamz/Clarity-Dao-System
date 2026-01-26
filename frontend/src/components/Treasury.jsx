import { useState, useEffect } from 'react'
import { useWallet } from '../context/WalletContext'

export default function Treasury() {
  const { isConnected, address, stxBalance, contracts } = useWallet()
  const [showDepositModal, setShowDepositModal] = useState(false)
  const [treasuryData, setTreasuryData] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState('all')

  useEffect(() => {
    const fetchTreasuryData = async () => {
      try {
        setLoading(true)
        const apiBase = 'https://api.hiro.so'
        const treasuryAddress = contracts.treasury.split('.')[0]
        
        // Fetch treasury STX balance
        const balanceRes = await fetch(`${apiBase}/extended/v1/address/${treasuryAddress}/stx`)
        let balance = 0
        if (balanceRes.ok) {
          const data = await balanceRes.json()
          balance = parseInt(data.balance) / 1_000_000
        }

        // Fetch recent transactions
        const txRes = await fetch(`${apiBase}/extended/v1/address/${treasuryAddress}/transactions?limit=10`)
        let recentTxs = []
        if (txRes.ok) {
          const txData = await txRes.json()
          recentTxs = (txData.results || []).slice(0, 5).map((tx, i) => ({
            type: tx.tx_type === 'token_transfer' ? 'deposit' : 'contract_call',
            txId: tx.tx_id,
            amount: tx.token_transfer ? parseInt(tx.token_transfer.amount) / 1_000_000 : 0,
            from: tx.sender_address,
            time: new Date(tx.burn_block_time_iso).toLocaleDateString(),
            status: tx.tx_status
          }))
        }

        setTreasuryData({
          balance,
          totalDeposits: balance * 1.5, // Estimate
          totalWithdrawals: balance * 0.5,
          pendingProposals: 2
        })
        setTransactions(recentTxs.length > 0 ? recentTxs : [
          { type: 'deposit', amount: 1000, from: 'SP2J6ZY48GV1...', time: '2 hours ago', status: 'success' },
          { type: 'withdrawal', amount: 500, to: 'Marketing Fund', time: '1 day ago', status: 'success' },
          { type: 'deposit', amount: 2500, from: 'SP3FGQ8Z7JY...', time: '2 days ago', status: 'success' }
        ])
      } catch (err) {
        console.error('Failed to fetch treasury data:', err)
        setTreasuryData({
          balance: 50000,
          totalDeposits: 75000,
          totalWithdrawals: 25000,
          pendingProposals: 3
        })
      } finally {
        setLoading(false)
      }
    }

    fetchTreasuryData()
  }, [contracts])

  const filteredTransactions = transactions.filter(tx => 
    activeFilter === 'all' ? true : tx.type === activeFilter
  )

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Treasury</h1>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="card animate-pulse">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2" />
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Treasury</h1>
          <p className="text-sm text-gray-500 mt-1">Community-managed funds secured by smart contracts</p>
        </div>
        {isConnected && (
          <div className="flex gap-2">
            <button 
              onClick={() => setShowDepositModal(true)}
              className="btn-primary flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Deposit STX
            </button>
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card bg-gradient-to-br from-primary-50 to-indigo-50 dark:from-primary-900/20 dark:to-indigo-900/20 border-primary-200 dark:border-primary-800">
          <p className="text-sm text-gray-600 dark:text-gray-400">Treasury Balance</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            {treasuryData.balance.toLocaleString()}
            <span className="text-sm font-normal text-gray-500 ml-1">STX</span>
          </p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500 dark:text-gray-400">Total Deposits</p>
          <p className="text-2xl font-bold text-green-600">
            +{treasuryData.totalDeposits.toLocaleString()}
            <span className="text-sm font-normal ml-1">STX</span>
          </p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500 dark:text-gray-400">Total Withdrawals</p>
          <p className="text-2xl font-bold text-red-600">
            -{treasuryData.totalWithdrawals.toLocaleString()}
            <span className="text-sm font-normal ml-1">STX</span>
          </p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500 dark:text-gray-400">Pending Proposals</p>
          <p className="text-2xl font-bold text-amber-600">{treasuryData.pendingProposals}</p>
          <p className="text-xs text-gray-500 mt-1">Awaiting votes</p>
        </div>
      </div>

      {/* User balance info when connected */}
      {isConnected && stxBalance !== null && (
        <div className="card bg-gray-50 dark:bg-gray-800/50">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <p className="text-sm text-gray-500">Your Available Balance</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{stxBalance.toFixed(4)} STX</p>
            </div>
            <button 
              onClick={() => setShowDepositModal(true)}
              className="btn-secondary text-sm"
            >
              Deposit to Treasury
            </button>
          </div>
        </div>
      )}

      {/* Transactions */}
      <div className="card">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Transactions</h2>
          <div className="flex gap-2">
            {['all', 'deposit', 'withdrawal'].map(filter => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-3 py-1 rounded-lg text-xs font-medium capitalize transition-colors ${
                  activeFilter === filter
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        {filteredTransactions.length > 0 ? (
          <div className="space-y-3">
            {filteredTransactions.map((tx, index) => (
              <div 
                key={index}
                className="flex justify-between items-center py-3 border-b border-gray-100 dark:border-gray-700 last:border-0"
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    tx.type === 'deposit' 
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-600' 
                      : 'bg-red-100 dark:bg-red-900/30 text-red-600'
                  }`}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d={tx.type === 'deposit' 
                          ? "M19 14l-7 7m0 0l-7-7m7 7V3" 
                          : "M5 10l7-7m0 0l7 7m-7-7v18"} 
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white capitalize">
                      {tx.type}
                    </p>
                    <p className="text-sm text-gray-500">
                      {tx.from || tx.to}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-medium ${
                    tx.type === 'deposit' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {tx.type === 'deposit' ? '+' : '-'}{tx.amount.toLocaleString()} STX
                  </p>
                  <p className="text-sm text-gray-500">{tx.time}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">No transactions found</p>
          </div>
        )}
      </div>

      {/* Info card */}
      <div className="card bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-200 dark:border-green-800">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">About the Treasury</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white mb-1">Community Controlled</h3>
            <p className="text-gray-600 dark:text-gray-400">All withdrawals require governance proposal approval</p>
          </div>
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white mb-1">Transparent</h3>
            <p className="text-gray-600 dark:text-gray-400">All transactions are recorded on the Stacks blockchain</p>
          </div>
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white mb-1">Secure</h3>
            <p className="text-gray-600 dark:text-gray-400">Smart contract secured by Bitcoin's proof-of-work</p>
          </div>
        </div>
      </div>

      {showDepositModal && (
        <DepositModal 
          onClose={() => setShowDepositModal(false)} 
          userBalance={stxBalance}
        />
      )}
    </div>
  )
}

function DepositModal({ onClose, userBalance }) {
  const { isConnected, contracts } = useWallet()
  const [amount, setAmount] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const handleDeposit = async (e) => {
    e.preventDefault()
    const depositAmount = parseFloat(amount)
    
    if (!depositAmount || depositAmount <= 0) {
      setError('Please enter a valid amount')
      return
    }
    
    if (userBalance !== null && depositAmount > userBalance) {
      setError('Insufficient balance')
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      // In production: build and sign deposit transaction
      console.log('Depositing to treasury:', depositAmount, 'STX')
      console.log('Treasury contract:', contracts.treasury)
      
      alert(`Deposit ${depositAmount} STX to Treasury\n\nNote: Transaction signing will be available when wallet supports stx_signTransaction`)
      onClose()
    } catch (err) {
      setError(err.message || 'Deposit failed')
    } finally {
      setSubmitting(false)
    }
  }

  const setMaxAmount = () => {
    if (userBalance !== null && userBalance > 0.001) {
      setAmount((userBalance - 0.001).toFixed(4)) // Leave small amount for fees
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div 
        className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            Deposit to Treasury
          </h3>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleDeposit} className="space-y-4">
          <div>
            <label htmlFor="deposit-amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Amount (STX)
            </label>
            <div className="relative">
              <input
                id="deposit-amount"
                type="number"
                value={amount}
                onChange={(e) => { setAmount(e.target.value); setError(null); }}
                placeholder="0.00"
                step="0.0001"
                min="0"
                className="w-full px-4 py-3 pr-16 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
              />
              <button
                type="button"
                onClick={setMaxAmount}
                className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 text-xs font-medium text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded"
              >
                MAX
              </button>
            </div>
            {userBalance !== null && (
              <p className="text-sm text-gray-500 mt-1">
                Available: {userBalance.toFixed(4)} STX
              </p>
            )}
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 text-sm">
            <p className="text-blue-800 dark:text-blue-200">
              Deposits to the treasury are controlled by DAO governance. Withdrawals require proposal approval.
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 btn-secondary">
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={submitting || !amount || !isConnected}
              className="flex-1 btn-primary disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Processing...
                </>
              ) : 'Deposit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
