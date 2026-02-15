import { useState, useEffect, useCallback } from 'react'
import { useWallet } from '../context/WalletContext'

export default function Governance() {
  const { isConnected, address, daoBalance, contracts } = useWallet()
  const [activeTab, setActiveTab] = useState('active')
  const [proposals, setProposals] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [userVotes, setUserVotes] = useState({})

  useEffect(() => {
    const fetchProposals = async () => {
      try {
        setLoading(true)
        // In production, fetch from contract
        setProposals([
          {
            id: 1,
            title: 'Treasury Allocation for Marketing',
            description: 'Allocate 5,000 STX from treasury for Q1 marketing initiatives including social media campaigns and community events.',
            proposer: 'SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7',
            votesFor: 850000,
            votesAgainst: 150000,
            status: 'active',
            endBlock: 189200,
            createdAt: Date.now() - 86400000 * 2,
            quorum: 1000000
          },
          {
            id: 2,
            title: 'Protocol Fee Adjustment',
            description: 'Reduce protocol fees from 2% to 1.5% to increase adoption and user participation.',
            proposer: 'SP3FGQ8Z7JY9BWYZ5WM53E0M9NK7WHJF0691NZ159',
            votesFor: 620000,
            votesAgainst: 380000,
            status: 'active',
            endBlock: 189500,
            createdAt: Date.now() - 86400000,
            quorum: 1000000
          },
          {
            id: 3,
            title: 'Community Fund Establishment',
            description: 'Create a community fund with 10,000 STX for ecosystem grants and developer incentives.',
            proposer: 'SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR',
            votesFor: 920000,
            votesAgainst: 80000,
            status: 'passed',
            endBlock: 184800,
            createdAt: Date.now() - 86400000 * 7,
            quorum: 1000000
          }
        ])
      } catch (err) {
        console.error('Failed to fetch proposals:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchProposals()
  }, [contracts])

  const filteredProposals = proposals.filter(p => 
    activeTab === 'all' ? true : p.status === activeTab
  )

  const handleVote = useCallback(async (proposalId, voteFor) => {
    if (!isConnected) return
    
    try {
      console.log(`Voting ${voteFor ? 'for' : 'against'} proposal ${proposalId}`)
      
      setUserVotes(prev => ({ ...prev, [proposalId]: voteFor ? 'for' : 'against' }))
      setProposals(prev => prev.map(p => {
        if (p.id === proposalId) {
          return {
            ...p,
            votesFor: voteFor ? p.votesFor + (daoBalance || 1000) : p.votesFor,
            votesAgainst: !voteFor ? p.votesAgainst + (daoBalance || 1000) : p.votesAgainst
          }
        }
        return p
      }))
      
      alert(`Vote registered: ${voteFor ? 'For' : 'Against'}\n\nNote: Full transaction signing available when wallet supports stx_signTransaction`)
    } catch (err) {
      console.error('Vote failed:', err)
    }
  }, [isConnected, daoBalance])

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Governance</h1>
        {[1, 2, 3].map(i => (
          <div key={i} className="card animate-pulse">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4" />
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-4" />
            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-full" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Governance</h1>
          {isConnected && daoBalance !== null && (
            <p className="text-sm text-gray-500 mt-1">
              Your voting power: <span className="font-medium text-primary-600">{daoBalance.toLocaleString()} DAO</span>
            </p>
          )}
        </div>
        {isConnected && (
          <button 
            onClick={() => setShowCreateModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Proposal
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card py-4">
          <p className="text-sm text-gray-500">Total Proposals</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{proposals.length}</p>
        </div>
        <div className="card py-4">
          <p className="text-sm text-gray-500">Active</p>
          <p className="text-2xl font-bold text-blue-600">{proposals.filter(p => p.status === 'active').length}</p>
        </div>
        <div className="card py-4">
          <p className="text-sm text-gray-500">Passed</p>
          <p className="text-2xl font-bold text-green-600">{proposals.filter(p => p.status === 'passed').length}</p>
        </div>
        <div className="card py-4">
          <p className="text-sm text-gray-500">Your Votes</p>
          <p className="text-2xl font-bold text-primary-600">{Object.keys(userVotes).length}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2" role="tablist">
        {['active', 'passed', 'rejected', 'all'].map((tab) => (
          <button
            key={tab}
            role="tab"
            aria-selected={activeTab === tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${
              activeTab === tab
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
            }`}
          >
            {tab}
            {tab !== 'all' && (
              <span className="ml-1 text-xs opacity-75">
                ({proposals.filter(p => p.status === tab).length})
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {filteredProposals.map((proposal) => (
          <ProposalCard 
            key={proposal.id} 
            proposal={proposal} 
            userVote={userVotes[proposal.id]}
            onVote={handleVote}
          />
        ))}
      </div>

      {filteredProposals.length === 0 && (
        <div className="card text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">No {activeTab} proposals found</p>
        </div>
      )}

      {showCreateModal && (
        <CreateProposalModal onClose={() => setShowCreateModal(false)} />
      )}
    </div>
  )
}

function ProposalCard({ proposal, userVote, onVote }) {
  const { isConnected } = useWallet()
  const [voting, setVoting] = useState(false)
  
  const totalVotes = proposal.votesFor + proposal.votesAgainst
  const forPercentage = totalVotes > 0 ? (proposal.votesFor / totalVotes) * 100 : 0
  const quorumReached = totalVotes >= proposal.quorum
  
  const statusConfig = {
    active: { bg: 'bg-blue-100 dark:bg-blue-900', text: 'text-blue-700 dark:text-blue-300' },
    passed: { bg: 'bg-green-100 dark:bg-green-900', text: 'text-green-700 dark:text-green-300' },
    rejected: { bg: 'bg-red-100 dark:bg-red-900', text: 'text-red-700 dark:text-red-300' }
  }

  const handleVote = async (voteFor) => {
    setVoting(true)
    await onVote(proposal.id, voteFor)
    setVoting(false)
  }

  const config = statusConfig[proposal.status]

  return (
    <article className="card">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="text-sm text-gray-500 font-mono">#{proposal.id}</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${config.bg} ${config.text}`}>
              {proposal.status}
            </span>
            {quorumReached && proposal.status === 'active' && (
              <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded-full text-xs font-medium">
                Quorum Reached
              </span>
            )}
            {userVote && (
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                userVote === 'for' 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-red-100 text-red-700'
              }`}>
                Voted {userVote}
              </span>
            )}
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {proposal.title}
          </h3>
        </div>
      </div>

      <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
        {proposal.description}
      </p>

      <div className="flex items-center gap-2 mb-4 text-sm text-gray-500">
        <span>Proposed by:</span>
        <code className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs">
          {proposal.proposer.slice(0, 8)}...{proposal.proposer.slice(-4)}
        </code>
      </div>

      <div className="mb-4">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-green-600 font-medium">For: {(proposal.votesFor / 1000).toFixed(0)}K ({forPercentage.toFixed(1)}%)</span>
          <span className="text-red-600 font-medium">Against: {(proposal.votesAgainst / 1000).toFixed(0)}K ({(100 - forPercentage).toFixed(1)}%)</span>
        </div>
        
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
          <div className="h-full flex">
            <div className="bg-green-500 h-full transition-all" style={{ width: `${forPercentage}%` }} />
            <div className="bg-red-500 h-full transition-all" style={{ width: `${100 - forPercentage}%` }} />
          </div>
        </div>
        
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>Total: {(totalVotes / 1000).toFixed(0)}K votes</span>
          <span>Quorum: {(proposal.quorum / 1000).toFixed(0)}K needed</span>
        </div>
      </div>

      {isConnected && proposal.status === 'active' && !userVote && (
        <div className="flex gap-3">
          <button 
            onClick={() => handleVote(true)}
            disabled={voting}
            className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white py-2.5 rounded-lg text-sm font-medium transition-colors"
          >
            {voting ? 'Voting...' : 'Vote For'}
          </button>
          <button 
            onClick={() => handleVote(false)}
            disabled={voting}
            className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white py-2.5 rounded-lg text-sm font-medium transition-colors"
          >
            {voting ? 'Voting...' : 'Vote Against'}
          </button>
        </div>
      )}

      {!isConnected && proposal.status === 'active' && (
        <p className="text-center text-sm text-gray-500 py-2">Connect wallet to vote</p>
      )}
    </article>
  )
}

function CreateProposalModal({ onClose }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!title.trim() || !description.trim()) return

    setSubmitting(true)
    try {
      console.log('Creating proposal:', { title, description })
      alert('Proposal creation will be available when transaction signing is implemented')
      onClose()
    } catch (err) {
      console.error('Failed to create proposal:', err)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-lg w-full" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Create Proposal</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter proposal title"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              maxLength={100}
              required
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your proposal in detail..."
              rows={5}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
              maxLength={1000}
              required
            />
            <p className="text-xs text-gray-500 mt-1">{description.length}/1000 characters</p>
          </div>

          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 text-sm">
            <p className="text-amber-800 dark:text-amber-200">
              <strong>Note:</strong> Creating a proposal requires at least 10,000 DAO tokens.
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 btn-secondary">Cancel</button>
            <button type="submit" disabled={submitting || !title.trim() || !description.trim()} className="flex-1 btn-primary disabled:opacity-50">
              {submitting ? 'Creating...' : 'Create Proposal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
