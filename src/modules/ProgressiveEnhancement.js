/**
 * Progressive Enhancement System
 * Skeleton loading, graceful degradation, and enhanced UX
 */
export class ProgressiveEnhancement {
  constructor() {
    this.loadingStates = new Map();
    this.errorBoundaries = new Map();
    this.featureSupport = {};
    this.fallbacks = new Map();

    this.init();
  }

  init() {
    this.detectFeatureSupport();
    this.setupGlobalErrorHandling();
    this.setupConnectionMonitoring();
    this.setupPerformanceObserver();

    console.log('🔄 Progressive enhancement initialized');
  }

  // Feature Detection
  detectFeatureSupport() {
    this.featureSupport = {
      indexedDB: 'indexedDB' in window,
      serviceWorker: 'serviceWorker' in navigator,
      webWorkers: typeof Worker !== 'undefined',
      compression: 'CompressionStream' in window,
      intersectionObserver: 'IntersectionObserver' in window,
      resizeObserver: 'ResizeObserver' in window,
      webGL: this.detectWebGL(),
      localStorage: this.detectLocalStorage(),
      fetch: 'fetch' in window,
      es6Modules: this.detectES6Modules(),
      css: {
        grid: CSS.supports('display', 'grid'),
        flexbox: CSS.supports('display', 'flex'),
        customProperties: CSS.supports('--test', 'test'),
        transforms: CSS.supports('transform', 'translateX(1px)')
      }
    };

    console.log('🔍 Feature support:', this.featureSupport);
    this.applyFeatureBasedEnhancements();
  }

  detectWebGL() {
    try {
      const canvas = document.createElement('canvas');
      return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
    } catch (e) {
      return false;
    }
  }

  detectLocalStorage() {
    try {
      const test = '__test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (e) {
      return false;
    }
  }

  detectES6Modules() {
    try {
      return typeof Symbol !== 'undefined' && typeof Promise !== 'undefined';
    } catch (e) {
      return false;
    }
  }

  applyFeatureBasedEnhancements() {
    // Apply CSS classes based on feature support
    const html = document.documentElement;

    Object.entries(this.featureSupport).forEach(([feature, supported]) => {
      if (typeof supported === 'boolean') {
        html.classList.add(supported ? `supports-${feature}` : `no-${feature}`);
      }
    });

    // CSS feature classes
    Object.entries(this.featureSupport.css || {}).forEach(([feature, supported]) => {
      html.classList.add(supported ? `supports-${feature}` : `no-${feature}`);
    });
  }

  // Skeleton Loading System
  createSkeletonLoader(config = {}) {
    const {
      type = 'table',
      rows = 5,
      columns = 4,
      animate = true,
      className = ''
    } = config;

    const skeleton = document.createElement('div');
    skeleton.className = `skeleton-loader ${className} ${animate ? 'animate-pulse' : ''}`;

    switch (type) {
      case 'table':
        skeleton.innerHTML = this.createTableSkeleton(rows, columns);
        break;
      case 'card':
        skeleton.innerHTML = this.createCardSkeleton();
        break;
      case 'list':
        skeleton.innerHTML = this.createListSkeleton(rows);
        break;
      case 'chart':
        skeleton.innerHTML = this.createChartSkeleton();
        break;
      default:
        skeleton.innerHTML = this.createGenericSkeleton();
    }

    return skeleton;
  }

  createTableSkeleton(rows, columns) {
    const headerRow = Array(columns).fill(0).map(() =>
      '<th class="px-4 py-3"><div class="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div></th>'
    ).join('');

    const bodyRows = Array(rows).fill(0).map(() =>
      '<tr>' + Array(columns).fill(0).map(() =>
        '<td class="px-4 py-3"><div class="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div></td>'
      ).join('') + '</tr>'
    ).join('');

    return `
      <table class="min-w-full">
        <thead class="bg-gray-50 dark:bg-gray-800">
          <tr>${headerRow}</tr>
        </thead>
        <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
          ${bodyRows}
        </tbody>
      </table>
    `;
  }

  createCardSkeleton() {
    return `
      <div class="p-6 space-y-4">
        <div class="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
        <div class="space-y-2">
          <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
          <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/6"></div>
        </div>
        <div class="flex space-x-2">
          <div class="h-8 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
          <div class="h-8 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
        </div>
      </div>
    `;
  }

  createListSkeleton(items) {
    const listItems = Array(items).fill(0).map(() => `
      <div class="flex items-center space-x-3 p-3">
        <div class="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
        <div class="flex-1 space-y-2">
          <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
          <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
        </div>
      </div>
    `).join('');

    return `<div class="space-y-1">${listItems}</div>`;
  }

  createChartSkeleton() {
    return `
      <div class="p-4">
        <div class="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
        <div class="h-48 bg-gray-200 dark:bg-gray-700 rounded"></div>
        <div class="flex justify-center space-x-4 mt-4">
          <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
          <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
          <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
        </div>
      </div>
    `;
  }

  createGenericSkeleton() {
    return `
      <div class="space-y-4 p-4">
        <div class="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
        <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
        <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
        <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/6"></div>
      </div>
    `;
  }

  // Progressive Loading
  async loadWithProgress(element, loadFunction, options = {}) {
    const {
      skeleton = true,
      skeletonType = 'generic',
      timeout = 10000,
      retries = 3,
      onProgress = null
    } = options;

    const loadingId = this.generateId();
    this.loadingStates.set(loadingId, {
      element,
      startTime: Date.now(),
      timeout,
      retries: retries
    });

    try {
      // Show skeleton if enabled
      if (skeleton) {
        const skeletonLoader = this.createSkeletonLoader({ type: skeletonType });
        element.innerHTML = '';
        element.appendChild(skeletonLoader);
      }

      // Add loading class
      element.classList.add('loading-state');

      // Execute load function with timeout
      const result = await this.withTimeout(loadFunction, timeout);

      // Remove skeleton and loading state
      element.classList.remove('loading-state');

      if (onProgress) {
        onProgress({ phase: 'complete', result });
      }

      return result;

    } catch (error) {
      console.error('Progressive loading failed:', error);

      // Show error state
      this.showErrorState(element, error, {
        retry: () => this.loadWithProgress(element, loadFunction, options)
      });

      throw error;
    } finally {
      this.loadingStates.delete(loadingId);
    }
  }

  async withTimeout(promise, timeout) {
    return Promise.race([
      promise,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Operation timeout')), timeout)
      )
    ]);
  }

  // Error Boundaries
  createErrorBoundary(element, options = {}) {
    const {
      fallback = this.createDefaultErrorFallback,
      onError = null,
      retry = true,
      maxRetries = 3
    } = options;

    const boundaryId = this.generateId();
    const boundary = {
      element,
      fallback,
      onError,
      retry,
      maxRetries,
      retryCount: 0
    };

    this.errorBoundaries.set(boundaryId, boundary);

    // Wrap element in error catching
    this.wrapElementWithErrorHandling(element, boundaryId);

    return boundaryId;
  }

  wrapElementWithErrorHandling(element, boundaryId) {
    const originalAddEventListener = element.addEventListener;

    element.addEventListener = function (type, listener, options) {
      const wrappedListener = (event) => {
        try {
          return listener.call(this, event);
        } catch (error) {
          window.progressiveEnhancement?.handleBoundaryError(boundaryId, error);
        }
      };

      return originalAddEventListener.call(this, type, wrappedListener, options);
    };
  }

  handleBoundaryError(boundaryId, error) {
    const boundary = this.errorBoundaries.get(boundaryId);
    if (!boundary) return;

    console.error('Error boundary caught:', error);

    if (boundary.onError) {
      boundary.onError(error);
    }

    // Show fallback UI
    this.showErrorState(boundary.element, error, {
      retry: boundary.retry ? () => this.retryBoundary(boundaryId) : null,
      maxRetries: boundary.maxRetries,
      retryCount: boundary.retryCount
    });
  }

  retryBoundary(boundaryId) {
    const boundary = this.errorBoundaries.get(boundaryId);
    if (!boundary) return;

    boundary.retryCount++;

    if (boundary.retryCount >= boundary.maxRetries) {
      console.warn('Max retries reached for error boundary:', boundaryId);
      return;
    }

    // Clear error state and retry
    boundary.element.classList.remove('error-state');
    // Trigger re-render or reload logic here
  }

  showErrorState(element, error, options = {}) {
    const { retry, maxRetries, retryCount = 0 } = options;

    element.classList.add('error-state');
    element.innerHTML = this.createErrorFallback(error, { retry, maxRetries, retryCount });
  }

  createErrorFallback(error, options = {}) {
    const { retry, maxRetries, retryCount } = options;
    const canRetry = retry && (!maxRetries || retryCount < maxRetries);

    return `
      <div class="error-fallback p-6 text-center bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
        <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/50 mb-4">
          <svg class="h-6 w-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
          </svg>
        </div>
        <h3 class="text-lg font-medium text-red-800 dark:text-red-200 mb-2">
          Something went wrong
        </h3>
        <p class="text-sm text-red-600 dark:text-red-300 mb-4">
          ${error.message || 'An unexpected error occurred'}
        </p>
        ${canRetry ? `
          <button class="retry-button bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            Try Again ${maxRetries ? `(${retryCount + 1}/${maxRetries})` : ''}
          </button>
        ` : ''}
        <details class="mt-4 text-left">
          <summary class="text-sm text-red-600 dark:text-red-400 cursor-pointer">Error Details</summary>
          <pre class="mt-2 text-xs text-red-500 dark:text-red-400 bg-red-100 dark:bg-red-900/30 p-2 rounded overflow-auto">
${error.stack || error.toString()}
          </pre>
        </details>
      </div>
    `;
  }

  createDefaultErrorFallback(error) {
    return this.createErrorFallback(error);
  }

  // Connection Monitoring
  setupConnectionMonitoring() {
    if ('navigator' in window && 'connection' in navigator) {
      this.connection = navigator.connection;
      this.updateConnectionUI();

      this.connection.addEventListener('change', () => {
        this.updateConnectionUI();
      });
    }

    // Online/offline events
    window.addEventListener('online', () => {
      this.showConnectionStatus('online');
    });

    window.addEventListener('offline', () => {
      this.showConnectionStatus('offline');
    });
  }

  updateConnectionUI() {
    if (!this.connection) return;

    const { effectiveType, downlink, rtt } = this.connection;

    // Adjust UI based on connection quality
    if (effectiveType === '2g' || downlink < 1) {
      this.enableLowBandwidthMode();
    } else {
      this.disableLowBandwidthMode();
    }

    console.log(`📶 Connection: ${effectiveType}, ${downlink}Mbps, ${rtt}ms RTT`);
  }

  enableLowBandwidthMode() {
    document.documentElement.classList.add('low-bandwidth');

    // Disable animations
    document.querySelectorAll('.animate-pulse, .animate-spin').forEach(el => {
      el.style.animation = 'none';
    });

    // Reduce image quality, disable auto-refresh, etc.
    this.showNotification('Low bandwidth detected - some features disabled for better performance', 'info');
  }

  disableLowBandwidthMode() {
    document.documentElement.classList.remove('low-bandwidth');
  }

  showConnectionStatus(status) {
    const message = status === 'online' ?
      'Connection restored' :
      'You are offline - some features may not work';

    const type = status === 'online' ? 'success' : 'warning';
    this.showNotification(message, type);
  }

  // Performance Observer
  setupPerformanceObserver() {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'measure') {
            console.log(`⏱️ ${entry.name}: ${Math.round(entry.duration)}ms`);
          }

          if (entry.entryType === 'paint') {
            console.log(`🎨 ${entry.name}: ${Math.round(entry.startTime)}ms`);
          }
        }
      });

      try {
        observer.observe({ entryTypes: ['measure', 'paint', 'largest-contentful-paint'] });
      } catch (e) {
        console.warn('Performance Observer not fully supported');
      }
    }
  }

  // Graceful Degradation
  createFallback(feature, fallbackFn) {
    this.fallbacks.set(feature, fallbackFn);
  }

  useFallback(feature, ...args) {
    const fallback = this.fallbacks.get(feature);
    if (fallback) {
      return fallback(...args);
    }

    console.warn(`No fallback available for feature: ${feature}`);
    return null;
  }

  // Progressive Loading Utilities
  async loadImageWithFallback(src, fallbackSrc) {
    return new Promise((resolve, reject) => {
      const img = new Image();

      img.onload = () => resolve(img);
      img.onerror = () => {
        if (fallbackSrc) {
          const fallbackImg = new Image();
          fallbackImg.onload = () => resolve(fallbackImg);
          fallbackImg.onerror = () => reject(new Error('Failed to load image and fallback'));
          fallbackImg.src = fallbackSrc;
        } else {
          reject(new Error('Failed to load image'));
        }
      };

      img.src = src;
    });
  }

  // Notification System
  showNotification(message, type = 'info', duration = 5000) {
    const notification = document.createElement('div');
    const id = this.generateId();

    const colors = {
      success: 'bg-green-500',
      error: 'bg-red-500',
      warning: 'bg-yellow-500',
      info: 'bg-blue-500'
    };

    notification.id = `notification-${id}`;
    notification.className = `
      fixed top-4 right-4 ${colors[type]} text-white px-6 py-4 rounded-lg shadow-lg z-50 
      transform translate-x-full opacity-0 transition-all duration-300 max-w-md
    `;

    notification.innerHTML = `
      <div class="flex items-center justify-between">
        <div class="flex items-center">
          <div class="mr-3">
            ${this.getNotificationIcon(type)}
          </div>
          <p class="text-sm font-medium">${message}</p>
        </div>
        <button class="ml-4 text-white hover:text-gray-200" onclick="this.parentElement.parentElement.remove()">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>
    `;

    document.body.appendChild(notification);

    // Animate in
    requestAnimationFrame(() => {
      notification.classList.remove('translate-x-full', 'opacity-0');
    });

    // Auto remove
    if (duration > 0) {
      setTimeout(() => {
        if (notification.parentNode) {
          notification.classList.add('translate-x-full', 'opacity-0');
          setTimeout(() => notification.remove(), 300);
        }
      }, duration);
    }

    return id;
  }

  getNotificationIcon(type) {
    const icons = {
      success: '<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path></svg>',
      error: '<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path></svg>',
      warning: '<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path></svg>',
      info: '<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path></svg>'
    };

    return icons[type] || icons.info;
  }

  // Global Error Handling
  setupGlobalErrorHandling() {
    window.addEventListener('error', (event) => {
      console.error('Global error:', event.error);
      this.handleGlobalError(event.error, 'JavaScript Error');
    });

    window.addEventListener('unhandledrejection', (event) => {
      console.error('Unhandled promise rejection:', event.reason);
      this.handleGlobalError(event.reason, 'Promise Rejection');
    });
  }

  handleGlobalError(error, type) {
    // Don't show notifications for every error in production
    if (process.env.NODE_ENV === 'development') {
      this.showNotification(`${type}: ${error.message}`, 'error');
    }

    // Log to external service in production
    this.logError(error, type);
  }

  logError(error, type) {
    // This would integrate with your error tracking service
    const errorData = {
      message: error.message,
      stack: error.stack,
      type,
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      features: this.featureSupport
    };

    console.log('📝 Error logged:', errorData);

    // In production, send to error tracking service
    // fetch('/api/errors', { method: 'POST', body: JSON.stringify(errorData) });
  }

  // Utility methods
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Cleanup
  destroy() {
    this.loadingStates.clear();
    this.errorBoundaries.clear();
    this.fallbacks.clear();
  }
}

// Export singleton instance
export const progressiveEnhancement = new ProgressiveEnhancement();

// Make globally available
if (typeof window !== 'undefined') {
  window.progressiveEnhancement = progressiveEnhancement;
}