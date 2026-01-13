import NetInfo, { NetInfoState, NetInfoSubscription } from '@react-native-community/netinfo';

export type ConnectionType = 'wifi' | 'cellular' | 'ethernet' | 'unknown' | 'none';
export type ConnectionQuality = 'excellent' | 'good' | 'fair' | 'poor';

export interface ConnectivityStatus {
  isConnected: boolean;
  type: ConnectionType;
  quality: ConnectionQuality;
  isInternetReachable: boolean | null;
}

/**
 * ConnectivityMonitor
 *
 * Monitors network connectivity and provides real-time status updates
 */
class ConnectivityMonitor {
  private unsubscribe: NetInfoSubscription | null = null;
  private listeners: Set<(status: ConnectivityStatus) => void> = new Set();
  private currentStatus: ConnectivityStatus = {
    isConnected: false,
    type: 'none',
    quality: 'poor',
    isInternetReachable: null,
  };

  /**
   * Initialize connectivity monitoring
   */
  async initialize(): Promise<void> {
    // Get initial state
    const state = await NetInfo.fetch();
    this.currentStatus = this.parseNetInfoState(state);

    // Subscribe to network state updates
    this.unsubscribe = NetInfo.addEventListener((state) => {
      const newStatus = this.parseNetInfoState(state);

      // Only notify if status changed
      if (this.hasStatusChanged(this.currentStatus, newStatus)) {
        this.currentStatus = newStatus;
        this.notifyListeners(newStatus);
      }
    });
  }

  /**
   * Stop monitoring connectivity
   */
  cleanup(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
    this.listeners.clear();
  }

  /**
   * Get current connectivity status
   */
  getStatus(): ConnectivityStatus {
    return { ...this.currentStatus };
  }

  /**
   * Check if currently connected to the internet
   */
  isConnected(): boolean {
    return this.currentStatus.isConnected && this.currentStatus.isInternetReachable !== false;
  }

  /**
   * Check if connected to WiFi
   */
  isWiFi(): boolean {
    return this.currentStatus.type === 'wifi';
  }

  /**
   * Check if connected to cellular
   */
  isCellular(): boolean {
    return this.currentStatus.type === 'cellular';
  }

  /**
   * Check if connection quality is good enough for uploads
   */
  canUpload(): boolean {
    if (!this.isConnected()) {
      return false;
    }

    // WiFi is always acceptable for uploads
    if (this.isWiFi()) {
      return true;
    }

    // For cellular, require at least 'good' quality
    if (this.isCellular()) {
      return this.currentStatus.quality === 'excellent' || this.currentStatus.quality === 'good';
    }

    return false;
  }

  /**
   * Subscribe to connectivity changes
   */
  subscribe(listener: (status: ConnectivityStatus) => void): () => void {
    this.listeners.add(listener);

    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Parse NetInfo state into ConnectivityStatus
   */
  private parseNetInfoState(state: NetInfoState): ConnectivityStatus {
    const isConnected = state.isConnected ?? false;
    const isInternetReachable = state.isInternetReachable;

    // Determine connection type
    let type: ConnectionType = 'none';
    if (state.type === 'wifi') {
      type = 'wifi';
    } else if (state.type === 'cellular') {
      type = 'cellular';
    } else if (state.type === 'ethernet') {
      type = 'ethernet';
    } else if (state.type !== 'none' && state.type !== 'unknown') {
      type = 'unknown';
    }

    // Estimate connection quality based on details
    const quality = this.estimateQuality(state);

    return {
      isConnected,
      type,
      quality,
      isInternetReachable,
    };
  }

  /**
   * Estimate connection quality based on NetInfo details
   */
  private estimateQuality(state: NetInfoState): ConnectionQuality {
    // If not connected, quality is poor
    if (!state.isConnected) {
      return 'poor';
    }

    // For WiFi, check signal strength if available
    if (state.type === 'wifi' && state.details) {
      const strength = (state.details as any).strength;
      if (strength !== undefined) {
        if (strength >= 75) return 'excellent';
        if (strength >= 50) return 'good';
        if (strength >= 25) return 'fair';
        return 'poor';
      }
    }

    // For cellular, check effective connection type
    if (state.type === 'cellular' && state.details) {
      const cellularGeneration = (state.details as any).cellularGeneration;
      if (cellularGeneration === '5g') return 'excellent';
      if (cellularGeneration === '4g') return 'good';
      if (cellularGeneration === '3g') return 'fair';
      return 'poor';
    }

    // Default to 'good' if connected but no details available
    return 'good';
  }

  /**
   * Check if status has meaningfully changed
   */
  private hasStatusChanged(oldStatus: ConnectivityStatus, newStatus: ConnectivityStatus): boolean {
    return (
      oldStatus.isConnected !== newStatus.isConnected ||
      oldStatus.type !== newStatus.type ||
      oldStatus.quality !== newStatus.quality ||
      oldStatus.isInternetReachable !== newStatus.isInternetReachable
    );
  }

  /**
   * Notify all listeners of status change
   */
  private notifyListeners(status: ConnectivityStatus): void {
    this.listeners.forEach((listener) => {
      try {
        listener(status);
      } catch (error) {
        console.error('Error in connectivity listener:', error);
      }
    });
  }
}

export const connectivityMonitor = new ConnectivityMonitor();
export default connectivityMonitor;
