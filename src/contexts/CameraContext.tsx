import React, { createContext, useContext, useReducer, useCallback } from 'react';
import { useCamera } from '@/hooks/useCamera';
import { useStorage } from '@/hooks/useStorage';
import { useAudio } from '@/hooks/useAudio';
import { cameraLogger } from '@/utils/logger';

// Types
interface CameraState {
  currentMode: 'photo' | 'video';
  isRecording: boolean;
  showControls: boolean;
  showGrid: boolean;
  zoom: number;
  lastToggleTime: number;
  cameraReady: boolean;
}

type CameraAction =
  | { type: 'SET_MODE'; payload: 'photo' | 'video' }
  | { type: 'SET_RECORDING'; payload: boolean }
  | { type: 'TOGGLE_CONTROLS' }
  | { type: 'SET_GRID'; payload: boolean }
  | { type: 'SET_ZOOM'; payload: number }
  | { type: 'SET_CAMERA_READY'; payload: boolean }
  | { type: 'RESET' };

// Initial state
const initialState: CameraState = {
  currentMode: 'video',
  isRecording: false,
  showControls: false,
  showGrid: false,
  zoom: 1,
  lastToggleTime: 0,
  cameraReady: false,
};

// Reducer
function cameraReducer(state: CameraState, action: CameraAction): CameraState {
  switch (action.type) {
    case 'SET_MODE':
      return { ...state, currentMode: action.payload };
    case 'SET_RECORDING':
      return { ...state, isRecording: action.payload };
    case 'TOGGLE_CONTROLS':
      const now = Date.now();
      if (now - state.lastToggleTime < 300) {
        cameraLogger.settings('Toggle debounced - too soon after last toggle');
        return state;
      }
      return { 
        ...state, 
        showControls: !state.showControls,
        lastToggleTime: now
      };
    case 'SET_GRID':
      return { ...state, showGrid: action.payload };
    case 'SET_ZOOM':
      return { ...state, zoom: action.payload };
    case 'SET_CAMERA_READY':
      return { ...state, cameraReady: action.payload };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

// Context
interface CameraContextType {
  state: CameraState;
  dispatch: React.Dispatch<CameraAction>;
  camera: ReturnType<typeof useCamera>;
  storage: ReturnType<typeof useStorage>;
  audio: ReturnType<typeof useAudio>;
  // Actions
  toggleControls: () => void;
  setMode: (mode: 'photo' | 'video') => void;
  setRecording: (recording: boolean) => void;
  setGrid: (grid: boolean) => void;
  setZoom: (zoom: number) => void;
  setCameraReady: (ready: boolean) => void;
  reset: () => void;
}

const CameraContext = createContext<CameraContextType | undefined>(undefined);

// Provider
export const CameraProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(cameraReducer, initialState);
  
  // Hooks
  const camera = useCamera();
  const storage = useStorage();
  const audio = useAudio();

  // Actions
  const toggleControls = useCallback(() => {
    dispatch({ type: 'TOGGLE_CONTROLS' });
  }, []);

  const setMode = useCallback((mode: 'photo' | 'video') => {
    dispatch({ type: 'SET_MODE', payload: mode });
  }, []);

  const setRecording = useCallback((recording: boolean) => {
    dispatch({ type: 'SET_RECORDING', payload: recording });
  }, []);

  const setGrid = useCallback((grid: boolean) => {
    dispatch({ type: 'SET_GRID', payload: grid });
  }, []);

  const setZoom = useCallback((zoom: number) => {
    dispatch({ type: 'SET_ZOOM', payload: zoom });
  }, []);

  const setCameraReady = useCallback((ready: boolean) => {
    dispatch({ type: 'SET_CAMERA_READY', payload: ready });
  }, []);

  const reset = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, []);

  const value: CameraContextType = {
    state,
    dispatch,
    camera,
    storage,
    audio,
    toggleControls,
    setMode,
    setRecording,
    setGrid,
    setZoom,
    setCameraReady,
    reset,
  };

  return (
    <CameraContext.Provider value={value}>
      {children}
    </CameraContext.Provider>
  );
};

// Hook
export const useCameraContext = () => {
  const context = useContext(CameraContext);
  if (context === undefined) {
    throw new Error('useCameraContext must be used within a CameraProvider');
  }
  return context;
};