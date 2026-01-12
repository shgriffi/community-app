import { create } from 'zustand';
import NetInfo from '@react-native-community/netinfo';

type FeedSortMode = 'recent' | 'for-you' | 'favorites';
type NetworkStatus = 'online' | 'offline' | 'unknown';

interface UIState {
  feedSortMode: FeedSortMode;
  networkStatus: NetworkStatus;
  lastSyncTimestamp: number | null;
  isRefreshing: boolean;

  // Actions
  setFeedSortMode: (mode: FeedSortMode) => void;
  setNetworkStatus: (status: NetworkStatus) => void;
  setLastSyncTimestamp: (timestamp: number) => void;
  setRefreshing: (isRefreshing: boolean) => void;
  initializeNetworkListener: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  feedSortMode: 'recent',
  networkStatus: 'unknown',
  lastSyncTimestamp: null,
  isRefreshing: false,

  setFeedSortMode: (mode) => set({ feedSortMode: mode }),

  setNetworkStatus: (status) => set({ networkStatus: status }),

  setLastSyncTimestamp: (timestamp) => set({ lastSyncTimestamp: timestamp }),

  setRefreshing: (isRefreshing) => set({ isRefreshing }),

  initializeNetworkListener: () => {
    NetInfo.addEventListener((state) => {
      const status: NetworkStatus = state.isConnected === true
        ? 'online'
        : state.isConnected === false
        ? 'offline'
        : 'unknown';
      set({ networkStatus: status });
    });
  },
}));
