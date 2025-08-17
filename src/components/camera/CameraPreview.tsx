import { useState, useRef, useEffect } from 'react';
import { Camera } from 'lucide-react';

interface CameraPreviewProps {
  isRecording: boolean;
  currentMode: 'photo' | 'video';
  zoom: number;
}

export const CameraPreview = ({ isRecording, currentMode, zoom }: CameraPreviewProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    // Initialize camera stream
    const initCamera = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 3840, min: 1920 },
            height: { ideal: 2160, min: 1080 },
            frameRate: { ideal: 60, min: 24 }
          },
          audio: {
            sampleRate: { ideal: 96000, min: 48000 },
            sampleSize: 32,
            channelCount: 2
          }
        });
        
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (err) {
        console.error('Error accessing camera:', err);
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

      {/* Grid overlay */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="w-full h-full grid grid-cols-3 grid-rows-3 opacity-30">
          {Array.from({ length: 9 }).map((_, i) => (
            <div
              key={i}
              className="border border-white/20"
            />
          ))}
        </div>
      </div>
    </div>
  );
};