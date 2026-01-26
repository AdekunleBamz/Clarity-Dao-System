import { useState, createContext, useContext } from 'react'

const TabsContext = createContext()

/**
 * Tabs Container Component
 */
export default function Tabs({
  children,
  defaultTab,
  variant = 'default',
  fullWidth = false,
  onChange,
  className = '',
}) {
  const [activeTab, setActiveTab] = useState(defaultTab)

  const handleTabChange = (tabId) => {
    setActiveTab(tabId)
    onChange?.(tabId)
  }

  return (
    <TabsContext.Provider
      value={{ activeTab, setActiveTab: handleTabChange, variant, fullWidth }}
    >
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  )
}

/**
 * Tab List - container for tab triggers
 */
export function TabList({ children, className = '' }) {
  const { variant, fullWidth } = useContext(TabsContext)

  const variantStyles = {
    default: 'border-b border-gray-200 dark:border-gray-700',
    pills: 'bg-gray-100 dark:bg-gray-800 rounded-lg p-1',
    enclosed: 'border border-gray-200 dark:border-gray-700 rounded-lg p-1',
    underline: 'border-b-2 border-gray-200 dark:border-gray-700',
  }

  return (
    <div
      className={`flex ${fullWidth ? '' : 'inline-flex'} ${variantStyles[variant]} ${className}`}
      role="tablist"
    >
      {children}
    </div>
  )
}

/**
 * Tab Trigger - individual tab button
 */
export function TabTrigger({
  value,
  children,
  disabled = false,
  icon,
  count,
  className = '',
}) {
  const { activeTab, setActiveTab, variant, fullWidth } = useContext(TabsContext)
  const isActive = activeTab === value

  const baseStyles = 'relative flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900'

  const variantStyles = {
    default: {
      active: 'text-purple-600 dark:text-purple-400 border-b-2 border-purple-600 dark:border-purple-400 -mb-px',
      inactive: 'text-gray-500 dark:text-gray-400 border-b-2 border-transparent hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600',
    },
    pills: {
      active: 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm rounded-md',
      inactive: 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 rounded-md',
    },
    enclosed: {
      active: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-md',
      inactive: 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md',
    },
    underline: {
      active: 'text-purple-600 dark:text-purple-400',
      inactive: 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300',
    },
  }

  const disabledStyles = 'opacity-50 cursor-not-allowed'
  const widthStyles = fullWidth ? 'flex-1' : ''

  return (
    <button
      role="tab"
      aria-selected={isActive}
      aria-disabled={disabled}
      tabIndex={isActive ? 0 : -1}
      onClick={() => !disabled && setActiveTab(value)}
      className={`${baseStyles} ${variantStyles[variant][isActive ? 'active' : 'inactive']} ${disabled ? disabledStyles : ''} ${widthStyles} ${className}`}
    >
      {icon && <span className="w-4 h-4">{icon}</span>}
      {children}
      {count !== undefined && (
        <span
          className={`ml-1 px-1.5 py-0.5 text-xs rounded-full ${
            isActive
              ? 'bg-purple-200 dark:bg-purple-800 text-purple-700 dark:text-purple-300'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
          }`}
        >
          {count}
        </span>
      )}
    </button>
  )
}

/**
 * Tab Content - individual tab panel
 */
export function TabContent({ value, children, className = '' }) {
  const { activeTab } = useContext(TabsContext)

  if (activeTab !== value) return null

  return (
    <div
      role="tabpanel"
      aria-labelledby={`tab-${value}`}
      tabIndex={0}
      className={`focus:outline-none ${className}`}
    >
      {children}
    </div>
  )
}

/**
 * Vertical Tabs variant
 */
export function VerticalTabs({
  children,
  defaultTab,
  onChange,
  className = '',
}) {
  const [activeTab, setActiveTab] = useState(defaultTab)

  const handleTabChange = (tabId) => {
    setActiveTab(tabId)
    onChange?.(tabId)
  }

  return (
    <TabsContext.Provider
      value={{ activeTab, setActiveTab: handleTabChange, variant: 'vertical', fullWidth: false }}
    >
      <div className={`flex gap-6 ${className}`}>{children}</div>
    </TabsContext.Provider>
  )
}

/**
 * Vertical Tab List
 */
export function VerticalTabList({ children, className = '' }) {
  return (
    <div
      className={`flex flex-col space-y-1 min-w-[200px] border-r border-gray-200 dark:border-gray-700 pr-4 ${className}`}
      role="tablist"
      aria-orientation="vertical"
    >
      {children}
    </div>
  )
}

/**
 * Vertical Tab Trigger
 */
export function VerticalTabTrigger({
  value,
  children,
  disabled = false,
  icon,
  description,
  className = '',
}) {
  const { activeTab, setActiveTab } = useContext(TabsContext)
  const isActive = activeTab === value

  return (
    <button
      role="tab"
      aria-selected={isActive}
      aria-disabled={disabled}
      onClick={() => !disabled && setActiveTab(value)}
      className={`flex items-start gap-3 w-full px-4 py-3 text-left rounded-lg transition-all duration-200
        ${isActive
          ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${className}
      `}
    >
      {icon && (
        <span className={`w-5 h-5 mt-0.5 ${isActive ? 'text-purple-600 dark:text-purple-400' : ''}`}>
          {icon}
        </span>
      )}
      <div>
        <div className="font-medium">{children}</div>
        {description && (
          <div className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {description}
          </div>
        )}
      </div>
    </button>
  )
}

/**
 * Vertical Tab Content
 */
export function VerticalTabContent({ value, children, className = '' }) {
  const { activeTab } = useContext(TabsContext)

  if (activeTab !== value) return null

  return (
    <div role="tabpanel" className={`flex-1 ${className}`}>
      {children}
    </div>
  )
}

/**
 * Simple Tabs hook for controlled usage
 */
export function useTabs(defaultTab) {
  const [activeTab, setActiveTab] = useState(defaultTab)

  return {
    activeTab,
    setActiveTab,
    isActive: (tabId) => activeTab === tabId,
    getTabProps: (tabId) => ({
      role: 'tab',
      'aria-selected': activeTab === tabId,
      onClick: () => setActiveTab(tabId),
    }),
    getPanelProps: (tabId) => ({
      role: 'tabpanel',
      hidden: activeTab !== tabId,
    }),
  }
}
