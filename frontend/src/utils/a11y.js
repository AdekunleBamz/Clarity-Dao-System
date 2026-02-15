/**
 * Accessibility Utilities
 * WCAG 2.1 AA Compliant helpers
 */

export const a11y = {
  // Focus management
  trapFocus: (element) => {
    const focusableElements =
      element.querySelectorAll('button, a, input, select, textarea, [tabindex]')
    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]

    return {
      handleKeydown: (e) => {
        if (e.key === 'Tab') {
          if (e.shiftKey && document.activeElement === firstElement) {
            e.preventDefault()
            lastElement.focus()
          } else if (!e.shiftKey && document.activeElement === lastElement) {
            e.preventDefault()
            firstElement.focus()
          }
        }
      },
      release: () => firstElement.focus()
    }
  },

  // Announce changes to screen readers
  announce: (message, priority = 'polite') => {
    const announcement = document.createElement('div')
    announcement.setAttribute('role', 'status')
    announcement.setAttribute('aria-live', priority)
    announcement.setAttribute('aria-atomic', 'true')
    announcement.className = 'sr-only'
    announcement.textContent = message
    document.body.appendChild(announcement)
    setTimeout(() => announcement.remove(), 1000)
  },

  // Check color contrast
  checkContrast: (foreground, background) => {
    const getLuminance = (rgb) => {
      const [r, g, b] = rgb.match(/\d+/g).map(x => {
        const c = parseInt(x) / 255
        return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
      })
      return 0.2126 * r + 0.7152 * g + 0.0722 * b
    }
    const l1 = getLuminance(foreground)
    const l2 = getLuminance(background)
    const contrast = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)
    return {
      ratio: contrast.toFixed(2),
      AALarge: contrast >= 3,
      AA: contrast >= 4.5,
      AAA: contrast >= 7,
      AAALarge: contrast >= 4.5
    }
  }
}
