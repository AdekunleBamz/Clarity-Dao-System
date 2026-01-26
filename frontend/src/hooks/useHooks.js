import { useState, useEffect, useCallback, useRef } from 'react'

/**
 * Debounce a value - useful for search inputs
 * @param {any} value - The value to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {any} Debounced value
 */
export function useDebounce(value, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => clearTimeout(timer)
  }, [value, delay])

  return debouncedValue
}

/**
 * Persist state to localStorage
 * @param {string} key - localStorage key
 * @param {any} initialValue - Initial value if not in storage
 * @returns {[any, Function]} State and setter
 */
export function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    if (typeof window === 'undefined') {
      return initialValue
    }
    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error)
      return initialValue
    }
  })

  const setValue = useCallback((value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value
      setStoredValue(valueToStore)
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore))
      }
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error)
    }
  }, [key, storedValue])

  const removeValue = useCallback(() => {
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(key)
      }
      setStoredValue(initialValue)
    } catch (error) {
      console.warn(`Error removing localStorage key "${key}":`, error)
    }
  }, [key, initialValue])

  return [storedValue, setValue, removeValue]
}

/**
 * Track previous value of a state
 * @param {any} value - Current value
 * @returns {any} Previous value
 */
export function usePrevious(value) {
  const ref = useRef()
  
  useEffect(() => {
    ref.current = value
  }, [value])

  return ref.current
}

/**
 * Run effect only on mount, not on updates
 * @param {Function} effect - Effect function
 */
export function useMount(effect) {
  useEffect(effect, [])
}

/**
 * Run cleanup only on unmount
 * @param {Function} cleanup - Cleanup function
 */
export function useUnmount(cleanup) {
  const cleanupRef = useRef(cleanup)
  cleanupRef.current = cleanup

  useEffect(() => {
    return () => cleanupRef.current()
  }, [])
}

/**
 * Boolean toggle hook
 * @param {boolean} initialValue - Initial boolean value
 * @returns {[boolean, Function, Function, Function]} Value and toggle functions
 */
export function useToggle(initialValue = false) {
  const [value, setValue] = useState(initialValue)

  const toggle = useCallback(() => setValue(v => !v), [])
  const setTrue = useCallback(() => setValue(true), [])
  const setFalse = useCallback(() => setValue(false), [])

  return [value, toggle, setTrue, setFalse]
}

/**
 * Copy text to clipboard
 * @returns {[boolean, Function]} Copied state and copy function
 */
export function useClipboard(resetDelay = 2000) {
  const [copied, setCopied] = useState(false)

  const copy = useCallback(async (text) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), resetDelay)
      return true
    } catch (error) {
      console.error('Failed to copy:', error)
      setCopied(false)
      return false
    }
  }, [resetDelay])

  return [copied, copy]
}

/**
 * Media query hook
 * @param {string} query - CSS media query
 * @returns {boolean} Whether query matches
 */
export function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia(query).matches
    }
    return false
  })

  useEffect(() => {
    if (typeof window === 'undefined') return

    const mediaQuery = window.matchMedia(query)
    const handler = (event) => setMatches(event.matches)

    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handler)
      return () => mediaQuery.removeEventListener('change', handler)
    }
    // Legacy browsers
    mediaQuery.addListener(handler)
    return () => mediaQuery.removeListener(handler)
  }, [query])

  return matches
}

/**
 * Responsive breakpoint hooks
 */
export function useIsMobile() {
  return useMediaQuery('(max-width: 639px)')
}

export function useIsTablet() {
  return useMediaQuery('(min-width: 640px) and (max-width: 1023px)')
}

export function useIsDesktop() {
  return useMediaQuery('(min-width: 1024px)')
}

/**
 * Window scroll position
 * @returns {{ x: number, y: number }} Scroll position
 */
export function useWindowScroll() {
  const [scroll, setScroll] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const handleScroll = () => {
      setScroll({ x: window.scrollX, y: window.scrollY })
    }

    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return scroll
}

/**
 * Element visibility in viewport
 * @param {Object} options - IntersectionObserver options
 * @returns {[ref, boolean]} Ref and visibility state
 */
export function useInView(options = {}) {
  const [inView, setInView] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const observer = new IntersectionObserver(([entry]) => {
      setInView(entry.isIntersecting)
    }, options)

    observer.observe(element)
    return () => observer.disconnect()
  }, [options.threshold, options.root, options.rootMargin])

  return [ref, inView]
}

/**
 * Document title setter
 * @param {string} title - Page title
 */
export function useDocumentTitle(title) {
  useEffect(() => {
    const previousTitle = document.title
    document.title = title

    return () => {
      document.title = previousTitle
    }
  }, [title])
}

/**
 * Async state management
 * @param {Function} asyncFunction - Async function to execute
 * @returns {{ execute, status, value, error }}
 */
export function useAsync(asyncFunction, immediate = false) {
  const [status, setStatus] = useState('idle')
  const [value, setValue] = useState(null)
  const [error, setError] = useState(null)

  const execute = useCallback(async (...args) => {
    setStatus('pending')
    setValue(null)
    setError(null)

    try {
      const response = await asyncFunction(...args)
      setValue(response)
      setStatus('success')
      return response
    } catch (err) {
      setError(err)
      setStatus('error')
      throw err
    }
  }, [asyncFunction])

  useEffect(() => {
    if (immediate) {
      execute()
    }
  }, [immediate])

  return { execute, status, value, error, isLoading: status === 'pending' }
}

/**
 * Interval hook
 * @param {Function} callback - Function to call
 * @param {number|null} delay - Delay in ms, null to stop
 */
export function useInterval(callback, delay) {
  const savedCallback = useRef(callback)

  useEffect(() => {
    savedCallback.current = callback
  }, [callback])

  useEffect(() => {
    if (delay === null) return

    const id = setInterval(() => savedCallback.current(), delay)
    return () => clearInterval(id)
  }, [delay])
}

/**
 * Keyboard shortcut hook
 * @param {string} key - Key combo (e.g., 'ctrl+k', 'escape')
 * @param {Function} callback - Handler function
 */
export function useKeyPress(key, callback) {
  useEffect(() => {
    const handler = (event) => {
      const keys = key.toLowerCase().split('+')
      const mainKey = keys[keys.length - 1]
      const modifiers = keys.slice(0, -1)

      const modifierMatch = modifiers.every(mod => {
        switch (mod) {
          case 'ctrl': return event.ctrlKey
          case 'alt': return event.altKey
          case 'shift': return event.shiftKey
          case 'meta': return event.metaKey
          default: return false
        }
      })

      if (modifierMatch && event.key.toLowerCase() === mainKey) {
        event.preventDefault()
        callback(event)
      }
    }

    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [key, callback])
}

export default {
  useDebounce,
  useLocalStorage,
  usePrevious,
  useMount,
  useUnmount,
  useToggle,
  useClipboard,
  useMediaQuery,
  useIsMobile,
  useIsTablet,
  useIsDesktop,
  useWindowScroll,
  useInView,
  useDocumentTitle,
  useAsync,
  useInterval,
  useKeyPress
}
