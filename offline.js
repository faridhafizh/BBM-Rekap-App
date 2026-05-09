/**
 * Offline support functionality for BBM Rekap App
 * Provides data caching, offline storage, and sync capabilities
 */

class OfflineManager {
  constructor() {
    this.isOnline = navigator.onLine;
    this.pendingOperations = [];
    this.cachedData = new Map();
    this.storageKey = 'bbm_rekap_offline_data';
    this.pendingKey = 'bbm_rekap_pending_operations';
    
    this.initializeEventListeners();
    this.loadCachedData();
  }

  // Initialize event listeners for online/offline status
  initializeEventListeners() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      console.log('App is online');
      this.syncPendingOperations();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      console.log('App is offline');
      this.showOfflineNotification();
    });
  }

  // Load cached data from localStorage
  loadCachedData() {
    try {
      const cached = localStorage.getItem(this.storageKey);
      if (cached) {
        const data = JSON.parse(cached);
        Object.entries(data).forEach(([key, value]) => {
          this.cachedData.set(key, value);
        });
      }

      // Load pending operations
      const pending = localStorage.getItem(this.pendingKey);
      if (pending) {
        this.pendingOperations = JSON.parse(pending);
      }
    } catch (error) {
      console.error('Error loading cached data:', error);
    }
  }

  // Save data to localStorage cache
  saveToCache(key, data) {
    try {
      this.cachedData.set(key, data);
      const cacheObject = Object.fromEntries(this.cachedData);
      localStorage.setItem(this.storageKey, JSON.stringify(cacheObject));
    } catch (error) {
      console.error('Error saving to cache:', error);
    }
  }

  // Get cached data
  getCachedData(key) {
    return this.cachedData.get(key);
  }

  // Add operation to pending queue
  addPendingOperation(operation) {
    const pendingOp = {
      ...operation,
      timestamp: Date.now(),
      id: this.generateOperationId()
    };
    
    this.pendingOperations.push(pendingOp);
    this.savePendingOperations();
    
    console.log('Added pending operation:', pendingOp);
    return pendingOp.id;
  }

  // Generate unique operation ID
  generateOperationId() {
    return `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Save pending operations to localStorage
  savePendingOperations() {
    try {
      localStorage.setItem(this.pendingKey, JSON.stringify(this.pendingOperations));
    } catch (error) {
      console.error('Error saving pending operations:', error);
    }
  }

  // Sync pending operations when online
  async syncPendingOperations() {
    if (!this.isOnline || this.pendingOperations.length === 0) {
      return;
    }

    console.log(`Syncing ${this.pendingOperations.length} pending operations...`);
    
    const syncedOperations = [];
    const failedOperations = [];

    for (const operation of this.pendingOperations) {
      try {
        await this.executeOperation(operation);
        syncedOperations.push(operation);
      } catch (error) {
        console.error('Failed to sync operation:', error);
        failedOperations.push(operation);
      }
    }

    // Update pending operations list
    this.pendingOperations = failedOperations;
    this.savePendingOperations();

    // Show sync result
    if (syncedOperations.length > 0) {
      this.showSyncNotification(syncedOperations.length, failedOperations.length);
    }
  }

  // Execute a pending operation
  async executeOperation(operation) {
    const { type, data } = operation;

    switch (type) {
      case 'save':
        return await this.executeSaveOperation(data);
      case 'search':
        return await this.executeSearchOperation(data);
      case 'getAll':
        return await this.executeGetAllOperation(data);
      default:
        throw new Error(`Unknown operation type: ${type}`);
    }
  }

  // Execute save operation
  async executeSaveOperation(data) {
    const response = await fetch(data.apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(data.payload)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    if (result.status !== 'success') {
      throw new Error(result.message || 'Operation failed');
    }

    return result;
  }

  // Execute search operation
  async executeSearchOperation(data) {
    const url = `${data.apiUrl}?action=search&sheetName=${encodeURIComponent(data.sheetName)}&id=${encodeURIComponent(data.id)}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  }

  // Execute getAll operation
  async executeGetAllOperation(data) {
    const url = `${data.apiUrl}?action=getAll&sheetName=${encodeURIComponent(data.sheetName)}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  }

  // Offline save operation
  saveOffline(operationData) {
    if (this.isOnline) {
      // Try online first, fallback to offline if it fails
      return this.saveOnline(operationData).catch(error => {
        console.error('Online save failed, using offline:', error);
        return this.saveOfflineFallback(operationData);
      });
    } else {
      return this.saveOfflineFallback(operationData);
    }
  }

  // Online save operation
  async saveOnline(operationData) {
    const response = await fetch(operationData.apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(operationData.payload)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    if (result.status !== 'success') {
      throw new Error(result.message || 'Save failed');
    }

    return result;
  }

  // Offline save fallback
  saveOfflineFallback(operationData) {
    const operationId = this.addPendingOperation({
      type: 'save',
      data: operationData
    });

    // Also save to local cache for immediate access
    const cacheKey = `${operationData.payload.sheetName}_${operationData.payload.id}`;
    this.saveToCache(cacheKey, operationData.payload);

    return {
      status: 'offline_pending',
      message: 'Data disimpan secara offline. Akan disinkronkan saat online.',
      operationId: operationId
    };
  }

  // Get data with offline fallback
  async getDataWithFallback(operationData) {
    if (this.isOnline) {
      try {
        const result = await this.fetchOnlineData(operationData);
        // Cache the result for offline use
        const cacheKey = `${operationData.sheetName}_${operationData.action || 'data'}`;
        this.saveToCache(cacheKey, result);
        return result;
      } catch (error) {
        console.error('Online fetch failed, using cache:', error);
        return this.getCachedDataFallback(operationData);
      }
    } else {
      return this.getCachedDataFallback(operationData);
    }
  }

  // Fetch online data
  async fetchOnlineData(operationData) {
    const { action, sheetName, apiUrl, id } = operationData;
    let url;

    if (action === 'search' && id) {
      url = `${apiUrl}?action=search&sheetName=${encodeURIComponent(sheetName)}&id=${encodeURIComponent(id)}`;
    } else if (action === 'getAll') {
      url = `${apiUrl}?action=getAll&sheetName=${encodeURIComponent(sheetName)}`;
    } else if (action === 'getSheets') {
      url = `${apiUrl}?action=getSheets`;
    }

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  }

  // Get cached data fallback
  getCachedDataFallback(operationData) {
    const cacheKey = `${operationData.sheetName}_${operationData.action || 'data'}`;
    const cached = this.getCachedData(cacheKey);

    if (cached) {
      return {
        status: 'offline_cached',
        message: 'Data dari cache offline.',
        data: cached
      };
    }

    throw new Error('Tidak ada data tersedia secara offline.');
  }

  // Show offline notification
  showOfflineNotification() {
    // Create notification element if it doesn't exist
    let notification = document.getElementById('offlineNotification');
    if (!notification) {
      notification = document.createElement('div');
      notification.id = 'offlineNotification';
      notification.className = 'offline-notification';
      notification.innerHTML = `
        <div class="offline-content">
          <i class="bi bi-wifi-off"></i>
          <span>Anda sedang offline. Data akan disimpan secara lokal.</span>
        </div>
      `;
      document.body.appendChild(notification);
    }

    notification.style.display = 'block';
  }

  // Hide offline notification
  hideOfflineNotification() {
    const notification = document.getElementById('offlineNotification');
    if (notification) {
      notification.style.display = 'none';
    }
  }

  // Show sync notification
  showSyncNotification(syncedCount, failedCount) {
    const message = failedCount === 0 
      ? `✅ ${syncedCount} data berhasil disinkronkan.`
      : `⚠️ ${syncedCount} data berhasil disinkronkan, ${failedCount} gagal.`;

    // Show message using existing message system if available
    if (typeof showMessage === 'function') {
      showMessage(message, failedCount === 0, failedCount > 0);
    } else {
      console.log(message);
    }
  }

  // Get offline status
  getOfflineStatus() {
    return {
      isOnline: this.isOnline,
      pendingOperations: this.pendingOperations.length,
      cachedData: this.cachedData.size
    };
  }

  // Clear all cached data
  clearCache() {
    this.cachedData.clear();
    localStorage.removeItem(this.storageKey);
    console.log('Cache cleared');
  }

  // Clear pending operations
  clearPendingOperations() {
    this.pendingOperations = [];
    localStorage.removeItem(this.pendingKey);
    console.log('Pending operations cleared');
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = OfflineManager;
}
