/**
 * Advanced Caching System
 * Multi-layer caching with IndexedDB, memory, and intelligent eviction
 */
export class CacheManager {
  constructor() {
    this.memoryCache = new Map();
    this.indexedDB = null;
    this.cacheConfig = {
      maxMemoryItems: 100,
      maxMemorySize: 50 * 1024 * 1024, // 50MB
      ttl: 24 * 60 * 60 * 1000, // 24 hours
      compressionEnabled: true
    };

    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0,
      compressionRatio: 0
    };

    this.init();
  }

  async init() {
    await this.initIndexedDB();
    this.setupMemoryManagement();
    this.loadStatsFromStorage();

    console.log('🗄️ Cache system initialized');
  }

  async initIndexedDB() {
    if (!('indexedDB' in window)) {
      console.warn('IndexedDB not supported, using memory cache only');
      return;
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open('SpreadsheetCacheDB', 2);

      request.onerror = () => {
        console.warn('IndexedDB initialization failed:', request.error);
        resolve(); // Continue without IndexedDB
      };

      request.onsuccess = () => {
        this.indexedDB = request.result;
        console.log('✅ IndexedDB initialized');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Create object stores
        if (!db.objectStoreNames.contains('dataCache')) {
          const store = db.createObjectStore('dataCache', { keyPath: 'key' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('size', 'size', { unique: false });
          store.createIndex('accessCount', 'accessCount', { unique: false });
        }

        if (!db.objectStoreNames.contains('fileCache')) {
          const fileStore = db.createObjectStore('fileCache', { keyPath: 'key' });
          fileStore.createIndex('lastAccessed', 'lastAccessed', { unique: false });
        }

        if (!db.objectStoreNames.contains('queryCache')) {
          const queryStore = db.createObjectStore('queryCache', { keyPath: 'key' });
          queryStore.createIndex('queryType', 'queryType', { unique: false });
        }
      };
    });
  }

  setupMemoryManagement() {
    // Monitor memory usage
    this.memoryMonitor = setInterval(() => {
      this.checkMemoryUsage();
    }, 10000); // Check every 10 seconds

    // Cleanup expired items
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredItems();
    }, 60000); // Cleanup every minute
  }

  // Primary cache methods
  async set(key, value, options = {}) {
    const {
      ttl = this.cacheConfig.ttl,
      compress = this.cacheConfig.compressionEnabled,
      priority = 1,
      tags = []
    } = options;

    const cacheItem = {
      key,
      value: compress ? await this.compress(value) : value,
      timestamp: Date.now(),
      ttl,
      priority,
      tags,
      size: this.calculateSize(value),
      accessCount: 0,
      compressed: compress
    };

    // Store in memory cache
    this.memoryCache.set(key, cacheItem);

    // Store in IndexedDB for persistence
    if (this.indexedDB) {
      await this.setInIndexedDB('dataCache', cacheItem);
    }

    // Check if we need to evict items
    this.checkEviction();

    console.log(`📦 Cached item: ${key} (${this.formatSize(cacheItem.size)})`);
    return true;
  }

  async get(key) {
    let cacheItem = null;

    // Check memory cache first
    if (this.memoryCache.has(key)) {
      cacheItem = this.memoryCache.get(key);
      this.recordHit();
    }
    // Check IndexedDB
    else if (this.indexedDB) {
      cacheItem = await this.getFromIndexedDB('dataCache', key);
      if (cacheItem) {
        // Promote to memory cache
        this.memoryCache.set(key, cacheItem);
        this.recordHit();
      }
    }

    if (!cacheItem) {
      this.recordMiss();
      return null;
    }

    // Check if expired
    if (this.isExpired(cacheItem)) {
      await this.delete(key);
      this.recordMiss();
      return null;
    }

    // Update access statistics
    cacheItem.accessCount++;
    cacheItem.lastAccessed = Date.now();

    // Decompress if needed
    const value = cacheItem.compressed ?
      await this.decompress(cacheItem.value) :
      cacheItem.value;

    return value;
  }

  async delete(key) {
    this.memoryCache.delete(key);

    if (this.indexedDB) {
      await this.deleteFromIndexedDB('dataCache', key);
    }

    return true;
  }

  async clear() {
    this.memoryCache.clear();

    if (this.indexedDB) {
      const transaction = this.indexedDB.transaction(['dataCache'], 'readwrite');
      await transaction.objectStore('dataCache').clear();
    }

    this.stats = { hits: 0, misses: 0, evictions: 0, compressionRatio: 0 };
    this.saveStatsToStorage();

    console.log('🗑️ Cache cleared');
  }

  // Specialized cache methods
  async cacheFile(fileId, fileData) {
    const key = `file_${fileId}`;
    await this.set(key, fileData, {
      ttl: 7 * 24 * 60 * 60 * 1000, // 7 days for files
      compress: true,
      priority: 2,
      tags: ['file']
    });
  }

  async getCachedFile(fileId) {
    return await this.get(`file_${fileId}`);
  }

  async cacheQuery(queryHash, result, queryType = 'general') {
    const key = `query_${queryHash}`;
    const cacheItem = {
      key,
      value: result,
      queryType,
      timestamp: Date.now(),
      lastAccessed: Date.now()
    };

    if (this.indexedDB) {
      await this.setInIndexedDB('queryCache', cacheItem);
    }
  }

  async getCachedQuery(queryHash) {
    if (!this.indexedDB) return null;

    const cacheItem = await this.getFromIndexedDB('queryCache', `query_${queryHash}`);
    if (cacheItem && !this.isExpired(cacheItem)) {
      cacheItem.lastAccessed = Date.now();
      await this.setInIndexedDB('queryCache', cacheItem);
      return cacheItem.value;
    }

    return null;
  }

  // Compression methods
  async compress(data) {
    if (!('CompressionStream' in window)) {
      // Fallback: JSON string compression simulation
      const jsonString = JSON.stringify(data);
      const compressed = this.simpleCompress(jsonString);
      this.updateCompressionRatio(jsonString.length, compressed.length);
      return compressed;
    }

    try {
      const jsonString = JSON.stringify(data);
      const stream = new CompressionStream('gzip');
      const writer = stream.writable.getWriter();
      const reader = stream.readable.getReader();

      writer.write(new TextEncoder().encode(jsonString));
      writer.close();

      const chunks = [];
      let done = false;

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) chunks.push(value);
      }

      const compressed = new Uint8Array(chunks.reduce((acc, chunk) => acc + chunk.length, 0));
      let offset = 0;
      for (const chunk of chunks) {
        compressed.set(chunk, offset);
        offset += chunk.length;
      }

      this.updateCompressionRatio(jsonString.length, compressed.length);
      return compressed;
    } catch (error) {
      console.warn('Compression failed, storing uncompressed:', error);
      return data;
    }
  }

  async decompress(compressedData) {
    if (typeof compressedData === 'string') {
      // Fallback decompression
      return JSON.parse(this.simpleDecompress(compressedData));
    }

    if (!('DecompressionStream' in window)) {
      return compressedData;
    }

    try {
      const stream = new DecompressionStream('gzip');
      const writer = stream.writable.getWriter();
      const reader = stream.readable.getReader();

      writer.write(compressedData);
      writer.close();

      const chunks = [];
      let done = false;

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) chunks.push(value);
      }

      const decompressed = new Uint8Array(chunks.reduce((acc, chunk) => acc + chunk.length, 0));
      let offset = 0;
      for (const chunk of chunks) {
        decompressed.set(chunk, offset);
        offset += chunk.length;
      }

      const jsonString = new TextDecoder().decode(decompressed);
      return JSON.parse(jsonString);
    } catch (error) {
      console.warn('Decompression failed:', error);
      return compressedData;
    }
  }

  simpleCompress(str) {
    // Simple run-length encoding for fallback
    return str.replace(/(.)\1+/g, (match, char) => {
      return char + match.length;
    });
  }

  simpleDecompress(str) {
    // Reverse simple compression
    return str.replace(/(.)\d+/g, (match, char) => {
      const count = parseInt(match.slice(1));
      return char.repeat(count);
    });
  }

  // IndexedDB helpers
  async setInIndexedDB(storeName, data) {
    if (!this.indexedDB) return;

    return new Promise((resolve, reject) => {
      const transaction = this.indexedDB.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(data);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getFromIndexedDB(storeName, key) {
    if (!this.indexedDB) return null;

    return new Promise((resolve, reject) => {
      const transaction = this.indexedDB.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(key);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async deleteFromIndexedDB(storeName, key) {
    if (!this.indexedDB) return;

    return new Promise((resolve, reject) => {
      const transaction = this.indexedDB.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(key);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Cache management
  checkMemoryUsage() {
    const totalSize = Array.from(this.memoryCache.values())
      .reduce((sum, item) => sum + item.size, 0);

    if (totalSize > this.cacheConfig.maxMemorySize ||
      this.memoryCache.size > this.cacheConfig.maxMemoryItems) {
      this.evictItems();
    }
  }

  evictItems() {
    // Use LRU + priority eviction strategy
    const items = Array.from(this.memoryCache.entries())
      .map(([key, item]) => ({ key, ...item }))
      .sort((a, b) => {
        // Sort by priority (lower first) then by last accessed
        if (a.priority !== b.priority) {
          return a.priority - b.priority;
        }
        return (a.lastAccessed || a.timestamp) - (b.lastAccessed || b.timestamp);
      });

    // Evict 25% of items or until under limits
    const evictCount = Math.max(1, Math.floor(items.length * 0.25));

    for (let i = 0; i < evictCount; i++) {
      const item = items[i];
      this.memoryCache.delete(item.key);
      this.stats.evictions++;
    }

    console.log(`🗑️ Evicted ${evictCount} items from memory cache`);
  }

  cleanupExpiredItems() {
    const now = Date.now();
    const expired = [];

    for (const [key, item] of this.memoryCache.entries()) {
      if (this.isExpired(item, now)) {
        expired.push(key);
      }
    }

    expired.forEach(key => this.memoryCache.delete(key));

    if (expired.length > 0) {
      console.log(`🧹 Cleaned up ${expired.length} expired items`);
    }
  }

  checkEviction() {
    if (this.memoryCache.size > this.cacheConfig.maxMemoryItems) {
      this.evictItems();
    }
  }

  // Utility methods
  isExpired(item, now = Date.now()) {
    return item.ttl > 0 && (now - item.timestamp) > item.ttl;
  }

  calculateSize(data) {
    try {
      return new Blob([JSON.stringify(data)]).size;
    } catch {
      return JSON.stringify(data).length * 2; // Estimate
    }
  }

  formatSize(bytes) {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${Math.round(size * 100) / 100} ${units[unitIndex]}`;
  }

  // Statistics
  recordHit() {
    this.stats.hits++;
    this.saveStatsToStorage();
  }

  recordMiss() {
    this.stats.misses++;
    this.saveStatsToStorage();
  }

  updateCompressionRatio(originalSize, compressedSize) {
    const ratio = (originalSize - compressedSize) / originalSize;
    this.stats.compressionRatio = (this.stats.compressionRatio + ratio) / 2;
  }

  getStats() {
    const total = this.stats.hits + this.stats.misses;
    const hitRate = total > 0 ? (this.stats.hits / total) * 100 : 0;

    return {
      ...this.stats,
      hitRate: Math.round(hitRate * 100) / 100,
      memoryItems: this.memoryCache.size,
      memorySize: this.getMemoryCacheSize()
    };
  }

  getMemoryCacheSize() {
    return Array.from(this.memoryCache.values())
      .reduce((sum, item) => sum + item.size, 0);
  }

  saveStatsToStorage() {
    try {
      localStorage.setItem('cache_stats', JSON.stringify(this.stats));
    } catch (error) {
      console.warn('Failed to save cache stats:', error);
    }
  }

  loadStatsFromStorage() {
    try {
      const saved = localStorage.getItem('cache_stats');
      if (saved) {
        this.stats = { ...this.stats, ...JSON.parse(saved) };
      }
    } catch (error) {
      console.warn('Failed to load cache stats:', error);
    }
  }

  // Cache warming
  async warmCache(files) {
    console.log('🔥 Warming cache...');

    for (const file of files) {
      await this.cacheFile(file.id, file);

      // Pre-compute common queries
      if (file.rows && file.rows.length > 0) {
        const sampleQueries = [
          `count_${file.id}`,
          `headers_${file.id}`,
          `summary_${file.id}`
        ];

        for (const queryKey of sampleQueries) {
          // This would be implemented based on your query system
          await this.cacheQuery(queryKey, { precomputed: true });
        }
      }
    }

    console.log('✅ Cache warming completed');
  }

  // Advanced cache strategies
  async getOrCompute(key, computeFn, options = {}) {
    // Try to get from cache first
    let result = await this.get(key);

    if (result === null) {
      // Not in cache, compute the result
      result = await computeFn();

      // Cache the computed result
      await this.set(key, result, options);
    }

    return result;
  }

  // Batch operations
  async setBatch(items) {
    const promises = items.map(({ key, value, options }) =>
      this.set(key, value, options)
    );

    return await Promise.all(promises);
  }

  async getBatch(keys) {
    const promises = keys.map(key => this.get(key));
    return await Promise.all(promises);
  }

  // Cache invalidation
  async invalidateByTag(tag) {
    const toDelete = [];

    for (const [key, item] of this.memoryCache.entries()) {
      if (item.tags && item.tags.includes(tag)) {
        toDelete.push(key);
      }
    }

    for (const key of toDelete) {
      await this.delete(key);
    }

    console.log(`🗑️ Invalidated ${toDelete.length} items with tag: ${tag}`);
  }

  // Cleanup
  destroy() {
    if (this.memoryMonitor) {
      clearInterval(this.memoryMonitor);
    }

    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }

    this.memoryCache.clear();

    if (this.indexedDB) {
      this.indexedDB.close();
    }
  }
}

// Export singleton instance
export const cacheManager = new CacheManager();