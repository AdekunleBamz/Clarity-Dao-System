import { useState, useEffect, useCallback } from 'react'
import { useWallet } from '../context/WalletContext'

// Match contract constants
const DURATIONS = [
  { blocks: 4320, label: '1 Month', rate: 500 },      // 5% APY
  { blocks: 12960, label: '3 Months', rate: 800 },    // 8% APY
  { blocks: 25920, label: '6 Months', rate: 1200 },   // 12% APY
  { blocks: 51840, label: '1 Year', rate: 1800 },     // 18% APY
  { blocks: 103680, label: '2 Years', rate: 2500 },   // 25% APY
]

export default function Staking() {
  const { isConnected, address, daoBalance, contracts, callReadOnly } = useWallet()
  const [activeTab, setActiveTab] = useState('stake')
  const [stakeAmount, setStakeAmount] = useState('')
  const [selectedDuration, setSelectedDuration] = useState(DURATIONS[0])
  const [userStakes, setUserStakes] = useState([])
  const [totalStaked, setTotalStaked] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  // Fetch staking data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        // In production, these would be contract calls via callReadOnly
        // For now, show realistic placeholder data
        setTotalStaked(125000)
        setUserStakes([])
        setError(null)
      } catch (err) {
        setError('Failed to load staking data')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [address, contracts])

  // Calculate estimated rewards
  const calculateRewards = useCallback((amount, duration) => {
    if (!amount || isNaN(amount)) return 0
    const rate = duration.rate / 10000 // Convert basis points to decimal
    const periods = duration.blocks / 51840 // Normalize to 1 year
    return (amount * rate * periods).toFixed(2)
  }, [])

  const handleStake = async () => {
    if (!stakeAmount || parseFloat(stakeAmount) <= 0) {
      setError('Please enter a valid amount')
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      // In production: build and sign transaction
      // const tx = await buildStakeTransaction(stakeAmount, selectedDuration.blocks)
      // await signTransaction(tx)
      console.log('Staking:', stakeAmount, 'for', selectedDuration.label)
      alert(`Staking ${stakeAmount} DAO for ${selectedDuration.label}\n\nNote: Transaction signing not yet implemented. Connect to a wallet that supports stx_signTransaction.`)
    } catch (err) {
      setError(err.message || 'Failed to stake')
    } finally {
      setSubmitting(false)
    }
  }

  const handleUnstake = async (stakeId) => {
    setSubmitting(true)
    try {
      console.log('Unstaking:', stakeId)
      alert('Unstake transaction would be signed here')
    } catch (err) {
      setError(err.message || 'Failed to unstake')
    } finally {
      setSubmitting(false)
    }
  }

  const handleClaimRewards = async () => {
    setSubmitting(true)
    try {
      console.log('Claiming rewards')
      alert('Claim rewards transaction would be signed here')
    } catch (err) {
      setError(err.message || 'Failed to claim')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Staking</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Staking</h1>
        <div className="flex items-center gap-4 text-sm">
          <div className="px-3 py-1 bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 rounded-full">
            <span className="font-medium">TVL:</span> {totalStaked?.toLocaleString() || '—'} DAO
          </div>
          {isConnected && daoBalance !== null && (
            <div className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full">
              <span className="font-medium">Your Balance:</span> {daoBalance.toLocaleString()} DAO
            </div>
          )}
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Staking pools overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {DURATIONS.slice(0, 3).map((dur, i) => (
          <div 
            key={dur.blocks} 
            className={`card cursor-pointer transition-all ${selectedDuration.blocks === dur.blocks ? 'ring-2 ring-primary-500' : 'hover:shadow-lg'}`}
            onClick={() => setSelectedDuration(dur)}
            role="button"
            tabIndex={0}
            aria-pressed={selectedDuration.blocks === dur.blocks}
            onKeyDown={(e) => e.key === 'Enter' && setSelectedDuration(dur)}
          >
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-semibold text-gray-900 dark:text-white">{dur.label}</h3>
              <span className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-full text-xs font-bold">
                {(dur.rate / 100).toFixed(0)}% APY
              </span>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Lock for {dur.label.toLowerCase()} to earn rewards
            </p>
          </div>
        ))}
      </div>

      {/* Main staking card */}
      <div className="card">
        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6" role="tablist">
          {['stake', 'unstake', 'rewards'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              role="tab"
              aria-selected={activeTab === tab}
              className={`px-4 py-2 text-sm font-medium capitalize border-b-2 transition-colors ${
                activeTab === tab 
                  ? 'border-primary-600 text-primary-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Stake tab */}
        {activeTab === 'stake' && (
          <div className="space-y-6">
            <div>
              <label htmlFor="stake-amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Amount to Stake
              </label>
              <div className="relative">
                <input
                  id="stake-amount"
                  type="number"
                  value={stakeAmount}
                  onChange={(e) => setStakeAmount(e.target.value)}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-3 pr-20 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  aria-describedby="stake-balance"
                />
                <button 
                  onClick={() => daoBalance && setStakeAmount(daoBalance.toString())}
                  className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 text-xs font-medium text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded"
                >
                  MAX
                </button>
              </div>
              {isConnected && (
                <p id="stake-balance" className="text-sm text-gray-500 mt-1">
                  Available: {daoBalance?.toLocaleString() || '0'} DAO
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Lock Duration
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {DURATIONS.map(dur => (
                  <button
                    key={dur.blocks}
                    onClick={() => setSelectedDuration(dur)}
                    className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                      selectedDuration.blocks === dur.blocks 
                        ? 'bg-primary-600 text-white' 
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
                    }`}
                  >
                    {dur.label}
                  </button>
                ))}
              </div>
            </div>

            {stakeAmount && parseFloat(stakeAmount) > 0 && (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Estimated Rewards</p>
                    <p className="text-2xl font-bold text-green-600">
                      +{calculateRewards(parseFloat(stakeAmount), selectedDuration)} DAO
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600 dark:text-gray-400">APY</p>
                    <p className="text-xl font-bold text-primary-600">{(selectedDuration.rate / 100).toFixed(0)}%</p>
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={handleStake}
              disabled={!isConnected || !stakeAmount || submitting}
              className="w-full btn-primary py-3 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Processing...
                </>
              ) : isConnected ? 'Stake Tokens' : 'Connect Wallet to Stake'}
            </button>
          </div>
        )}

        {/* Unstake tab */}
        {activeTab === 'unstake' && (
          <div>
            {userStakes.length > 0 ? (
              <div className="space-y-4">
                {userStakes.map((stake, i) => (
                  <div key={i} className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{stake.amount.toLocaleString()} DAO</p>
                      <p className="text-sm text-gray-500">Locked until block {stake.lockUntil}</p>
                    </div>
                    <button 
                      onClick={() => handleUnstake(stake.id)}
                      disabled={submitting}
                      className="btn-secondary"
                    >
                      Unstake
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <svg className="w-12 h-12 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                <p className="text-gray-500 dark:text-gray-400">No active stakes</p>
                <p className="text-sm text-gray-400 mt-1">Stake tokens to see them here</p>
              </div>
            )}
          </div>
        )}

        {/* Rewards tab */}
        {activeTab === 'rewards' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 rounded-lg p-6 text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Claimable Rewards</p>
              <p className="text-4xl font-bold text-amber-600">0.00 DAO</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg text-center">
                <p className="text-sm text-gray-500 mb-1">Total Earned</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">0.00 DAO</p>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg text-center">
                <p className="text-sm text-gray-500 mb-1">Total Claimed</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">0.00 DAO</p>
              </div>
            </div>

            <button
              onClick={handleClaimRewards}
              disabled={!isConnected || submitting}
              className="w-full btn-primary py-3 disabled:opacity-50"
            >
              Claim Rewards
            </button>
          </div>
        )}
      </div>

      {/* Info section */}
      <div className="card bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">About Staking</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white mb-1">Earn Rewards</h3>
            <p className="text-gray-600 dark:text-gray-400">Stake your DAO tokens to earn up to 25% APY based on lock duration.</p>
          </div>
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white mb-1">Boost Voting Power</h3>
            <p className="text-gray-600 dark:text-gray-400">Staked tokens count toward your governance voting power.</p>
          </div>
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white mb-1">Early Unstake</h3>
            <p className="text-gray-600 dark:text-gray-400">Early unstaking incurs a 20% penalty. Wait for lock period to avoid fees.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
