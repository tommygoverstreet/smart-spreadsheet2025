/**
 * Advanced Data Processing Engine
 * Handles large datasets with memory optimization and caching
 */
export class DataProcessor {
  constructor() {
    this.cache = new Map();
    this.processingQueue = [];
    this.isProcessing = false;
    this.maxCacheSize = 50; // Max cached operations
    this.chunkSize = 1000; // Process in chunks for large datasets

    this.initCache();
  }

  initCache() {
    // Check for existing cache in IndexedDB
    if ('indexedDB' in window) {
      this.initIndexedDB();
    }
  }

  async initIndexedDB() {
    try {
      this.db = await this.openDatabase();
    } catch (error) {
      console.warn('IndexedDB not available, using memory cache only');
    }
  }

  openDatabase() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('SpreadsheetCache', 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('dataCache')) {
          const store = db.createObjectStore('dataCache', { keyPath: 'id' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  }

  // Optimized CSV parsing with chunking
  async parseCSVOptimized(csvText, filename) {
    const cacheKey = this.generateCacheKey('parse', csvText.substring(0, 100));

    // Check cache first
    const cached = await this.getFromCache(cacheKey);
    if (cached) {
      this.incrementCacheHit();
      return cached;
    }

    this.incrementCacheMiss();

    return new Promise((resolve) => {
      // Use web worker for large files
      if (csvText.length > 100000) {
        this.parseWithWorker(csvText, filename).then(result => {
          this.setCache(cacheKey, result);
          resolve(result);
        });
      } else {
        // Standard parsing for smaller files
        const result = this.parseCSVSync(csvText, filename);
        this.setCache(cacheKey, result);
        resolve(result);
      }
    });
  }

  parseCSVSync(csvText, filename) {
    const lines = csvText.split('\n');
    const headers = this.parseCSVLine(lines[0] || '');
    const rows = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line) {
        const values = this.parseCSVLine(line);
        const row = {};
        headers.forEach((header, index) => {
          row[header] = values[index] || '';
        });
        rows.push(row);
      }
    }

    return {
      id: this.generateId(),
      name: filename,
      headers,
      rows,
      metadata: {
        rowCount: rows.length,
        columnCount: headers.length,
        size: csvText.length,
        parseTime: performance.now()
      }
    };
  }

  parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }

    result.push(current.trim());
    return result;
  }

  // Web Worker for heavy processing
  async parseWithWorker(csvText, filename) {
    return new Promise((resolve, reject) => {
      const worker = new Worker(URL.createObjectURL(new Blob([`
        self.onmessage = function(e) {
          const { csvText, filename } = e.data;
          
          // Simple CSV parsing in worker
          const lines = csvText.split('\\n');
          const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
          const rows = [];
          
          for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (line) {
              const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
              const row = {};
              headers.forEach((header, index) => {
                row[header] = values[index] || '';
              });
              rows.push(row);
            }
          }
          
          self.postMessage({
            id: Date.now().toString(36),
            name: filename,
            headers,
            rows,
            metadata: {
              rowCount: rows.length,
              columnCount: headers.length,
              parseTime: performance.now()
            }
          });
        };
      `], { type: 'application/javascript' })));

      worker.onmessage = (e) => {
        resolve(e.data);
        worker.terminate();
      };

      worker.onerror = (error) => {
        reject(error);
        worker.terminate();
      };

      worker.postMessage({ csvText, filename });
    });
  }

  // Data validation and cleaning
  validateAndCleanData(data) {
    const cacheKey = this.generateCacheKey('validate', JSON.stringify(data.headers));
    const cached = this.cache.get(cacheKey);

    if (cached) {
      this.incrementCacheHit();
      return cached;
    }

    this.incrementCacheMiss();

    const result = {
      ...data,
      rows: data.rows.map(row => this.cleanRow(row, data.headers)),
      validation: this.performValidation(data)
    };

    this.setCache(cacheKey, result);
    return result;
  }

  cleanRow(row, headers) {
    const cleaned = {};

    headers.forEach(header => {
      let value = row[header] || '';

      // Trim whitespace
      value = value.toString().trim();

      // Auto-detect and convert data types
      if (this.isNumeric(value)) {
        cleaned[header] = parseFloat(value);
      } else if (this.isDate(value)) {
        cleaned[header] = new Date(value).toISOString().split('T')[0];
      } else {
        cleaned[header] = value;
      }
    });

    return cleaned;
  }

  performValidation(data) {
    const validation = {
      errors: [],
      warnings: [],
      suggestions: []
    };

    // Check for empty columns
    data.headers.forEach(header => {
      const emptyCount = data.rows.filter(row => !row[header] || row[header] === '').length;
      const emptyPercentage = (emptyCount / data.rows.length) * 100;

      if (emptyPercentage > 50) {
        validation.warnings.push(`Column "${header}" is ${Math.round(emptyPercentage)}% empty`);
      }
    });

    // Check for duplicate rows
    const uniqueRows = new Set(data.rows.map(row => JSON.stringify(row)));
    if (uniqueRows.size < data.rows.length) {
      validation.warnings.push(`Found ${data.rows.length - uniqueRows.size} duplicate rows`);
    }

    // Data type consistency checks
    data.headers.forEach(header => {
      const types = new Set(data.rows.map(row => typeof row[header]).filter(t => t !== 'undefined'));
      if (types.size > 1) {
        validation.suggestions.push(`Column "${header}" has mixed data types: ${Array.from(types).join(', ')}`);
      }
    });

    return validation;
  }

  // Optimized filtering with indexing
  filterData(data, searchTerm, column = null) {
    const cacheKey = this.generateCacheKey('filter', `${searchTerm}_${column}`);
    const cached = this.cache.get(cacheKey);

    if (cached) {
      this.incrementCacheHit();
      return cached;
    }

    this.incrementCacheMiss();

    const searchColumns = column ? [column] : data.headers;
    const searchLower = searchTerm.toLowerCase();

    const filtered = data.rows.filter(row => {
      return searchColumns.some(col => {
        const value = row[col];
        return value && value.toString().toLowerCase().includes(searchLower);
      });
    });

    const result = { ...data, rows: filtered };
    this.setCache(cacheKey, result);
    return result;
  }

  // Advanced sorting with multiple columns
  sortData(data, sortConfig) {
    const cacheKey = this.generateCacheKey('sort', JSON.stringify(sortConfig));
    const cached = this.cache.get(cacheKey);

    if (cached) {
      this.incrementCacheHit();
      return cached;
    }

    this.incrementCacheMiss();

    const sorted = [...data.rows].sort((a, b) => {
      for (const { column, direction } of sortConfig) {
        const aVal = a[column];
        const bVal = b[column];

        let comparison = 0;

        if (this.isNumeric(aVal) && this.isNumeric(bVal)) {
          comparison = parseFloat(aVal) - parseFloat(bVal);
        } else {
          comparison = String(aVal).localeCompare(String(bVal));
        }

        if (comparison !== 0) {
          return direction === 'desc' ? -comparison : comparison;
        }
      }
      return 0;
    });

    const result = { ...data, rows: sorted };
    this.setCache(cacheKey, result);
    return result;
  }

  // Utility methods
  isNumeric(value) {
    return !isNaN(parseFloat(value)) && isFinite(value);
  }

  isDate(value) {
    return !isNaN(Date.parse(value));
  }

  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  generateCacheKey(operation, data) {
    return `${operation}_${this.hashCode(data)}`;
  }

  hashCode(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash;
  }

  // Cache management
  async setCache(key, value) {
    // Memory cache
    if (this.cache.size >= this.maxCacheSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, value);

    // IndexedDB cache for persistence
    if (this.db) {
      try {
        const transaction = this.db.transaction(['dataCache'], 'readwrite');
        const store = transaction.objectStore('dataCache');
        store.put({
          id: key,
          data: value,
          timestamp: Date.now()
        });
      } catch (error) {
        console.warn('Failed to cache to IndexedDB:', error);
      }
    }
  }

  async getFromCache(key) {
    // Check memory cache first
    if (this.cache.has(key)) {
      return this.cache.get(key);
    }

    // Check IndexedDB
    if (this.db) {
      try {
        const transaction = this.db.transaction(['dataCache'], 'readonly');
        const store = transaction.objectStore('dataCache');
        const request = store.get(key);

        return new Promise((resolve) => {
          request.onsuccess = () => {
            const result = request.result;
            if (result) {
              // Also cache in memory for faster access
              this.cache.set(key, result.data);
              resolve(result.data);
            } else {
              resolve(null);
            }
          };
          request.onerror = () => resolve(null);
        });
      } catch (error) {
        console.warn('Failed to read from IndexedDB:', error);
      }
    }

    return null;
  }

  incrementCacheHit() {
    const hits = parseInt(localStorage.getItem('cache_hits') || '0');
    localStorage.setItem('cache_hits', (hits + 1).toString());
  }

  incrementCacheMiss() {
    const misses = parseInt(localStorage.getItem('cache_misses') || '0');
    localStorage.setItem('cache_misses', (misses + 1).toString());
  }

  // Clear cache
  clearCache() {
    this.cache.clear();

    if (this.db) {
      const transaction = this.db.transaction(['dataCache'], 'readwrite');
      const store = transaction.objectStore('dataCache');
      store.clear();
    }

    localStorage.removeItem('cache_hits');
    localStorage.removeItem('cache_misses');
  }

  // Get performance stats
  getStats() {
    return {
      cacheSize: this.cache.size,
      maxCacheSize: this.maxCacheSize,
      hits: parseInt(localStorage.getItem('cache_hits') || '0'),
      misses: parseInt(localStorage.getItem('cache_misses') || '0')
    };
  }
}

export const dataProcessor = new DataProcessor();