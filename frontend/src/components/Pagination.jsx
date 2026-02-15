import { useState, useMemo, useCallback } from 'react'

/**
 * Generate page numbers array with ellipsis
 */
function generatePageNumbers(currentPage, totalPages, maxVisible = 7) {
  if (totalPages <= maxVisible) {
    return Array.from({ length: totalPages }, (_, i) => i + 1)
  }

  const pages = []
  const halfVisible = Math.floor((maxVisible - 3) / 2)

  // Always show first page
  pages.push(1)

  if (currentPage <= halfVisible + 2) {
    // Near start: show first pages + ellipsis + last
    for (let i = 2; i <= maxVisible - 2; i++) {
      pages.push(i)
    }
    pages.push('...')
    pages.push(totalPages)
  } else if (currentPage >= totalPages - halfVisible - 1) {
    // Near end: show first + ellipsis + last pages
    pages.push('...')
    for (let i = totalPages - maxVisible + 3; i <= totalPages; i++) {
      pages.push(i)
    }
  } else {
    // Middle: show first + ellipsis + middle pages + ellipsis + last
    pages.push('...')
    for (let i = currentPage - halfVisible; i <= currentPage + halfVisible; i++) {
      pages.push(i)
    }
    pages.push('...')
    pages.push(totalPages)
  }

  return pages
}

/**
 * Page button component
 */
function PageButton({ page, isActive, isDisabled, onClick, ariaLabel }) {
  const baseClasses = 'relative inline-flex items-center justify-center min-w-[40px] h-10 px-3 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900'
  
  if (page === '...') {
    return (
      <span className={`${baseClasses} text-gray-400 dark:text-gray-500 cursor-default`}>
        ...
      </span>
    )
  }

  return (
    <button
      onClick={() => onClick(page)}
      disabled={isDisabled}
      aria-label={ariaLabel || `Go to page ${page}`}
      aria-current={isActive ? 'page' : undefined}
      className={`${baseClasses} rounded-lg ${
        isActive
          ? 'bg-purple-600 text-white shadow-sm'
          : isDisabled
          ? 'text-gray-300 dark:text-gray-700 cursor-not-allowed'
          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
      }`}
    >
      {page}
    </button>
  )
}

/**
 * Navigation arrow button
 */
function NavButton({ direction, onClick, disabled, children }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={direction === 'prev' ? 'Go to previous page' : 'Go to next page'}
      className={`relative inline-flex items-center justify-center h-10 px-3 text-sm font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 ${
        disabled
          ? 'text-gray-300 dark:text-gray-700 cursor-not-allowed'
          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
      }`}
    >
      {children}
    </button>
  )
}

/**
 * Items per page selector
 */
function PageSizeSelector({ pageSize, onPageSizeChange, options = [10, 20, 50, 100] }) {
  return (
    <div className="flex items-center gap-2">
      <label htmlFor="pageSize" className="text-sm text-gray-500 dark:text-gray-400">
        Show
      </label>
      <select
        id="pageSize"
        value={pageSize}
        onChange={(e) => onPageSizeChange(Number(e.target.value))}
        className="px-2 py-1 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
      >
        {options.map((size) => (
          <option key={size} value={size}>
            {size}
          </option>
        ))}
      </select>
      <span className="text-sm text-gray-500 dark:text-gray-400">per page</span>
    </div>
  )
}

/**
 * Pagination info text
 */
function PaginationInfo({ currentPage, pageSize, totalItems }) {
  const start = (currentPage - 1) * pageSize + 1
  const end = Math.min(currentPage * pageSize, totalItems)

  return (
    <p className="text-sm text-gray-500 dark:text-gray-400">
      Showing <span className="font-medium text-gray-700 dark:text-gray-300">{start}</span> to{' '}
      <span className="font-medium text-gray-700 dark:text-gray-300">{end}</span> of{' '}
      <span className="font-medium text-gray-700 dark:text-gray-300">{totalItems.toLocaleString()}</span> results
    </p>
  )
}

/**
 * Main Pagination component
 */
export default function Pagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  showInfo = true,
  showPageSize = true,
  maxVisiblePages = 7,
  className = '',
}) {
  const pages = useMemo(
    () => generatePageNumbers(currentPage, totalPages, maxVisiblePages),
    [currentPage, totalPages, maxVisiblePages]
  )

  const handlePrevious = useCallback(() => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1)
    }
  }, [currentPage, onPageChange])

  const handleNext = useCallback(() => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1)
    }
  }, [currentPage, totalPages, onPageChange])

  if (totalPages <= 1) {
    return showInfo ? (
      <div className={`flex items-center justify-between ${className}`}>
        <PaginationInfo currentPage={1} pageSize={pageSize} totalItems={totalItems} />
      </div>
    ) : null
  }

  return (
    <nav
      role="navigation"
      aria-label="Pagination"
      className={`flex flex-col sm:flex-row items-center justify-between gap-4 ${className}`}
    >
      {/* Left side: Info and page size */}
      <div className="flex items-center gap-4">
        {showInfo && (
          <PaginationInfo
            currentPage={currentPage}
            pageSize={pageSize}
            totalItems={totalItems}
          />
        )}
        {showPageSize && onPageSizeChange && (
          <PageSizeSelector
            pageSize={pageSize}
            onPageSizeChange={onPageSizeChange}
          />
        )}
      </div>

      {/* Right side: Page navigation */}
      <div className="flex items-center gap-1">
        <NavButton
          direction="prev"
          onClick={handlePrevious}
          disabled={currentPage === 1}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </NavButton>

        <div className="hidden sm:flex items-center gap-1">
          {pages.map((page, index) => (
            <PageButton
              key={`${page}-${index}`}
              page={page}
              isActive={page === currentPage}
              onClick={onPageChange}
            />
          ))}
        </div>

        {/* Mobile: Simple current/total display */}
        <div className="sm:hidden px-4 text-sm text-gray-700 dark:text-gray-300">
          Page {currentPage} of {totalPages}
        </div>

        <NavButton
          direction="next"
          onClick={handleNext}
          disabled={currentPage === totalPages}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </NavButton>
      </div>
    </nav>
  )
}

/**
 * Simple pagination for compact layouts
 */
export function SimplePagination({ currentPage, totalPages, onPageChange }) {
  return (
    <div className="flex items-center justify-center gap-2">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <span className="text-sm text-gray-600 dark:text-gray-400">
        {currentPage} / {totalPages}
      </span>
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  )
}

/**
 * Hook for pagination state management
 */
export function usePagination({ totalItems, initialPage = 1, initialPageSize = 20 }) {
  const [currentPage, setCurrentPage] = useState(initialPage)
  const [pageSize, setPageSize] = useState(initialPageSize)

  const totalPages = useMemo(
    () => Math.ceil(totalItems / pageSize),
    [totalItems, pageSize]
  )

  const handlePageChange = useCallback((page) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)))
  }, [totalPages])

  const handlePageSizeChange = useCallback((size) => {
    setPageSize(size)
    setCurrentPage(1) // Reset to first page when changing page size
  }, [])

  const paginatedItems = useCallback(
    (items) => {
      const start = (currentPage - 1) * pageSize
      return items.slice(start, start + pageSize)
    },
    [currentPage, pageSize]
  )

  return {
    currentPage,
    pageSize,
    totalPages,
    setCurrentPage: handlePageChange,
    setPageSize: handlePageSizeChange,
    paginatedItems,
    paginationProps: {
      currentPage,
      totalPages,
      totalItems,
      pageSize,
      onPageChange: handlePageChange,
      onPageSizeChange: handlePageSizeChange,
    },
  }
}
