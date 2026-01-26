import { createContext, useContext, useState, useCallback, useEffect } from 'react'

const ToastContext = createContext(null)

// Toast types and their styles
const TOAST_TYPES = {
  success: {
    icon: (
      <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    ),
    className: 'border-green-500 bg-green-50 dark:bg-green-900/20'
  },
  error: {
    icon: (
      <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    ),
    className: 'border-red-500 bg-red-50 dark:bg-red-900/20'
  },
  warning: {
    icon: (
      <svg className="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
    className: 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20'
  },
  info: {
    icon: (
      <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    className: 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
  },
  loading: {
    icon: (
      <svg className="w-5 h-5 text-indigo-500 animate-spin" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
    ),
    className: 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
  }
}

// Toast positions
const POSITIONS = {
  'top-right': 'top-4 right-4',
  'top-left': 'top-4 left-4',
  'top-center': 'top-4 left-1/2 -translate-x-1/2',
  'bottom-right': 'bottom-4 right-4',
  'bottom-left': 'bottom-4 left-4',
  'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2'
}

// Individual Toast Component
function Toast({ id, type, title, message, duration, onDismiss, action }) {
  const [isVisible, setIsVisible] = useState(false)
  const [isLeaving, setIsLeaving] = useState(false)
  const config = TOAST_TYPES[type] || TOAST_TYPES.info

  useEffect(() => {
    // Animate in
    const timer = setTimeout(() => setIsVisible(true), 10)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (duration && duration !== Infinity) {
      const timer = setTimeout(() => {
        handleDismiss()
      }, duration)
      return () => clearTimeout(timer)
    }
  }, [duration])

  const handleDismiss = useCallback(() => {
    setIsLeaving(true)
    setTimeout(() => onDismiss(id), 200)
  }, [id, onDismiss])

  return (
    <div
      role="alert"
      aria-live="polite"
      className={`
        flex items-start space-x-3 p-4 rounded-lg border-l-4 shadow-lg backdrop-blur-sm
        transform transition-all duration-200 ease-out max-w-sm
        ${config.className}
        ${isVisible && !isLeaving ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
      `}
    >
      {/* Icon */}
      <div className="flex-shrink-0 mt-0.5">
        {config.icon}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {title && (
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            {title}
          </p>
        )}
        {message && (
          <p className={`text-sm text-gray-600 dark:text-gray-300 ${title ? 'mt-1' : ''}`}>
            {message}
          </p>
        )}
        {action && (
          <button
            onClick={() => {
              action.onClick()
              handleDismiss()
            }}
            className="mt-2 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500"
          >
            {action.label}
          </button>
        )}
      </div>

      {/* Dismiss button */}
      {type !== 'loading' && (
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          aria-label="Dismiss notification"
        >
          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  )
}

// Toast Container
function ToastContainer({ toasts, position, onDismiss }) {
  const positionClass = POSITIONS[position] || POSITIONS['top-right']

  return (
    <div
      className={`fixed z-[100] flex flex-col space-y-2 ${positionClass}`}
      aria-label="Notifications"
    >
      {toasts.map((toast) => (
        <Toast key={toast.id} {...toast} onDismiss={onDismiss} />
      ))}
    </div>
  )
}

// Toast Provider
export function ToastProvider({ children, position = 'top-right', maxToasts = 5 }) {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback((options) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const toast = {
      id,
      type: 'info',
      duration: 5000,
      ...options
    }

    setToasts((prev) => {
      const newToasts = [...prev, toast]
      // Limit max toasts
      if (newToasts.length > maxToasts) {
        return newToasts.slice(-maxToasts)
      }
      return newToasts
    })

    return id
  }, [maxToasts])

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const dismissAll = useCallback(() => {
    setToasts([])
  }, [])

  // Update existing toast (useful for loading -> success/error)
  const updateToast = useCallback((id, options) => {
    setToasts((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, ...options } : t
      )
    )
  }, [])

  // Convenience methods
  const toast = useCallback((message, options = {}) => {
    return addToast({ message, ...options })
  }, [addToast])

  toast.success = (message, options = {}) => addToast({ type: 'success', message, ...options })
  toast.error = (message, options = {}) => addToast({ type: 'error', message, duration: 8000, ...options })
  toast.warning = (message, options = {}) => addToast({ type: 'warning', message, ...options })
  toast.info = (message, options = {}) => addToast({ type: 'info', message, ...options })
  toast.loading = (message, options = {}) => addToast({ type: 'loading', message, duration: Infinity, ...options })
  toast.dismiss = dismissToast
  toast.dismissAll = dismissAll
  toast.update = updateToast

  // Promise helper
  toast.promise = async (promise, { loading, success, error }) => {
    const id = toast.loading(loading)
    try {
      const result = await promise
      updateToast(id, { type: 'success', message: success, duration: 5000 })
      return result
    } catch (err) {
      updateToast(id, { type: 'error', message: error || err.message, duration: 8000 })
      throw err
    }
  }

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <ToastContainer toasts={toasts} position={position} onDismiss={dismissToast} />
    </ToastContext.Provider>
  )
}

// Hook to use toast
export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

export default { ToastProvider, useToast }
