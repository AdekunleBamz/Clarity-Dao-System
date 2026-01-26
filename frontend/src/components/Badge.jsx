const VARIANTS = {
  default: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
  primary: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  success: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  danger: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  info: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
}

const SIZES = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-sm',
  lg: 'px-3 py-1.5 text-base',
}

export default function Badge({
  children,
  variant = 'default',
  size = 'md',
  rounded = 'full',
  dot = false,
  removable = false,
  onRemove,
  className = '',
}) {
  const roundedClasses = {
    full: 'rounded-full',
    lg: 'rounded-lg',
    md: 'rounded-md',
    none: 'rounded-none',
  }

  const dotColors = {
    default: 'bg-gray-500',
    primary: 'bg-purple-500',
    success: 'bg-green-500',
    warning: 'bg-yellow-500',
    danger: 'bg-red-500',
    info: 'bg-blue-500',
  }

  return (
    <span
      className={`inline-flex items-center font-medium ${VARIANTS[variant]} ${SIZES[size]} ${roundedClasses[rounded]} ${className}`}
    >
      {dot && (
        <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${dotColors[variant]}`} />
      )}
      {children}
      {removable && (
        <button
          type="button"
          onClick={onRemove}
          className="ml-1.5 -mr-1 p-0.5 hover:bg-black/10 dark:hover:bg-white/10 rounded-full transition-colors"
          aria-label="Remove"
        >
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      )}
    </span>
  )
}

/**
 * Status Badge with predefined statuses
 */
export function StatusBadge({ status, size = 'md' }) {
  const statusConfig = {
    active: { variant: 'success', label: 'Active', dot: true },
    inactive: { variant: 'default', label: 'Inactive', dot: true },
    pending: { variant: 'warning', label: 'Pending', dot: true },
    completed: { variant: 'success', label: 'Completed' },
    failed: { variant: 'danger', label: 'Failed' },
    cancelled: { variant: 'default', label: 'Cancelled' },
    open: { variant: 'success', label: 'Open', dot: true },
    closed: { variant: 'danger', label: 'Closed' },
    passed: { variant: 'success', label: 'Passed' },
    rejected: { variant: 'danger', label: 'Rejected' },
    executed: { variant: 'primary', label: 'Executed' },
    expired: { variant: 'warning', label: 'Expired' },
  }

  const config = statusConfig[status] || { variant: 'default', label: status }

  return (
    <Badge variant={config.variant} size={size} dot={config.dot}>
      {config.label}
    </Badge>
  )
}

/**
 * Tier Badge for membership/staking levels
 */
export function TierBadge({ tier, showLabel = true }) {
  const tiers = {
    1: { label: 'Bronze', color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300', icon: '🥉' },
    2: { label: 'Silver', color: 'bg-gray-200 text-gray-700 dark:bg-gray-600 dark:text-gray-200', icon: '🥈' },
    3: { label: 'Gold', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300', icon: '🥇' },
    4: { label: 'Platinum', color: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300', icon: '💎' },
    5: { label: 'Diamond', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300', icon: '👑' },
  }

  const config = tiers[tier] || tiers[1]

  return (
    <span className={`inline-flex items-center px-2.5 py-1 text-sm font-medium rounded-full ${config.color}`}>
      <span className="mr-1">{config.icon}</span>
      {showLabel && config.label}
    </span>
  )
}

/**
 * Count Badge (notification style)
 */
export function CountBadge({ count, max = 99, variant = 'danger', className = '' }) {
  if (!count || count <= 0) return null

  const displayCount = count > max ? `${max}+` : count

  return (
    <span
      className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-bold rounded-full ${VARIANTS[variant]} ${className}`}
    >
      {displayCount}
    </span>
  )
}

/**
 * Outline Badge variant
 */
export function OutlineBadge({ children, variant = 'default', size = 'md', className = '' }) {
  const outlineVariants = {
    default: 'border-gray-300 text-gray-700 dark:border-gray-600 dark:text-gray-300',
    primary: 'border-purple-500 text-purple-700 dark:border-purple-400 dark:text-purple-300',
    success: 'border-green-500 text-green-700 dark:border-green-400 dark:text-green-300',
    warning: 'border-yellow-500 text-yellow-700 dark:border-yellow-400 dark:text-yellow-300',
    danger: 'border-red-500 text-red-700 dark:border-red-400 dark:text-red-300',
    info: 'border-blue-500 text-blue-700 dark:border-blue-400 dark:text-blue-300',
  }

  return (
    <span
      className={`inline-flex items-center font-medium border ${SIZES[size]} rounded-full ${outlineVariants[variant]} ${className}`}
    >
      {children}
    </span>
  )
}

/**
 * Badge Group
 */
export function BadgeGroup({ children, spacing = 'sm', className = '' }) {
  const spacingClasses = {
    sm: 'gap-1',
    md: 'gap-2',
    lg: 'gap-3',
  }

  return (
    <div className={`flex flex-wrap items-center ${spacingClasses[spacing]} ${className}`}>
      {children}
    </div>
  )
}
