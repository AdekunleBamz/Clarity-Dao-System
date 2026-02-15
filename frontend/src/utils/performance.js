/**
 * PR 7: Debounce & Throttle Utilities
 * Performance optimization helpers
 */
export function debounce(fn, delayMs) {
  let timeoutId
  return function debounced(...args) {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => fn(...args), delayMs)
  }
}

export function throttle(fn, intervalMs) {
  let lastCallTime = 0
  return function throttled(...args) {
    const now = Date.now()
    if (now - lastCallTime >= intervalMs) {
      fn(...args)
      lastCallTime = now
    }
  }
}

export function useDebounce(fn, delayMs) {
  const [debouncedFn] = React.useState(() => debounce(fn, delayMs))
  return debouncedFn
}
