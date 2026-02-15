/**
 * Card Component Library
 * Flexible card components for DAO dashboard
 */

export default function Card({
  children,
  variant = 'default',
  padding = 'md',
  hover = false,
  className = '',
  onClick,
}) {
  const variants = {
    default: 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700',
    elevated: 'bg-white dark:bg-gray-800 shadow-lg',
    outlined: 'bg-transparent border-2 border-gray-300 dark:border-gray-600',
    filled: 'bg-gray-100 dark:bg-gray-900',
    gradient: 'bg-gradient-to-br from-purple-500 to-indigo-600 text-white',
  }

  const paddings = {
    none: 'p-0',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
    xl: 'p-8',
  }

  const hoverClass = hover
    ? 'transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 cursor-pointer'
    : ''

  return (
    <div
      className={`rounded-xl ${variants[variant]} ${paddings[padding]} ${hoverClass} ${className}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {children}
    </div>
  )
}

/**
 * Card Header
 */
export function CardHeader({
  title,
  subtitle,
  action,
  icon,
  className = '',
}) {
  return (
    <div className={`flex items-start justify-between ${className}`}>
      <div className="flex items-start gap-3">
        {icon && (
          <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
            {icon}
          </div>
        )}
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white">
            {title}
          </h3>
          {subtitle && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}

/**
 * Card Body
 */
export function CardBody({ children, className = '' }) {
  return <div className={`mt-4 ${className}`}>{children}</div>
}

/**
 * Card Footer
 */
export function CardFooter({
  children,
  border = true,
  className = '',
}) {
  return (
    <div
      className={`mt-4 pt-4 ${border ? 'border-t border-gray-200 dark:border-gray-700' : ''} ${className}`}
    >
      {children}
    </div>
  )
}

/**
 * Stat Card for displaying metrics
 */
export function StatCard({
  label,
  value,
  change,
  changeType = 'neutral',
  icon,
  className = '',
}) {
  const changeColors = {
    positive: 'text-green-600 dark:text-green-400',
    negative: 'text-red-600 dark:text-red-400',
    neutral: 'text-gray-500 dark:text-gray-400',
  }

  const changeIcons = {
    positive: '↑',
    negative: '↓',
    neutral: '→',
  }

  return (
    <Card className={className}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {value}
          </p>
          {change && (
            <p className={`text-sm mt-1 ${changeColors[changeType]}`}>
              {changeIcons[changeType]} {change}
            </p>
          )}
        </div>
        {icon && (
          <div className="p-3 rounded-lg bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
            {icon}
          </div>
        )}
      </div>
    </Card>
  )
}

/**
 * Feature Card with icon
 */
export function FeatureCard({
  icon,
  title,
  description,
  action,
  className = '',
}) {
  return (
    <Card hover className={className}>
      <div className="text-center">
        <div className="inline-flex p-4 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white mb-4">
          {icon}
        </div>
        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
          {title}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          {description}
        </p>
        {action}
      </div>
    </Card>
  )
}

/**
 * Proposal Card for governance
 */
export function ProposalCard({
  id,
  title,
  description,
  status,
  votes,
  deadline,
  onClick,
  className = '',
}) {
  const statusStyles = {
    active: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    passed: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    failed: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  }

  const totalVotes = (votes?.for || 0) + (votes?.against || 0)
  const forPercent = totalVotes > 0 ? ((votes?.for || 0) / totalVotes) * 100 : 0

  return (
    <Card hover onClick={onClick} className={className}>
      <div className="flex items-start justify-between mb-3">
        <span className="text-sm text-gray-500 dark:text-gray-400">
          Proposal #{id}
        </span>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusStyles[status]}`}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
      </div>
      
      <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
        {title}
      </h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-4">
        {description}
      </p>
      
      {votes && (
        <div className="mb-3">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-green-600 dark:text-green-400">
              For: {votes.for?.toLocaleString()}
            </span>
            <span className="text-red-600 dark:text-red-400">
              Against: {votes.against?.toLocaleString()}
            </span>
          </div>
          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500"
              style={{ width: `${forPercent}%` }}
            />
          </div>
        </div>
      )}
      
      {deadline && (
        <p className="text-xs text-gray-400 dark:text-gray-500">
          Ends: {deadline}
        </p>
      )}
    </Card>
  )
}

/**
 * Token Card for displaying token info
 */
export function TokenCard({
  name,
  symbol,
  balance,
  value,
  icon,
  change,
  onClick,
  className = '',
}) {
  const isPositive = change > 0
  const isNegative = change < 0

  return (
    <Card hover onClick={onClick} className={className}>
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold">
          {icon || symbol?.charAt(0)}
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 dark:text-white">
            {name}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {balance} {symbol}
          </p>
        </div>
        <div className="text-right">
          <p className="font-semibold text-gray-900 dark:text-white">
            {value}
          </p>
          {change !== undefined && (
            <p className={`text-sm ${isPositive ? 'text-green-500' : isNegative ? 'text-red-500' : 'text-gray-500'}`}>
              {isPositive ? '+' : ''}{change}%
            </p>
          )}
        </div>
      </div>
    </Card>
  )
}

/**
 * Empty State Card
 */
export function EmptyStateCard({
  icon,
  title,
  description,
  action,
  className = '',
}) {
  return (
    <Card className={`text-center py-12 ${className}`}>
      {icon && (
        <div className="text-gray-400 dark:text-gray-500 mb-4 flex justify-center">
          {icon}
        </div>
      )}
      <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
        {title}
      </h3>
      <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto">
        {description}
      </p>
      {action}
    </Card>
  )
}
improved card spacing
