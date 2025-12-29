import { useWallet } from '../context/WalletContext'
import { Link } from 'react-router-dom'

export default function Dashboard() {
  const { isConnected, address } = useWallet()

  const stats = [
    { label: 'Total Supply', value: '1,000,000,000', unit: 'DAO' },
    { label: 'Active Proposals', value: '12', unit: '' },
    { label: 'Treasury Balance', value: '50,000', unit: 'STX' },
    { label: 'Total Members', value: '1,247', unit: '' }
  ]

  return (
    <div className="space-y-8">
      <div className="text-center py-12">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          Clarity DAO System
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          A decentralized autonomous organization built on Stacks blockchain
          with transparent governance and community-driven treasury management.
        </p>
      </div>

      {!isConnected && (
        <div className="card text-center py-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Connect Your Wallet
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Connect your Stacks wallet to participate in governance
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="card">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
              {stat.label}
            </p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {stat.value}
              {stat.unit && (
                <span className="text-sm font-normal text-gray-500 ml-1">
                  {stat.unit}
                </span>
              )}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link to="/governance" className="card hover:shadow-xl transition-shadow">
          <div className="text-primary-600 mb-4">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Governance
          </h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Create proposals and vote on community decisions
          </p>
        </Link>

        <Link to="/treasury" className="card hover:shadow-xl transition-shadow">
          <div className="text-green-600 mb-4">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Treasury
          </h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            View treasury balance and manage funds
          </p>
        </Link>

        <Link to="/tokens" className="card hover:shadow-xl transition-shadow">
          <div className="text-purple-600 mb-4">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            DAO Tokens
          </h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Manage your DAO tokens and voting power
          </p>
        </Link>
      </div>

      <div className="card bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border-indigo-200 dark:border-indigo-800">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Why Clarity DAO?
        </h3>
        <div className="space-y-4 text-sm">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-indigo-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-indigo-600 dark:text-indigo-400">🔐</span>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white">Secure & Transparent</h4>
              <p className="text-gray-500 dark:text-gray-400">Built on Stacks, secured by Bitcoin's proof-of-work</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-purple-600 dark:text-purple-400">⚡</span>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white">Community Driven</h4>
              <p className="text-gray-500 dark:text-gray-400">Every token holder has a voice in governance decisions</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-green-600 dark:text-green-400">💎</span>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white">Decentralized Treasury</h4>
              <p className="text-gray-500 dark:text-gray-400">Funds are managed collectively through smart contracts</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
