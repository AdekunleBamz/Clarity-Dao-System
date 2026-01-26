import { useState, useCallback } from 'react'

/**
 * Validation rules for form fields
 */
export const validators = {
  required: (value) => {
    if (value === null || value === undefined || value === '') {
      return 'This field is required'
    }
    return null
  },

  email: (value) => {
    if (!value) return null
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(value)) {
      return 'Please enter a valid email address'
    }
    return null
  },

  minLength: (min) => (value) => {
    if (!value) return null
    if (value.length < min) {
      return `Must be at least ${min} characters`
    }
    return null
  },

  maxLength: (max) => (value) => {
    if (!value) return null
    if (value.length > max) {
      return `Must be no more than ${max} characters`
    }
    return null
  },

  min: (min) => (value) => {
    if (value === '' || value === null || value === undefined) return null
    const num = parseFloat(value)
    if (isNaN(num) || num < min) {
      return `Must be at least ${min}`
    }
    return null
  },

  max: (max) => (value) => {
    if (value === '' || value === null || value === undefined) return null
    const num = parseFloat(value)
    if (isNaN(num) || num > max) {
      return `Must be no more than ${max}`
    }
    return null
  },

  pattern: (regex, message) => (value) => {
    if (!value) return null
    if (!regex.test(value)) {
      return message || 'Invalid format'
    }
    return null
  },

  stxAddress: (value) => {
    if (!value) return null
    const stxRegex = /^S[PM][A-Z0-9]{39}$/
    if (!stxRegex.test(value)) {
      return 'Please enter a valid STX address'
    }
    return null
  },

  positiveNumber: (value) => {
    if (value === '' || value === null || value === undefined) return null
    const num = parseFloat(value)
    if (isNaN(num) || num <= 0) {
      return 'Must be a positive number'
    }
    return null
  },

  integer: (value) => {
    if (value === '' || value === null || value === undefined) return null
    const num = parseFloat(value)
    if (isNaN(num) || !Number.isInteger(num)) {
      return 'Must be a whole number'
    }
    return null
  },
}

/**
 * Combine multiple validators
 */
export function composeValidators(...validators) {
  return (value) => {
    for (const validator of validators) {
      const error = validator(value)
      if (error) return error
    }
    return null
  }
}

/**
 * Custom hook for form state management
 */
export function useForm(initialValues = {}, validationRules = {}) {
  const [values, setValues] = useState(initialValues)
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const validateField = useCallback((name, value) => {
    const rules = validationRules[name]
    if (!rules) return null
    
    if (Array.isArray(rules)) {
      for (const rule of rules) {
        const error = rule(value)
        if (error) return error
      }
    } else {
      return rules(value)
    }
    return null
  }, [validationRules])

  const validateAll = useCallback(() => {
    const newErrors = {}
    let isValid = true
    
    for (const name of Object.keys(validationRules)) {
      const error = validateField(name, values[name])
      if (error) {
        newErrors[name] = error
        isValid = false
      }
    }
    
    setErrors(newErrors)
    return isValid
  }, [values, validationRules, validateField])

  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target
    const newValue = type === 'checkbox' ? checked : value
    
    setValues((prev) => ({ ...prev, [name]: newValue }))
    
    if (touched[name]) {
      const error = validateField(name, newValue)
      setErrors((prev) => ({ ...prev, [name]: error }))
    }
  }, [touched, validateField])

  const handleBlur = useCallback((e) => {
    const { name, value } = e.target
    setTouched((prev) => ({ ...prev, [name]: true }))
    
    const error = validateField(name, value)
    setErrors((prev) => ({ ...prev, [name]: error }))
  }, [validateField])

  const setValue = useCallback((name, value) => {
    setValues((prev) => ({ ...prev, [name]: value }))
  }, [])

  const setError = useCallback((name, error) => {
    setErrors((prev) => ({ ...prev, [name]: error }))
  }, [])

  const reset = useCallback(() => {
    setValues(initialValues)
    setErrors({})
    setTouched({})
    setIsSubmitting(false)
  }, [initialValues])

  const handleSubmit = useCallback((onSubmit) => async (e) => {
    e?.preventDefault()
    
    // Touch all fields
    const allTouched = Object.keys(validationRules).reduce((acc, key) => {
      acc[key] = true
      return acc
    }, {})
    setTouched(allTouched)
    
    if (!validateAll()) return
    
    setIsSubmitting(true)
    try {
      await onSubmit(values)
    } finally {
      setIsSubmitting(false)
    }
  }, [values, validationRules, validateAll])

  const getFieldProps = useCallback((name) => ({
    name,
    value: values[name] ?? '',
    onChange: handleChange,
    onBlur: handleBlur,
  }), [values, handleChange, handleBlur])

  const getFieldError = useCallback((name) => 
    touched[name] ? errors[name] : null
  , [touched, errors])

  return {
    values,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
    setValue,
    setError,
    reset,
    validateAll,
    getFieldProps,
    getFieldError,
    isValid: Object.keys(errors).every(k => !errors[k]),
  }
}

export default useForm
