// Runtime performance optimizations

// Type declaration for React DevTools
declare global {
  interface Window {
    __REACT_DEVTOOLS_GLOBAL_HOOK__?: {
      onCommitFiberRoot?: any
      onCommitFiberUnmount?: any
    }
  }
}

// Optimize React DevTools in production
export const optimizeReactDevTools = () => {
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
    // Disable React DevTools in production
    if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
      window.__REACT_DEVTOOLS_GLOBAL_HOOK__.onCommitFiberRoot = null
      window.__REACT_DEVTOOLS_GLOBAL_HOOK__.onCommitFiberUnmount = null
    }
  }
}

// Optimize console logging in production
export const optimizeConsoleLogging = () => {
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
    // Disable console methods in production
    const noop = () => {}
    console.log = noop
    console.warn = noop
    console.info = noop
    console.debug = noop
    // Keep console.error for critical issues
  }
}

// Memory leak prevention
export const preventMemoryLeaks = () => {
  if (typeof window !== 'undefined') {
    // Clean up event listeners on page unload
    window.addEventListener('beforeunload', () => {
      // Clear any global timers
      const highestTimeoutId = setTimeout(() => {}, 0) as any
      for (let i = 0; i < Number(highestTimeoutId); i++) {
        clearTimeout(i)
      }
      
      const highestIntervalId = setInterval(() => {}, 0) as any
      for (let i = 0; i < Number(highestIntervalId); i++) {
        clearInterval(i)
      }
    })
  }
}

// Optimize images loading
export const optimizeImageLoading = () => {
  if (typeof window !== 'undefined' && 'loading' in HTMLImageElement.prototype) {
    // Use native lazy loading when available
    const images = document.querySelectorAll('img[data-src]')
    images.forEach(img => {
      img.setAttribute('loading', 'lazy')
      img.setAttribute('src', img.getAttribute('data-src') || '')
      img.removeAttribute('data-src')
    })
  }
}

// Preload critical resources
export const preloadCriticalResources = () => {
  if (typeof window !== 'undefined') {
    // Preload critical fonts
    const criticalFonts = [
      '/fonts/nunito-regular.woff2',
      '/fonts/nunito-medium.woff2',
      '/fonts/nunito-semibold.woff2'
    ]
    
    criticalFonts.forEach(font => {
      const link = document.createElement('link')
      link.rel = 'preload'
      link.as = 'font'
      link.type = 'font/woff2'
      link.crossOrigin = 'anonymous'
      link.href = font
      document.head.appendChild(link)
    })
    
    // Preload critical images
    const criticalImages = [
      '/chef-hat.svg',
      '/recipe_images/default.jpg'
    ]
    
    criticalImages.forEach(image => {
      const link = document.createElement('link')
      link.rel = 'preload'
      link.as = 'image'
      link.href = image
      document.head.appendChild(link)
    })
  }
}

// Service Worker registration for caching
export const registerServiceWorker = () => {
  if (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    process.env.NODE_ENV === 'production'
  ) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then(registration => {
          console.log('SW registered: ', registration)
        })
        .catch(registrationError => {
          console.log('SW registration failed: ', registrationError)
        })
    })
  }
}

// Initialize all runtime optimizations
export const initRuntimeOptimizations = () => {
  optimizeReactDevTools()
  optimizeConsoleLogging()
  preventMemoryLeaks()
  optimizeImageLoading()
  preloadCriticalResources()
  registerServiceWorker()
}

// Performance monitoring
export const monitorPerformance = () => {
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    // Monitor long tasks
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.duration > 50) { // Tasks longer than 50ms
            console.warn(`🐌 Long task detected: ${entry.duration.toFixed(2)}ms`)
          }
        }
      })
      
      observer.observe({ entryTypes: ['longtask'] })
    }
    
    // Monitor layout shifts
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const layoutShiftEntry = entry as any
          if (layoutShiftEntry.value > 0.1) { // CLS threshold
            console.warn(`📐 Layout shift detected: ${layoutShiftEntry.value.toFixed(3)}`)
          }
        }
      })
      
      observer.observe({ entryTypes: ['layout-shift'] })
    }
  }
}

// Bundle size monitoring
export const monitorBundleSize = () => {
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    window.addEventListener('load', () => {
      const resources = performance.getEntriesByType('resource')
      const jsResources = resources.filter(r => r.name.includes('.js'))
      const cssResources = resources.filter(r => r.name.includes('.css'))
      
      const totalJSSize = jsResources.reduce((acc, r) => acc + ((r as any).transferSize || 0), 0)
      const totalCSSSize = cssResources.reduce((acc, r) => acc + ((r as any).transferSize || 0), 0)
      
      console.group('📦 Bundle Size Analysis')
      console.log(`JavaScript: ${(totalJSSize / 1024).toFixed(2)} KB`)
      console.log(`CSS: ${(totalCSSSize / 1024).toFixed(2)} KB`)
      console.log(`Total: ${((totalJSSize + totalCSSSize) / 1024).toFixed(2)} KB`)
      console.groupEnd()
    })
  }
}