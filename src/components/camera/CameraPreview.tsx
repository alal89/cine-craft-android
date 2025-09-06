import { useState, useRef, useEffect } from 'react';
import { Camera } from 'lucide-react';

interface CameraPreviewProps {
  isRecording: boolean;
  currentMode: 'photo' | 'video';
  zoom: number;
  showGrid?: boolean;
}

export const CameraPreview = ({ isRecording, currentMode, zoom, showGrid = false }: CameraPreviewProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    // Initialize camera stream
    const initCamera = async () => {
      try {
        // Check if getUserMedia is available
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          console.error('getUserMedia not supported');
          return;
        }

        // Try with more basic constraints first
        const constraints = {
          video: {
            facingMode: 'environment', // Use back camera by default
            width: { ideal: 1920, min: 640 },
            height: { ideal: 1080, min: 480 },
            frameRate: { ideal: 30, min: 15 }
          },
          audio: true
        };

        const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
        
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          // Ensure video plays
          videoRef.current.play().catch(e => console.log('Video play failed:', e));
        }
      } catch (err) {
        console.error('Error accessing camera:', err);
        
        // Fallback: try with even simpler constraints
        try {
          const fallbackStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false
          });
          
          setStream(fallbackStream);
          if (videoRef.current) {
            videoRef.current.srcObject = fallbackStream;
            videoRef.current.play().catch(e => console.log('Fallback video play failed:', e));
          }
        } catch (fallbackErr) {
          console.error('Fallback camera access failed:', fallbackErr);
        }
      }
    };

    initCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return (
    <div className="relative w-full h-full bg-black overflow-hidden rounded-lg">
      {stream ? (
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="w-full h-full object-cover transition-transform duration-300"
          style={{
            transform: `scale(${zoom})`
          }}
        />
      ) : (
        <div className="w-full h-full bg-cinema-surface flex items-center justify-center">
          <div className="text-center">
            <Camera className="w-16 h-16 mx-auto mb-4 text-cinema-text-muted" />
            <p className="text-cinema-text-secondary">Initialisation de la caméra...</p>
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
          {currentMode}
        </span>
      </div>

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
};