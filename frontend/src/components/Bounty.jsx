import { useState, useContext } from 'react'
import { WalletContext } from '../context/WalletContext'

const BOUNTY_STATUS = {
  open: { label: 'Open', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' },
  inProgress: { label: 'In Progress', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' },
  review: { label: 'In Review', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' },
  completed: { label: 'Completed', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' },
  disputed: { label: 'Disputed', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' },
}

const SAMPLE_BOUNTIES = [
  {
    id: 1,
    title: 'Implement Dark Mode Toggle',
    description: 'Add a dark mode toggle button to the header that persists user preference in localStorage.',
    reward: 500,
    status: 'open',
    category: 'Frontend',
    deadline: '2026-02-15',
    submissions: 0,
    creator: 'SP3FK...G6N',
  },
  {
    id: 2,
    title: 'Smart Contract Security Audit',
    description: 'Perform a comprehensive security audit of the treasury-v5-1 contract and document findings.',
    reward: 2000,
    status: 'inProgress',
    category: 'Security',
    deadline: '2026-02-28',
    submissions: 2,
    creator: 'SP2AB...X4R',
    assignee: 'SP1CD...K2M',
  },
  {
    id: 3,
    title: 'API Documentation',
    description: 'Create comprehensive API documentation for all contract functions using OpenAPI spec.',
    reward: 800,
    status: 'review',
    category: 'Documentation',
    deadline: '2026-01-30',
    submissions: 1,
    creator: 'SP3FK...G6N',
  },
  {
    id: 4,
    title: 'Mobile Responsive Design',
    description: 'Ensure all pages are fully responsive on mobile devices with proper touch interactions.',
    reward: 1200,
    status: 'completed',
    category: 'Frontend',
    deadline: '2026-01-20',
    submissions: 3,
    creator: 'SP2EF...H8N',
    winner: 'SP4GH...J5P',
  },
]

export default function Bounty() {
  const { address, isConnected } = useContext(WalletContext)
  const [bounties, setBounties] = useState(SAMPLE_BOUNTIES)
  const [filter, setFilter] = useState('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedBounty, setSelectedBounty] = useState(null)

  const filteredBounties = bounties.filter(b => 
    filter === 'all' || b.status === filter
  )

  const stats = {
    totalBounties: bounties.length,
    openBounties: bounties.filter(b => b.status === 'open').length,
    totalRewards: bounties.reduce((sum, b) => sum + b.reward, 0),
    completedThisMonth: bounties.filter(b => b.status === 'completed').length,
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Bounties
        </h1>
        {isConnected && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors"
          >
            Create Bounty
          </button>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">Total Bounties</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalBounties}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">Open Bounties</p>
          <p className="text-2xl font-bold text-green-600">{stats.openBounties}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">Total Rewards</p>
          <p className="text-2xl font-bold text-purple-600">{stats.totalRewards.toLocaleString()} DAO</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">Completed</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.completedThisMonth}</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {['all', 'open', 'inProgress', 'review', 'completed', 'disputed'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
              filter === status
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            {status === 'all' ? 'All' : BOUNTY_STATUS[status]?.label || status}
          </button>
        ))}
      </div>

      {/* Bounties List */}
      <div className="space-y-4">
        {filteredBounties.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
            <p className="text-gray-500 dark:text-gray-400">No bounties found</p>
          </div>
        ) : (
          filteredBounties.map((bounty) => (
            <div
              key={bounty.id}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => setSelectedBounty(bounty)}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${BOUNTY_STATUS[bounty.status].color}`}>
                      {BOUNTY_STATUS[bounty.status].label}
                    </span>
                    <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-xs font-medium text-gray-700 dark:text-gray-300">
                      {bounty.category}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {bounty.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2">
                    {bounty.description}
                  </p>
                  <div className="flex items-center gap-4 mt-4 text-sm text-gray-500 dark:text-gray-400">
                    <span>Deadline: {new Date(bounty.deadline).toLocaleDateString()}</span>
                    <span>•</span>
                    <span>{bounty.submissions} submissions</span>
                    <span>•</span>
                    <span>By: {bounty.creator}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {bounty.reward.toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">DAO</p>
                </div>
              </div>

              {bounty.status === 'open' && isConnected && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      console.log('Claiming bounty:', bounty.id)
                    }}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors"
                  >
                    Claim Bounty
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Create Bounty Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Create New Bounty
            </h2>
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Bounty title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Describe the task in detail"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Reward (DAO)
                  </label>
                  <input
                    type="number"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="1000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Deadline
                  </label>
                  <input
                    type="date"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Category
                </label>
                <select className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                  <option>Frontend</option>
                  <option>Backend</option>
                  <option>Smart Contract</option>
                  <option>Security</option>
                  <option>Documentation</option>
                  <option>Design</option>
                  <option>Other</option>
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors"
                >
                  Create Bounty
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
