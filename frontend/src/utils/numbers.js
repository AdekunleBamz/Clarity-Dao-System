/**
 * Format a number as currency with STX symbol
 */
export function formatSTX(amount, decimals = 6) {
  if (amount === null || amount === undefined) return '0 STX'
  const num = typeof amount === 'string' ? parseFloat(amount) : amount
  if (isNaN(num)) return '0 STX'
  
  return `${num.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  })} STX`
}

/**
 * Format a number as DAO tokens
 */
export function formatDAO(amount, decimals = 2) {
  if (amount === null || amount === undefined) return '0 DAO'
  const num = typeof amount === 'string' ? parseFloat(amount) : amount
  if (isNaN(num)) return '0 DAO'
  
  return `${num.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  })} DAO`
}

/**
 * Format large numbers with K, M, B suffixes
 */
export function formatCompact(num) {
  if (num === null || num === undefined) return '0'
  const n = typeof num === 'string' ? parseFloat(num) : num
  if (isNaN(n)) return '0'
  
  if (Math.abs(n) >= 1e9) {
    return `${(n / 1e9).toFixed(1)}B`
  }
  if (Math.abs(n) >= 1e6) {
    return `${(n / 1e6).toFixed(1)}M`
  }
  if (Math.abs(n) >= 1e3) {
    return `${(n / 1e3).toFixed(1)}K`
  }
  return n.toFixed(0)
}

/**
 * Format a percentage
 */
export function formatPercent(value, decimals = 2) {
  if (value === null || value === undefined) return '0%'
  const num = typeof value === 'string' ? parseFloat(value) : value
  if (isNaN(num)) return '0%'
  
  return `${num.toFixed(decimals)}%`
}

/**
 * Format a number with commas
 */
export function formatNumber(num, decimals = 0) {
  if (num === null || num === undefined) return '0'
  const n = typeof num === 'string' ? parseFloat(num) : num
  if (isNaN(n)) return '0'
  
  return n.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}

/**
 * Format microSTX to STX
 */
export function microToSTX(microAmount) {
  if (!microAmount) return 0
  return parseFloat(microAmount) / 1_000_000
}

/**
 * Format STX to microSTX
 */
export function stxToMicro(stxAmount) {
  if (!stxAmount) return 0
  return Math.floor(parseFloat(stxAmount) * 1_000_000)
}

/**
 * Truncate a wallet address
 */
export function truncateAddress(address, startChars = 5, endChars = 4) {
  if (!address) return ''
  if (address.length <= startChars + endChars + 3) return address
  return `${address.slice(0, startChars)}...${address.slice(-endChars)}`
}

/**
 * Parse a numeric input safely
 */
export function parseNumericInput(value, fallback = 0) {
  if (value === '' || value === null || value === undefined) return fallback
  const parsed = parseFloat(value)
  return isNaN(parsed) ? fallback : parsed
}

/**
 * Clamp a number between min and max
 */
export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

/**
 * Calculate percentage of a value
 */
export function percentOf(value, total) {
  if (!total) return 0
  return (value / total) * 100
}

/**
 * Format a duration in blocks to human readable
 */
export function formatBlockDuration(blocks, avgBlockTime = 10) {
  const minutes = blocks * avgBlockTime / 60
  
  if (minutes < 60) {
    return `${Math.round(minutes)} min`
  }
  
  const hours = minutes / 60
  if (hours < 24) {
    return `${Math.round(hours)} hr`
  }
  
  const days = hours / 24
  if (days < 30) {
    return `${Math.round(days)} days`
  }
  
  const months = days / 30
  return `${Math.round(months)} months`
}

/**
 * Format token amount from contract (with decimals)
 */
export function formatTokenAmount(amount, decimals = 6) {
  if (!amount) return '0'
  const value = parseFloat(amount) / Math.pow(10, decimals)
  return formatNumber(value, 2)
}
