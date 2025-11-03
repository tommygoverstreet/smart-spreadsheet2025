/**
 * Performance Dashboard Component
 * Real-time monitoring with advanced metrics
 */
export class PerformanceDashboard {
  constructor() {
    this.metrics = new Map();
    this.charts = new Map();
    this.intervals = new Map();
    this.isVisible = false;

    this.init();
  }

  init() {
    this.createDashboardUI();
    this.setupMetricsCollection();
    this.startRealTimeUpdates();
  }

  createDashboardUI() {
    // Check if dashboard already exists
    if (document.getElementById('performanceDashboard')) return;

    const dashboard = document.createElement('div');
    dashboard.id = 'performanceDashboard';
    dashboard.className = 'fixed bottom-4 right-4 z-50 transition-all duration-300 transform translate-y-full opacity-0';

    dashboard.innerHTML = `
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 w-80 max-h-96 overflow-hidden">
        <!-- Header -->
        <div class="bg-gradient-to-r from-blue-500 to-purple-600 p-3 flex items-center justify-between">
          <div class="flex items-center space-x-2">
            <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
            </svg>
            <h3 class="text-white font-semibold text-sm">Performance Monitor</h3>
          </div>
          <div class="flex items-center space-x-1">
            <button id="perfMinimize" class="text-white hover:text-gray-200 p-1 rounded">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4"></path>
              </svg>
            </button>
            <button id="perfClose" class="text-white hover:text-gray-200 p-1 rounded">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
        </div>

        <!-- Content -->
        <div id="perfContent" class="p-4 space-y-4 max-h-80 overflow-y-auto">
          <!-- Real-time Metrics -->
          <div class="grid grid-cols-2 gap-3">
            <div class="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
              <div class="text-xs text-green-600 dark:text-green-400 font-medium">CPU Usage</div>
              <div id="cpuUsage" class="text-lg font-bold text-green-700 dark:text-green-300">0%</div>
            </div>
            <div class="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
              <div class="text-xs text-blue-600 dark:text-blue-400 font-medium">Memory</div>
              <div id="memoryUsageDash" class="text-lg font-bold text-blue-700 dark:text-blue-300">0 MB</div>
            </div>
            <div class="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg">
              <div class="text-xs text-purple-600 dark:text-purple-400 font-medium">FPS</div>
              <div id="fpsCounter" class="text-lg font-bold text-purple-700 dark:text-purple-300">60</div>
            </div>
            <div class="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg">
              <div class="text-xs text-yellow-600 dark:text-yellow-400 font-medium">DOM Nodes</div>
              <div id="domNodeCount" class="text-lg font-bold text-yellow-700 dark:text-yellow-300">0</div>
            </div>
          </div>

          <!-- Performance Chart -->
          <div class="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
            <div class="text-xs text-gray-600 dark:text-gray-400 font-medium mb-2">Performance Timeline</div>
            <canvas id="perfChart" width="280" height="120"></canvas>
          </div>

          <!-- Network Stats -->
          <div class="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
            <div class="text-xs text-gray-600 dark:text-gray-400 font-medium mb-2">Network & Cache</div>
            <div class="grid grid-cols-2 gap-2 text-xs">
              <div class="flex justify-between">
                <span>Cache Hits:</span>
                <span id="cacheHitsDash" class="font-medium">0</span>
              </div>
              <div class="flex justify-between">
                <span>Cache Misses:</span>
                <span id="cacheMissesDash" class="font-medium">0</span>
              </div>
              <div class="flex justify-between">
                <span>Hit Rate:</span>
                <span id="cacheRateDash" class="font-medium">0%</span>
              </div>
              <div class="flex justify-between">
                <span>Data Size:</span>
                <span id="dataSize" class="font-medium">0 KB</span>
              </div>
            </div>
          </div>

          <!-- Event Listeners -->
          <div class="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
            <div class="text-xs text-gray-600 dark:text-gray-400 font-medium mb-2">Event Listeners</div>
            <div class="grid grid-cols-2 gap-2 text-xs">
              <div class="flex justify-between">
                <span>Active:</span>
                <span id="activeListeners" class="font-medium">0</span>
              </div>
              <div class="flex justify-between">
                <span>Memory Leaks:</span>
                <span id="memoryLeaks" class="font-medium text-red-500">0</span>
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex gap-2">
            <button id="clearCache" class="flex-1 bg-red-500 hover:bg-red-600 text-white text-xs py-2 px-3 rounded font-medium transition-colors">
              Clear Cache
            </button>
            <button id="forceGC" class="flex-1 bg-blue-500 hover:bg-blue-600 text-white text-xs py-2 px-3 rounded font-medium transition-colors">
              Force GC
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(dashboard);
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Toggle visibility
    document.getElementById('perfClose')?.addEventListener('click', () => this.hide());
    document.getElementById('perfMinimize')?.addEventListener('click', () => this.toggleMinimize());

    // Action buttons
    document.getElementById('clearCache')?.addEventListener('click', () => this.clearCache());
    document.getElementById('forceGC')?.addEventListener('click', () => this.forceGarbageCollection());

    // Keyboard shortcut to toggle dashboard
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'P') {
        e.preventDefault();
        this.toggle();
      }
    });
  }

  setupMetricsCollection() {
    // FPS Counter
    this.startFPSCounter();

    // Memory monitoring
    this.startMemoryMonitoring();

    // DOM node counting
    this.startDOMMonitoring();

    // Performance timeline
    this.startPerformanceTimeline();
  }

  startFPSCounter() {
    let frames = 0;
    let lastTime = performance.now();

    const countFPS = (currentTime) => {
      frames++;

      if (currentTime - lastTime >= 1000) {
        const fps = Math.round((frames * 1000) / (currentTime - lastTime));
        this.updateMetric('fps', fps);

        frames = 0;
        lastTime = currentTime;
      }

      requestAnimationFrame(countFPS);
    };

    requestAnimationFrame(countFPS);
  }

  startMemoryMonitoring() {
    const interval = setInterval(() => {
      if ('memory' in performance) {
        const memory = performance.memory;
        const usedMB = Math.round(memory.usedJSHeapSize / 1024 / 1024 * 100) / 100;
        this.updateMetric('memory', usedMB);

        // CPU estimation (very rough)
        const cpuUsage = Math.min(100, (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100);
        this.updateMetric('cpu', Math.round(cpuUsage));
      }
    }, 1000);

    this.intervals.set('memory', interval);
  }

  startDOMMonitoring() {
    const interval = setInterval(() => {
      const nodeCount = document.getElementsByTagName('*').length;
      this.updateMetric('domNodes', nodeCount);
    }, 2000);

    this.intervals.set('dom', interval);
  }

  startPerformanceTimeline() {
    this.performanceData = {
      timestamps: [],
      memory: [],
      fps: [],
      cpu: []
    };

    const interval = setInterval(() => {
      const now = Date.now();
      this.performanceData.timestamps.push(now);
      this.performanceData.memory.push(this.metrics.get('memory') || 0);
      this.performanceData.fps.push(this.metrics.get('fps') || 60);
      this.performanceData.cpu.push(this.metrics.get('cpu') || 0);

      // Keep only last 30 data points
      if (this.performanceData.timestamps.length > 30) {
        this.performanceData.timestamps.shift();
        this.performanceData.memory.shift();
        this.performanceData.fps.shift();
        this.performanceData.cpu.shift();
      }

      this.updateChart();
    }, 1000);

    this.intervals.set('timeline', interval);
  }

  updateMetric(name, value) {
    this.metrics.set(name, value);

    // Update UI elements
    switch (name) {
      case 'fps':
        const fpsElement = document.getElementById('fpsCounter');
        if (fpsElement) {
          fpsElement.textContent = value;
          fpsElement.className = `text-lg font-bold ${value < 30 ? 'text-red-600' : value < 50 ? 'text-yellow-600' : 'text-green-600'}`;
        }
        break;

      case 'memory':
        const memoryElement = document.getElementById('memoryUsageDash');
        if (memoryElement) {
          memoryElement.textContent = `${value} MB`;
          memoryElement.className = `text-lg font-bold ${value > 100 ? 'text-red-600' : value > 50 ? 'text-yellow-600' : 'text-blue-600'}`;
        }
        break;

      case 'cpu':
        const cpuElement = document.getElementById('cpuUsage');
        if (cpuElement) {
          cpuElement.textContent = `${value}%`;
          cpuElement.className = `text-lg font-bold ${value > 80 ? 'text-red-600' : value > 60 ? 'text-yellow-600' : 'text-green-600'}`;
        }
        break;

      case 'domNodes':
        const domElement = document.getElementById('domNodeCount');
        if (domElement) {
          domElement.textContent = value.toLocaleString();
          domElement.className = `text-lg font-bold ${value > 1000 ? 'text-red-600' : value > 500 ? 'text-yellow-600' : 'text-yellow-600'}`;
        }
        break;
    }
  }

  updateChart() {
    const canvas = document.getElementById('perfChart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    if (this.performanceData.memory.length < 2) return;

    // Draw grid
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;

    // Horizontal lines
    for (let i = 0; i <= 4; i++) {
      const y = (height / 4) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Draw memory line
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    ctx.beginPath();

    const maxMemory = Math.max(...this.performanceData.memory, 50);
    this.performanceData.memory.forEach((value, index) => {
      const x = (width / (this.performanceData.memory.length - 1)) * index;
      const y = height - (value / maxMemory) * height;

      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();

    // Draw FPS line
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 2;
    ctx.beginPath();

    this.performanceData.fps.forEach((value, index) => {
      const x = (width / (this.performanceData.fps.length - 1)) * index;
      const y = height - (value / 60) * height; // Normalize to 60 FPS

      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();
  }

  startRealTimeUpdates() {
    const interval = setInterval(() => {
      this.updateCacheStats();
      this.updateEventListenerStats();
      this.updateDataSize();
    }, 2000);

    this.intervals.set('realtime', interval);
  }

  updateCacheStats() {
    const hits = parseInt(localStorage.getItem('cache_hits') || '0');
    const misses = parseInt(localStorage.getItem('cache_misses') || '0');
    const total = hits + misses;
    const hitRate = total > 0 ? Math.round((hits / total) * 100) : 0;

    document.getElementById('cacheHitsDash')?.textContent = hits;
    document.getElementById('cacheMissesDash')?.textContent = misses;
    document.getElementById('cacheRateDash')?.textContent = `${hitRate}%`;
  }

  updateEventListenerStats() {
    const activeListeners = window.performanceMonitor?.metrics.eventListeners.size || 0;
    document.getElementById('activeListeners')?.textContent = activeListeners;

    // Simple memory leak detection (if listeners keep growing)
    const previousCount = parseInt(sessionStorage.getItem('prevListenerCount') || '0');
    const leaks = Math.max(0, activeListeners - previousCount - 10); // Allow some growth

    document.getElementById('memoryLeaks')?.textContent = leaks;
    sessionStorage.setItem('prevListenerCount', activeListeners.toString());
  }

  updateDataSize() {
    const dataString = localStorage.getItem('spreadsheet_data') || '';
    const sizeKB = Math.round(new Blob([dataString]).size / 1024);
    document.getElementById('dataSize')?.textContent = `${sizeKB} KB`;
  }

  clearCache() {
    if (window.app?.dataProcessor) {
      window.app.dataProcessor.clearCache();
    }

    // Clear localStorage cache data
    localStorage.removeItem('cache_hits');
    localStorage.removeItem('cache_misses');

    this.updateCacheStats();

    // Show notification
    this.showNotification('Cache cleared successfully', 'success');
  }

  forceGarbageCollection() {
    // Force garbage collection if available
    if (window.gc) {
      window.gc();
      this.showNotification('Garbage collection triggered', 'success');
    } else {
      // Fallback: Try to force GC by creating/destroying objects
      const temp = [];
      for (let i = 0; i < 1000; i++) {
        temp.push(new Array(1000).fill(0));
      }
      temp.length = 0;

      this.showNotification('Memory cleanup attempted', 'info');
    }
  }

  show() {
    const dashboard = document.getElementById('performanceDashboard');
    if (dashboard) {
      dashboard.classList.remove('translate-y-full', 'opacity-0');
      dashboard.classList.add('translate-y-0', 'opacity-100');
      this.isVisible = true;
    }
  }

  hide() {
    const dashboard = document.getElementById('performanceDashboard');
    if (dashboard) {
      dashboard.classList.add('translate-y-full', 'opacity-0');
      dashboard.classList.remove('translate-y-0', 'opacity-100');
      this.isVisible = false;
    }
  }

  toggle() {
    if (this.isVisible) {
      this.hide();
    } else {
      this.show();
    }
  }

  toggleMinimize() {
    const content = document.getElementById('perfContent');
    if (content) {
      content.classList.toggle('hidden');
    }
  }

  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    const colors = {
      success: 'bg-green-500',
      error: 'bg-red-500',
      warning: 'bg-yellow-500',
      info: 'bg-blue-500'
    };

    notification.className = `fixed top-4 left-4 ${colors[type]} text-white px-4 py-2 rounded-lg shadow-lg z-50 text-sm`;
    notification.textContent = message;

    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 2000);
  }

  destroy() {
    // Clear all intervals
    this.intervals.forEach(interval => clearInterval(interval));
    this.intervals.clear();

    // Remove dashboard
    const dashboard = document.getElementById('performanceDashboard');
    if (dashboard) {
      dashboard.remove();
    }
  }
}

// Auto-initialize if performance monitoring is enabled
if (typeof window !== 'undefined' && window.performanceMonitor) {
  window.performanceDashboard = new PerformanceDashboard();

  // Show dashboard after 3 seconds
  setTimeout(() => {
    window.performanceDashboard.show();
  }, 3000);
}