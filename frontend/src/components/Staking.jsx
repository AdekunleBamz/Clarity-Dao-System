import { useState, useContext } from 'react'
import { WalletContext } from '../context/WalletContext'

const STAKING_TIERS = [
  { tier: 1, name: 'Bronze', minStake: 100, apy: 5, lockDays: 7 },
  { tier: 2, name: 'Silver', minStake: 1000, apy: 10, lockDays: 30 },
  { tier: 3, name: 'Gold', minStake: 5000, apy: 15, lockDays: 90 },
  { tier: 4, name: 'Platinum', minStake: 10000, apy: 20, lockDays: 180 },
  { tier: 5, name: 'Diamond', minStake: 50000, apy: 25, lockDays: 365 },
]

const TIER_ICONS = ['🥉', '🥈', '🥇', '💎', '👑']

export default function Staking() {
  const { address, isConnected } = useContext(WalletContext)
  const [stakeAmount, setStakeAmount] = useState('')
  const [selectedTier, setSelectedTier] = useState(null)
  const [isStaking, setIsStaking] = useState(false)

  const userStake = {
    amount: 2500,
    tier: 2,
    startBlock: 150000,
    endBlock: 154320,
    rewards: 45.5,
    autoCompound: true,
  }

  const handleStake = async () => {
    if (!isConnected || !stakeAmount || !selectedTier) return
    setIsStaking(true)
    
    try {
      // Staking contract call would go here
      console.log(`Staking ${stakeAmount} tokens at tier ${selectedTier}`)
      await new Promise(resolve => setTimeout(resolve, 2000))
      setStakeAmount('')
      setSelectedTier(null)
    } catch (error) {
      console.error('Staking failed:', error)
    } finally {
      setIsStaking(false)
    }
  }

  const handleUnstake = async () => {
    if (!isConnected) return
    console.log('Unstaking...')
  }

  const handleClaimRewards = async () => {
    if (!isConnected) return
    console.log('Claiming rewards...')
  }

  const calculateEstimatedRewards = () => {
    if (!stakeAmount || !selectedTier) return 0
    const tier = STAKING_TIERS.find(t => t.tier === selectedTier)
    if (!tier) return 0
    const amount = parseFloat(stakeAmount)
    return ((amount * tier.apy) / 100 * (tier.lockDays / 365)).toFixed(2)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Staking
        </h1>
        {isConnected && userStake.amount > 0 && (
          <div className="flex items-center gap-2 px-3 py-1 bg-purple-100 dark:bg-purple-900/30 rounded-full">
            <span className="text-lg">{TIER_ICONS[userStake.tier - 1]}</span>
            <span className="text-sm font-medium text-purple-700 dark:text-purple-300">
              {STAKING_TIERS[userStake.tier - 1].name} Tier
            </span>
          </div>
        )}
      </div>

      {/* Current Stake Card */}
      {isConnected && userStake.amount > 0 && (
        <div className="bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl p-6 text-white">
          <h2 className="text-lg font-semibold mb-4">Your Stake</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-purple-200 text-sm">Staked Amount</p>
              <p className="text-2xl font-bold">{userStake.amount.toLocaleString()} DAO</p>
            </div>
            <div>
              <p className="text-purple-200 text-sm">Current APY</p>
              <p className="text-2xl font-bold">{STAKING_TIERS[userStake.tier - 1].apy}%</p>
            </div>
            <div>
              <p className="text-purple-200 text-sm">Pending Rewards</p>
              <p className="text-2xl font-bold">{userStake.rewards} DAO</p>
            </div>
            <div>
              <p className="text-purple-200 text-sm">Auto-Compound</p>
              <p className="text-2xl font-bold">{userStake.autoCompound ? 'On' : 'Off'}</p>
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <button
              onClick={handleClaimRewards}
              className="flex-1 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg font-medium transition-colors"
            >
              Claim Rewards
            </button>
            <button
              onClick={handleUnstake}
              className="flex-1 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg font-medium transition-colors"
            >
              Unstake
            </button>
          </div>
        </div>
      )}

      {/* Staking Tiers */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Staking Tiers
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {STAKING_TIERS.map((tier) => (
            <button
              key={tier.tier}
              onClick={() => setSelectedTier(tier.tier)}
              className={`p-4 rounded-xl border-2 transition-all ${
                selectedTier === tier.tier
                  ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-purple-300'
              }`}
            >
              <div className="text-3xl mb-2">{TIER_ICONS[tier.tier - 1]}</div>
              <h3 className="font-semibold text-gray-900 dark:text-white">{tier.name}</h3>
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{tier.apy}% APY</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Min: {tier.minStake.toLocaleString()} DAO
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Lock: {tier.lockDays} days
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Stake Form */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Stake Tokens
        </h2>
        
        {!isConnected ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-8">
            Connect your wallet to stake tokens
          </p>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Amount to Stake
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={stakeAmount}
                  onChange={(e) => setStakeAmount(e.target.value)}
                  placeholder="Enter amount"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">
                  DAO
                </span>
              </div>
            </div>

            {selectedTier && stakeAmount && (
              <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Selected Tier</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {TIER_ICONS[selectedTier - 1]} {STAKING_TIERS[selectedTier - 1].name}
                  </span>
                </div>
                <div className="flex justify-between text-sm mt-2">
                  <span className="text-gray-500 dark:text-gray-400">Lock Period</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {STAKING_TIERS[selectedTier - 1].lockDays} days
                  </span>
                </div>
                <div className="flex justify-between text-sm mt-2">
                  <span className="text-gray-500 dark:text-gray-400">Estimated Rewards</span>
                  <span className="font-medium text-green-600 dark:text-green-400">
                    +{calculateEstimatedRewards()} DAO
                  </span>
                </div>
              </div>
            )}

            <button
              onClick={handleStake}
              disabled={!stakeAmount || !selectedTier || isStaking}
              className="w-full px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
            >
              {isStaking ? 'Staking...' : 'Stake Tokens'}
            </button>
          </div>
        )}
      </div>

      {/* Staking Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">Total Value Locked</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">2.5M DAO</p>
          <p className="text-sm text-green-600">+12.5% this week</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">Total Stakers</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">1,247</p>
          <p className="text-sm text-green-600">+89 this week</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">Average APY</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">15.2%</p>
          <p className="text-sm text-gray-500">Weighted average</p>
        </div>
      </div>
    </div>
  )
}
