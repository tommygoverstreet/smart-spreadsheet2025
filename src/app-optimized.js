/**
 * Optimized Smart Spreadsheet Dashboard
 * Main application with modular architecture and performance optimizations
 */

// Dynamic imports for code splitting
const PerformanceMonitor = import('./modules/PerformanceMonitor.js');
const DataProcessor = import('./modules/DataProcessor.js');
const UIRenderer = import('./modules/UIRenderer.js');

// Global state management
class AppState {
  constructor() {
    this.files = [];
    this.activeId = null;
    this.history = [];
    this.historyIndex = -1;
    this.searchTerm = '';
    this.filterColumn = '';
    this.page = 0;
    this.perPage = 25;
    this.sortConfig = [];

    // Performance tracking
    this.performanceData = {
      loadTime: 0,
      renderTime: 0,
      memoryUsage: 0
    };

    this.init();
  }

  async init() {
    // Load modules dynamically
    this.performanceMonitor = (await PerformanceMonitor).performanceMonitor;
    this.dataProcessor = (await DataProcessor).dataProcessor;
    this.uiRenderer = (await UIRenderer).uiRenderer;

    // Setup event listeners
    this.setupEventListeners();

    // Load saved data
    this.loadFromStorage();

    // Initialize UI
    this.initializeUI();
  }

  setupEventListeners() {
    // Custom events for modular communication
    document.addEventListener('dataChange', (e) => this.handleDataChange(e));
    document.addEventListener('fileSelect', (e) => this.handleFileSelect(e));
    document.addEventListener('fileDelete', (e) => this.handleFileDelete(e));
    document.addEventListener('columnSort', (e) => this.handleColumnSort(e));

    // File upload
    this.setupFileUpload();

    // Keyboard shortcuts
    this.setupKeyboardShortcuts();

    // Window events
    window.addEventListener('beforeunload', () => this.saveToStorage());
    window.addEventListener('resize', this.debounce(() => this.handleResize(), 250));
  }

  async setupFileUpload() {
    const fileInput = document.getElementById('fileInput');
    const dropZone = document.getElementById('dropZone');

    if (fileInput) {
      fileInput.addEventListener('change', (e) => this.handleFileUpload(e.target.files));
    }

    if (dropZone) {
      dropZone.addEventListener('click', () => fileInput?.click());
      dropZone.addEventListener('dragover', (e) => this.handleDragOver(e));
      dropZone.addEventListener('drop', (e) => this.handleDrop(e));
    }
  }

  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Ctrl/Cmd + U for file upload
      if ((e.ctrlKey || e.metaKey) && e.key === 'u') {
        e.preventDefault();
        document.getElementById('fileInput')?.click();
      }

      // Ctrl/Cmd + F for search
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        document.getElementById('searchInput')?.focus();
      }

      // Escape to clear search
      if (e.key === 'Escape') {
        const searchInput = document.getElementById('searchInput');
        if (searchInput && searchInput.value) {
          searchInput.value = '';
          this.handleSearch('');
        }
      }
    });
  }

  async handleFileUpload(files) {
    const loadingIndicator = this.showLoading('Processing files...');

    try {
      for (const file of files) {
        await this.processFile(file);
      }

      this.renderAll();
      this.showNotification('Files uploaded successfully', 'success');
    } catch (error) {
      console.error('File upload error:', error);
      this.showNotification('Error uploading files', 'error');
    } finally {
      this.hideLoading(loadingIndicator);
    }
  }

  async processFile(file) {
    const text = await this.readFileAsText(file);

    if (file.name.endsWith('.csv')) {
      const data = await this.dataProcessor.parseCSVOptimized(text, file.name);
      const validatedData = this.dataProcessor.validateAndCleanData(data);
      this.addFile(validatedData);
    } else if (file.name.endsWith('.json')) {
      const jsonData = JSON.parse(text);
      const data = this.convertJSONToTableFormat(jsonData, file.name);
      this.addFile(data);
    }
  }

  readFileAsText(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = (e) => reject(e);
      reader.readAsText(file);
    });
  }

  convertJSONToTableFormat(jsonData, filename) {
    let rows = Array.isArray(jsonData) ? jsonData : [jsonData];

    // Extract headers from first object
    const headers = rows.length > 0 ? Object.keys(rows[0]) : [];

    return {
      id: this.generateId(),
      name: filename,
      headers,
      rows,
      metadata: {
        rowCount: rows.length,
        columnCount: headers.length,
        parseTime: performance.now()
      }
    };
  }

  handleDragOver(e) {
    e.preventDefault();
    e.currentTarget.classList.add('drop-drag');
  }

  handleDrop(e) {
    e.preventDefault();
    e.currentTarget.classList.remove('drop-drag');

    const files = Array.from(e.dataTransfer.files);
    this.handleFileUpload(files);
  }

  handleDataChange(event) {
    const { column, row, value } = event.detail;
    const activeFile = this.getActiveFile();

    if (activeFile && activeFile.rows[row]) {
      // Save current state for undo
      this.saveToHistory();

      // Update data
      activeFile.rows[row][column] = value;

      // Auto-save
      this.saveToStorage();
    }
  }

  handleFileSelect(event) {
    this.activeId = event.detail.fileId;
    this.renderAll();
  }

  handleFileDelete(event) {
    const fileId = event.detail.fileId;
    this.files = this.files.filter(f => f.id !== fileId);

    if (this.activeId === fileId) {
      this.activeId = this.files.length > 0 ? this.files[0].id : null;
    }

    this.renderAll();
    this.saveToStorage();
  }

  handleColumnSort(event) {
    const { column, direction } = event.detail;
    const activeFile = this.getActiveFile();

    if (activeFile) {
      this.sortConfig = [{ column, direction }];
      const sortedData = this.dataProcessor.sortData(activeFile, this.sortConfig);

      // Update the file data
      const fileIndex = this.files.findIndex(f => f.id === activeFile.id);
      if (fileIndex !== -1) {
        this.files[fileIndex] = sortedData;
      }

      this.renderTable();
    }
  }

  async handleSearch(searchTerm) {
    this.searchTerm = searchTerm;
    const activeFile = this.getActiveFile();

    if (activeFile) {
      if (searchTerm.trim()) {
        const filteredData = this.dataProcessor.filterData(activeFile, searchTerm, this.filterColumn);
        this.renderTable(filteredData);
      } else {
        this.renderTable(activeFile);
      }
    }
  }

  handleResize() {
    // Responsive adjustments
    this.renderAll();
  }

  addFile(fileData) {
    this.files.push(fileData);
    this.activeId = fileData.id;
    this.saveToHistory();
  }

  getActiveFile() {
    return this.files.find(f => f.id === this.activeId);
  }

  saveToHistory() {
    const state = {
      files: JSON.parse(JSON.stringify(this.files)),
      activeId: this.activeId,
      timestamp: Date.now()
    };

    // Remove future history if we're not at the end
    if (this.historyIndex < this.history.length - 1) {
      this.history = this.history.slice(0, this.historyIndex + 1);
    }

    this.history.push(state);
    this.historyIndex = this.history.length - 1;

    // Limit history size
    if (this.history.length > 50) {
      this.history = this.history.slice(-50);
      this.historyIndex = this.history.length - 1;
    }
  }

  undo() {
    if (this.historyIndex > 0) {
      this.historyIndex--;
      const state = this.history[this.historyIndex];
      this.files = JSON.parse(JSON.stringify(state.files));
      this.activeId = state.activeId;
      this.renderAll();
    }
  }

  redo() {
    if (this.historyIndex < this.history.length - 1) {
      this.historyIndex++;
      const state = this.history[this.historyIndex];
      this.files = JSON.parse(JSON.stringify(state.files));
      this.activeId = state.activeId;
      this.renderAll();
    }
  }

  initializeUI() {
    // Initialize theme manager
    this.themeManager = new ThemeManager();

    // Setup search input
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
      searchInput.addEventListener('input',
        this.debounce((e) => this.handleSearch(e.target.value), 300)
      );
    }

    // Setup button event listeners
    this.setupButtonListeners();

    // Load demo data if no files
    if (this.files.length === 0) {
      this.loadDemoData();
    }

    // Initial render
    this.renderAll();
  }

  setupButtonListeners() {
    // Undo/Redo buttons
    document.getElementById('undoBtn')?.addEventListener('click', () => this.undo());
    document.getElementById('redoBtn')?.addEventListener('click', () => this.redo());

    // Quick action buttons
    document.getElementById('autoCleanBtn')?.addEventListener('click', () => this.autoCleanData());
    document.getElementById('validateBtn')?.addEventListener('click', () => this.validateData());
    document.getElementById('optimizeBtn')?.addEventListener('click', () => this.optimizeData());

    // Export buttons
    document.getElementById('exportCsvBtn')?.addEventListener('click', () => this.exportCSV());
    document.getElementById('exportWorkspaceBtn')?.addEventListener('click', () => this.exportWorkspace());

    // Clear workspace
    document.getElementById('clearWorkspaceBtn')?.addEventListener('click', () => this.clearWorkspace());
  }

  async autoCleanData() {
    const activeFile = this.getActiveFile();
    if (!activeFile) return;

    const loadingIndicator = this.showLoading('Cleaning data...');

    try {
      const cleanedData = this.dataProcessor.validateAndCleanData(activeFile);

      // Update file data
      const fileIndex = this.files.findIndex(f => f.id === activeFile.id);
      if (fileIndex !== -1) {
        this.files[fileIndex] = cleanedData;
      }

      this.renderAll();
      this.showNotification('Data cleaned successfully', 'success');
    } catch (error) {
      console.error('Auto-clean error:', error);
      this.showNotification('Error cleaning data', 'error');
    } finally {
      this.hideLoading(loadingIndicator);
    }
  }

  validateData() {
    const activeFile = this.getActiveFile();
    if (!activeFile) return;

    const validation = this.dataProcessor.performValidation(activeFile);
    this.showValidationResults(validation);
  }

  optimizeData() {
    const activeFile = this.getActiveFile();
    if (!activeFile) return;

    // Remove empty rows
    const optimizedRows = activeFile.rows.filter(row => {
      return activeFile.headers.some(header => row[header] && row[header].trim() !== '');
    });

    // Update file
    const fileIndex = this.files.findIndex(f => f.id === activeFile.id);
    if (fileIndex !== -1) {
      this.files[fileIndex].rows = optimizedRows;
    }

    this.renderAll();
    this.showNotification(`Removed ${activeFile.rows.length - optimizedRows.length} empty rows`, 'success');
  }

  exportCSV() {
    const activeFile = this.getActiveFile();
    if (!activeFile) return;

    const csv = this.generateCSV(activeFile);
    this.downloadBlob(csv, `${activeFile.name.replace(/\.[^/.]+$/, '')}.csv`, 'text/csv');
  }

  exportWorkspace() {
    const workspaceData = {
      files: this.files,
      activeId: this.activeId,
      exportDate: new Date().toISOString()
    };

    const json = JSON.stringify(workspaceData, null, 2);
    this.downloadBlob(json, 'workspace.json', 'application/json');
  }

  clearWorkspace() {
    if (confirm('Are you sure you want to clear all data? This cannot be undone.')) {
      this.files = [];
      this.activeId = null;
      this.history = [];
      this.historyIndex = -1;

      this.renderAll();
      this.saveToStorage();
      this.showNotification('Workspace cleared', 'success');
    }
  }

  renderAll() {
    this.performanceMonitor?.startRenderTracking();

    this.renderFilesList();
    this.renderTable();
    this.updateStats();
    this.saveToStorage();

    this.performanceMonitor?.endRenderTracking();
  }

  renderFilesList() {
    const container = document.getElementById('filesList');
    if (container && this.uiRenderer) {
      this.uiRenderer.renderFilesList(this.files, container);
    }
  }

  renderTable(data = null) {
    const container = document.getElementById('dataTable');
    if (!container) return;

    const activeFile = data || this.getActiveFile();
    if (!activeFile) {
      container.innerHTML = '<div class="p-8 text-center text-gray-500">No data to display</div>';
      return;
    }

    // Use optimized renderer
    if (this.uiRenderer) {
      this.uiRenderer.renderTable(activeFile, container, {
        startRow: this.page * this.perPage,
        endRow: (this.page + 1) * this.perPage,
        pageSize: this.perPage
      });
    }

    // Update active file name
    const activeFileName = document.getElementById('activeFileName');
    if (activeFileName) {
      activeFileName.textContent = activeFile.name;
    }
  }

  updateStats() {
    const activeFile = this.getActiveFile();
    const statsElement = document.getElementById('tableStats');

    if (statsElement) {
      if (activeFile) {
        statsElement.textContent = `${activeFile.rows.length} rows • ${activeFile.headers.length} cols`;
      } else {
        statsElement.textContent = '0 rows • 0 cols';
      }
    }
  }

  loadDemoData() {
    const demoData = {
      id: this.generateId(),
      name: 'demo_sales.csv',
      headers: ['order_date', 'region', 'product', 'units', 'price', 'revenue'],
      rows: [
        { order_date: '2024-01-05', region: 'West', product: 'A', units: 10, price: 12.5, revenue: 125 },
        { order_date: '2024-02-14', region: 'East', product: 'B', units: 4, price: 20, revenue: 80 },
        { order_date: '2024-03-03', region: 'West', product: 'A', units: 7, price: 12.5, revenue: 87.5 }
      ],
      metadata: {
        rowCount: 3,
        columnCount: 6,
        parseTime: 0
      }
    };

    this.addFile(demoData);
  }

  // Storage methods
  saveToStorage() {
    try {
      const data = {
        files: this.files,
        activeId: this.activeId,
        settings: {
          perPage: this.perPage,
          theme: localStorage.getItem('theme')
        }
      };
      localStorage.setItem('spreadsheet_data', JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save to localStorage:', error);
    }
  }

  loadFromStorage() {
    try {
      const saved = localStorage.getItem('spreadsheet_data');
      if (saved) {
        const data = JSON.parse(saved);
        this.files = data.files || [];
        this.activeId = data.activeId;
        this.perPage = data.settings?.perPage || 25;
      }
    } catch (error) {
      console.warn('Failed to load from localStorage:', error);
    }
  }

  // Utility methods
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  generateCSV(fileData) {
    const rows = [
      fileData.headers.join(','),
      ...fileData.rows.map(row =>
        fileData.headers.map(header => this.csvEscape(row[header])).join(',')
      )
    ];
    return rows.join('\n');
  }

  csvEscape(value) {
    const str = String(value || '');
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  }

  downloadBlob(content, filename, type) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  showLoading(message = 'Loading...') {
    const loader = document.createElement('div');
    loader.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    loader.innerHTML = `
      <div class="bg-white dark:bg-gray-800 rounded-lg p-6 flex items-center gap-3 shadow-xl">
        <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        <span class="text-gray-700 dark:text-gray-200">${message}</span>
      </div>
    `;
    document.body.appendChild(loader);
    return loader;
  }

  hideLoading(loader) {
    if (loader && loader.parentNode) {
      loader.parentNode.removeChild(loader);
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

    notification.className = `fixed top-4 right-4 ${colors[type]} text-white px-4 py-2 rounded-lg shadow-lg z-50 max-w-md`;
    notification.textContent = message;

    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
  }

  showValidationResults(validation) {
    const results = [
      ...validation.errors.map(e => `❌ ${e}`),
      ...validation.warnings.map(w => `⚠️ ${w}`),
      ...validation.suggestions.map(s => `💡 ${s}`)
    ];

    if (results.length === 0) {
      this.showNotification('Data validation passed!', 'success');
    } else {
      const modal = document.createElement('div');
      modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
      modal.innerHTML = `
        <div class="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl max-h-96 overflow-y-auto">
          <h3 class="text-lg font-bold mb-4">Validation Results</h3>
          <div class="space-y-2">
            ${results.map(r => `<div class="text-sm">${r}</div>`).join('')}
          </div>
          <button class="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600" onclick="this.closest('.fixed').remove()">
            Close
          </button>
        </div>
      `;
      document.body.appendChild(modal);
    }
  }

  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }
}

// Theme Manager (lightweight version)
class ThemeManager {
  constructor() {
    this.theme = localStorage.getItem('theme') || 'light';
    this.init();
  }

  init() {
    this.applyTheme(this.theme);
    this.setupThemeToggle();
  }

  applyTheme(theme) {
    const html = document.documentElement;
    if (theme === 'dark') {
      html.classList.add('dark');
    } else {
      html.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }

  setupThemeToggle() {
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
      themeToggle.addEventListener('click', () => this.toggleTheme());
    }
  }

  toggleTheme() {
    this.theme = this.theme === 'light' ? 'dark' : 'light';
    this.applyTheme(this.theme);
  }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.app = new AppState();
});

// Handle service worker registration
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => console.log('SW registered'))
      .catch(error => console.log('SW registration failed'));
  });
}