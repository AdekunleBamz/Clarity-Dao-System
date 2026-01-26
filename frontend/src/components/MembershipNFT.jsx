import { useState, useEffect, useCallback } from 'react'
import { useWallet } from '../context/WalletContext'

const NFT_CONTRACT = 'SP3FKNEZ86RG5RT7SZ5FBRGH85FZNG94ZH1MCGG6N.membership-nft-v5-1'

// Membership tiers matching contract
const TIERS = {
  1: {
    name: 'Bronze',
    color: 'from-amber-600 to-amber-800',
    textColor: 'text-amber-600',
    borderColor: 'border-amber-500',
    icon: '🥉',
    minTokens: 100,
    benefits: ['Basic voting rights', 'Community access', 'Newsletter'],
  },
  2: {
    name: 'Silver',
    color: 'from-gray-400 to-gray-600',
    textColor: 'text-gray-500',
    borderColor: 'border-gray-400',
    icon: '🥈',
    minTokens: 1000,
    benefits: ['All Bronze benefits', 'Priority support', 'Exclusive channels'],
  },
  3: {
    name: 'Gold',
    color: 'from-yellow-400 to-yellow-600',
    textColor: 'text-yellow-500',
    borderColor: 'border-yellow-400',
    icon: '🥇',
    minTokens: 10000,
    benefits: ['All Silver benefits', 'Governance proposals', 'Early access'],
  },
  4: {
    name: 'Platinum',
    color: 'from-purple-400 to-purple-600',
    textColor: 'text-purple-500',
    borderColor: 'border-purple-400',
    icon: '💎',
    minTokens: 100000,
    benefits: ['All Gold benefits', 'Council voting', 'Revenue share'],
  },
  5: {
    name: 'Diamond',
    color: 'from-cyan-400 to-blue-600',
    textColor: 'text-cyan-500',
    borderColor: 'border-cyan-400',
    icon: '👑',
    minTokens: 1000000,
    benefits: ['All Platinum benefits', 'Treasury proposals', 'VIP events'],
  },
}

// Achievement badges
const BADGES = [
  { id: 1, name: 'Early Adopter', icon: '🌟', description: 'Joined in first 100 members' },
  { id: 2, name: 'Top Voter', icon: '🗳️', description: 'Voted on 50+ proposals' },
  { id: 3, name: 'Bounty Hunter', icon: '🎯', description: 'Completed 10+ bounties' },
  { id: 4, name: 'Staking Champion', icon: '💰', description: 'Staked for 1+ year' },
  { id: 5, name: 'Community Builder', icon: '🤝', description: 'Referred 10+ members' },
  { id: 6, name: 'Governance Pro', icon: '📜', description: 'Created 5+ approved proposals' },
]

export default function MembershipNFT() {
  const { isConnected, address } = useWallet()
  const [loading, setLoading] = useState(true)
  const [myNFT, setMyNFT] = useState(null)
  const [myBadges, setMyBadges] = useState([])
  const [stats, setStats] = useState({
    totalMinted: 0,
    tierDistribution: {},
  })
  const [showMintModal, setShowMintModal] = useState(false)
  const [selectedTier, setSelectedTier] = useState(null)
  const [minting, setMinting] = useState(false)

  const fetchMembershipData = useCallback(async () => {
    if (!address) {
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      // Mock data - replace with actual API calls
      setMyNFT({
        id: 42,
        tier: 3,
        mintedAt: Date.now() - 90 * 24 * 60 * 60 * 1000,
        tokenBalance: 15000,
      })
      setMyBadges([1, 2, 4])
      setStats({
        totalMinted: 1234,
        tierDistribution: {
          1: 800,
          2: 300,
          3: 100,
          4: 30,
          5: 4,
        },
      })
    } catch (error) {
      console.error('Failed to fetch membership data:', error)
    } finally {
      setLoading(false)
    }
  }, [address])

  useEffect(() => {
    fetchMembershipData()
  }, [fetchMembershipData])

  const handleMint = async () => {
    if (!selectedTier) return
    
    setMinting(true)
    try {
      // TODO: Implement contract call
      console.log('Minting tier:', selectedTier)
      await new Promise(resolve => setTimeout(resolve, 2000))
      setShowMintModal(false)
      fetchMembershipData()
    } catch (error) {
      console.error('Failed to mint:', error)
    } finally {
      setMinting(false)
    }
  }

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Membership NFT</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Tiered membership with exclusive benefits and badges
          </p>
        </div>
        {isConnected && !myNFT && (
          <button
            onClick={() => setShowMintModal(true)}
            className="btn-primary flex items-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Mint Membership</span>
          </button>
        )}
      </div>

      {/* My Membership Card */}
      {isConnected && myNFT && (
        <div className={`relative overflow-hidden bg-gradient-to-r ${TIERS[myNFT.tier].color} rounded-2xl p-6 text-white shadow-xl`}>
          <div className="absolute top-0 right-0 opacity-10">
            <span className="text-[200px]">{TIERS[myNFT.tier].icon}</span>
          </div>
          
          <div className="relative z-10">
            <div className="flex items-start justify-between mb-6">
              <div>
                <p className="text-white/70 text-sm">Your Membership</p>
                <h2 className="text-3xl font-bold">{TIERS[myNFT.tier].name} Member</h2>
                <p className="text-white/80">NFT #{myNFT.id}</p>
              </div>
              <div className="text-6xl">{TIERS[myNFT.tier].icon}</div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div>
                <p className="text-white/70 text-xs uppercase">Member Since</p>
                <p className="font-semibold">{formatDate(myNFT.mintedAt)}</p>
              </div>
              <div>
                <p className="text-white/70 text-xs uppercase">Token Balance</p>
                <p className="font-semibold">{myNFT.tokenBalance.toLocaleString()} DAO</p>
              </div>
              <div>
                <p className="text-white/70 text-xs uppercase">Badges Earned</p>
                <p className="font-semibold">{myBadges.length} / {BADGES.length}</p>
              </div>
              <div>
                <p className="text-white/70 text-xs uppercase">Tier Rank</p>
                <p className="font-semibold">Top {Math.round((myNFT.id / stats.totalMinted) * 100)}%</p>
              </div>
            </div>

            <div>
              <p className="text-white/70 text-sm mb-2">Your Benefits</p>
              <div className="flex flex-wrap gap-2">
                {TIERS[myNFT.tier].benefits.map((benefit, i) => (
                  <span key={i} className="px-3 py-1 bg-white/20 rounded-full text-sm">
                    {benefit}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Not Connected / No NFT State */}
      {!isConnected && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-8 text-center">
          <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Connect Your Wallet</h3>
          <p className="text-gray-600 dark:text-gray-400">
            Connect your wallet to view or mint your membership NFT
          </p>
        </div>
      )}

      {/* Tier Overview */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Membership Tiers</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {Object.entries(TIERS).map(([tier, info]) => (
            <div
              key={tier}
              className={`bg-white dark:bg-gray-800 rounded-xl p-4 border-2 ${
                myNFT?.tier === parseInt(tier) ? info.borderColor : 'border-transparent'
              } transition-all hover:shadow-lg`}
            >
              <div className="text-center mb-3">
                <span className="text-4xl">{info.icon}</span>
                <h3 className={`text-lg font-bold ${info.textColor}`}>{info.name}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {info.minTokens.toLocaleString()}+ DAO tokens
                </p>
              </div>
              
              <ul className="space-y-1">
                {info.benefits.map((benefit, i) => (
                  <li key={i} className="text-xs text-gray-600 dark:text-gray-400 flex items-start">
                    <svg className="w-4 h-4 text-green-500 mr-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {benefit}
                  </li>
                ))}
              </ul>

              {stats.tierDistribution[tier] && (
                <p className="mt-3 text-xs text-center text-gray-400">
                  {stats.tierDistribution[tier]} members
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Achievement Badges */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Achievement Badges</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {BADGES.map((badge) => {
            const earned = myBadges.includes(badge.id)
            return (
              <div
                key={badge.id}
                className={`bg-white dark:bg-gray-800 rounded-xl p-4 text-center transition-all ${
                  earned ? 'ring-2 ring-indigo-500' : 'opacity-50 grayscale'
                }`}
              >
                <span className="text-4xl block mb-2">{badge.icon}</span>
                <h4 className="font-medium text-gray-900 dark:text-white text-sm">{badge.name}</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{badge.description}</p>
                {earned && (
                  <span className="inline-block mt-2 px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs rounded-full">
                    Earned
                  </span>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Stats */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Community Stats</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-3xl font-bold text-indigo-600">{stats.totalMinted.toLocaleString()}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Members</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-amber-600">{stats.tierDistribution[1] || 0}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Bronze Holders</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-yellow-500">{stats.tierDistribution[3] || 0}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Gold Holders</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-cyan-500">{stats.tierDistribution[5] || 0}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Diamond Holders</p>
          </div>
        </div>
      </div>

      {/* Mint Modal */}
      {showMintModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Mint Membership NFT</h2>
              <button onClick={() => setShowMintModal(false)} className="text-gray-500 hover:text-gray-700">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Select a tier based on your DAO token holdings. Higher tiers unlock more benefits.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {Object.entries(TIERS).map(([tier, info]) => (
                <button
                  key={tier}
                  onClick={() => setSelectedTier(parseInt(tier))}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    selectedTier === parseInt(tier)
                      ? `${info.borderColor} bg-opacity-10`
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{info.icon}</span>
                    <div>
                      <h3 className={`font-bold ${info.textColor}`}>{info.name}</h3>
                      <p className="text-sm text-gray-500">{info.minTokens.toLocaleString()}+ tokens required</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <div className="flex justify-end gap-3">
              <button onClick={() => setShowMintModal(false)} className="btn-secondary">
                Cancel
              </button>
              <button
                onClick={handleMint}
                disabled={!selectedTier || minting}
                className="btn-primary disabled:opacity-50"
              >
                {minting ? 'Minting...' : `Mint ${selectedTier ? TIERS[selectedTier].name : ''} NFT`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
