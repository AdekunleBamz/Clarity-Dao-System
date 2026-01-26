import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'

const POSITIONS = {
  top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
  bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
  left: 'right-full top-1/2 -translate-y-1/2 mr-2',
  right: 'left-full top-1/2 -translate-y-1/2 ml-2',
}

const ARROW_POSITIONS = {
  top: 'top-full left-1/2 -translate-x-1/2 border-t-gray-900 dark:border-t-gray-700 border-l-transparent border-r-transparent border-b-transparent',
  bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-gray-900 dark:border-b-gray-700 border-l-transparent border-r-transparent border-t-transparent',
  left: 'left-full top-1/2 -translate-y-1/2 border-l-gray-900 dark:border-l-gray-700 border-t-transparent border-b-transparent border-r-transparent',
  right: 'right-full top-1/2 -translate-y-1/2 border-r-gray-900 dark:border-r-gray-700 border-t-transparent border-b-transparent border-l-transparent',
}

export default function Tooltip({
  children,
  content,
  position = 'top',
  delay = 200,
  disabled = false,
  className = '',
}) {
  const [isVisible, setIsVisible] = useState(false)
  const [coords, setCoords] = useState({ top: 0, left: 0 })
  const triggerRef = useRef(null)
  const tooltipRef = useRef(null)
  const timeoutRef = useRef(null)

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  const showTooltip = () => {
    if (disabled) return
    timeoutRef.current = setTimeout(() => {
      if (triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect()
        setCoords({
          top: rect.top + window.scrollY,
          left: rect.left + window.scrollX,
          width: rect.width,
          height: rect.height,
        })
      }
      setIsVisible(true)
    }, delay)
  }

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    setIsVisible(false)
  }

  if (!content) {
    return children
  }

  return (
    <>
      <span
        ref={triggerRef}
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        onFocus={showTooltip}
        onBlur={hideTooltip}
        className={`inline-block ${className}`}
      >
        {children}
      </span>
      
      {isVisible && createPortal(
        <div
          ref={tooltipRef}
          role="tooltip"
          className="fixed z-50 pointer-events-none"
          style={{
            top: position === 'bottom' ? coords.top + coords.height + 8 :
                 position === 'top' ? coords.top - 8 :
                 coords.top + coords.height / 2,
            left: position === 'right' ? coords.left + coords.width + 8 :
                  position === 'left' ? coords.left - 8 :
                  coords.left + coords.width / 2,
            transform: position === 'top' ? 'translate(-50%, -100%)' :
                       position === 'bottom' ? 'translate(-50%, 0)' :
                       position === 'left' ? 'translate(-100%, -50%)' :
                       'translate(0, -50%)',
          }}
        >
          <div className="px-3 py-2 text-sm text-white bg-gray-900 dark:bg-gray-700 rounded-lg shadow-lg whitespace-nowrap">
            {content}
          </div>
        </div>,
        document.body
      )}
    </>
  )
}

/**
 * Info tooltip with icon
 */
export function InfoTooltip({ content, iconSize = 'sm' }) {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  }

  return (
    <Tooltip content={content}>
      <svg
        className={`${sizes[iconSize]} text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-help inline-block`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    </Tooltip>
  )
}

/**
 * Tooltip for addresses with copy functionality
 */
export function AddressTooltip({ address, children }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(address)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  return (
    <Tooltip
      content={
        <span className="flex items-center gap-2">
          <span className="font-mono">{address}</span>
          <button onClick={handleCopy} className="pointer-events-auto">
            {copied ? '✓' : '📋'}
          </button>
        </span>
      }
    >
      {children}
    </Tooltip>
  )
}

/**
 * Simple inline tooltip
 */
export function SimpleTooltip({ text, children, position = 'top' }) {
  return (
    <span className="relative group inline-block">
      {children}
      <span
        className={`absolute ${POSITIONS[position]} z-50 px-2 py-1 text-xs text-white bg-gray-900 dark:bg-gray-700 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none`}
      >
        {text}
        <span
          className={`absolute ${ARROW_POSITIONS[position]} border-4`}
        />
      </span>
    </span>
  )
}
