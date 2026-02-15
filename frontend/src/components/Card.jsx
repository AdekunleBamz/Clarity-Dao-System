/**
 * Card component library for consistent container styling
 */

/**
 * Base Card component
 */
export default function Card({
  children,
  variant = 'default',
  padding = 'md',
  hover = false,
  clickable = false,
  onClick,
  className = '',
  ...props
}) {
  const variants = {
    default: 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700',
    elevated: 'bg-white dark:bg-gray-800 shadow-lg',
    outlined: 'border-2 border-gray-300 dark:border-gray-600 bg-transparent',
    filled: 'bg-gray-100 dark:bg-gray-900',
    gradient: 'bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-200 dark:border-purple-800',
  }

  const paddings = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
    xl: 'p-8',
  }

  const hoverEffect = hover ? 'transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5' : ''
  const clickableEffect = clickable ? 'cursor-pointer active:scale-[0.98]' : ''

  return (
    <div
      className={`rounded-xl ${variants[variant]} ${paddings[padding]} ${hoverEffect} ${clickableEffect} ${className}`}
      onClick={clickable ? onClick : undefined}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      onKeyDown={clickable ? (e) => e.key === 'Enter' && onClick?.() : undefined}
      {...props}
    >
      {children}
    </div>
  )
}

/**
 * Card Header section
 */
export function CardHeader({
  children,
  title,
  subtitle,
  action,
  className = '',
}) {
  return (
    <div className={`flex items-start justify-between mb-4 ${className}`}>
      <div>
        {title && (
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {title}
          </h3>
        )}
        {subtitle && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {subtitle}
          </p>
        )}
        {children}
      </div>
      {action && <div className="ml-4 flex-shrink-0">{action}</div>}
    </div>
  )
}

/**
 * Card Body section
 */
export function CardBody({ children, className = '' }) {
  return <div className={className}>{children}</div>
}

/**
 * Card Footer section
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
  title,
  value,
  change,
  changeType = 'neutral',
  icon,
  loading = false,
  className = '',
}) {
  const changeColors = {
    positive: 'text-green-600 dark:text-green-400',
    negative: 'text-red-600 dark:text-red-400',
    neutral: 'text-gray-600 dark:text-gray-400',
  }

  const changeIcons = {
    positive: '↑',
    negative: '↓',
    neutral: '→',
  }

  return (
    <Card className={className}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
            {title}
          </p>
          {loading ? (
            <div className="mt-2 h-8 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          ) : (
            <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
              {value}
            </p>
          )}
          {change !== undefined && !loading && (
            <p className={`mt-1 text-sm ${changeColors[changeType]}`}>
              <span>{changeIcons[changeType]}</span> {change}
            </p>
          )}
        </div>
        {icon && (
          <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg text-purple-600 dark:text-purple-400">
            {icon}
          </div>
        )}
      </div>
    </Card>
  )
}

/**
 * Feature Card for showcasing features
 */
export function FeatureCard({
  icon,
  title,
  description,
  link,
  className = '',
}) {
  const content = (
    <Card hover={!!link} clickable={!!link} className={className}>
      {icon && (
        <div className="w-12 h-12 flex items-center justify-center bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg text-white text-xl mb-4">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        {title}
      </h3>
      <p className="text-gray-600 dark:text-gray-400 text-sm">
        {description}
      </p>
      {link && (
        <p className="mt-4 text-purple-600 dark:text-purple-400 text-sm font-medium">
          Learn more →
        </p>
      )}
    </Card>
  )

  if (link) {
    return (
      <a href={link} className="block">
        {content}
      </a>
    )
  }

  return content
}

/**
 * Profile Card for user/member display
 */
export function ProfileCard({
  avatar,
  name,
  role,
  stats,
  actions,
  className = '',
}) {
  return (
    <Card className={`text-center ${className}`}>
      <div className="flex flex-col items-center">
        {avatar ? (
          <img
            src={avatar}
            alt={name}
            className="w-20 h-20 rounded-full object-cover mb-4"
          />
        ) : (
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white text-2xl font-bold mb-4">
            {name?.charAt(0)?.toUpperCase() || '?'}
          </div>
        )}
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {name}
        </h3>
        {role && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{role}</p>
        )}
      </div>

      {stats && stats.length > 0 && (
        <div className="flex justify-center gap-6 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                {stat.value}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      )}

      {actions && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          {actions}
        </div>
      )}
    </Card>
  )
}

/**
 * Card Grid container
 */
export function CardGrid({
  children,
  columns = 3,
  gap = 'md',
  className = '',
}) {
  const colClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  }

  const gapClasses = {
    sm: 'gap-3',
    md: 'gap-4',
    lg: 'gap-6',
    xl: 'gap-8',
  }

  return (
    <div className={`grid ${colClasses[columns]} ${gapClasses[gap]} ${className}`}>
      {children}
    </div>
  )
}

/**
 * Skeleton Card for loading states
 */
export function SkeletonCard({ lines = 3, className = '' }) {
  return (
    <Card className={className}>
      <div className="animate-pulse">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4" />
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={`h-3 bg-gray-200 dark:bg-gray-700 rounded mb-2 ${
              i === lines - 1 ? 'w-2/3' : 'w-full'
            }`}
          />
        ))}
      </div>
    </Card>
  )
}

/**
 * Collapsible Card
 */
export function CollapsibleCard({
  title,
  children,
  defaultOpen = false,
  className = '',
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <Card padding="none" className={className}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
      >
        <span className="font-medium text-gray-900 dark:text-white">{title}</span>
        <svg
          className={`w-5 h-5 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && (
        <div className="px-4 pb-4 pt-2 border-t border-gray-200 dark:border-gray-700">
          {children}
        </div>
      )}
    </Card>
  )
}

// Import useState for CollapsibleCard
import { useState } from 'react'
