import { useState, useEffect, useRef, useCallback } from 'react'

/**
 * Animation timing functions
 */
export const easings = {
  linear: (t) => t,
  easeInQuad: (t) => t * t,
  easeOutQuad: (t) => t * (2 - t),
  easeInOutQuad: (t) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
  easeInCubic: (t) => t * t * t,
  easeOutCubic: (t) => (--t) * t * t + 1,
  easeInOutCubic: (t) => (t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1),
  easeOutElastic: (t) => {
    const c4 = (2 * Math.PI) / 3
    return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1
  },
  easeOutBounce: (t) => {
    const n1 = 7.5625
    const d1 = 2.75
    if (t < 1 / d1) return n1 * t * t
    if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75
    if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375
    return n1 * (t -= 2.625 / d1) * t + 0.984375
  },
}

/**
 * Hook for animating a numeric value
 */
export function useAnimatedValue(targetValue, options = {}) {
  const {
    duration = 500,
    easing = 'easeOutQuad',
    onComplete,
    delay = 0,
  } = options

  const [value, setValue] = useState(targetValue)
  const animationRef = useRef(null)
  const startValueRef = useRef(targetValue)
  const startTimeRef = useRef(null)

  useEffect(() => {
    if (delay > 0) {
      const timeout = setTimeout(() => {
        startAnimation()
      }, delay)
      return () => clearTimeout(timeout)
    } else {
      startAnimation()
    }

    function startAnimation() {
      startValueRef.current = value
      startTimeRef.current = performance.now()

      const easingFn = typeof easing === 'function' ? easing : easings[easing]

      const animate = (currentTime) => {
        const elapsed = currentTime - startTimeRef.current
        const progress = Math.min(elapsed / duration, 1)
        const easedProgress = easingFn(progress)

        const newValue =
          startValueRef.current + (targetValue - startValueRef.current) * easedProgress

        setValue(newValue)

        if (progress < 1) {
          animationRef.current = requestAnimationFrame(animate)
        } else {
          setValue(targetValue)
          onComplete?.()
        }
      }

      animationRef.current = requestAnimationFrame(animate)
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [targetValue, duration, easing, delay])

  return value
}

/**
 * Hook for spring animations
 */
export function useSpring(targetValue, options = {}) {
  const {
    stiffness = 170,
    damping = 26,
    mass = 1,
    precision = 0.01,
  } = options

  const [value, setValue] = useState(targetValue)
  const velocityRef = useRef(0)
  const animationRef = useRef(null)
  const previousTimeRef = useRef(null)

  useEffect(() => {
    const animate = (currentTime) => {
      if (previousTimeRef.current === null) {
        previousTimeRef.current = currentTime
      }

      const deltaTime = Math.min((currentTime - previousTimeRef.current) / 1000, 0.064)
      previousTimeRef.current = currentTime

      const displacement = value - targetValue
      const springForce = -stiffness * displacement
      const dampingForce = -damping * velocityRef.current
      const acceleration = (springForce + dampingForce) / mass

      velocityRef.current += acceleration * deltaTime
      const newValue = value + velocityRef.current * deltaTime

      setValue(newValue)

      if (
        Math.abs(velocityRef.current) < precision &&
        Math.abs(newValue - targetValue) < precision
      ) {
        setValue(targetValue)
        velocityRef.current = 0
      } else {
        animationRef.current = requestAnimationFrame(animate)
      }
    }

    previousTimeRef.current = null
    animationRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [targetValue, stiffness, damping, mass, precision])

  return value
}

/**
 * Hook for fade in/out transitions
 */
export function useFade(isVisible, options = {}) {
  const { duration = 200, delay = 0 } = options
  const [shouldRender, setShouldRender] = useState(isVisible)
  const [opacity, setOpacity] = useState(isVisible ? 1 : 0)

  useEffect(() => {
    if (isVisible) {
      setShouldRender(true)
      const timeout = setTimeout(() => setOpacity(1), delay)
      return () => clearTimeout(timeout)
    } else {
      setOpacity(0)
      const timeout = setTimeout(() => setShouldRender(false), duration)
      return () => clearTimeout(timeout)
    }
  }, [isVisible, duration, delay])

  return {
    shouldRender,
    style: {
      opacity,
      transition: `opacity ${duration}ms ease`,
    },
  }
}

/**
 * Hook for staggered animations
 */
export function useStagger(items, options = {}) {
  const { delayPerItem = 50, duration = 300 } = options
  const [visibleItems, setVisibleItems] = useState([])

  useEffect(() => {
    setVisibleItems([])
    
    items.forEach((_, index) => {
      setTimeout(() => {
        setVisibleItems((prev) => [...prev, index])
      }, index * delayPerItem)
    })
  }, [items, delayPerItem])

  const getItemStyle = useCallback(
    (index) => ({
      opacity: visibleItems.includes(index) ? 1 : 0,
      transform: visibleItems.includes(index)
        ? 'translateY(0)'
        : 'translateY(20px)',
      transition: `all ${duration}ms ease`,
    }),
    [visibleItems, duration]
  )

  return { visibleItems, getItemStyle }
}

/**
 * Hook for counting animation
 */
export function useCountUp(end, options = {}) {
  const {
    start = 0,
    duration = 2000,
    decimals = 0,
    easing = 'easeOutQuad',
    separator = ',',
    prefix = '',
    suffix = '',
    onComplete,
  } = options

  const animatedValue = useAnimatedValue(end, {
    duration,
    easing,
    onComplete,
  })

  const formattedValue = `${prefix}${animatedValue
    .toFixed(decimals)
    .replace(/\B(?=(\d{3})+(?!\d))/g, separator)}${suffix}`

  return formattedValue
}

/**
 * Hook for scroll-triggered animations
 */
export function useScrollAnimation(options = {}) {
  const {
    threshold = 0.1,
    rootMargin = '0px',
    triggerOnce = true,
  } = options

  const ref = useRef(null)
  const [isVisible, setIsVisible] = useState(false)
  const hasTriggeredRef = useRef(false)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (triggerOnce && hasTriggeredRef.current) return
          hasTriggeredRef.current = true
          setIsVisible(true)
        } else if (!triggerOnce) {
          setIsVisible(false)
        }
      },
      { threshold, rootMargin }
    )

    observer.observe(element)

    return () => observer.disconnect()
  }, [threshold, rootMargin, triggerOnce])

  return { ref, isVisible }
}

/**
 * CSS animation class generator
 */
export const animations = {
  fadeIn: 'animate-fadeIn',
  fadeOut: 'animate-fadeOut',
  slideUp: 'animate-slideUp',
  slideDown: 'animate-slideDown',
  slideLeft: 'animate-slideLeft',
  slideRight: 'animate-slideRight',
  scale: 'animate-scale',
  pulse: 'animate-pulse',
  spin: 'animate-spin',
  bounce: 'animate-bounce',
}

/**
 * Tailwind animation keyframes config
 * Add to tailwind.config.js
 */
export const tailwindAnimationConfig = {
  keyframes: {
    fadeIn: {
      '0%': { opacity: '0' },
      '100%': { opacity: '1' },
    },
    fadeOut: {
      '0%': { opacity: '1' },
      '100%': { opacity: '0' },
    },
    slideUp: {
      '0%': { transform: 'translateY(20px)', opacity: '0' },
      '100%': { transform: 'translateY(0)', opacity: '1' },
    },
    slideDown: {
      '0%': { transform: 'translateY(-20px)', opacity: '0' },
      '100%': { transform: 'translateY(0)', opacity: '1' },
    },
    slideLeft: {
      '0%': { transform: 'translateX(20px)', opacity: '0' },
      '100%': { transform: 'translateX(0)', opacity: '1' },
    },
    slideRight: {
      '0%': { transform: 'translateX(-20px)', opacity: '0' },
      '100%': { transform: 'translateX(0)', opacity: '1' },
    },
    scale: {
      '0%': { transform: 'scale(0.95)', opacity: '0' },
      '100%': { transform: 'scale(1)', opacity: '1' },
    },
  },
  animation: {
    fadeIn: 'fadeIn 0.3s ease-out',
    fadeOut: 'fadeOut 0.3s ease-out',
    slideUp: 'slideUp 0.3s ease-out',
    slideDown: 'slideDown 0.3s ease-out',
    slideLeft: 'slideLeft 0.3s ease-out',
    slideRight: 'slideRight 0.3s ease-out',
    scale: 'scale 0.3s ease-out',
  },
}

export default {
  easings,
  useAnimatedValue,
  useSpring,
  useFade,
  useStagger,
  useCountUp,
  useScrollAnimation,
  animations,
  tailwindAnimationConfig,
}
