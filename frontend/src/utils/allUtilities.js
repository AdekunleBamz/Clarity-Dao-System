// PR 21-43: Theme, Color, Accessibility, and UI Utilities
import React from 'react'

// PR 21: Theme Manager
export const theme = {
  colors: {
    primary: '#6366f1', secondary: '#ec4899', success: '#10b981',
    warning: '#f59e0b', error: '#ef4444', info: '#3b82f6',
    light: '#f3f4f6', dark: '#111827'
  },
  spacing: { xs: '4px', sm: '8px', md: '16px', lg: '24px', xl: '32px' },
  breakpoints: { sm: '640px', md: '768px', lg: '1024px', xl: '1280px' }
}

// PR 22: Color Utilities
export const colorUtils = {
  lighten: (color, amount) => {
    const usePound = color[0] === '#'
    const col = usePound ? color.slice(1) : color
    const num = parseInt(col, 16)
    const r = Math.min(255, (num >> 16) + amount)
    const g = Math.min(255, (num >> 8 & 0x00FF) + amount)
    const b = Math.min(255, (num & 0x0000FF) + amount)
    return (usePound ? '#' : '') + (0x1000000 + r * 0x10000 + g * 0x100 + b).toString(16).slice(1)
  },
  darken: (color, amount) => colorUtils.lighten(color, -amount),
  setAlpha: (color, alpha) => color.replace(/^#/, '') + Math.round(alpha * 255).toString(16).padStart(2, '0')
}

// PR 23: Accessibility Utilities
export const a11y = {
  announceToScreenReader: (message) => {
    const div = document.createElement('div')
    div.setAttribute('role', 'status')
    div.setAttribute('aria-live', 'polite')
    div.textContent = message
    document.body.appendChild(div)
    setTimeout(() => div.remove(), 1000)
  },
  trapFocus: (element) => {
    const focusable = element.querySelectorAll('button, a, input, select, textarea')
    const first = focusable[0], last = focusable[focusable.length - 1]
    return (e) => {
      if (e.key === 'Tab') {
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
      }
    }
  }
}

// PR 24: Animation Utilities
export const animations = {
  fadeIn: 'fadeIn 300ms ease-in',
  slideInX: 'slideInX 400ms ease-out',
  slideInY: 'slideInY 400ms ease-out',
  bounce: 'bounce 600ms ease-in-out'
}

// PR 25: String Utilities
export const stringUtils = {
  truncate: (str, length) => str.length > length ? str.slice(0, length) + '...' : str,
  capitalize: (str) => str.charAt(0).toUpperCase() + str.slice(1),
  camelToKebab: (str) => str.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase(),
  kebabToCamel: (str) => str.replace(/-./g, c => c[1].toUpperCase())
}

// PR 26: Number Formatting
export const numberUtils = {
  formatCurrency: (num, currency = 'USD') => new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(num),
  formatNumber: (num) => num.toLocaleString(),
  abbreviate: (num) => {
    const units = ['', 'K', 'M', 'B']
    let unitIndex = 0
    while (Math.abs(num) >= 1000 && unitIndex < units.length - 1) { num /= 1000; unitIndex++ }
    return (Math.round(num * 100) / 100) + units[unitIndex]
  }
}

// PR 27: Array Utilities
export const arrayUtils = {
  unique: (arr) => [...new Set(arr)],
  chunk: (arr, size) => Array.from({ length: Math.ceil(arr.length / size) }, (_, i) => arr.slice(i * size, i * size + size)),
  flatten: (arr) => arr.flat(Infinity),
  groupBy: (arr, key) => arr.reduce((acc, obj) => { (acc[obj[key]] = acc[obj[key]] || []).push(obj); return acc }, {})
}

// PR 28: Object Utilities
export const objectUtils = {
  pick: (obj, keys) => keys.reduce((acc, k) => ({ ...acc, [k]: obj[k] }), {}),
  omit: (obj, keys) => Object.fromEntries(Object.entries(obj).filter(([k]) => !keys.includes(k))),
  merge: (...objs) => Object.assign({}, ...objs),
  deepClone: (obj) => JSON.parse(JSON.stringify(obj))
}

// PR 29: CSS Class Builder
export function clsx(...classes) {
  return classes.filter(Boolean).join(' ')
}

// PR 30: Media Query Hook
export function useMediaQuery(query) {
  const [matches, setMatches] = React.useState(false)
  React.useEffect(() => {
    const media = window.matchMedia(query)
    media.addEventListener('change', () => setMatches(media.matches))
    setMatches(media.matches)
  }, [query])
  return matches
}

// PR 31: Click Outside Hook
export function useClickOutside(ref, callback) {
  React.useEffect(() => {
    const handler = (e) => ref.current && !ref.current.contains(e.target) && callback()
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [ref, callback])
}

// PR 32: Keyboard Shortcut Hook
export function useKeyboardShortcut(key, callback) {
  React.useEffect(() => {
    const handler = (e) => e.key === key && callback()
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [key, callback])
}

// PR 33: Intersection Observer Hook
export function useIntersectionObserver(ref) {
  const [isVisible, setIsVisible] = React.useState(false)
  React.useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => setIsVisible(entry.isIntersecting))
    ref.current && observer.observe(ref.current)
    return () => observer.disconnect()
  }, [ref])
  return isVisible
}

// PR 34: Fetch Hook
export function useFetch(url) {
  const [data, setData] = React.useState(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState(null)

  React.useEffect(() => {
    fetch(url).then(r => r.json()).then(setData).catch(setError).finally(() => setLoading(false))
  }, [url])

  return { data, loading, error }
}

// PR 35: Mount Effect
export function useMounted() {
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => setMounted(true), [])
  return mounted
}

// PR 36: State History
export function useStateHistory(initialValue) {
  const [value, setValue] = React.useState(initialValue)
  const [history, setHistory] = React.useState([initialValue])
  const [index, setIndex] = React.useState(0)

  const handleChange = (newValue) => {
    setValue(newValue)
    setHistory([...history.slice(0, index + 1), newValue])
    setIndex(index + 1)
  }

  return {
    value, setValue: handleChange, history,
    undo: () => { setIndex(Math.max(0, index - 1)); setValue(history[Math.max(0, index - 1)]) },
    redo: () => { setIndex(Math.min(history.length - 1, index + 1)); setValue(history[Math.min(history.length - 1, index + 1)]) }
  }
}

// PR 37: Focus Lock Hook
export function useFocusLock(ref, enabled = true) {
  React.useEffect(() => {
    if (!enabled) return
    const observer = new MutationObserver(() => {
      const focusable = ref.current?.querySelectorAll('[tabindex], button, a, input')
      focusable?.length && focusable[0].focus()
    })
    ref.current && observer.observe(ref.current, { subtree: true, childList: true })
    return () => observer.disconnect()
  }, [ref, enabled])
}

// PR 38: Lazy Load Component
export function lazy(importFn) {
  return React.lazy(importFn)
}

// PR 39: Promise State Hook
export function usePromise(promise) {
  const [state, setState] = React.useState('pending')
  React.useEffect(() => {
    promise.then(() => setState('resolved')).catch(() => setState('rejected'))
  }, [promise])
  return state
}

// PR 40: Deep Memo
export function useDeepMemo(factory, deps) {
  const ref = React.useRef()
  const [prevDeps, setPrevDeps] = React.useState(deps)

  if (JSON.stringify(deps) !== JSON.stringify(prevDeps)) {
    ref.current = factory()
    setPrevDeps(deps)
  }

  return ref.current
}

// PR 41: Request Animation Frame Hook
export function useAnimationFrame(callback) {
  const ref = React.useRef()
  React.useEffect(() => {
    const animate = () => { callback(); ref.current = requestAnimationFrame(animate) }
    ref.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(ref.current)
  }, [callback])
}

// PR 42: Raf State
export function useRafState(initialValue) {
  const [state, setState] = React.useState(initialValue)
  const ref = React.useRef()

  const setRafState = React.useCallback((value) => {
    cancelAnimationFrame(ref.current)
    ref.current = requestAnimationFrame(() => setState(value))
  }, [])

  return [state, setRafState]
}

// PR 43: Ref State
export function useRefState(initialValue) {
  const [state, setState] = React.useState(initialValue)
  const ref = React.useRef(state)

  const setRefState = React.useCallback((value) => {
    ref.current = value
    setState(value)
  }, [])

  return [state, setRefState, ref]
}
