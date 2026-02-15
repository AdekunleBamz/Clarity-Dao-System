/**
 * PR 6: Local Storage Manager
 * Persistent state with serialization and expiry
 */
export const storageManager = {
  set(key, value, expiryMs = null) {
    const data = {
      value,
      timestamp: Date.now(),
      expiry: expiryMs ? Date.now() + expiryMs : null
    }
    localStorage.setItem(key, JSON.stringify(data))
  },

  get(key) {
    const data = JSON.parse(localStorage.getItem(key))
    if (!data) return null
    if (data.expiry && Date.now() > data.expiry) {
      localStorage.removeItem(key)
      return null
    }
    return data.value
  },

  remove(key) {
    localStorage.removeItem(key)
  },

  clear() {
    localStorage.clear()
  }
}
