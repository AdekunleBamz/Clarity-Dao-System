/**
 * API Request Utilities
 * Centralized fetch logic with retry, timeout, and error handling
 */

export class APIClient {
  constructor(baseURL, options = {}) {
    this.baseURL = baseURL
    this.timeout = options.timeout || 30000
    this.retries = options.retries || 3
    this.headers = options.headers || {}
  }

  /**
   * Make API request with retry logic
   */
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`
    const config = {
      ...options,
      headers: { ...this.headers, ...options.headers }
    }

    let lastError
    for (let attempt = 0; attempt <= this.retries; attempt++) {
      try {
        return await this.fetchWithTimeout(url, config)
      } catch (error) {
        lastError = error
        if (attempt < this.retries && this.isRetryable(error)) {
          await this.delay(Math.pow(2, attempt) * 1000)
        }
      }
    }
    throw lastError
  }

  /**
   * Fetch with timeout
   */
  async fetchWithTimeout(url, config) {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.timeout)

    try {
      const response = await fetch(url, {
        ...config,
        signal: controller.signal
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      return await response.json()
    } finally {
      clearTimeout(timeoutId)
    }
  }

  /**
   * Check if error is retryable
   */
  isRetryable(error) {
    return error instanceof TypeError ||
           error?.message?.includes('abort') ||
           error?.status >= 500
  }

  /**
   * Delay utility for retries
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * GET request
   */
  get(endpoint, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'GET'
    })
  }

  /**
   * POST request
   */
  post(endpoint, data, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  /**
   * PUT request
   */
  put(endpoint, data, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data)
    })
  }

  /**
   * DELETE request
   */
  delete(endpoint, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'DELETE'
    })
  }
}

// Create default Hiro API client
export const hiroAPI = new APIClient('https://api.hiro.so', {
  timeout: 30000,
  retries: 2
})
