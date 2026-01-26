import { useState, useEffect } from 'react'
import { useWallet } from '../context/WalletContext'

export default function Tokens() {
  const { isConnected, address, daoBalance, stxBalance, contracts } = useWallet()
  const [tokenInfo, setTokenInfo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showTransferModal, setShowTransferModal] = useState(false)

  useEffect(() => {
    const fetchTokenInfo = async () => {
      try {
        setLoading(true)
        // In production, fetch from contract
        setTokenInfo({
          name: 'DAO Token',
          symbol: 'DAO',
          decimals: 6,
          totalSupply: 1_000_000_000,
          contractAddress: contracts.daoToken
        })
      } catch (err) {
        console.error('Failed to fetch token info:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchTokenInfo()
  }, [contracts])

  const votingPowerPercent = daoBalance && tokenInfo 
    ? ((daoBalance / tokenInfo.totalSupply) * 100).toFixed(4)
    : '0'

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">DAO Tokens</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2].map(i => (
            <div key={i} className="card animate-pulse">
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4" />
              <div className="space-y-3">
                {[1, 2, 3].map(j => (
                  <div key={j} className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full" />
                ))}
              </div>
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">DAO Tokens</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your governance tokens and voting power</p>
        </div>
        {isConnected && daoBalance > 0 && (
          <button 
            onClick={() => setShowTransferModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
            Transfer
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Token Information */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <span className="w-8 h-8 bg-primary-100 dark:bg-primary-900 rounded-lg flex items-center justify-center">
              <span className="text-primary-600 dark:text-primary-400">🪙</span>
            </span>
            Token Information
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
              <span className="text-gray-500">Name</span>
              <span className="font-medium text-gray-900 dark:text-white">{tokenInfo?.name}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
              <span className="text-gray-500">Symbol</span>
              <span className="font-medium text-gray-900 dark:text-white">{tokenInfo?.symbol}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
              <span className="text-gray-500">Decimals</span>
              <span className="font-medium text-gray-900 dark:text-white">{tokenInfo?.decimals}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
              <span className="text-gray-500">Total Supply</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {tokenInfo?.totalSupply.toLocaleString()} {tokenInfo?.symbol}
              </span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-500">Contract</span>
              <a 
                href={`https://explorer.stacks.co/txid/${tokenInfo?.contractAddress}?chain=mainnet`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
              >
                View on Explorer
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
          </div>
        </div>

        {/* User Balance */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <span className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
              <span className="text-green-600 dark:text-green-400">💰</span>
            </span>
            Your Balance
          </h2>
          
          {isConnected ? (
            <div className="space-y-4">
              <div className="text-center py-6 bg-gradient-to-br from-primary-50 to-indigo-50 dark:from-primary-900/20 dark:to-indigo-900/20 rounded-xl">
                <p className="text-5xl font-bold text-gray-900 dark:text-white">
                  {daoBalance?.toLocaleString() || '0'}
                </p>
                <p className="text-gray-500 mt-1">{tokenInfo?.symbol}</p>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-gray-500">Voting Power</span>
                  <span className="text-sm font-medium text-primary-600">
                    {daoBalance?.toLocaleString() || '0'} votes
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                  <div 
                    className="bg-primary-600 h-2 rounded-full transition-all" 
                    style={{ width: `${Math.min(parseFloat(votingPowerPercent) * 10, 100)}%` }} 
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">{votingPowerPercent}% of total supply</p>
              </div>

              {stxBalance !== null && (
                <div className="flex justify-between items-center py-2 px-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <span className="text-sm text-gray-500">STX Balance</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {stxBalance.toFixed(4)} STX
                  </span>
                </div>
              )}

              <div className="flex gap-2">
                <button 
                  onClick={() => setShowTransferModal(true)}
                  className="flex-1 btn-primary"
                  disabled={!daoBalance || daoBalance <= 0}
                >
                  Transfer Tokens
                </button>
                <a 
                  href="/staking"
                  className="flex-1 btn-secondary text-center"
                >
                  Stake for Rewards
                </a>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <p className="text-gray-500 dark:text-gray-400 mb-2">
                Connect your wallet to view your balance
              </p>
              <p className="text-sm text-gray-400">
                Use the button in the header to connect
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Token Utility Info */}
      <div className="card bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-200 dark:border-amber-800">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Token Utility</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
              <span>🗳️</span>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">Governance</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Vote on proposals and shape the DAO's future</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
              <span>📈</span>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">Staking</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Earn up to 25% APY by staking tokens</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
              <span>📝</span>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">Proposals</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Create proposals with 10,000+ tokens</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
              <span>🎁</span>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">Rewards</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Earn bounties and participation rewards</p>
            </div>
          </div>
        </div>
      </div>

      {showTransferModal && (
        <TransferModal 
          onClose={() => setShowTransferModal(false)} 
          balance={daoBalance}
          symbol={tokenInfo?.symbol}
        />
      )}
    </div>
  )
}

function TransferModal({ onClose, balance, symbol }) {
  const [recipient, setRecipient] = useState('')
  const [amount, setAmount] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const handleTransfer = async (e) => {
    e.preventDefault()
    
    if (!recipient.startsWith('SP') && !recipient.startsWith('ST')) {
      setError('Invalid Stacks address')
      return
    }
    
    const transferAmount = parseFloat(amount)
    if (!transferAmount || transferAmount <= 0) {
      setError('Please enter a valid amount')
      return
    }
    
    if (transferAmount > balance) {
      setError('Insufficient balance')
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      console.log('Transferring:', amount, symbol, 'to', recipient)
      alert(`Transfer ${amount} ${symbol} to ${recipient}\n\nNote: Transaction signing available when wallet supports stx_signTransaction`)
      onClose()
    } catch (err) {
      setError(err.message || 'Transfer failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Transfer Tokens</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleTransfer} className="space-y-4">
          <div>
            <label htmlFor="recipient" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Recipient Address
            </label>
            <input
              id="recipient"
              type="text"
              value={recipient}
              onChange={(e) => { setRecipient(e.target.value); setError(null); }}
              placeholder="SP... or ST..."
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm"
              required
            />
          </div>

          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Amount
            </label>
            <div className="relative">
              <input
                id="amount"
                type="number"
                value={amount}
                onChange={(e) => { setAmount(e.target.value); setError(null); }}
                placeholder="0.00"
                step="0.000001"
                min="0"
                className="w-full px-4 py-2 pr-20 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
              />
              <button
                type="button"
                onClick={() => setAmount(balance?.toString() || '0')}
                className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 text-xs font-medium text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded"
              >
                MAX
              </button>
            </div>
            <p className="text-sm text-gray-500 mt-1">Available: {balance?.toLocaleString() || '0'} {symbol}</p>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 btn-secondary">Cancel</button>
            <button type="submit" disabled={submitting} className="flex-1 btn-primary disabled:opacity-50">
              {submitting ? 'Sending...' : 'Send Tokens'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
