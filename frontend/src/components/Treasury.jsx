import { useState } from 'react'
import { useWallet } from '../context/WalletContext'

export default function Treasury() {
  const { isConnected, deployer } = useWallet()
  const [showDepositModal, setShowDepositModal] = useState(false)

  const treasuryData = {
    balance: 50000,
    totalDeposits: 75000,
    totalWithdrawals: 25000,
    pendingProposals: 3
  }

  const recentTransactions = [
    { type: 'deposit', amount: 1000, from: 'SP2J6ZY48GV1...', time: '2 hours ago' },
    { type: 'withdrawal', amount: 500, to: 'Marketing Fund', time: '1 day ago' },
    { type: 'deposit', amount: 2500, from: 'SP3FGQ8Z7JY...', time: '2 days ago' },
    { type: 'deposit', amount: 750, from: 'SP2C2YFP12A...', time: '3 days ago' }
  ]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Treasury
        </h1>
        {isConnected && (
          <button 
            onClick={() => setShowDepositModal(true)}
            className="btn-primary"
          >
            Deposit STX
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card">
          <p className="text-sm text-gray-500 dark:text-gray-400">Balance</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {treasuryData.balance.toLocaleString()} <span className="text-sm font-normal">STX</span>
          </p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500 dark:text-gray-400">Total Deposits</p>
          <p className="text-2xl font-bold text-green-600">
            +{treasuryData.totalDeposits.toLocaleString()} <span className="text-sm font-normal">STX</span>
          </p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500 dark:text-gray-400">Total Withdrawals</p>
          <p className="text-2xl font-bold text-red-600">
            -{treasuryData.totalWithdrawals.toLocaleString()} <span className="text-sm font-normal">STX</span>
          </p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500 dark:text-gray-400">Pending Proposals</p>
          <p className="text-2xl font-bold text-primary-600">
            {treasuryData.pendingProposals}
          </p>
        </div>
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Recent Transactions
        </h2>
        <div className="space-y-3">
          {recentTransactions.map((tx, index) => (
            <div 
              key={index}
              className="flex justify-between items-center py-3 border-b border-gray-100 dark:border-gray-700 last:border-0"
            >
              <div className="flex items-center space-x-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  tx.type === 'deposit' 
                    ? 'bg-green-100 text-green-600' 
                    : 'bg-red-100 text-red-600'
                }`}>
                  {tx.type === 'deposit' ? '↓' : '↑'}
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white capitalize">
                    {tx.type}
                  </p>
                  <p className="text-sm text-gray-500">
                    {tx.from || tx.to}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className={`font-medium ${
                  tx.type === 'deposit' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {tx.type === 'deposit' ? '+' : '-'}{tx.amount.toLocaleString()} STX
                </p>
                <p className="text-sm text-gray-500">{tx.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Treasury Contract
        </h2>
        <code className="text-sm text-gray-600 dark:text-gray-300 font-mono">
          {deployer}.treasury
        </code>
      </div>

      {showDepositModal && (
        <DepositModal onClose={() => setShowDepositModal(false)} />
      )}
    </div>
  )
}

function DepositModal({ onClose }) {
  const [amount, setAmount] = useState('')

  const handleDeposit = () => {
    console.log('Depositing:', amount)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Deposit to Treasury
        </h3>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Amount (STX)
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>

        <div className="flex space-x-3">
          <button onClick={onClose} className="flex-1 btn-secondary">
            Cancel
          </button>
          <button onClick={handleDeposit} className="flex-1 btn-primary">
            Deposit
          </button>
        </div>
      </div>
    </div>
  )
}
