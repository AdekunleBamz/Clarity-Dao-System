import { Link, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'

export default function NotFound() {
  const navigate = useNavigate()
  const [countdown, setCountdown] = useState(10)

  // Auto redirect after countdown
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
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="text-center max-w-lg">
        {/* Animated 404 */}
        <div className="relative mb-8">
          <h1 className="text-[150px] font-bold text-gray-200 dark:text-gray-800 select-none">
            404
          </h1>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-6xl animate-bounce">🔍</span>
          </div>
        </div>

        {/* Message */}
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Page Not Found
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Oops! The page you're looking for doesn't exist or has been moved. 
          Maybe try one of the links below?
        </p>

        {/* Quick Links */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          <Link
            to="/"
            className="flex flex-col items-center p-4 bg-white dark:bg-gray-800 rounded-xl hover:shadow-md transition-shadow"
          >
            <span className="text-2xl mb-2">🏠</span>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Dashboard</span>
          </Link>
          <Link
            to="/governance"
            className="flex flex-col items-center p-4 bg-white dark:bg-gray-800 rounded-xl hover:shadow-md transition-shadow"
          >
            <span className="text-2xl mb-2">🗳️</span>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Governance</span>
          </Link>
          <Link
            to="/treasury"
            className="flex flex-col items-center p-4 bg-white dark:bg-gray-800 rounded-xl hover:shadow-md transition-shadow"
          >
            <span className="text-2xl mb-2">💰</span>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Treasury</span>
          </Link>
          <Link
            to="/tokens"
            className="flex flex-col items-center p-4 bg-white dark:bg-gray-800 rounded-xl hover:shadow-md transition-shadow"
          >
            <span className="text-2xl mb-2">🪙</span>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Tokens</span>
          </Link>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row justify-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex items-center justify-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>Go Back</span>
          </button>
          <Link
            to="/"
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span>Home</span>
          </Link>
        </div>

        {/* Auto redirect notice */}
        <p className="mt-8 text-sm text-gray-500 dark:text-gray-400">
          Redirecting to home in{' '}
          <span className="font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
            {countdown}s
          </span>
        </p>
      </div>
    </div>
  )
}
