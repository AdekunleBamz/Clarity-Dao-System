import { useState } from 'react'
import { useWallet } from '../context/WalletContext'

export default function Governance() {
  const { isConnected, address, deployer } = useWallet()
  const [activeTab, setActiveTab] = useState('active')

  const proposals = [
    {
      id: 1,
      title: 'Treasury Allocation for Marketing',
      description: 'Allocate 5,000 STX from treasury for Q1 marketing initiatives',
      proposer: 'SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7',
      votesFor: 850000,
      votesAgainst: 150000,
      status: 'active',
      endBlock: 145200
    },
    {
      id: 2,
      title: 'Protocol Fee Adjustment',
      description: 'Reduce protocol fees from 2% to 1.5% to increase adoption',
      proposer: 'SP3FGQ8Z7JY9BWYZ5WM53E0M9NK7WHJF0691NZ159',
      votesFor: 620000,
      votesAgainst: 380000,
      status: 'active',
      endBlock: 145500
    },
    {
      id: 3,
      title: 'Community Fund Establishment',
      description: 'Create a community fund with 10,000 STX for ecosystem grants',
      proposer: 'SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR',
      votesFor: 920000,
      votesAgainst: 80000,
      status: 'passed',
      endBlock: 144800
    }
  ]

  const filteredProposals = proposals.filter(p => 
    activeTab === 'all' ? true : p.status === activeTab
  )

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Governance
        </h1>
        {isConnected && (
          <button className="btn-primary">
            Create Proposal
          </button>
        )}
      </div>

      <div className="flex space-x-2">
        {['active', 'passed', 'rejected', 'all'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${
              activeTab === tab
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {filteredProposals.map((proposal) => (
          <ProposalCard key={proposal.id} proposal={proposal} />
        ))}
      </div>

      {filteredProposals.length === 0 && (
        <div className="card text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">
            No proposals found
          </p>
        </div>
      )}
    </div>
  )
}

function ProposalCard({ proposal }) {
  const { isConnected } = useWallet()
  const totalVotes = proposal.votesFor + proposal.votesAgainst
  const forPercentage = totalVotes > 0 ? (proposal.votesFor / totalVotes) * 100 : 0

  const statusColors = {
    active: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    passed: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
    rejected: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
  }

  return (
    <div className="card">
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <span className="text-sm text-gray-500">#{proposal.id}</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${statusColors[proposal.status]}`}>
              {proposal.status}
            </span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {proposal.title}
          </h3>
        </div>
      </div>

      <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
        {proposal.description}
      </p>

      <div className="mb-4">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-green-600">For: {(proposal.votesFor / 1000).toFixed(0)}K</span>
          <span className="text-red-600">Against: {(proposal.votesAgainst / 1000).toFixed(0)}K</span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            className="bg-green-500 h-2 rounded-full"
            style={{ width: `${forPercentage}%` }}
          />
        </div>
      </div>

      {isConnected && proposal.status === 'active' && (
        <div className="flex space-x-2">
          <button className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg text-sm font-medium">
            Vote For
          </button>
          <button className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg text-sm font-medium">
            Vote Against
          </button>
        </div>
      )}
    </div>
  )
}
