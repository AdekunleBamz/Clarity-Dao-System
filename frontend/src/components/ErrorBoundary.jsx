import { Component } from 'react'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      eventId: null
    }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo })
    
    // Generate unique error ID for support
    const eventId = `err_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 9)}`
    this.setState({ eventId })
    
    // Log error for debugging (could send to error tracking service)
    console.error('Error Boundary caught an error:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      eventId
    })
    
    // Could integrate with error tracking services like Sentry here
    // if (window.Sentry) {
    //   window.Sentry.captureException(error, { extra: errorInfo })
    // }
  }

  handleReload = () => {
    window.location.reload()
  }

  handleGoHome = () => {
    window.location.href = '/'
  }

  handleReportIssue = () => {
    const { error, eventId } = this.state
    const subject = encodeURIComponent(`[Bug Report] Application Error - ${eventId}`)
    const body = encodeURIComponent(`
Error ID: ${eventId}
Error: ${error?.message || 'Unknown error'}
URL: ${window.location.href}
Time: ${new Date().toISOString()}
User Agent: ${navigator.userAgent}

Please describe what you were doing when this error occurred:

    `.trim())
    
    window.open(
      `https://github.com/AdekunleBamz/Clarity-Dao-System/issues/new?title=${subject}&body=${body}`,
      '_blank'
    )
  }

  render() {
    const { hasError, error, errorInfo, eventId } = this.state
    const { fallback, children } = this.props

    if (hasError) {
      // Custom fallback UI if provided
      if (fallback) {
        return typeof fallback === 'function' 
          ? fallback({ error, errorInfo, eventId, reset: this.handleReload })
          : fallback
      }

      // Default error UI
      return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
          <div className="max-w-lg w-full">
            {/* Error Icon */}
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
            </div>

            {/* Error Content */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 text-center">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Something went wrong
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                We're sorry, but something unexpected happened. Our team has been notified.
              </p>

              {/* Error Details (collapsible) */}
              {process.env.NODE_ENV === 'development' && (
                <details className="mb-6 text-left">
                  <summary className="cursor-pointer text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 mb-2">
                    View Error Details
                  </summary>
                  <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 overflow-auto max-h-48">
                    <pre className="text-xs text-red-600 dark:text-red-400 whitespace-pre-wrap">
                      {error?.toString()}
                    </pre>
                    {errorInfo?.componentStack && (
                      <pre className="text-xs text-gray-500 dark:text-gray-400 mt-2 whitespace-pre-wrap">
                        {errorInfo.componentStack}
                      </pre>
                    )}
                  </div>
                </details>
              )}

              {/* Event ID for support */}
              {eventId && (
                <div className="bg-gray-50 dark:bg-gray-750 rounded-lg px-4 py-2 mb-6">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Error ID: <code className="font-mono text-gray-700 dark:text-gray-300">{eventId}</code>
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={this.handleReload}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2.5 rounded-lg transition-colors flex items-center justify-center space-x-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>Refresh Page</span>
                </button>
                
                <button
                  onClick={this.handleGoHome}
                  className="flex-1 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 font-medium px-4 py-2.5 rounded-lg transition-colors flex items-center justify-center space-x-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  <span>Go Home</span>
                </button>
              </div>

              {/* Report Issue Link */}
              <button
                onClick={this.handleReportIssue}
                className="mt-4 text-sm text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
              >
                Report this issue →
              </button>
            </div>

            {/* Additional Help */}
            <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
              If this problem persists, please contact support or check our{' '}
              <a 
                href="https://github.com/AdekunleBamz/Clarity-Dao-System/issues"
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                GitHub Issues
              </a>
            </p>
          </div>
        </div>
      )
    }

    return children
  }
}

export default ErrorBoundary
