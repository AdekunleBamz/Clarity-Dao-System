/**
 * Reusable Loading Skeleton Components
 * Provides consistent loading states across the app
 */

// Base skeleton with shimmer animation
export function Skeleton({ className = '', animate = true, ...props }) {
  const animationClass = animate ? 'animate-pulse' : ''
  return (
    <div
      className={`${animationClass} bg-gray-200 dark:bg-gray-700 rounded ${className}`}
      {...props}
    />
  )
}

// Button skeleton
export function SkeletonButton({ size = 'md', className = '' }) {
  const sizes = {
    sm: 'h-8 w-16',
    md: 'h-10 w-24',
    lg: 'h-12 w-32',
    xl: 'h-14 w-40'
  }
  return <Skeleton className={`rounded-lg ${sizes[size]} ${className}`} />
}

// Heading skeleton
export function SkeletonHeading({ size = 'md', className = '' }) {
  const sizes = {
    sm: 'h-5 w-32',
    md: 'h-7 w-48',
    lg: 'h-9 w-64',
    xl: 'h-11 w-80'
  }
  return <Skeleton className={`rounded ${sizes[size]} ${className}`} />
}

// Input field skeleton
export function SkeletonInput({ className = '' }) {
  return <Skeleton className={`h-10 w-full rounded-lg ${className}`} />
}

// Text skeleton with varying widths
export function SkeletonText({ lines = 1, className = '' }) {
  const widths = ['w-full', 'w-11/12', 'w-4/5', 'w-3/4', 'w-2/3']
  
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={`h-4 ${widths[i % widths.length]}`}
        />
      ))}
    </div>
  )
}

// Circle skeleton for avatars
export function SkeletonCircle({ size = 'md', className = '' }) {
  const sizes = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24'
  }

  return (
    <Skeleton className={`rounded-full ${sizes[size]} ${className}`} />
  )
}

// Card skeleton for dashboard cards
export function SkeletonCard({ className = '' }) {
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-4 w-24" />
        <SkeletonCircle size="sm" />
      </div>
      <Skeleton className="h-8 w-32 mb-2" />
      <Skeleton className="h-4 w-20" />
    </div>
  )
}

// Stats grid skeleton
export function SkeletonStats({ count = 4 }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  )
}

// Table skeleton
export function SkeletonTable({ rows = 5, columns = 4 }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="flex space-x-4">
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton key={i} className="h-4 flex-1" />
          ))}
        </div>
      </div>
      
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div
          key={rowIndex}
          className="border-b border-gray-100 dark:border-gray-700/50 p-4 last:border-0"
        >
          <div className="flex space-x-4">
            {Array.from({ length: columns }).map((_, colIndex) => (
              <Skeleton
                key={colIndex}
                className={`h-4 flex-1 ${colIndex === 0 ? 'max-w-[200px]' : ''}`}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

// Proposal card skeleton
export function SkeletonProposal() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <Skeleton className="h-5 w-3/4 mb-2" />
          <SkeletonText lines={2} className="mb-4" />
        </div>
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
      
      {/* Progress bar */}
      <Skeleton className="h-2 w-full rounded-full mb-4" />
      
      {/* Vote buttons */}
      <div className="flex space-x-3">
        <Skeleton className="h-10 flex-1 rounded-lg" />
        <Skeleton className="h-10 flex-1 rounded-lg" />
      </div>
    </div>
  )
}

// Transaction row skeleton
export function SkeletonTransaction() {
  return (
    <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700/50 last:border-0">
      <div className="flex items-center space-x-3">
        <SkeletonCircle size="sm" />
        <div>
          <Skeleton className="h-4 w-24 mb-1" />
          <Skeleton className="h-3 w-32" />
        </div>
      </div>
      <div className="text-right">
        <Skeleton className="h-4 w-20 mb-1" />
        <Skeleton className="h-3 w-16" />
      </div>
    </div>
  )
}

// Full page loading
export function SkeletonPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-32 rounded-lg" />
      </div>
      
      {/* Stats */}
      <SkeletonStats count={4} />
      
      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <Skeleton className="h-6 w-32" />
          <SkeletonProposal />
          <SkeletonProposal />
        </div>
        <div>
          <Skeleton className="h-6 w-32 mb-4" />
          <SkeletonTable rows={5} columns={3} />
        </div>
      </div>
    </div>
  )
}

// Inline loading spinner
export function LoadingSpinner({ size = 'md', className = '' }) {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  }

  return (
    <svg
      className={`animate-spin ${sizes[size]} ${className}`}
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  )
}

// Button loading state
export function LoadingButton({ loading, children, className = '', ...props }) {
  return (
    <button
      disabled={loading}
      className={`relative ${className} ${loading ? 'cursor-not-allowed opacity-75' : ''}`}
      {...props}
    >
      {loading && (
        <span className="absolute inset-0 flex items-center justify-center">
          <LoadingSpinner size="sm" />
        </span>
      )}
      <span className={loading ? 'invisible' : ''}>{children}</span>
    </button>
  )
}

export default {
  Skeleton,
  SkeletonText,
  SkeletonCircle,
  SkeletonCard,
  SkeletonStats,
  SkeletonTable,
  SkeletonProposal,
  SkeletonTransaction,
  SkeletonPage,
  LoadingSpinner,
  LoadingButton
}
