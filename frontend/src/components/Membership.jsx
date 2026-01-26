import { useState, useContext } from 'react'
import { WalletContext } from '../context/WalletContext'

const MEMBERSHIP_TIERS = [
  {
    tier: 1,
    name: 'Bronze',
    icon: '🥉',
    color: 'from-amber-400 to-amber-600',
    price: 100,
    benefits: ['Basic voting rights', 'Access to public channels', 'Monthly newsletter'],
    maxSupply: 1000,
    minted: 847,
  },
  {
    tier: 2,
    name: 'Silver',
    icon: '🥈',
    color: 'from-gray-300 to-gray-500',
    price: 500,
    benefits: ['All Bronze benefits', 'Priority proposal review', 'Exclusive Discord role', 'Quarterly calls'],
    maxSupply: 500,
    minted: 312,
  },
  {
    tier: 3,
    name: 'Gold',
    icon: '🥇',
    color: 'from-yellow-400 to-yellow-600',
    price: 1500,
    benefits: ['All Silver benefits', 'Proposal creation rights', 'Treasury view access', 'Monthly AMAs'],
    maxSupply: 200,
    minted: 156,
  },
  {
    tier: 4,
    name: 'Platinum',
    icon: '💎',
    color: 'from-cyan-400 to-cyan-600',
    price: 5000,
    benefits: ['All Gold benefits', 'Council voting rights', 'Early feature access', 'Direct team contact'],
    maxSupply: 50,
    minted: 38,
  },
  {
    tier: 5,
    name: 'Diamond',
    icon: '👑',
    color: 'from-purple-400 to-purple-600',
    price: 15000,
    benefits: ['All Platinum benefits', 'Governance veto power', 'Revenue sharing', 'Founding member status'],
    maxSupply: 10,
    minted: 7,
  },
]

const ACHIEVEMENTS = [
  { id: 1, name: 'First Vote', description: 'Cast your first governance vote', icon: '🗳️', earned: true },
  { id: 2, name: 'Proposal Creator', description: 'Create your first proposal', icon: '📝', earned: true },
  { id: 3, name: 'Staking Pioneer', description: 'Stake tokens for 30+ days', icon: '⚡', earned: false },
  { id: 4, name: 'Bounty Hunter', description: 'Complete 5 bounties', icon: '🎯', earned: false },
  { id: 5, name: 'Treasury Contributor', description: 'Deposit to treasury', icon: '💰', earned: true },
  { id: 6, name: 'Community Builder', description: 'Refer 10 members', icon: '👥', earned: false },
]

export default function Membership() {
  const { address, isConnected } = useContext(WalletContext)
  const [selectedTier, setSelectedTier] = useState(null)
  const [isMinting, setIsMinting] = useState(false)

  const userMembership = isConnected ? {
    tier: 2,
    tokenId: 156,
    mintedAt: '2025-06-15',
    achievements: ACHIEVEMENTS.filter(a => a.earned).length,
  } : null

  const handleMint = async (tier) => {
    if (!isConnected) return
    setIsMinting(true)
    
    try {
      console.log(`Minting tier ${tier} NFT`)
      await new Promise(resolve => setTimeout(resolve, 2000))
    } catch (error) {
      console.error('Minting failed:', error)
    } finally {
      setIsMinting(false)
    }
  }

  const handleUpgrade = async (newTier) => {
    if (!isConnected || !userMembership) return
    console.log(`Upgrading from tier ${userMembership.tier} to ${newTier}`)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Membership NFTs
        </h1>
      </div>

      {/* User's Current Membership */}
      {userMembership && (
        <div className={`bg-gradient-to-r ${MEMBERSHIP_TIERS[userMembership.tier - 1].color} rounded-xl p-6 text-white`}>
          <div className="flex items-center gap-4">
            <div className="text-5xl">{MEMBERSHIP_TIERS[userMembership.tier - 1].icon}</div>
            <div>
              <p className="text-white/80 text-sm">Your Membership</p>
              <h2 className="text-2xl font-bold">{MEMBERSHIP_TIERS[userMembership.tier - 1].name} Member</h2>
              <p className="text-white/80 text-sm">Token #{userMembership.tokenId} • Minted {userMembership.mintedAt}</p>
            </div>
            <div className="ml-auto text-right">
              <p className="text-white/80 text-sm">Achievements</p>
              <p className="text-3xl font-bold">{userMembership.achievements}/{ACHIEVEMENTS.length}</p>
            </div>
          </div>
        </div>
      )}

      {/* Membership Tiers */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {MEMBERSHIP_TIERS.map((tier) => (
          <div
            key={tier.tier}
            className={`bg-white dark:bg-gray-800 rounded-xl border-2 overflow-hidden ${
              userMembership?.tier === tier.tier
                ? 'border-purple-500'
                : 'border-gray-200 dark:border-gray-700'
            }`}
          >
            <div className={`bg-gradient-to-r ${tier.color} p-4 text-white text-center`}>
              <div className="text-4xl mb-2">{tier.icon}</div>
              <h3 className="text-xl font-bold">{tier.name}</h3>
            </div>
            <div className="p-4">
              <p className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-2">
                {tier.price.toLocaleString()} DAO
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-4">
                {tier.minted}/{tier.maxSupply} minted
              </p>
              <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full mb-4">
                <div
                  className={`h-full bg-gradient-to-r ${tier.color} rounded-full`}
                  style={{ width: `${(tier.minted / tier.maxSupply) * 100}%` }}
                />
              </div>
              <ul className="space-y-2 mb-4">
                {tier.benefits.map((benefit, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <span className="text-green-500 mt-0.5">✓</span>
                    {benefit}
                  </li>
                ))}
              </ul>
              
              {!isConnected ? (
                <button
                  disabled
                  className="w-full px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 font-medium rounded-lg cursor-not-allowed"
                >
                  Connect Wallet
                </button>
              ) : userMembership?.tier === tier.tier ? (
                <button
                  disabled
                  className="w-full px-4 py-2 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 font-medium rounded-lg"
                >
                  Current Tier
                </button>
              ) : userMembership?.tier > tier.tier ? (
                <button
                  disabled
                  className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 font-medium rounded-lg cursor-not-allowed"
                >
                  Lower Tier
                </button>
              ) : tier.minted >= tier.maxSupply ? (
                <button
                  disabled
                  className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 font-medium rounded-lg cursor-not-allowed"
                >
                  Sold Out
                </button>
              ) : userMembership ? (
                <button
                  onClick={() => handleUpgrade(tier.tier)}
                  className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors"
                >
                  Upgrade
                </button>
              ) : (
                <button
                  onClick={() => handleMint(tier.tier)}
                  disabled={isMinting}
                  className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors"
                >
                  {isMinting ? 'Minting...' : 'Mint NFT'}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Achievements Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Achievement Badges
        </h2>
        <p className="text-gray-600 dark:text-gray-400 text-sm mb-6">
          Earn badges by participating in DAO activities. Badges are recorded on-chain as achievement NFTs.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {ACHIEVEMENTS.map((achievement) => (
            <div
              key={achievement.id}
              className={`p-4 rounded-xl text-center ${
                achievement.earned
                  ? 'bg-purple-50 dark:bg-purple-900/20 border-2 border-purple-200 dark:border-purple-800'
                  : 'bg-gray-50 dark:bg-gray-700/50 border-2 border-gray-200 dark:border-gray-700 opacity-50'
              }`}
            >
              <div className="text-3xl mb-2">{achievement.icon}</div>
              <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                {achievement.name}
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {achievement.description}
              </p>
              {achievement.earned && (
                <span className="inline-block mt-2 px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs rounded-full">
                  Earned
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* NFT Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">Total Minted</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {MEMBERSHIP_TIERS.reduce((sum, t) => sum + t.minted, 0).toLocaleString()}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">Total Supply</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {MEMBERSHIP_TIERS.reduce((sum, t) => sum + t.maxSupply, 0).toLocaleString()}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">Unique Holders</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">1,247</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">Floor Price</p>
          <p className="text-2xl font-bold text-purple-600">150 DAO</p>
        </div>
      </div>
    </div>
  )
}
