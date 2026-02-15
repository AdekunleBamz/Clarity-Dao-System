import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useWallet } from '../context/WalletContext'
import { ThemeToggle } from '../context/ThemeContext'
import WalletConnectButton from './WalletConnectButton'

export default function Header() {
  const location = useLocation()
  const { isConnected, address, stxBalance } = useWallet()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navItems = [
    { path: '/', label: 'Dashboard' },
    { path: '/governance', label: 'Governance' },
    { path: '/treasury', label: 'Treasury' },
    { path: '/tokens', label: 'Tokens' },
    { path: '/staking', label: 'Staking' }
  ]

  return (
    <header className="bg-white dark:bg-gray-800 shadow-md" role="banner">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link to="/" className="flex items-center space-x-2" aria-label="Clarity DAO Home">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg" aria-hidden="true">C</span>
              </div>
              <span className="font-bold text-xl text-gray-900 dark:text-white">
                Clarity DAO
              </span>
            </Link>

            <nav className="hidden md:flex space-x-6" role="navigation" aria-label="Main navigation">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  aria-current={location.pathname === item.path ? 'page' : undefined}
                  className={`text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded px-2 py-1 ${
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

          <div className="flex items-center gap-4">
            {isConnected && stxBalance !== null && (
              <span className="hidden sm:inline-flex text-sm text-gray-600 dark:text-gray-300">
                {stxBalance.toFixed(2)} STX
              </span>
            )}
            
            <WalletConnectButton />

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-menu"
              aria-label="Toggle navigation menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile navigation */}
        {mobileMenuOpen && (
          <nav 
            id="mobile-menu" 
            className="md:hidden py-4 border-t border-gray-100 dark:border-gray-700"
            role="navigation"
            aria-label="Mobile navigation"
          >
            <div className="flex flex-col space-y-2">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  aria-current={location.pathname === item.path ? 'page' : undefined}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    location.pathname === item.path
                      ? 'bg-primary-50 dark:bg-primary-900 text-primary-600 dark:text-primary-400'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </nav>
        )}
      </div>
    </header>
  )
}
