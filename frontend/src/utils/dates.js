/**
 * Date and time utilities for the DAO application
 * Provides formatting, relative time, and block time calculations
 */

// Stacks block time is approximately 10 minutes
const STACKS_BLOCK_TIME_MS = 10 * 60 * 1000

/**
 * Format a date to a readable string
 */
export function formatDate(date, options = {}) {
  const d = date instanceof Date ? date : new Date(date)
  
  const defaultOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options,
  }

  return d.toLocaleDateString('en-US', defaultOptions)
}

/**
 * Format a date with time
 */
export function formatDateTime(date, options = {}) {
  const d = date instanceof Date ? date : new Date(date)
  
  const defaultOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    ...options,
  }

  return d.toLocaleString('en-US', defaultOptions)
}

/**
 * Format time only
 */
export function formatTime(date) {
  const d = date instanceof Date ? date : new Date(date)
  
  return d.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Get relative time string (e.g., "2 hours ago", "in 3 days")
 */
export function getRelativeTime(date) {
  const d = date instanceof Date ? date : new Date(date)
  const now = new Date()
  const diffMs = d - now
  const diffAbs = Math.abs(diffMs)
  const isPast = diffMs < 0

  const seconds = Math.floor(diffAbs / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  const weeks = Math.floor(days / 7)
  const months = Math.floor(days / 30)
  const years = Math.floor(days / 365)

  let value, unit

  if (seconds < 60) {
    return 'just now'
  } else if (minutes < 60) {
    value = minutes
    unit = minutes === 1 ? 'minute' : 'minutes'
  } else if (hours < 24) {
    value = hours
    unit = hours === 1 ? 'hour' : 'hours'
  } else if (days < 7) {
    value = days
    unit = days === 1 ? 'day' : 'days'
  } else if (weeks < 4) {
    value = weeks
    unit = weeks === 1 ? 'week' : 'weeks'
  } else if (months < 12) {
    value = months
    unit = months === 1 ? 'month' : 'months'
  } else {
    value = years
    unit = years === 1 ? 'year' : 'years'
  }

  return isPast ? `${value} ${unit} ago` : `in ${value} ${unit}`
}

/**
 * Get short relative time (e.g., "2h", "3d")
 */
export function getShortRelativeTime(date) {
  const d = date instanceof Date ? date : new Date(date)
  const now = new Date()
  const diffMs = Math.abs(d - now)

  const seconds = Math.floor(diffMs / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  const weeks = Math.floor(days / 7)
  const months = Math.floor(days / 30)
  const years = Math.floor(days / 365)

  if (seconds < 60) return 'now'
  if (minutes < 60) return `${minutes}m`
  if (hours < 24) return `${hours}h`
  if (days < 7) return `${days}d`
  if (weeks < 4) return `${weeks}w`
  if (months < 12) return `${months}mo`
  return `${years}y`
}

/**
 * Convert block height difference to estimated time
 */
export function blocksToTime(blocks) {
  const ms = blocks * STACKS_BLOCK_TIME_MS
  const hours = Math.floor(ms / (1000 * 60 * 60))
  const days = Math.floor(hours / 24)

  if (days > 0) {
    return `~${days} day${days === 1 ? '' : 's'}`
  }
  if (hours > 0) {
    return `~${hours} hour${hours === 1 ? '' : 's'}`
  }
  const minutes = Math.floor(ms / (1000 * 60))
  return `~${minutes} minute${minutes === 1 ? '' : 's'}`
}

/**
 * Estimate date from current block height and target block
 */
export function estimateDateFromBlock(currentBlock, targetBlock) {
  const blockDiff = targetBlock - currentBlock
  const msFromNow = blockDiff * STACKS_BLOCK_TIME_MS
  return new Date(Date.now() + msFromNow)
}

/**
 * Calculate blocks needed for a duration
 */
export function timeToBlocks(days = 0, hours = 0, minutes = 0) {
  const totalMs = (days * 24 * 60 + hours * 60 + minutes) * 60 * 1000
  return Math.ceil(totalMs / STACKS_BLOCK_TIME_MS)
}

/**
 * Format duration in human-readable format
 */
export function formatDuration(ms) {
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 0) {
    return `${days}d ${hours % 24}h`
  }
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`
  }
  return `${seconds}s`
}

/**
 * Format countdown timer
 */
export function formatCountdown(endDate) {
  const d = endDate instanceof Date ? endDate : new Date(endDate)
  const now = new Date()
  const diff = d - now

  if (diff <= 0) {
    return { expired: true, display: 'Ended' }
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((diff % (1000 * 60)) / 1000)

  const parts = []
  if (days > 0) parts.push(`${days}d`)
  if (hours > 0 || days > 0) parts.push(`${hours}h`)
  if (minutes > 0 || hours > 0) parts.push(`${minutes}m`)
  parts.push(`${seconds}s`)

  return {
    expired: false,
    days,
    hours,
    minutes,
    seconds,
    display: parts.join(' '),
  }
}

/**
 * Check if date is today
 */
export function isToday(date) {
  const d = date instanceof Date ? date : new Date(date)
  const today = new Date()
  return d.toDateString() === today.toDateString()
}

/**
 * Check if date is in the past
 */
export function isPast(date) {
  const d = date instanceof Date ? date : new Date(date)
  return d < new Date()
}

/**
 * Check if date is in the future
 */
export function isFuture(date) {
  const d = date instanceof Date ? date : new Date(date)
  return d > new Date()
}

/**
 * Get start of day
 */
export function startOfDay(date) {
  const d = date instanceof Date ? new Date(date) : new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

/**
 * Get end of day
 */
export function endOfDay(date) {
  const d = date instanceof Date ? new Date(date) : new Date(date)
  d.setHours(23, 59, 59, 999)
  return d
}

/**
 * Add days to a date
 */
export function addDays(date, days) {
  const d = date instanceof Date ? new Date(date) : new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

/**
 * Format timestamp (Unix seconds) to date
 */
export function fromUnix(timestamp) {
  return new Date(timestamp * 1000)
}

/**
 * Get Unix timestamp (seconds) from date
 */
export function toUnix(date) {
  const d = date instanceof Date ? date : new Date(date)
  return Math.floor(d.getTime() / 1000)
}

export default {
  formatDate,
  formatDateTime,
  formatTime,
  getRelativeTime,
  getShortRelativeTime,
  blocksToTime,
  estimateDateFromBlock,
  timeToBlocks,
  formatDuration,
  formatCountdown,
  isToday,
  isPast,
  isFuture,
  startOfDay,
  endOfDay,
  addDays,
  fromUnix,
  toUnix,
}
