import { useState, useRef, useEffect, useCallback, cloneElement } from 'react'
import { createPortal } from 'react-dom'

/**
 * Calculate tooltip position relative to trigger element
 */
function calculatePosition(triggerRect, tooltipRect, position, offset = 8) {
  const positions = {
    top: {
      top: triggerRect.top - tooltipRect.height - offset,
      left: triggerRect.left + (triggerRect.width - tooltipRect.width) / 2,
    },
    bottom: {
      top: triggerRect.bottom + offset,
      left: triggerRect.left + (triggerRect.width - tooltipRect.width) / 2,
    },
    left: {
      top: triggerRect.top + (triggerRect.height - tooltipRect.height) / 2,
      left: triggerRect.left - tooltipRect.width - offset,
    },
    right: {
      top: triggerRect.top + (triggerRect.height - tooltipRect.height) / 2,
      left: triggerRect.right + offset,
    },
    'top-start': {
      top: triggerRect.top - tooltipRect.height - offset,
      left: triggerRect.left,
    },
    'top-end': {
      top: triggerRect.top - tooltipRect.height - offset,
      left: triggerRect.right - tooltipRect.width,
    },
    'bottom-start': {
      top: triggerRect.bottom + offset,
      left: triggerRect.left,
    },
    'bottom-end': {
      top: triggerRect.bottom + offset,
      left: triggerRect.right - tooltipRect.width,
    },
  }

  let pos = positions[position] || positions.top
  
  // Ensure tooltip stays within viewport
  const viewportWidth = window.innerWidth
  const viewportHeight = window.innerHeight
  
  // Horizontal bounds
  if (pos.left < 8) pos.left = 8
  if (pos.left + tooltipRect.width > viewportWidth - 8) {
    pos.left = viewportWidth - tooltipRect.width - 8
  }
  
  // Vertical bounds - flip if necessary
  if (pos.top < 8 && position.startsWith('top')) {
    pos = calculatePosition(triggerRect, tooltipRect, position.replace('top', 'bottom'), offset)
  } else if (pos.top + tooltipRect.height > viewportHeight - 8 && position.startsWith('bottom')) {
    pos = calculatePosition(triggerRect, tooltipRect, position.replace('bottom', 'top'), offset)
  }

  return pos
}

/**
 * Get arrow styles based on position
 */
function getArrowStyles(position) {
  const arrowBase = {
    position: 'absolute',
    width: 0,
    height: 0,
    borderStyle: 'solid',
  }

  const arrowStyles = {
    top: {
      ...arrowBase,
      bottom: '-6px',
      left: '50%',
      transform: 'translateX(-50%)',
      borderWidth: '6px 6px 0 6px',
      borderColor: 'rgb(17 24 39) transparent transparent transparent',
    },
    bottom: {
      ...arrowBase,
      top: '-6px',
      left: '50%',
      transform: 'translateX(-50%)',
      borderWidth: '0 6px 6px 6px',
      borderColor: 'transparent transparent rgb(17 24 39) transparent',
    },
    left: {
      ...arrowBase,
      right: '-6px',
      top: '50%',
      transform: 'translateY(-50%)',
      borderWidth: '6px 0 6px 6px',
      borderColor: 'transparent transparent transparent rgb(17 24 39)',
    },
    right: {
      ...arrowBase,
      left: '-6px',
      top: '50%',
      transform: 'translateY(-50%)',
      borderWidth: '6px 6px 6px 0',
      borderColor: 'transparent rgb(17 24 39) transparent transparent',
    },
  }

  const basePosition = position.split('-')[0]
  return arrowStyles[basePosition] || arrowStyles.top
}

/**
 * Tooltip component
 */
export default function Tooltip({
  children,
  content,
  position = 'top',
  delay = 200,
  offset = 8,
  disabled = false,
  showArrow = true,
  className = '',
  maxWidth = 250,
}) {
  const [isVisible, setIsVisible] = useState(false)
  const [coords, setCoords] = useState({ top: 0, left: 0 })
  const triggerRef = useRef(null)
  const tooltipRef = useRef(null)
  const timeoutRef = useRef(null)

  const showTooltip = useCallback(() => {
    if (disabled) return
    
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true)
    }, delay)
  }, [delay, disabled])

  const hideTooltip = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    setIsVisible(false)
  }, [])

  // Update position when visible
  useEffect(() => {
    if (!isVisible || !triggerRef.current || !tooltipRef.current) return

    const updatePosition = () => {
      const triggerRect = triggerRef.current.getBoundingClientRect()
      const tooltipRect = tooltipRef.current.getBoundingClientRect()
      const newCoords = calculatePosition(triggerRect, tooltipRect, position, offset)
      setCoords(newCoords)
    }

    updatePosition()
    
    window.addEventListener('scroll', updatePosition, true)
    window.addEventListener('resize', updatePosition)

    return () => {
      window.removeEventListener('scroll', updatePosition, true)
      window.removeEventListener('resize', updatePosition)
    }
  }, [isVisible, position, offset])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  // Clone child and add event handlers
  const trigger = cloneElement(children, {
    ref: triggerRef,
    onMouseEnter: (e) => {
      showTooltip()
      children.props.onMouseEnter?.(e)
    },
    onMouseLeave: (e) => {
      hideTooltip()
      children.props.onMouseLeave?.(e)
    },
    onFocus: (e) => {
      showTooltip()
      children.props.onFocus?.(e)
    },
    onBlur: (e) => {
      hideTooltip()
      children.props.onBlur?.(e)
    },
    'aria-describedby': isVisible ? 'tooltip' : undefined,
  })

  return (
    <>
      {trigger}
      {isVisible && content && createPortal(
        <div
          ref={tooltipRef}
          id="tooltip"
          role="tooltip"
          style={{
            position: 'fixed',
            top: coords.top,
            left: coords.left,
            zIndex: 9999,
            maxWidth,
          }}
          className={`px-3 py-2 text-sm text-white bg-gray-900 rounded-lg shadow-lg animate-fadeIn ${className}`}
        >
          {content}
          {showArrow && <div style={getArrowStyles(position)} />}
        </div>,
        document.body
      )}
    </>
  )
}

/**
 * Info tooltip with icon
 */
export function InfoTooltip({ content, position = 'top', className = '' }) {
  return (
    <Tooltip content={content} position={position}>
      <button
        type="button"
        className={`inline-flex items-center justify-center w-4 h-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors ${className}`}
        aria-label="More information"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
            clipRule="evenodd"
          />
        </svg>
      </button>
    </Tooltip>
  )
}

/**
 * Truncated text with tooltip showing full text
 */
export function TruncatedText({ text, maxLength = 20, className = '' }) {
  if (!text || text.length <= maxLength) {
    return <span className={className}>{text}</span>
  }

  const truncated = `${text.slice(0, maxLength)}...`

  return (
    <Tooltip content={text} maxWidth={400}>
      <span className={`cursor-help ${className}`}>{truncated}</span>
    </Tooltip>
  )
}

/**
 * Address tooltip for Stacks addresses
 */
export function AddressTooltip({ address, className = '' }) {
  if (!address) return null

  const truncated = `${address.slice(0, 6)}...${address.slice(-4)}`

  return (
    <Tooltip
      content={
        <div className="font-mono text-xs break-all">
          {address}
          <p className="mt-1 text-gray-400">Click to copy</p>
        </div>
      }
      maxWidth={350}
    >
      <button
        onClick={() => navigator.clipboard.writeText(address)}
        className={`font-mono text-sm text-purple-600 dark:text-purple-400 hover:underline ${className}`}
      >
        {truncated}
      </button>
    </Tooltip>
  )
}
