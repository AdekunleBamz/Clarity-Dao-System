/**
 * Comprehensive Error Handler
 * Standardized error handling and user feedback
 */

class ErrorHandler {
  constructor() {
    this.errorMap = {
      // Network errors
      'NetworkError': { code: 'NETWORK_ERROR', message: 'Network connection failed. Check your internet.' },
      'TimeoutError': { code: 'TIMEOUT', message: 'Request timed out. Please try again.' },
      
      // Wallet errors 
      'NotConnected': { code: 'WALLET_NOT_CONNECTED', message: 'Please connect your wallet first.' },
      'UserRejected': { code: 'USER_REJECTED', message: 'Transaction was cancelled.' },
      'InsufficientBalance': { code: 'INSUFFICIENT_BALANCE', message: 'Insufficient balance for this transaction.' },
      
      // Smart contract errors
      'ContractCallFailed': { code: 'CONTRACT_CALL_FAILED', message: 'Contract function call failed. Check parameters.' },
      'InvalidAddress': { code: 'INVALID_ADDRESS', message: 'Invalid wallet address format.' },
      
      // Form errors
      'ValidationFailed': { code: 'VALIDATION_FAILED', message: 'Please check your input and try again.' }
    }
    
    this.listeners = []
  }

  /**
   * Register error listener
   */
  onError(callback) {
    this.listeners.push(callback)
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback)
    }
  }

  /**
   * Parse and handle error
   */
  handle(error, context = {}) {
    const parsed = this.parseError(error)
    
    const errorData = {
      ...parsed,
      context,
      timestamp: new Date().toISOString(),
      userMessage: this.getUserMessage(parsed.code)
    }

    // Notify listeners
    this.listeners.forEach(listener => listener(errorData))

    // Log to console in dev
    if (process.env.NODE_ENV === 'development') {
      console.error('[ErrorHandler]', errorData)
    }

    return errorData
  }

  /**
   * Parse error object
   */
  parseError(error) {
    if (typeof error === 'string') {
      return {
        code: 'UNKNOWN_ERROR',
        message: error,
        type: 'string'
      }
    }

    if (error instanceof Error) {
      const errorType = this.errorMap[error.name]
      if (errorType) {
        return errorType
      }

      return {
        code: 'ERROR_' + error.name.toUpperCase(),
        message: error.message,
        type: 'error',
        stack: error.stack
      }
    }

    if (error?.response?.data?.message) {
      return {
        code: error.response.status,
        message: error.response.data.message,
        type: 'api'
      }
    }

    return {
      code: 'UNKNOWN_ERROR',
      message: 'An unexpected error occurred',
      type: 'unknown'
    }
  }

  /**
   * Get user-friendly message
   */
  getUserMessage(code) {
    const messages = {
      'NETWORK_ERROR': 'Network connection failed',
      'TIMEOUT': 'Request timed out',
      'WALLET_NOT_CONNECTED': 'Wallet not connected',
      'USER_REJECTED': 'Transaction cancelled',
      'INSUFFICIENT_BALANCE': 'Insufficient balance',
      'CONTRACT_CALL_FAILED': 'Contract call failed',
      'INVALID_ADDRESS': 'Invalid address',
      'VALIDATION_FAILED': 'Validation failed',
    }

    return messages[code] || 'Something went wrong'
  }

  /**
   * Check if error is retryable
   */
  isRetryable(error) {
    const parsed = this.parseError(error)
    const retryableCodes = ['NETWORK_ERROR', 'TIMEOUT', 409, 429, 503]
    return retryableCodes.includes(parsed.code)
  }
}

export const errorHandler = new ErrorHandler()

/**
 * Error boundary hook
 */
export function useErrorHandler() {
  const [error, setError] = React.useState(null)

  React.useEffect(() => {
    const unsubscribe = errorHandler.onError((err) => {
      setError(err)
      setTimeout(() => setError(null), 5000)
    })

    return unsubscribe
  }, [])

  return { error, clearError: () => setError(null) }
}
