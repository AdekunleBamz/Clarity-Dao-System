import { useState } from 'react'

const SIZES = {
  xs: 'w-6 h-6 text-xs',
  sm: 'w-8 h-8 text-sm',
  md: 'w-10 h-10 text-base',
  lg: 'w-12 h-12 text-lg',
  xl: 'w-16 h-16 text-xl',
  '2xl': 'w-24 h-24 text-3xl',
}

const COLORS = [
  'bg-red-500',
  'bg-orange-500',
  'bg-amber-500',
  'bg-yellow-500',
  'bg-lime-500',
  'bg-green-500',
  'bg-emerald-500',
  'bg-teal-500',
  'bg-cyan-500',
  'bg-sky-500',
  'bg-blue-500',
  'bg-indigo-500',
  'bg-violet-500',
  'bg-purple-500',
  'bg-fuchsia-500',
  'bg-pink-500',
  'bg-rose-500',
]

function getColorFromString(str) {
  if (!str) return COLORS[0]
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  return COLORS[Math.abs(hash) % COLORS.length]
}

function getInitials(name) {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase()
  }
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
}

export default function Avatar({
  src,
  alt,
  name,
  size = 'md',
  rounded = 'full',
  status,
  className = '',
}) {
  const [hasError, setHasError] = useState(false)
  
  const roundedClasses = {
    full: 'rounded-full',
    lg: 'rounded-lg',
    md: 'rounded-md',
    none: 'rounded-none',
  }

  const statusColors = {
    online: 'bg-green-500',
    offline: 'bg-gray-400',
    away: 'bg-yellow-500',
    busy: 'bg-red-500',
  }

  const statusSizes = {
    xs: 'w-1.5 h-1.5',
    sm: 'w-2 h-2',
    md: 'w-2.5 h-2.5',
    lg: 'w-3 h-3',
    xl: 'w-3.5 h-3.5',
    '2xl': 'w-4 h-4',
  }

  const showFallback = !src || hasError

  return (
    <div className={`relative inline-block ${className}`}>
      {showFallback ? (
        <div
          className={`${SIZES[size]} ${roundedClasses[rounded]} ${getColorFromString(name)} flex items-center justify-center text-white font-medium`}
        >
          {getInitials(name)}
        </div>
      ) : (
        <img
          src={src}
          alt={alt || name || 'Avatar'}
          className={`${SIZES[size]} ${roundedClasses[rounded]} object-cover`}
          onError={() => setHasError(true)}
        />
      )}
      
      {status && (
        <span
          className={`absolute bottom-0 right-0 ${statusSizes[size]} ${statusColors[status]} ${roundedClasses[rounded]} ring-2 ring-white dark:ring-gray-800`}
        />
      )}
    </div>
  )
}

/**
 * Avatar Group component
 */
export function AvatarGroup({
  avatars,
  max = 5,
  size = 'md',
  className = '',
}) {
  const displayed = avatars.slice(0, max)
  const remaining = avatars.length - max

  const overlapClasses = {
    xs: '-ml-1.5',
    sm: '-ml-2',
    md: '-ml-2.5',
    lg: '-ml-3',
    xl: '-ml-4',
    '2xl': '-ml-6',
  }

  return (
    <div className={`flex items-center ${className}`}>
      {displayed.map((avatar, index) => (
        <div
          key={index}
          className={`${index > 0 ? overlapClasses[size] : ''} ring-2 ring-white dark:ring-gray-800 rounded-full`}
        >
          <Avatar
            src={avatar.src}
            name={avatar.name}
            size={size}
          />
        </div>
      ))}
      
      {remaining > 0 && (
        <div
          className={`${overlapClasses[size]} ${SIZES[size]} rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300 font-medium ring-2 ring-white dark:ring-gray-800`}
        >
          +{remaining}
        </div>
      )}
    </div>
  )
}

/**
 * Avatar with name and optional details
 */
export function AvatarWithName({
  src,
  name,
  detail,
  size = 'md',
  className = '',
}) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <Avatar src={src} name={name} size={size} />
      <div>
        <p className="font-medium text-gray-900 dark:text-white">{name}</p>
        {detail && (
          <p className="text-sm text-gray-500 dark:text-gray-400">{detail}</p>
        )}
      </div>
    </div>
  )
}

/**
 * Wallet Avatar (for blockchain addresses)
 */
export function WalletAvatar({ address, size = 'md', className = '' }) {
  // Generate a simple gradient based on address
  const getGradient = (addr) => {
    if (!addr) return 'from-gray-400 to-gray-600'
    const hash = addr.slice(2, 8)
    const gradients = [
      'from-purple-500 to-pink-500',
      'from-blue-500 to-cyan-500',
      'from-green-500 to-teal-500',
      'from-orange-500 to-red-500',
      'from-indigo-500 to-purple-500',
      'from-pink-500 to-rose-500',
    ]
    const index = parseInt(hash, 16) % gradients.length
    return gradients[index]
  }

  const sizeClasses = {
    xs: 'w-6 h-6',
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  }

  return (
    <div
      className={`${sizeClasses[size]} rounded-full bg-gradient-to-br ${getGradient(address)} ${className}`}
      title={address}
    />
  )
}
