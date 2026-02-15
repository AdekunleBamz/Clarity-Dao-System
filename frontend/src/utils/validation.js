/**
 * Form validation utilities for the DAO application
 * Provides reusable validation functions and form state management
 */

// ============ Validation Rules ============

/**
 * Check if value is not empty
 */
export function required(value, message = 'This field is required') {
  if (value === null || value === undefined) return message
  if (typeof value === 'string' && value.trim() === '') return message
  if (Array.isArray(value) && value.length === 0) return message
  return null
}

/**
 * Check minimum length
 */
export function minLength(min, message) {
  return (value) => {
    if (!value) return null // Let required handle empty values
    if (value.length < min) {
      return message || `Must be at least ${min} characters`
    }
    return null
  }
}

/**
 * Check maximum length
 */
export function maxLength(max, message) {
  return (value) => {
    if (!value) return null
    if (value.length > max) {
      return message || `Must be no more than ${max} characters`
    }
    return null
  }
}

/**
 * Validate email format
 */
export function email(value, message = 'Invalid email address') {
  if (!value) return null
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(value) ? null : message
}

/**
 * Validate URL format
 */
export function url(value, message = 'Invalid URL') {
  if (!value) return null
  try {
    new URL(value)
    return null
  } catch {
    return message
  }
}

/**
 * Validate Stacks address format
 */
export function stacksAddress(value, message = 'Invalid Stacks address') {
  if (!value) return null
  // Stacks addresses start with SP or ST and are 41 characters
  const stacksRegex = /^(SP|ST)[A-Z0-9]{39}$/
  return stacksRegex.test(value) ? null : message
}

/**
 * Validate positive number
 */
export function positiveNumber(value, message = 'Must be a positive number') {
  if (!value && value !== 0) return null
  const num = Number(value)
  if (isNaN(num) || num <= 0) return message
  return null
}

/**
 * Validate minimum value
 */
export function min(minValue, message) {
  return (value) => {
    if (!value && value !== 0) return null
    const num = Number(value)
    if (isNaN(num) || num < minValue) {
      return message || `Must be at least ${minValue}`
    }
    return null
  }
}

/**
 * Validate maximum value
 */
export function max(maxValue, message) {
  return (value) => {
    if (!value && value !== 0) return null
    const num = Number(value)
    if (isNaN(num) || num > maxValue) {
      return message || `Must be no more than ${maxValue}`
    }
    return null
  }
}

/**
 * Validate STX amount (in microSTX)
 */
export function stxAmount(value, minAmount = 0, maxAmount = Infinity) {
  if (!value && value !== 0) return null
  const num = Number(value)
  
  if (isNaN(num)) return 'Invalid amount'
  if (num < 0) return 'Amount cannot be negative'
  if (num < minAmount) return `Minimum amount is ${minAmount / 1000000} STX`
  if (num > maxAmount) return `Maximum amount is ${maxAmount / 1000000} STX`
  
  return null
}

/**
 * Validate integer value
 */
export function integer(value, message = 'Must be a whole number') {
  if (!value && value !== 0) return null
  const num = Number(value)
  if (!Number.isInteger(num)) return message
  return null
}

/**
 * Pattern matching validation
 */
export function pattern(regex, message = 'Invalid format') {
  return (value) => {
    if (!value) return null
    return regex.test(value) ? null : message
  }
}

/**
 * Custom validation function
 */
export function custom(validateFn) {
  return (value) => validateFn(value)
}

// ============ Compound Validators ============

/**
 * Compose multiple validators
 */
export function compose(...validators) {
  return (value) => {
    for (const validator of validators) {
      const error = typeof validator === 'function'
        ? validator(value)
        : validator
      if (error) return error
    }
    return null
  }
}

/**
 * Validate proposal title
 */
export const proposalTitle = compose(
  required,
  minLength(5, 'Title must be at least 5 characters'),
  maxLength(100, 'Title must be no more than 100 characters')
)

/**
 * Validate proposal description
 */
export const proposalDescription = compose(
  required,
  minLength(20, 'Description must be at least 20 characters'),
  maxLength(5000, 'Description must be no more than 5000 characters')
)

/**
 * Validate bounty reward
 */
export const bountyReward = compose(
  required,
  (value) => positiveNumber(value, 'Reward must be a positive number'),
  (value) => min(1)(value) // Minimum 1 STX
)

/**
 * Validate staking amount
 */
export const stakingAmount = compose(
  required,
  (value) => positiveNumber(value, 'Amount must be a positive number'),
  (value) => min(10)(value) // Minimum 10 STX
)

// ============ Form State Helpers ============

/**
 * Validate all fields in a form
 * @param {Object} values - Form values
 * @param {Object} validators - Map of field names to validators
 * @returns {Object} - Map of field names to error messages
 */
export function validateForm(values, validators) {
  const errors = {}
  
  for (const [field, validator] of Object.entries(validators)) {
    const error = validator(values[field])
    if (error) {
      errors[field] = error
    }
  }
  
  return errors
}

/**
 * Check if form has any errors
 */
export function hasErrors(errors) {
  return Object.keys(errors).length > 0
}

/**
 * Get first error message from errors object
 */
export function getFirstError(errors) {
  const firstKey = Object.keys(errors)[0]
  return firstKey ? errors[firstKey] : null
}

/**
 * Create initial form state
 */
export function createFormState(initialValues = {}) {
  return {
    values: initialValues,
    errors: {},
    touched: {},
    isSubmitting: false,
    isValid: true,
  }
}

/**
 * Format validation error for display
 */
export function formatError(error) {
  if (!error) return null
  if (typeof error === 'string') return error
  if (Array.isArray(error)) return error[0]
  return 'Invalid value'
}

// ============ Input Sanitization ============

/**
 * Sanitize string input
 */
export function sanitizeString(value) {
  if (!value) return ''
  return value.toString().trim()
}

/**
 * Sanitize number input
 */
export function sanitizeNumber(value, decimals = 6) {
  if (!value && value !== 0) return ''
  const num = Number(value)
  if (isNaN(num)) return ''
  return Number(num.toFixed(decimals))
}

/**
 * Convert STX to microSTX
 */
export function stxToMicroStx(stx) {
  return Math.floor(Number(stx) * 1000000)
}

/**
 * Convert microSTX to STX
 */
export function microStxToStx(microStx) {
  return Number(microStx) / 1000000
}

export default {
  required,
  minLength,
  maxLength,
  email,
  url,
  stacksAddress,
  positiveNumber,
  min,
  max,
  stxAmount,
  integer,
  pattern,
  custom,
  compose,
  proposalTitle,
  proposalDescription,
  bountyReward,
  stakingAmount,
  validateForm,
  hasErrors,
  getFirstError,
  createFormState,
  formatError,
  sanitizeString,
  sanitizeNumber,
  stxToMicroStx,
  microStxToStx,
}
