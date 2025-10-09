import React, { memo, useCallback, useEffect } from 'react';
import { useCameraContext } from '@/contexts/CameraContext';
import { cameraLogger } from '@/utils/logger';

interface CameraViewProps {
  onInitializeCamera: () => Promise<void>;
}

export const CameraView = memo<CameraViewProps>(({ onInitializeCamera }) => {
  const { state, camera } = useCameraContext();
  const { isRecording, showGrid, zoom } = state;

  // Memoized video styles to prevent unnecessary re-renders
  const videoStyles = useMemo(() => ({
    transform: camera.zoomMode === 'native' ? `scale(${zoom})` : 'none',
    backgroundColor: 'black',
    display: camera.zoomMode === 'canvas' ? 'none' : 'block'
  }), [camera.zoomMode, zoom]);

  const canvasStyles = useMemo(() => ({
    display: camera.zoomMode === 'canvas' ? 'block' : 'none',
    backgroundColor: 'black'
  }), [camera.zoomMode]);

  // Handle canvas size updates
  const updateCanvasSize = useCallback(() => {
    if (camera.canvasRef.current && camera.videoRef.current) {
      const canvas = camera.canvasRef.current;
      const video = camera.videoRef.current;
      const rect = video.getBoundingClientRect();
      
      canvas.width = rect.width;
      canvas.height = rect.height;
      
      cameraLogger.debug('Canvas size updated:', { width: rect.width, height: rect.height });
    }
  }, [camera.canvasRef, camera.videoRef]);

  // Update canvas size on zoom changes
  useEffect(() => {
    if (camera.zoomMode === 'canvas') {
      updateCanvasSize();
    }
  }, [camera.zoomMode, zoom, updateCanvasSize]);

  return (
    <div className="w-full h-full bg-black overflow-hidden rounded-lg relative">
      {/* Canvas for zoom recording */}
      <canvas
        ref={camera.canvasRef}
        className="absolute inset-0 w-full h-full object-cover"
        style={canvasStyles}
      />
      
      {/* Video element */}
      <video
        ref={camera.videoRef}
        autoPlay
        muted
        playsInline
        className="w-full h-full object-cover transition-transform duration-300"
        style={videoStyles}
      />
      
      {/* Camera not initialized overlay */}
      {!camera.stream && (
        <div className="absolute inset-0 bg-cinema-surface flex items-center justify-center">
          <div className="text-center">
            <button
              onClick={onInitializeCamera}
              className="w-20 h-20 mx-auto mb-4 rounded-full bg-cinema-primary/30 hover:bg-cinema-primary/40 flex items-center justify-center transition-all active:scale-95"
            >
              <span className="text-4xl">📸</span>
            </button>
            <p className="text-cinema-text-secondary font-medium">Appuyez pour démarrer</p>
            <p className="text-cinema-text-muted text-sm mt-2">Autoriser l'accès caméra</p>
          </div>
        </div>
      )}
      
      {/* Recording border indicator */}
      {isRecording && (
        <div className="absolute inset-0 border-4 border-red-500 pointer-events-none animate-pulse-glow rounded-lg">
          <div className="absolute inset-0 border-2 border-red-400/60 rounded-lg">
            <div className="absolute inset-0 border border-red-300/40 rounded-lg"></div>
          </div>
        </div>
      )}

      {/* Recording indicator */}
      {isRecording && (
        <div className="absolute top-4 left-4 flex items-center space-x-2 animate-pulse-glow">
          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
          <span className="text-white text-sm font-medium">REC</span>
        </div>
      )}

      {/* Mode indicator */}
      <div className="absolute top-4 right-4 bg-black/50 px-3 py-1 rounded-full">
        <span className="text-white text-sm font-medium uppercase">
          {state.currentMode}
        </span>
      </div>

      {/* Zoom indicator */}
      {zoom > 1 && (
        <div className="absolute top-16 right-4 bg-black/50 px-3 py-1 rounded-full">
          <span className="text-white text-sm font-medium">
            {camera.zoomMode === 'canvas' ? '🔍' : '📷'} {zoom.toFixed(1)}x
          </span>
        </div>
      )}

      {/* Zoom mode indicator during recording */}
      {isRecording && camera.zoomMode === 'canvas' && (
        <div className="absolute top-20 right-4 bg-red-500/80 px-3 py-1 rounded-full">
          <span className="text-white text-xs font-medium">
            Zoom Canvas Actif
          </span>
        </div>
      )}

      {/* Composition grid overlay */}
      {showGrid && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="w-full h-full grid grid-cols-3 grid-rows-3 opacity-40">
            {Array.from({ length: 9 }).map((_, i) => (
              <div
                key={i}
                className="border border-cinema-text-primary/30"
              />
            ))}
          </div>
        </div>
      )}

      {/* Level grid overlay */}
      {showGrid && (
        <div className="absolute inset-0 pointer-events-none">
          {/* Horizontal center line */}
          <div className="absolute top-1/2 left-0 right-0 h-px bg-cinema-primary/60"></div>
          {/* Vertical center line */}
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-cinema-primary/60"></div>
          {/* Corner indicators */}
          <div className="absolute top-4 left-4 w-6 h-6 border-l-2 border-t-2 border-cinema-primary/40"></div>
          <div className="absolute top-4 right-4 w-6 h-6 border-r-2 border-t-2 border-cinema-primary/40"></div>
          <div className="absolute bottom-4 left-4 w-6 h-6 border-l-2 border-b-2 border-cinema-primary/40"></div>
          <div className="absolute bottom-4 right-4 w-6 h-6 border-r-2 border-b-2 border-cinema-primary/40"></div>
        </div>
      )}
    </div>
  );
});

CameraView.displayName = 'CameraView';