import { useState, useEffect, useContext } from 'react'
import { WalletContext } from '../context/WalletContext'
import { STORAGE_KEYS } from '../utils/constants'

const DEFAULT_SETTINGS = {
  notifications: {
    proposals: true,
    votes: true,
    rewards: true,
    transactions: true,
  },
  display: {
    compactMode: false,
    showUsdValues: true,
    hideSmallBalances: false,
    smallBalanceThreshold: 1,
  },
  privacy: {
    hideBalance: false,
    analyticsEnabled: true,
  },
  advanced: {
    slippageTolerance: 0.5,
    gasPreference: 'medium',
    autoSign: false,
  },
}

export default function Settings() {
  const { address, isConnected, disconnect } = useContext(WalletContext)
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS)
    return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS
  })
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings))
    setSaved(true)
    const timer = setTimeout(() => setSaved(false), 2000)
    return () => clearTimeout(timer)
  }, [settings])

  const updateSetting = (category, key, value) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value,
      },
    }))
  }

  const resetSettings = () => {
    setSettings(DEFAULT_SETTINGS)
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
        {saved && (
          <span className="text-sm text-green-600 dark:text-green-400">✓ Saved</span>
        )}
      </div>

      {/* Wallet Section */}
      <section className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Wallet</h2>
        {isConnected ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Connected Address</p>
                <p className="font-mono text-sm text-gray-900 dark:text-white">{address}</p>
              </div>
              <button
                onClick={disconnect}
                className="px-4 py-2 text-red-600 dark:text-red-400 border border-red-300 dark:border-red-700 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                Disconnect
              </button>
            </div>
          </div>
        ) : (
          <p className="text-gray-500 dark:text-gray-400">No wallet connected</p>
        )}
      </section>

      {/* Notifications */}
      <section className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Notifications</h2>
        <div className="space-y-4">
          {Object.entries({
            proposals: 'New proposal alerts',
            votes: 'Voting reminders',
            rewards: 'Reward notifications',
            transactions: 'Transaction updates',
          }).map(([key, label]) => (
            <label key={key} className="flex items-center justify-between cursor-pointer">
              <span className="text-gray-700 dark:text-gray-300">{label}</span>
              <input
                type="checkbox"
                checked={settings.notifications[key]}
                onChange={(e) => updateSetting('notifications', key, e.target.checked)}
                className="w-5 h-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
              />
            </label>
          ))}
        </div>
      </section>

      {/* Display */}
      <section className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Display</h2>
        <div className="space-y-4">
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-gray-700 dark:text-gray-300">Compact mode</span>
            <input
              type="checkbox"
              checked={settings.display.compactMode}
              onChange={(e) => updateSetting('display', 'compactMode', e.target.checked)}
              className="w-5 h-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
            />
          </label>
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-gray-700 dark:text-gray-300">Show USD values</span>
            <input
              type="checkbox"
              checked={settings.display.showUsdValues}
              onChange={(e) => updateSetting('display', 'showUsdValues', e.target.checked)}
              className="w-5 h-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
            />
          </label>
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-gray-700 dark:text-gray-300">Hide small balances</span>
            <input
              type="checkbox"
              checked={settings.display.hideSmallBalances}
              onChange={(e) => updateSetting('display', 'hideSmallBalances', e.target.checked)}
              className="w-5 h-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
            />
          </label>
          {settings.display.hideSmallBalances && (
            <div className="ml-4">
              <label className="text-sm text-gray-600 dark:text-gray-400">
                Threshold (DAO)
                <input
                  type="number"
                  value={settings.display.smallBalanceThreshold}
                  onChange={(e) => updateSetting('display', 'smallBalanceThreshold', parseFloat(e.target.value) || 0)}
                  className="ml-4 w-24 px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </label>
            </div>
          )}
        </div>
      </section>

      {/* Privacy */}
      <section className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Privacy</h2>
        <div className="space-y-4">
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-gray-700 dark:text-gray-300">Hide balance on dashboard</span>
            <input
              type="checkbox"
              checked={settings.privacy.hideBalance}
              onChange={(e) => updateSetting('privacy', 'hideBalance', e.target.checked)}
              className="w-5 h-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
            />
          </label>
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-gray-700 dark:text-gray-300">Allow analytics</span>
            <input
              type="checkbox"
              checked={settings.privacy.analyticsEnabled}
              onChange={(e) => updateSetting('privacy', 'analyticsEnabled', e.target.checked)}
              className="w-5 h-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
            />
          </label>
        </div>
      </section>

      {/* Advanced */}
      <section className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Advanced</h2>
        <div className="space-y-4">
          <div>
            <label className="text-gray-700 dark:text-gray-300 block mb-2">
              Slippage Tolerance (%)
            </label>
            <input
              type="number"
              step="0.1"
              value={settings.advanced.slippageTolerance}
              onChange={(e) => updateSetting('advanced', 'slippageTolerance', parseFloat(e.target.value) || 0.5)}
              className="w-24 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="text-gray-700 dark:text-gray-300 block mb-2">
              Gas Preference
            </label>
            <select
              value={settings.advanced.gasPreference}
              onChange={(e) => updateSetting('advanced', 'gasPreference', e.target.value)}
              className="w-40 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
        </div>
      </section>

      {/* Actions */}
      <div className="flex justify-end gap-4">
        <button
          onClick={resetSettings}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          Reset to Defaults
        </button>
      </div>
    </div>
  )
}
