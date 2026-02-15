/**
 * PR 9: Logger Service
 * Centralized logging for debugging and monitoring
 */
export class Logger {
  constructor(namespace = 'App') {
    this.namespace = namespace
    this.isDev = process.env.NODE_ENV === 'development'
  }

  log(...args) {
    console.log(`[${this.namespace}]`, ...args)
  }

  debug(...args) {
    if (this.isDev) {
      console.debug(`[${this.namespace}]`, ...args)
    }
  }

  error(...args) {
    console.error(`[${this.namespace}]`, ...args)
  }

  warn(...args) {
    console.warn(`[${this.namespace}]`, ...args)
  }
}

export const logger = new Logger('DAO')
