import { useState, useRef, useEffect } from 'react';
import { Camera } from 'lucide-react';

interface CameraAPI {
  capturePhoto: () => Promise<Blob>;
  getBackDevices: () => Promise<MediaDeviceInfo[]>;
  switchToDevice: (deviceId: string) => Promise<void>;
  cycleBackCamera: () => Promise<void>;
  applyZoom: (value: number) => Promise<void>;
}

interface CameraPreviewProps {
  isRecording: boolean;
  currentMode: 'photo' | 'video';
  zoom: number;
  showGrid?: boolean;
  onReady?: (api: CameraAPI) => void;
}

export const CameraPreview = ({ isRecording, currentMode, zoom, showGrid = false, onReady }: CameraPreviewProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [currentDeviceId, setCurrentDeviceId] = useState<string | null>(null);
  const backDevicesRef = useRef<MediaDeviceInfo[]>([]);

  const enumerateBackVideoDevices = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videos = devices.filter(d => d.kind === 'videoinput');
      console.log('Video input devices:', videos);
      // Prefer rear/back/environment and known lens keywords
      const backs = videos.filter(d => /back|rear|environment|tele|wide|ultra|main/i.test(d.label));
      backDevicesRef.current = backs.length ? backs : videos; // fallback to any video inputs
      return backDevicesRef.current;
    } catch (e) {
      console.warn('enumerateDevices failed:', e);
      backDevicesRef.current = [];
      return [];
    }
  };

  const startStream = async (constraints: MediaStreamConstraints) => {
    console.log('Requesting camera access with constraints:', constraints);
    const newStream = await navigator.mediaDevices.getUserMedia(constraints);

    // cleanup any previous stream
    if (stream) {
      stream.getTracks().forEach(t => t.stop());
    }

    setStream(newStream);
    if (videoRef.current) {
      (videoRef.current as HTMLVideoElement).srcObject = newStream as any;
      try {
        await (videoRef.current as HTMLVideoElement).play();
        console.log('Video started playing');
      } catch (e) {
        console.error('Video play failed:', e);
      }
    }
    return newStream;
  };

  const switchToDevice = async (deviceId: string) => {
    try {
      await startStream({
        audio: currentMode === 'video',
        video: { deviceId: { exact: deviceId } }
      });
      setCurrentDeviceId(deviceId);
    } catch (e) {
      console.error('Failed to switch device', e);
    }
  };

  const cycleBackCamera = async () => {
    const backs = backDevicesRef.current.length ? backDevicesRef.current : await enumerateBackVideoDevices();
    if (!backs.length) return;
    const idx = Math.max(0, backs.findIndex(d => d.deviceId === currentDeviceId));
    const next = backs[(idx + 1) % backs.length];
    console.log('Switching to camera:', next?.label || next.deviceId);
    await switchToDevice(next.deviceId);
  };

  const applyZoom = async (value: number) => {
    try {
      const track = stream?.getVideoTracks?.()[0];
      // Use native camera zoom if available
      const caps: any = (track as any)?.getCapabilities?.();
      if (caps && 'zoom' in caps) {
        await (track as any).applyConstraints({ advanced: [{ zoom: value }] });
        console.log('Applied native zoom:', value);
      }
    } catch (e) {
      console.warn('Native zoom not applied:', e);
    }
  };

  const capturePhoto = async (): Promise<Blob> => {
    const video = videoRef.current as HTMLVideoElement | null;
    if (!video) throw new Error('Video element not ready');

    // Try ImageCapture API for best quality
    try {
      const track = stream?.getVideoTracks?.()[0];
      const ImageCaptureCtor: any = (window as any).ImageCapture;
      if (ImageCaptureCtor && track) {
        const ic = new ImageCaptureCtor(track);
        const blob: Blob = await ic.takePhoto();
        if (blob) return blob;
      }
    } catch (e) {
      console.warn('ImageCapture failed, falling back to canvas:', e);
    }

    // Canvas fallback
    const canvas = document.createElement('canvas');
    const w = video.videoWidth || 1920;
    const h = video.videoHeight || 1080;
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas context not available');
    ctx.drawImage(video, 0, 0, w, h);
    const blob: Blob | null = await new Promise(resolve => canvas.toBlob(b => resolve(b), 'image/jpeg', 0.92));
    if (!blob) throw new Error('Canvas toBlob failed');
    return blob;
  };

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
          audio: currentMode === 'video',
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1920 },
            height: { ideal: 1080 },
            frameRate: { ideal: 30, max: 60 },
          },
        };

        const tryBackCameraByDeviceId = async () => {
          try {
            const backs = await enumerateBackVideoDevices();
            const back = backs[0];
            if (back) {
              return await switchToDevice(back.deviceId);
            }
          } catch (e) {
            console.warn('enumerateDevices failed:', e);
          }
          return await startStream({ audio: currentMode === 'video', video: true });
        };

        try {
          const s = await startStream(baseConstraints);
          // save current deviceId if possible
          try {
            const track = s.getVideoTracks?.()[0];
            const settings = track?.getSettings?.();
            if (settings?.deviceId) setCurrentDeviceId(settings.deviceId);
          } catch {}

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

    // Expose API to parent
    onReady?.({ capturePhoto, getBackDevices: enumerateBackVideoDevices, switchToDevice, cycleBackCamera, applyZoom });

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