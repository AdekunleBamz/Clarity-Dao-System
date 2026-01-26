const VARIANTS = {
  primary: 'bg-purple-600',
  success: 'bg-green-600',
  warning: 'bg-yellow-500',
  danger: 'bg-red-600',
  info: 'bg-blue-600',
  gradient: 'bg-gradient-to-r from-purple-600 to-blue-600',
}

const SIZES = {
  xs: 'h-1',
  sm: 'h-2',
  md: 'h-3',
  lg: 'h-4',
  xl: 'h-6',
}

/**
 * Progress Bar component
 */
export default function Progress({
  value,
  max = 100,
  variant = 'primary',
  size = 'md',
  showValue = false,
  animated = false,
  striped = false,
  label,
  className = '',
}) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100)

  return (
    <div className={className}>
      {(label || showValue) && (
        <div className="flex items-center justify-between mb-1.5">
          {label && (
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {label}
            </span>
          )}
          {showValue && (
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {percentage.toFixed(0)}%
            </span>
          )}
        </div>
      )}
      <div className={`w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden ${SIZES[size]}`}>
        <div
          className={`${SIZES[size]} ${VARIANTS[variant]} rounded-full transition-all duration-500 ${
            striped ? 'bg-stripes' : ''
          } ${animated ? 'animate-progress' : ''}`}
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={max}
        />
      </div>
    </div>
  )
}

/**
 * Circular Progress component
 */
export function CircularProgress({
  value,
  max = 100,
  size = 'md',
  variant = 'primary',
  showValue = true,
  thickness = 8,
  className = '',
}) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100)
  
  const sizes = {
    sm: 48,
    md: 64,
    lg: 96,
    xl: 128,
  }
  
  const dimension = sizes[size]
  const radius = (dimension - thickness) / 2
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (percentage / 100) * circumference

  const variantColors = {
    primary: '#9333ea',
    success: '#16a34a',
    warning: '#eab308',
    danger: '#dc2626',
    info: '#2563eb',
  }

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <svg
        width={dimension}
        height={dimension}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={dimension / 2}
          cy={dimension / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={thickness}
          fill="none"
          className="text-gray-200 dark:text-gray-700"
        />
        {/* Progress circle */}
        <circle
          cx={dimension / 2}
          cy={dimension / 2}
          r={radius}
          stroke={variantColors[variant]}
          strokeWidth={thickness}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-500"
        />
      </svg>
      {showValue && (
        <span className="absolute text-sm font-semibold text-gray-700 dark:text-gray-300">
          {percentage.toFixed(0)}%
        </span>
      )}
    </div>
  )
}

/**
 * Multi-segment Progress (for voting, etc.)
 */
export function SegmentedProgress({
  segments,
  total,
  size = 'md',
  showLabels = true,
  className = '',
}) {
  return (
    <div className={className}>
      <div className={`w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden flex ${SIZES[size]}`}>
        {segments.map((segment, index) => {
          const percentage = (segment.value / total) * 100
          return (
            <div
              key={index}
              className={`${SIZES[size]} ${segment.color || VARIANTS.primary} transition-all duration-500`}
              style={{ width: `${percentage}%` }}
            />
          )
        })}
      </div>
      {showLabels && (
        <div className="flex flex-wrap gap-4 mt-2">
          {segments.map((segment, index) => (
            <div key={index} className="flex items-center gap-2">
              <span className={`w-3 h-3 rounded-full ${segment.color || VARIANTS.primary}`} />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {segment.label}: {segment.value}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/**
 * Step Progress for multi-step processes
 */
export function StepProgress({ steps, currentStep, className = '' }) {
  return (
    <div className={`flex items-center ${className}`}>
      {steps.map((step, index) => {
        const isCompleted = index < currentStep
        const isCurrent = index === currentStep
        
        return (
          <div key={index} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                  isCompleted
                    ? 'bg-purple-600 text-white'
                    : isCurrent
                    ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 border-2 border-purple-600'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
                }`}
              >
                {isCompleted ? (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  index + 1
                )}
              </div>
              <span className={`mt-2 text-xs font-medium ${
                isCurrent ? 'text-purple-600 dark:text-purple-400' : 'text-gray-500 dark:text-gray-400'
              }`}>
                {step}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={`w-12 h-0.5 mx-2 ${
                  isCompleted ? 'bg-purple-600' : 'bg-gray-200 dark:bg-gray-700'
                }`}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

/**
 * Loading spinner
 */
export function Spinner({ size = 'md', variant = 'primary', className = '' }) {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12',
  }

  return (
    <svg
      className={`animate-spin ${sizes[size]} ${className}`}
      fill="none"
      viewBox="0 0 24 24"
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
