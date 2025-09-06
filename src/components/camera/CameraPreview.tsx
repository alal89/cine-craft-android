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
    let mounted = true;
    
    const initCamera = async () => {
      try {
        console.log('Initializing camera...');
        
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          console.error('getUserMedia not supported');
          return;
        }

        // Prefer back camera with sensible defaults for Android
        const baseConstraints: MediaStreamConstraints = {
          audio: true,
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1920 },
            height: { ideal: 1080 },
            frameRate: { ideal: 30, max: 60 },
          },
        };

        const startStream = async (constraints: MediaStreamConstraints) => {
          console.log('Requesting camera access with constraints:', constraints);
          const newStream = await navigator.mediaDevices.getUserMedia(constraints);

          // cleanup any previous stream
          if (stream) {
            stream.getTracks().forEach(t => t.stop());
          }

          if (!mounted) return newStream;

          setStream(newStream);
          if (videoRef.current) {
            videoRef.current.srcObject = newStream as any;
            try {
              await videoRef.current.play();
              console.log('Video started playing');
            } catch (e) {
              console.error('Video play failed:', e);
            }
          }
          return newStream;
        };

        const tryBackCameraByDeviceId = async () => {
          try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const videos = devices.filter(d => d.kind === 'videoinput');
            console.log('Video input devices:', videos);
            const back = videos.find(d => /back|rear|environment|wide/i.test(d.label));
            if (back) {
              return startStream({ audio: true, video: { deviceId: { exact: back.deviceId } } });
            }
          } catch (e) {
            console.warn('enumerateDevices failed:', e);
          }
          return startStream({ audio: true, video: true });
        };

        try {
          const s = await startStream(baseConstraints);

          // If video didn't render properly, retry selecting explicit back camera
          setTimeout(async () => {
            if (!mounted || !videoRef.current) return;
            const v = videoRef.current as HTMLVideoElement;
            if (v.videoWidth === 0 || v.videoHeight === 0) {
              console.warn('Video dimensions are 0, retrying with deviceId...');
              await tryBackCameraByDeviceId();
            }
          }, 1500);
        } catch (err) {
          console.error('Primary camera initialization failed:', err);
          await tryBackCameraByDeviceId();
        }
      } catch (outerErr) {
        console.error('Unhandled camera init error:', outerErr);
      }
    };

    initCamera();

    return () => {
      mounted = false;
      if (stream) {
        console.log('Cleaning up camera stream');
        stream.getTracks().forEach(track => {
          track.stop();
          console.log('Stopped track:', track.kind);
        });
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
            transform: `scale(${zoom})`,
            backgroundColor: 'black'
          }}
        />
      ) : (
        <div className="w-full h-full bg-cinema-surface flex items-center justify-center">
          <div className="text-center">
            <Camera className="w-16 h-16 mx-auto mb-4 text-cinema-text-muted" />
            <p className="text-cinema-text-secondary">Initialisation de la caméra...</p>
            <p className="text-cinema-text-muted text-sm mt-2">Vérifiez les permissions caméra</p>
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