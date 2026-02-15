/**
 * Form Validation Utilities
 * Real-time validation with helpful error messages
 */

export const validators = {
  email: (value) => {
    if (!value) return 'Email is required'
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(value) ? null : 'Invalid email format'
  },

  address: (value) => {
    if (!value) return 'Address is required'
    return value.startsWith('SP') && value.length === 42 ? null : 'Invalid Stacks address'
  },

  amount: (value, min = 0, max = Infinity) => {
    if (!value) return 'Amount is required'
    const num = parseFloat(value)
    if (isNaN(num)) return 'Amount must be a number'
    if (num < min) return `Amount must be at least ${min}`
    if (num > max) return `Amount cannot exceed ${max}`
    return null
  },

  title: (value, minLength = 3) => {
    if (!value) return 'Title is required'
    if (value.length < minLength) return `Title must be at least ${minLength} characters`
    return null
  },

  description: (value, minLength = 10, maxLength = 1000) => {
    if (!value) return 'Description is required'
    if (value.length < minLength) return `Description must be at least ${minLength} characters`
    if (value.length > maxLength) return `Description cannot exceed ${maxLength} characters`
    return null
  },

  duration: (value) => {
    if (!value) return 'Duration is required'
    const num = parseInt(value)
    if (isNaN(num) || num <= 0) return 'Duration must be a positive number'
    return null
  },

  percentage: (value) => {
    if (!value) return 'Percentage is required'
    const num = parseFloat(value)
    if (isNaN(num) || num < 0 || num > 100) return 'Percentage must be between 0 and 100'
    return null
  }
}

/**
 * Validate form fields
 * @param {Object} formData - Form field values
 * @param {Object} rules - Validation rules
 * @returns {Object} Errors object
 */
export function validateForm(formData, rules) {
  const errors = {}
  Object.entries(rules).forEach(([field, rule]) => {
    const error = rule(formData[field])
    if (error) errors[field] = error
  })
  return errors
}

/**
 * Real-time field validation hook
 * @param {string} fieldName - Field name
 * @param {Function} validator - Validator function
 * @returns {Object} Value, error, and handler
 */
export function useFieldValidation(fieldName, validator) {
  const [value, setValue] = React.useState('')
  const [error, setError] = React.useState(null)
  const [touched, setTouched] = React.useState(false)

  const handleChange = (newValue) => {
    setValue(newValue)
    if (touched) {
      setError(validator(newValue))
    }
  }

  const handleBlur = () => {
    setTouched(true)
    setError(validator(value))
  }

  return {
    value,
    error: touched ? error : null,
    touched,
    handleChange,
    handleBlur,
    setError,
    setValue
  }
}
