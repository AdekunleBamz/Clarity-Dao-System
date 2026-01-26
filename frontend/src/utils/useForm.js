import { useState, useCallback, useRef } from 'react'
import { validateForm, hasErrors, createFormState, sanitizeString } from './validation'

/**
 * Custom hook for form handling with validation
 * @param {Object} config - Form configuration
 * @param {Object} config.initialValues - Initial form values
 * @param {Object} config.validators - Validation rules for each field
 * @param {Function} config.onSubmit - Form submission handler
 * @returns {Object} - Form state and handlers
 */
export function useForm({ initialValues = {}, validators = {}, onSubmit }) {
  const [values, setValues] = useState(initialValues)
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitCount, setSubmitCount] = useState(0)
  
  const initialValuesRef = useRef(initialValues)

  /**
   * Handle input change
   */
  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target
    const newValue = type === 'checkbox' ? checked : value

    setValues((prev) => ({
      ...prev,
      [name]: newValue,
    }))

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }, [errors])

  /**
   * Handle input blur (mark as touched and validate)
   */
  const handleBlur = useCallback((e) => {
    const { name } = e.target
    
    setTouched((prev) => ({
      ...prev,
      [name]: true,
    }))

    // Validate single field
    if (validators[name]) {
      const error = validators[name](values[name])
      if (error) {
        setErrors((prev) => ({
          ...prev,
          [name]: error,
        }))
      }
    }
  }, [validators, values])

  /**
   * Set a specific field value
   */
  const setFieldValue = useCallback((name, value) => {
    setValues((prev) => ({
      ...prev,
      [name]: value,
    }))
  }, [])

  /**
   * Set a specific field error
   */
  const setFieldError = useCallback((name, error) => {
    setErrors((prev) => ({
      ...prev,
      [name]: error,
    }))
  }, [])

  /**
   * Set multiple field values
   */
  const setMultipleValues = useCallback((newValues) => {
    setValues((prev) => ({
      ...prev,
      ...newValues,
    }))
  }, [])

  /**
   * Validate all fields
   */
  const validateAll = useCallback(() => {
    const formErrors = validateForm(values, validators)
    setErrors(formErrors)
    return !hasErrors(formErrors)
  }, [values, validators])

  /**
   * Handle form submission
   */
  const handleSubmit = useCallback(async (e) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }

    setSubmitCount((c) => c + 1)
    
    // Mark all fields as touched
    const allTouched = Object.keys(validators).reduce((acc, key) => {
      acc[key] = true
      return acc
    }, {})
    setTouched(allTouched)

    // Validate all fields
    const isValid = validateAll()
    
    if (!isValid || !onSubmit) {
      return
    }

    setIsSubmitting(true)
    
    try {
      // Sanitize values before submission
      const sanitizedValues = Object.keys(values).reduce((acc, key) => {
        acc[key] = typeof values[key] === 'string' 
          ? sanitizeString(values[key])
          : values[key]
        return acc
      }, {})

      await onSubmit(sanitizedValues)
    } catch (error) {
      console.error('Form submission error:', error)
      throw error
    } finally {
      setIsSubmitting(false)
    }
  }, [values, validators, validateAll, onSubmit])

  /**
   * Reset form to initial values
   */
  const resetForm = useCallback(() => {
    setValues(initialValuesRef.current)
    setErrors({})
    setTouched({})
    setIsSubmitting(false)
    setSubmitCount(0)
  }, [])

  /**
   * Check if form is dirty (values changed from initial)
   */
  const isDirty = JSON.stringify(values) !== JSON.stringify(initialValuesRef.current)

  /**
   * Check if form is valid
   */
  const isValid = !hasErrors(errors)

  /**
   * Get field props for an input
   */
  const getFieldProps = useCallback((name) => ({
    name,
    value: values[name] ?? '',
    onChange: handleChange,
    onBlur: handleBlur,
    'aria-invalid': !!errors[name],
    'aria-describedby': errors[name] ? `${name}-error` : undefined,
  }), [values, errors, handleChange, handleBlur])

  /**
   * Get error message for a field
   */
  const getFieldError = useCallback((name) => {
    return touched[name] ? errors[name] : null
  }, [errors, touched])

  /**
   * Check if a field has been touched
   */
  const isFieldTouched = useCallback((name) => {
    return !!touched[name]
  }, [touched])

  return {
    // State
    values,
    errors,
    touched,
    isSubmitting,
    isValid,
    isDirty,
    submitCount,

    // Handlers
    handleChange,
    handleBlur,
    handleSubmit,

    // Setters
    setFieldValue,
    setFieldError,
    setMultipleValues,
    setErrors,
    setTouched,

    // Utilities
    validateAll,
    resetForm,
    getFieldProps,
    getFieldError,
    isFieldTouched,
  }
}

/**
 * Field error display component
 */
export function FieldError({ name, error, className = '' }) {
  if (!error) return null

  return (
    <p
      id={`${name}-error`}
      role="alert"
      className={`text-sm text-red-500 mt-1 ${className}`}
    >
      {error}
    </p>
  )
}

/**
 * Form field wrapper component
 */
export function FormField({
  name,
  label,
  error,
  touched,
  required,
  hint,
  children,
  className = '',
}) {
  const showError = touched && error

  return (
    <div className={`space-y-1 ${className}`}>
      {label && (
        <label
          htmlFor={name}
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      {children}
      {hint && !showError && (
        <p className="text-sm text-gray-500 dark:text-gray-400">{hint}</p>
      )}
      {showError && <FieldError name={name} error={error} />}
    </div>
  )
}

export default useForm
