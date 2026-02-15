/**
 * Advanced Input Validators
 * Reusable validation rules for forms
 */

export const validators = {
  // Required field
  required: (value) => !value ? 'This field is required' : null,

  // Email validation
  email: (value) => {
    if (!value) return 'Email is required'
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return !emailRegex.test(value) ? 'Invalid email format' : null
  },

  // Wallet address validation (Stacks)
  stacksAddress: (value) => {
    if (!value) return 'Address is required'
    const isValid = value.startsWith('SP') && value.length === 42
    return !isValid ? 'Invalid Stacks address (must be SP... format, 42 chars)' : null
  },

  // Amount validation
  amount: (min = 0, max = Infinity) => (value) => {
    if (!value) return 'Amount is required'
    const num = parseFloat(value)
    if (isNaN(num)) return 'Must be a number'
    if (num < min) return `Minimum amount is ${min}`
    if (num > max) return `Maximum amount is ${max}`
    return null
  },

  // Integer validation
  integer: (value) => {
    if (!value) return 'Required'
    const num = parseInt(value, 10)
    if (isNaN(num) || num.toString() !== value) return 'Must be a whole number'
    return null
  },

  // Min length
  minLength: (min) => (value) => {
    if (!value) return 'Required'
    return value.length < min ? `Minimum ${min} characters` : null
  },

  // Max length
  maxLength: (max) => (value) => {
    return value?.length > max ? `Maximum ${max} characters` : null
  },

  // Min value
  min: (min) => (value) => {
    const num = parseFloat(value)
    return isNaN(num) || num < min ? `Minimum value is ${min}` : null
  },

  // Max value
  max: (max) => (value) => {
    const num = parseFloat(value)
    return isNaN(num) || num > max ? `Maximum value is ${max}` : null
  },

  // URL validation
  url: (value) => {
    try {
      new URL(value)
      return null
    } catch {
      return 'Invalid URL'
    }
  },

  // Percentage (0-100)
  percentage: (value) => {
    const num = parseFloat(value)
    if (isNaN(num)) return 'Must be a number'
    if (num < 0 || num > 100) return 'Must be between 0 and 100'
    return null
  }
}

/**
 * Compose multiple validators
 */
export function compose(...rules) {
  return (value) => {
    for (const rule of rules) {
      const error = rule(value)
      if (error) return error
    }
    return null
  }
}

/**
 * Create async validator
 */
export function createAsyncValidator(asyncFn) {
  return async (value) => {
    try {
      await asyncFn(value)
      return null
    } catch (error) {
      return error.message || 'Validation failed'
    }
  }
}
