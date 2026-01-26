import { useState, useEffect, useCallback } from 'react'
import { useWallet } from '../context/WalletContext'

const BOUNTY_CONTRACT = 'SP3FKNEZ86RG5RT7SZ5FBRGH85FZNG94ZH1MCGG6N.bounty-v5-1'
const STACKS_API = 'https://api.hiro.so'

// Bounty status enum matching contract
const BountyStatus = {
  0: { label: 'Open', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' },
  1: { label: 'In Review', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' },
  2: { label: 'Disputed', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' },
  3: { label: 'Completed', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
  4: { label: 'Cancelled', color: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300' },
}

// Difficulty levels
const Difficulty = {
  beginner: { label: 'Beginner', color: 'text-green-600', icon: '🌱' },
  intermediate: { label: 'Intermediate', color: 'text-yellow-600', icon: '⚡' },
  advanced: { label: 'Advanced', color: 'text-orange-600', icon: '🔥' },
  expert: { label: 'Expert', color: 'text-red-600', icon: '💎' },
}

export default function Bounty() {
  const { isConnected, address } = useWallet()
  const [bounties, setBounties] = useState([])
  const [myBounties, setMyBounties] = useState([])
  const [mySubmissions, setMySubmissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('all')
  const [filter, setFilter] = useState('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showSubmitModal, setShowSubmitModal] = useState(false)
  const [selectedBounty, setSelectedBounty] = useState(null)
  const [stats, setStats] = useState({
    totalBounties: 0,
    totalPayout: 0,
    activeBounties: 0,
    completedBounties: 0,
  })

  // Fetch bounties from API
  const fetchBounties = useCallback(async () => {
    setLoading(true)
    try {
      // Mock data for demonstration - replace with actual API calls
      const mockBounties = [
        {
          id: 1,
          title: 'Implement Dark Mode Toggle',
          description: 'Add a dark mode toggle to the header that persists user preference to localStorage.',
          reward: 500000000, // 500 STX in microSTX
          creator: 'SP2...ABC',
          status: 0,
          difficulty: 'beginner',
          deadline: Date.now() + 7 * 24 * 60 * 60 * 1000,
          submissions: 3,
          tags: ['frontend', 'UI', 'React'],
        },
        {
          id: 2,
          title: 'Optimize Smart Contract Gas Usage',
          description: 'Review and optimize the governance contract to reduce gas costs by at least 20%.',
          reward: 2000000000, // 2000 STX
          creator: 'SP3...DEF',
          status: 0,
          difficulty: 'expert',
          deadline: Date.now() + 14 * 24 * 60 * 60 * 1000,
          submissions: 1,
          tags: ['clarity', 'optimization', 'smart-contract'],
        },
        {
          id: 3,
          title: 'Add Wallet Transaction History',
          description: 'Create a component to display user transaction history with filtering and pagination.',
          reward: 800000000, // 800 STX
          creator: 'SP1...GHI',
          status: 1,
          difficulty: 'intermediate',
          deadline: Date.now() + 10 * 24 * 60 * 60 * 1000,
          submissions: 5,
          tags: ['frontend', 'API', 'transactions'],
        },
      ]

      setBounties(mockBounties)
      setStats({
        totalBounties: mockBounties.length,
        totalPayout: mockBounties.reduce((acc, b) => acc + b.reward, 0),
        activeBounties: mockBounties.filter(b => b.status === 0).length,
        completedBounties: mockBounties.filter(b => b.status === 3).length,
      })
    } catch (error) {
      console.error('Failed to fetch bounties:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchBounties()
  }, [fetchBounties])

  const formatSTX = (microSTX) => {
    return (microSTX / 1_000_000).toLocaleString(undefined, { 
      minimumFractionDigits: 0, 
      maximumFractionDigits: 2 
    })
  }

  const formatTimeLeft = (deadline) => {
    const diff = deadline - Date.now()
    if (diff <= 0) return 'Expired'
    const days = Math.floor(diff / (24 * 60 * 60 * 1000))
    const hours = Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000))
    if (days > 0) return `${days}d ${hours}h left`
    return `${hours}h left`
  }

  const filteredBounties = bounties.filter(b => {
    if (filter === 'all') return true
    if (filter === 'open') return b.status === 0
    if (filter === 'review') return b.status === 1
    if (filter === 'completed') return b.status === 3
    return true
  })

  const handleCreateBounty = (e) => {
    e.preventDefault()
    // TODO: Implement contract call
    setShowCreateModal(false)
  }

  const handleSubmitWork = (e) => {
    e.preventDefault()
    // TODO: Implement contract call
    setShowSubmitModal(false)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Bounties</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Earn rewards by completing community tasks
          </p>
        </div>
        {isConnected && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary flex items-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Create Bounty</span>
          </button>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <p className="text-sm text-gray-500 dark:text-gray-400">Total Bounties</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalBounties}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <p className="text-sm text-gray-500 dark:text-gray-400">Total Payout</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatSTX(stats.totalPayout)} STX</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <p className="text-sm text-gray-500 dark:text-gray-400">Active</p>
          <p className="text-2xl font-bold text-green-600">{stats.activeBounties}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <p className="text-sm text-gray-500 dark:text-gray-400">Completed</p>
          <p className="text-2xl font-bold text-blue-600">{stats.completedBounties}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-8">
          {['all', 'my-bounties', 'my-submissions'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab
                  ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              {tab === 'all' && 'All Bounties'}
              {tab === 'my-bounties' && 'My Bounties'}
              {tab === 'my-submissions' && 'My Submissions'}
            </button>
          ))}
        </nav>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {['all', 'open', 'review', 'completed'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              filter === f
                ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Bounties List */}
      {loading ? (
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm animate-pulse">
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4" />
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2" />
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : filteredBounties.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No bounties found</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {isConnected ? 'Create the first bounty to get started.' : 'Connect wallet to create bounties.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredBounties.map((bounty) => (
            <div
              key={bounty.id}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${BountyStatus[bounty.status].color}`}>
                      {BountyStatus[bounty.status].label}
                    </span>
                    <span className={`flex items-center text-sm ${Difficulty[bounty.difficulty].color}`}>
                      <span className="mr-1">{Difficulty[bounty.difficulty].icon}</span>
                      {Difficulty[bounty.difficulty].label}
                    </span>
                  </div>
                  
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {bounty.title}
                  </h3>
                  
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">
                    {bounty.description}
                  </p>

                  <div className="flex flex-wrap gap-2 mb-3">
                    {bounty.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs text-gray-600 dark:text-gray-400"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                    <span className="flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {formatTimeLeft(bounty.deadline)}
                    </span>
                    <span className="flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      {bounty.submissions} submissions
                    </span>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-3">
                  <div className="text-right">
                    <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                      {formatSTX(bounty.reward)} STX
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Reward</p>
                  </div>
                  
                  {isConnected && bounty.status === 0 && (
                    <button
                      onClick={() => {
                        setSelectedBounty(bounty)
                        setShowSubmitModal(true)
                      }}
                      className="btn-primary text-sm"
                    >
                      Submit Work
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Bounty Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-lg w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Create Bounty</h2>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-500 hover:text-gray-700">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleCreateBounty} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Enter bounty title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                <textarea
                  required
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Describe the bounty requirements"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Reward (STX)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Difficulty</label>
                  <select className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                    <option value="expert">Expert</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Deadline</label>
                <input
                  type="date"
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowCreateModal(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Create Bounty
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Submit Work Modal */}
      {showSubmitModal && selectedBounty && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-lg w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Submit Work</h2>
              <button onClick={() => setShowSubmitModal(false)} className="text-gray-500 hover:text-gray-700">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <h3 className="font-medium text-gray-900 dark:text-white">{selectedBounty.title}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Reward: {formatSTX(selectedBounty.reward)} STX</p>
            </div>

            <form onSubmit={handleSubmitWork} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Submission Link (GitHub PR, etc.)
                </label>
                <input
                  type="url"
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="https://github.com/..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description of Work
                </label>
                <textarea
                  required
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Describe what you implemented and how it meets the requirements"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowSubmitModal(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Submit for Review
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
