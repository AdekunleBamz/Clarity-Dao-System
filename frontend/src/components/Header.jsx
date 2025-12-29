import { Link, useLocation } from 'react-router-dom'
import { useWallet } from '../context/WalletContext'
import WalletConnectButton from './WalletConnectButton'

export default function Header() {
  const location = useLocation()
  const { isConnected, address } = useWallet()

  const navItems = [
    { path: '/', label: 'Dashboard' },
    { path: '/governance', label: 'Governance' },
    { path: '/treasury', label: 'Treasury' },
    { path: '/tokens', label: 'Tokens' }
  ]

  return (
    <header className="bg-white dark:bg-gray-800 shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">C</span>
              </div>
              <span className="font-bold text-xl text-gray-900 dark:text-white">
                Clarity DAO
              </span>
            </Link>

            <nav className="hidden md:flex space-x-6">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`text-sm font-medium transition-colors ${
                    location.pathname === item.path
                      ? 'text-primary-600 dark:text-primary-400'
                      : 'text-gray-600 dark:text-gray-300 hover:text-primary-600'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          <WalletConnectButton />
        </div>
      </div>
    </header>
  )
}
