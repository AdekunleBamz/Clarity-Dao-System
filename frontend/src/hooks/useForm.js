/**
 * useForm Hook
 * Comprehensive form state management with validation
 */

import { useState, useCallback, useRef } from 'react'

export function useForm(initialValues, onSubmit, validate) {
  const [values, setValues] = useState(initialValues)
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const submitCountRef = useRef(0)

  // Handle field change
  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target
    const fieldValue = type === 'checkbox' ? checked : value

    setValues(prev => ({ ...prev, [name]: fieldValue }))

    // Validate on change if field was touched
    if (touched[name] && validate) {
      const fieldError = validate({ ...values, [name]: fieldValue })?.[name]
      setErrors(prev => ({
        ...prev,
        [name]: fieldError || undefined
      }))
    }
  }, [touched, values, validate])

  // Handle field blur
  const handleBlur = useCallback((e) => {
    const { name } = e.target
    setTouched(prev => ({ ...prev, [name]: true }))

    // Validate on blur
    if (validate) {
      const fieldErrors = validate(values)
      setErrors(prev => ({
        ...prev,
        [name]: fieldErrors?.[name]
      }))
    }
  }, [values, validate])

  // Validate all fields
  const validateAll = useCallback(() => {
    if (!validate) return true

    const newErrors = validate(values)
    setErrors(newErrors || {})
    
    return Object.keys(newErrors || {}).length === 0
  }, [values, validate])

  // Handle submit
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault()
    submitCountRef.current++

    // Mark all fields as touched
    const allTouched = Object.keys(values).reduce(
      (acc, key) => ({ ...acc, [key]: true }),
      {}
    )
    setTouched(allTouched)

    // Validate
    if (!validateAll()) return

    setIsSubmitting(true)
    try {
      await onSubmit(values)
    } catch (error) {
      console.error('Form submission error:', error)
    } finally {
      setIsSubmitting(false)
    }
  }, [values, validateAll, onSubmit])

  // Reset form
  const resetForm = useCallback(() => {
    setValues(initialValues)
    setErrors({})
    setTouched({})
    setIsSubmitting(false)
    submitCountRef.current = 0
  }, [initialValues])

  // Set field value programmatically
  const setFieldValue = useCallback((name, value) => {
    setValues(prev => ({ ...prev, [name]: value }))
  }, [])

  // Set field error
  const setFieldError = useCallback((name, error) => {
    setErrors(prev => ({ ...prev, [name]: error }))
  }, [])

  // Set field touched
  const setFieldTouched = useCallback((name, isTouched = true) => {
    setTouched(prev => ({ ...prev, [name]: isTouched }))
  }, [])

  return {
    values,
    errors,
    touched,
    isSubmitting,
    submitCount: submitCountRef.current,
    handleChange,
    handleBlur,
    handleSubmit,
    resetForm,
    setFieldValue,
    setFieldError,
    setFieldTouched,
    setValues,
    setErrors,
    setTouched,
    isValid: Object.keys(errors).length === 0,
    dirty: JSON.stringify(values) !== JSON.stringify(initialValues)
  }
}
