import { forwardRef, useState } from 'react'

const SIZES = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-4 py-3 text-base',
}

const Input = forwardRef(function Input(
  {
    label,
    error,
    hint,
    leftIcon,
    rightIcon,
    size = 'md',
    fullWidth = true,
    className = '',
    containerClassName = '',
    success = false,
    ...props
  },
  ref
) {
  const [touched, setTouched] = useState(false)
  const hasError = touched && !!error
  const showSuccess = touched && success && !error
  const widthClass = fullWidth ? 'w-full' : ''
  
  const baseClasses = `block rounded-lg border bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 transition-colors ${SIZES[size]}`
  
  const stateClasses = hasError
    ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
    : showSuccess
    ? 'border-green-500 focus:border-green-500 focus:ring-green-500/20'
    : 'border-gray-300 dark:border-gray-600 focus:border-purple-500 focus:ring-purple-500/20'
  
  const paddingClasses = `${leftIcon ? 'pl-10' : ''} ${rightIcon || hasError || showSuccess ? 'pr-10' : ''}`

  const handleBlur = (e) => {
    setTouched(true)
    props.onBlur?.(e)
  }

  return (
    <div className={`${fullWidth ? 'w-full' : ''} ${containerClassName}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          {label}
          {props.required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        {leftIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            {leftIcon}
          </div>
        )}
        
        <input
          ref={ref}
          className={`${baseClasses} ${stateClasses} ${paddingClasses} ${widthClass} ${className}`}
          aria-invalid={hasError}
          aria-describedby={hasError ? `${props.id || props.name}-error` : hint ? `${props.id || props.name}-hint` : undefined}
          onBlur={handleBlur}
          {...props}
        />
        
        {!rightIcon && (hasError || showSuccess) && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            {hasError && (
              <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18.101 12.93a1 1 0 00-1.414-1.414L10 15.586l-6.687-6.687a1 1 0 00-1.414 1.414l8.101 8.101a1 1 0 001.414 0l10.101-10.101z" clipRule="evenodd" />
              </svg>
            )}
            {showSuccess && (
              <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            )}
          </div>
        )}
        
        {rightIcon && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400">
            {rightIcon}
          </div>
        )}
      </div>
      
      {hasError && (
        <p id={`${props.id || props.name}-error`} className="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
          <span>✕</span> {error}
        </p>
      )}
      
      {showSuccess && (
        <p className="mt-1.5 text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
          <span>✓</span> Looks good!
        </p>
      )}
      
      {hint && !hasError && !showSuccess && (
        <p id={`${props.id || props.name}-hint`} className="mt-1.5 text-sm text-gray-500 dark:text-gray-400">{hint}</p>
      )}
    </div>
  )
})

export default Input

/**
 * Textarea component
 */
export const Textarea = forwardRef(function Textarea(
  { label, error, hint, rows = 4, className = '', ...props },
  ref
) {
  const hasError = !!error
  const baseClasses = 'block w-full px-4 py-2 rounded-lg border bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 transition-colors resize-none'
  
  const stateClasses = hasError
    ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
    : 'border-gray-300 dark:border-gray-600 focus:border-purple-500 focus:ring-purple-500/20'

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          {label}
          {props.required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <textarea
        ref={ref}
        rows={rows}
        className={`${baseClasses} ${stateClasses} ${className}`}
        aria-invalid={hasError}
        {...props}
      />
      
      {error && <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">{error}</p>}
      {hint && !error && <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400">{hint}</p>}
    </div>
  )
})

/**
 * Select component
 */
export const Select = forwardRef(function Select(
  { label, error, hint, options = [], placeholder, className = '', ...props },
  ref
) {
  const hasError = !!error
  const baseClasses = 'block w-full px-4 py-2 rounded-lg border bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 transition-colors appearance-none'
  
  const stateClasses = hasError
    ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
    : 'border-gray-300 dark:border-gray-600 focus:border-purple-500 focus:ring-purple-500/20'

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          {label}
          {props.required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        <select
          ref={ref}
          className={`${baseClasses} ${stateClasses} ${className}`}
          aria-invalid={hasError}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
          <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
      
      {error && <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">{error}</p>}
      {hint && !error && <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400">{hint}</p>}
    </div>
  )
})

/**
 * Password input with visibility toggle
 */
export const PasswordInput = forwardRef(function PasswordInput(props, ref) {
  const [showPassword, setShowPassword] = useState(false)

  return (
    <Input
      ref={ref}
      type={showPassword ? 'text' : 'password'}
      rightIcon={
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="focus:outline-none"
          tabIndex={-1}
        >
          {showPassword ? (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          )}
        </button>
      }
      {...props}
    />
  )
})

/**
 * Number input with increment/decrement buttons
 */
export function NumberInput({
  value,
  onChange,
  min,
  max,
  step = 1,
  label,
  error,
  className = '',
  ...props
}) {
  const handleIncrement = () => {
    const newValue = (parseFloat(value) || 0) + step
    if (max === undefined || newValue <= max) {
      onChange({ target: { value: newValue, name: props.name } })
    }
  }

  const handleDecrement = () => {
    const newValue = (parseFloat(value) || 0) - step
    if (min === undefined || newValue >= min) {
      onChange({ target: { value: newValue, name: props.name } })
    }
  }

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          {label}
        </label>
      )}
      <div className="flex">
        <button
          type="button"
          onClick={handleDecrement}
          className="px-3 py-2 border border-r-0 border-gray-300 dark:border-gray-600 rounded-l-lg bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600"
        >
          −
        </button>
        <input
          type="number"
          value={value}
          onChange={onChange}
          min={min}
          max={max}
          step={step}
          className={`flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-center focus:outline-none focus:ring-2 focus:ring-purple-500/20 ${className}`}
          {...props}
        />
        <button
          type="button"
          onClick={handleIncrement}
          className="px-3 py-2 border border-l-0 border-gray-300 dark:border-gray-600 rounded-r-lg bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600"
        >
          +
        </button>
      </div>
      {error && <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">{error}</p>}
    </div>
  )
}
