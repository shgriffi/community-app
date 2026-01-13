import { create } from 'zustand';

interface RecordingState {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  startTime: number | null;
  pauseTime: number | null;
  filePath: string | null;

  // Actions
  startRecording: (filePath: string) => void;
  pauseRecording: () => void;
  resumeRecording: () => void;
  stopRecording: () => void;
  updateDuration: (duration: number) => void;
  reset: () => void;
}

const initialState = {
  isRecording: false,
  isPaused: false,
  duration: 0,
  startTime: null,
  pauseTime: null,
  filePath: null,
};

export const useRecordingStore = create<RecordingState>((set, get) => ({
  ...initialState,

  startRecording: (filePath) => {
    set({
      isRecording: true,
      isPaused: false,
      duration: 0,
      startTime: Date.now(),
      pauseTime: null,
      filePath,
    });
  },

  pauseRecording: () => {
    const { isRecording, isPaused } = get();
    if (isRecording && !isPaused) {
      set({
        isPaused: true,
        pauseTime: Date.now(),
      });
    }
  },

  resumeRecording: () => {
    const { isRecording, isPaused, pauseTime, startTime } = get();
    if (isRecording && isPaused && pauseTime && startTime) {
      const pauseDuration = Date.now() - pauseTime;
      set({
        isPaused: false,
        pauseTime: null,
        startTime: startTime + pauseDuration, // Adjust start time to exclude pause duration
      });
    }
  },

  stopRecording: () => {
    set({
      isRecording: false,
      isPaused: false,
    });
  },

  updateDuration: (duration) => {
    set({ duration });
  },

  reset: () => {
    set(initialState);
  },
}));
