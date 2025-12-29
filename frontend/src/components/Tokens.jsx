import { useWallet } from '../context/WalletContext'

export default function Tokens() {
  const { isConnected, address, deployer } = useWallet()

  const tokenInfo = {
    name: 'DAO Token',
    symbol: 'DAO',
    decimals: 6,
    totalSupply: '1,000,000,000',
    userBalance: isConnected ? '50,000' : '0',
    votingPower: isConnected ? '50,000' : '0'
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
        DAO Tokens
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Token Information
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
              <span className="text-gray-500">Name</span>
              <span className="font-medium text-gray-900 dark:text-white">{tokenInfo.name}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
              <span className="text-gray-500">Symbol</span>
              <span className="font-medium text-gray-900 dark:text-white">{tokenInfo.symbol}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
              <span className="text-gray-500">Decimals</span>
              <span className="font-medium text-gray-900 dark:text-white">{tokenInfo.decimals}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-500">Total Supply</span>
              <span className="font-medium text-gray-900 dark:text-white">{tokenInfo.totalSupply}</span>
            </div>
          </div>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Your Balance
          </h2>
          {isConnected ? (
            <div className="space-y-4">
              <div className="text-center py-4">
                <p className="text-4xl font-bold text-gray-900 dark:text-white">
                  {tokenInfo.userBalance}
                </p>
                <p className="text-gray-500">{tokenInfo.symbol}</p>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-gray-500">Voting Power</span>
                  <span className="text-sm font-medium text-primary-600">
                    {tokenInfo.votingPower} votes
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                  <div className="bg-primary-600 h-2 rounded-full" style={{ width: '5%' }} />
                </div>
                <p className="text-xs text-gray-400 mt-1">0.005% of total supply</p>
              </div>

              <div className="flex space-x-3">
                <button className="flex-1 btn-primary">
                  Register Voting Power
                </button>
                <button className="flex-1 btn-secondary">
                  Transfer
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                Connect your wallet to view your balance
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Token Contract
        </h2>
        <div className="space-y-2">
          <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
            <span className="text-gray-500">Contract</span>
            <code className="text-sm font-mono text-gray-900 dark:text-white">
              {deployer}.dao-token
            </code>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-gray-500">Standard</span>
            <span className="text-gray-900 dark:text-white">SIP-010 Fungible Token</span>
          </div>
        </div>
      </div>
    </div>
  )
}
