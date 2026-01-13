import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type UploadStatus = 'pending' | 'uploading' | 'paused' | 'completed' | 'failed';

export interface UploadItem {
  id: string;
  filePath: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  status: UploadStatus;
  progress: number;
  uploadedBytes: number;
  chunkSize: number;
  totalChunks: number;
  uploadedChunks: number;
  uploadUrl?: string;
  error?: string;
  createdAt: number;
  updatedAt: number;
  retryCount: number;
  maxRetries: number;
}

interface UploadQueueState {
  queue: UploadItem[];

  // Actions
  addToQueue: (item: Omit<UploadItem, 'id' | 'status' | 'progress' | 'uploadedBytes' | 'uploadedChunks' | 'createdAt' | 'updatedAt' | 'retryCount'>) => string;
  updateStatus: (id: string, status: UploadStatus, error?: string) => void;
  updateProgress: (id: string, uploadedBytes: number, uploadedChunks: number) => void;
  removeFromQueue: (id: string) => void;
  getPendingUploads: () => UploadItem[];
  getFailedUploads: () => UploadItem[];
  retryUpload: (id: string) => void;
  clearCompleted: () => void;
  setUploadUrl: (id: string, uploadUrl: string) => void;
}

export const useUploadQueueStore = create<UploadQueueState>()(
  persist(
    (set, get) => ({
      queue: [],

      addToQueue: (item) => {
        const id = `upload-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
        const now = Date.now();

        const newItem: UploadItem = {
          ...item,
          id,
          status: 'pending',
          progress: 0,
          uploadedBytes: 0,
          uploadedChunks: 0,
          createdAt: now,
          updatedAt: now,
          retryCount: 0,
          maxRetries: item.maxRetries || 3,
        };

        set((state) => ({
          queue: [...state.queue, newItem],
        }));

        return id;
      },

      updateStatus: (id, status, error) => {
        set((state) => ({
          queue: state.queue.map((item) =>
            item.id === id
              ? {
                  ...item,
                  status,
                  error,
                  updatedAt: Date.now(),
                }
              : item
          ),
        }));
      },

      updateProgress: (id, uploadedBytes, uploadedChunks) => {
        set((state) => ({
          queue: state.queue.map((item) => {
            if (item.id === id) {
              const progress = (uploadedBytes / item.fileSize) * 100;
              return {
                ...item,
                uploadedBytes,
                uploadedChunks,
                progress,
                updatedAt: Date.now(),
              };
            }
            return item;
          }),
        }));
      },

      removeFromQueue: (id) => {
        set((state) => ({
          queue: state.queue.filter((item) => item.id !== id),
        }));
      },

      getPendingUploads: () => {
        return get().queue.filter((item) => item.status === 'pending' || item.status === 'paused');
      },

      getFailedUploads: () => {
        return get().queue.filter((item) => item.status === 'failed');
      },

      retryUpload: (id) => {
        set((state) => ({
          queue: state.queue.map((item) => {
            if (item.id === id && item.status === 'failed') {
              return {
                ...item,
                status: 'pending' as UploadStatus,
                error: undefined,
                retryCount: item.retryCount + 1,
                updatedAt: Date.now(),
              };
            }
            return item;
          }),
        }));
      },

      clearCompleted: () => {
        set((state) => ({
          queue: state.queue.filter((item) => item.status !== 'completed'),
        }));
      },

      setUploadUrl: (id, uploadUrl) => {
        set((state) => ({
          queue: state.queue.map((item) =>
            item.id === id
              ? {
                  ...item,
                  uploadUrl,
                  updatedAt: Date.now(),
                }
              : item
          ),
        }));
      },
    }),
    {
      name: 'upload-queue-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
