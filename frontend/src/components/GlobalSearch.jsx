import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'

/**
 * Search categories with their configurations
 */
const SEARCH_CATEGORIES = [
  {
    id: 'proposals',
    label: 'Proposals',
    icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
    path: '/governance',
  },
  {
    id: 'bounties',
    label: 'Bounties',
    icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01',
    path: '/bounties',
  },
  {
    id: 'members',
    label: 'Members',
    icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z',
    path: '/membership',
  },
  {
    id: 'transactions',
    label: 'Transactions',
    icon: 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z',
    path: '/',
  },
]

/**
 * Quick actions for keyboard shortcuts
 */
const QUICK_ACTIONS = [
  { id: 'new-proposal', label: 'Create Proposal', shortcut: 'p', path: '/governance?action=new' },
  { id: 'stake', label: 'Stake Tokens', shortcut: 's', path: '/staking' },
  { id: 'vote', label: 'Vote on Proposals', shortcut: 'v', path: '/governance' },
  { id: 'settings', label: 'Settings', shortcut: ',', path: '/settings' },
]

/**
 * Search result item component
 */
function SearchResult({ result, isSelected, onClick }) {
  const category = SEARCH_CATEGORIES.find((c) => c.id === result.category)

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center px-4 py-3 text-left transition-colors ${
        isSelected
          ? 'bg-purple-50 dark:bg-purple-900/20'
          : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
      }`}
    >
      <div className={`p-2 rounded-lg mr-3 ${
        isSelected
          ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
          : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
      }`}>
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={category?.icon} />
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <p className={`font-medium truncate ${
          isSelected
            ? 'text-purple-900 dark:text-purple-100'
            : 'text-gray-900 dark:text-white'
        }`}>
          {result.title}
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
          {result.description}
        </p>
      </div>
      <span className="ml-2 text-xs text-gray-400 dark:text-gray-500 uppercase">
        {category?.label}
      </span>
    </button>
  )
}

/**
 * Quick action item component
 */
function QuickAction({ action, isSelected, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-between px-4 py-2 text-left transition-colors ${
        isSelected
          ? 'bg-purple-50 dark:bg-purple-900/20'
          : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
      }`}
    >
      <span className="text-gray-700 dark:text-gray-300">{action.label}</span>
      <kbd className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded">
        ⌘{action.shortcut.toUpperCase()}
      </kbd>
    </button>
  )
}

/**
 * Main GlobalSearch component
 */
export default function GlobalSearch({ isOpen, onClose }) {
  const navigate = useNavigate()
  const inputRef = useRef(null)
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [activeCategory, setActiveCategory] = useState('all')

  // Mock search results - in real app, fetch from API
  const searchResults = useMemo(() => {
    if (!query.trim()) return []

    const lowerQuery = query.toLowerCase()
    
    // Mock data - replace with real API call
    const mockResults = [
      { id: '1', title: 'Treasury Allocation Q1 2025', description: 'Proposal for Q1 budget allocation', category: 'proposals' },
      { id: '2', title: 'Frontend Development Bounty', description: '500 STX reward for UI improvements', category: 'bounties' },
      { id: '3', title: 'Smart Contract Audit', description: 'Security audit for v5.1 contracts', category: 'bounties' },
      { id: '4', title: 'Governance Parameter Update', description: 'Adjust voting thresholds', category: 'proposals' },
      { id: '5', title: 'Community Member Badge', description: 'NFT tier 2 membership', category: 'members' },
    ]

    return mockResults.filter(
      (r) =>
        (activeCategory === 'all' || r.category === activeCategory) &&
        (r.title.toLowerCase().includes(lowerQuery) ||
          r.description.toLowerCase().includes(lowerQuery))
    )
  }, [query, activeCategory])

  // Combined results for navigation
  const allItems = useMemo(() => {
    if (query.trim()) {
      return searchResults.map((r) => ({ type: 'result', data: r }))
    }
    return QUICK_ACTIONS.map((a) => ({ type: 'action', data: a }))
  }, [query, searchResults])

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
      setQuery('')
      setSelectedIndex(0)
    }
  }, [isOpen])

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setSelectedIndex((prev) => Math.min(prev + 1, allItems.length - 1))
          break
        case 'ArrowUp':
          e.preventDefault()
          setSelectedIndex((prev) => Math.max(prev - 1, 0))
          break
        case 'Enter':
          e.preventDefault()
          if (allItems[selectedIndex]) {
            handleSelect(allItems[selectedIndex])
          }
          break
        case 'Escape':
          onClose()
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, selectedIndex, allItems, onClose])

  // Handle selection
  const handleSelect = useCallback((item) => {
    if (item.type === 'result') {
      const category = SEARCH_CATEGORIES.find((c) => c.id === item.data.category)
      navigate(`${category?.path}?id=${item.data.id}`)
    } else {
      navigate(item.data.path)
    }
    onClose()
  }, [navigate, onClose])

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
        onClick={onClose}
      />

      {/* Search Modal */}
      <div className="fixed inset-x-4 top-[10%] mx-auto max-w-2xl z-50">
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-800">
          {/* Search Input */}
          <div className="flex items-center px-4 border-b border-gray-200 dark:border-gray-800">
            <svg
              className="w-5 h-5 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search proposals, bounties, members..."
              className="flex-1 px-4 py-4 text-lg bg-transparent text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none"
            />
            <kbd className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-800 text-gray-400 rounded">
              ESC
            </kbd>
          </div>

          {/* Category Filters */}
          <div className="flex items-center gap-2 px-4 py-2 border-b border-gray-100 dark:border-gray-800">
            <button
              onClick={() => setActiveCategory('all')}
              className={`px-3 py-1 text-sm rounded-full transition-colors ${
                activeCategory === 'all'
                  ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              All
            </button>
            {SEARCH_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-3 py-1 text-sm rounded-full transition-colors ${
                  activeCategory === cat.id
                    ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Results */}
          <div className="max-h-[400px] overflow-y-auto">
            {query.trim() ? (
              searchResults.length > 0 ? (
                <div className="py-2">
                  {searchResults.map((result, index) => (
                    <SearchResult
                      key={result.id}
                      result={result}
                      isSelected={index === selectedIndex}
                      onClick={() => handleSelect({ type: 'result', data: result })}
                    />
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center">
                  <svg
                    className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-700"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <p className="mt-4 text-gray-500 dark:text-gray-400">
                    No results found for "{query}"
                  </p>
                </div>
              )
            ) : (
              <div className="py-2">
                <p className="px-4 py-2 text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                  Quick Actions
                </p>
                {QUICK_ACTIONS.map((action, index) => (
                  <QuickAction
                    key={action.id}
                    action={action}
                    isSelected={index === selectedIndex}
                    onClick={() => handleSelect({ type: 'action', data: action })}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-800/50 text-xs text-gray-400 dark:text-gray-500 border-t border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">↑</kbd>
                <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">↓</kbd>
                to navigate
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">↵</kbd>
                to select
              </span>
            </div>
            <span>⌘K to open</span>
          </div>
        </div>
      </div>
    </>
  )
}

/**
 * Hook to handle global search keyboard shortcut
 */
export function useGlobalSearch() {
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setIsOpen((prev) => !prev)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  return {
    isOpen,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
    toggle: () => setIsOpen((prev) => !prev),
  }
}
