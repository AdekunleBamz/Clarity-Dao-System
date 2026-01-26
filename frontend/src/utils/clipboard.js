import { useState, useCallback } from 'react'

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text) {
  if (!text) return false
  
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text)
      return true
    }
    
    // Fallback for older browsers
    const textArea = document.createElement('textarea')
    textArea.value = text
    textArea.style.position = 'fixed'
    textArea.style.left = '-999999px'
    textArea.style.top = '-999999px'
    document.body.appendChild(textArea)
    textArea.focus()
    textArea.select()
    
    const successful = document.execCommand('copy')
    document.body.removeChild(textArea)
    return successful
  } catch (err) {
    console.error('Failed to copy:', err)
    return false
  }
}

/**
 * Read text from clipboard
 */
export async function readFromClipboard() {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      return await navigator.clipboard.readText()
    }
    return null
  } catch (err) {
    console.error('Failed to read clipboard:', err)
    return null
  }
}

/**
 * Hook for copy-to-clipboard functionality
 */
export function useCopyToClipboard(timeout = 2000) {
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState(null)

  const copy = useCallback(async (text) => {
    setError(null)
    
    try {
      const success = await copyToClipboard(text)
      if (success) {
        setCopied(true)
        setTimeout(() => setCopied(false), timeout)
      } else {
        setError('Failed to copy')
      }
      return success
    } catch (err) {
      setError(err.message)
      return false
    }
  }, [timeout])

  const reset = useCallback(() => {
    setCopied(false)
    setError(null)
  }, [])

  return { copied, error, copy, reset }
}

/**
 * Copy button component
 */
export function CopyButton({ 
  text, 
  onCopy,
  className = '',
  size = 'md',
  label = 'Copy'
}) {
  const { copied, copy } = useCopyToClipboard()

  const handleClick = async () => {
    const success = await copy(text)
    if (success && onCopy) {
      onCopy(text)
    }
  }

  const sizeClasses = {
    sm: 'p-1',
    md: 'p-2',
    lg: 'p-3',
  }

  return (
    <button
      onClick={handleClick}
      className={`inline-flex items-center gap-1 rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-gray-700 ${sizeClasses[size]} ${className}`}
      title={copied ? 'Copied!' : label}
      aria-label={copied ? 'Copied!' : label}
    >
      {copied ? (
        <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      )}
    </button>
  )
}

/**
 * Copyable text component
 */
export function CopyableText({ 
  text, 
  displayText,
  className = '',
  truncate = false,
  truncateLength = 20,
}) {
  const { copied, copy } = useCopyToClipboard()

  const display = displayText || text
  const truncated = truncate && display.length > truncateLength
    ? `${display.slice(0, truncateLength / 2)}...${display.slice(-truncateLength / 2)}`
    : display

  return (
    <button
      onClick={() => copy(text)}
      className={`inline-flex items-center gap-2 font-mono text-sm hover:text-purple-600 dark:hover:text-purple-400 transition-colors ${className}`}
      title={copied ? 'Copied!' : `Click to copy: ${text}`}
    >
      <span>{truncated}</span>
      {copied ? (
        <span className="text-xs text-green-500">✓</span>
      ) : (
        <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      )}
    </button>
  )
}

export default useCopyToClipboard
