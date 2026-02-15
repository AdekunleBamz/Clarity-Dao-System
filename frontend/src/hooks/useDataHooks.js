// PR 11: Pagination Hook
export function usePagination(items, itemsPerPage = 10) {
  const [currentPage, setCurrentPage] = React.useState(1)
  const totalPages = Math.ceil(items.length / itemsPerPage)
  const startIdx = (currentPage - 1) * itemsPerPage
  const endIdx = startIdx + itemsPerPage
  const paginatedItems = items.slice(startIdx, endIdx)

  return { currentPage, setCurrentPage, totalPages, paginatedItems, itemsPerPage }
}

// PR 12: Search Hook
export function useSearch(items, searchField) {
  const [query, setQuery] = React.useState('')
  const results = React.useMemo(() => {
    if (!query) return items
    return items.filter(item => String(item[searchField]).toLowerCase().includes(query.toLowerCase()))
  }, [query, items, searchField])

  return { query, setQuery, results }
}

// PR 13: Filter Hook
export function useFilter(items, filterFn) {
  const [filters, setFilters] = React.useState({})
  const filtered = React.useMemo(() => {
    return items.filter(item => filterFn(item, filters))
  }, [items, filters, filterFn])

  return { filters, setFilters, filtered }
}

// PR 14: Sort Hook
export function useSort(items, defaultField = null) {
  const [sortBy, setSortBy] = React.useState(defaultField)
  const [sortOrder, setSortOrder] = React.useState('asc')

  const sorted = React.useMemo(() => {
    if (!sortBy) return items
    const copy = [...items]
    copy.sort((a, b) => {
      const aVal = a[sortBy]
      const bVal = b[sortBy]
      return sortOrder === 'asc' ? (aVal > bVal ? 1 : -1) : (aVal < bVal ? 1 : -1)
    })
    return copy
  }, [items, sortBy, sortOrder])

  return { sorted, sortBy, setSortBy, sortOrder, setSortOrder }
}

// PR 15: Async State Hook
export function useAsync(asyncFn, immediate = true) {
  const [state, setState] = React.useState({ status: 'idle', data: null, error: null })

  const execute = React.useCallback(async () => {
    setState({ status: 'pending', data: null, error: null })
    try {
      const result = await asyncFn()
      setState({ status: 'success', data: result, error: null })
      return result
    } catch (error) {
      setState({ status: 'error', data: null, error })
    }
  }, [asyncFn])

  React.useEffect(() => {
    if (immediate) execute()
  }, [execute, immediate])

  return { ...state, execute }
}

// PR 16: Window Size Hook
export function useWindowSize() {
  const [size, setSize] = React.useState({ width: 0, height: 0 })

  React.useEffect(() => {
    const handleResize = () => {
      setSize({ width: window.innerWidth, height: window.innerHeight })
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return size
}

// PR 17: Previous Value Hook
export function usePrevious(value) {
  const ref = React.useRef()
  React.useEffect(() => { ref.current = value }, [value])
  return ref.current
}

// PR 18: Toggle Hook
export function useToggle(initialValue = false) {
  const [value, setValue] = React.useState(initialValue)
  const toggle = React.useCallback(() => setValue(v => !v), [])
  return [value, toggle]
}

// PR 19: Counter Hook
export function useCounter(initialValue = 0) {
  const [count, setCount] = React.useState(initialValue)
  return {
    count,
    increment: () => setCount(c => c + 1),
    decrement: () => setCount(c => c - 1),
    reset: () => setCount(initialValue),
    set: (value) => setCount(value)
  }
}

// PR 20: Local State Hook
export function useLocalStorage(key, initialValue) {
  const [state, setState] = React.useState(() => {
    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch {
      return initialValue
    }
  })

  const setValue = React.useCallback((value) => {
    try {
      setState(value)
      window.localStorage.setItem(key, JSON.stringify(value))
    } catch (e) {
      console.error(e)
    }
  }, [key])

  return [state, setValue]
}
