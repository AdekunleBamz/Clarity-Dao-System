import { Link, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'

export default function NotFound() {
  const navigate = useNavigate()
  const [countdown, setCountdown] = useState(10)

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          navigate('/')
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [navigate])

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center">
        <div className="mb-8">
          <span className="text-8xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            404
          </span>
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          Page Not Found
        </h1>
        
        <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
          The page you're looking for doesn't exist or has been moved.
          You'll be redirected to the dashboard in {countdown} seconds.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/"
            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors"
          >
            Go to Dashboard
          </Link>
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Go Back
          </button>
        </div>

        <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
          {[
            { path: '/governance', label: 'Governance', icon: '🗳️' },
            { path: '/treasury', label: 'Treasury', icon: '💰' },
            { path: '/staking', label: 'Staking', icon: '⚡' },
            { path: '/bounty', label: 'Bounties', icon: '🎯' },
          ].map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow text-center"
            >
              <span className="text-2xl mb-2 block">{link.icon}</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {link.label}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
