import { useState, useRef, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

export interface CameraDevice {
  deviceId: string;
  label: string;
  kind: 'videoinput';
  type?: string;
  megapixels?: number;
  aperture?: string;
  sensor?: string;
  features?: string[];
}

export const useCamera = () => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [devices, setDevices] = useState<CameraDevice[]>([]);
  const [currentDevice, setCurrentDevice] = useState<CameraDevice | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [currentZoom, setCurrentZoom] = useState(1);
  const [videoCodec, setVideoCodec] = useState('vp9');
  const [frameRate, setFrameRate] = useState(60);
  
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const { toast } = useToast();

  const getCameraDevices = async () => {
    try {
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = allDevices.filter(device => device.kind === 'videoinput') as CameraDevice[];
      
      // Enhanced device information
      const enhancedDevices = videoDevices.map(device => {
        const label = device.label.toLowerCase();
        let type = 'main';
        if (label.includes('ultra')) type = 'ultrawide';
        if (label.includes('tele')) type = 'telephoto';
        
        return {
          ...device,
          type,
          megapixels: label.includes('back') ? 48 : 12,
          aperture: label.includes('ultra') ? 'f/2.2' : label.includes('tele') ? 'f/2.8' : 'f/1.8',
          sensor: 'CMOS',
          features: ['HDR', 'Night Mode', 'Portrait']
        };
      });

      setDevices(enhancedDevices);
      return enhancedDevices;
    } catch (error) {
      console.error('Error getting devices:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'accéder aux caméras",
        variant: "destructive"
      });
      return [];
    }
  };

  const initializeCamera = async (deviceId?: string) => {
    try {
      // Stop existing stream
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }

      // Request camera permissions first
      await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      
      // Get available devices after permission granted
      const availableDevices = await getCameraDevices();
      
      // Fallback constraints for better mobile compatibility
      const baseConstraints = {
        video: deviceId 
          ? { 
              deviceId: { exact: deviceId },
              width: { min: 1280, ideal: 1920, max: 3840 },
              height: { min: 720, ideal: 1080, max: 2160 },
              frameRate: { min: 24, ideal: 30, max: 60 }
            }
          : { 
              facingMode: { ideal: 'environment' },
              width: { min: 1280, ideal: 1920, max: 3840 },
              height: { min: 720, ideal: 1080, max: 2160 },
              frameRate: { min: 24, ideal: 30, max: 60 }
            },
        audio: false
      };

      let newStream: MediaStream | null = null;
      
      try {
        // Try with ideal constraints
        newStream = await navigator.mediaDevices.getUserMedia(baseConstraints);
      } catch (err) {
        console.warn('Failed with ideal constraints, trying basic constraints:', err);
        // Fallback to basic constraints
        const basicConstraints = {
          video: deviceId 
            ? { deviceId: { exact: deviceId } }
            : { facingMode: 'environment' },
          audio: false
        };
        newStream = await navigator.mediaDevices.getUserMedia(basicConstraints);
      }

      setStream(newStream);

      // Attach stream to video element
      if (videoRef.current) {
        console.log('📹 Attaching stream to video element');
        const video = videoRef.current;
        
        video.srcObject = newStream;
        video.muted = true;
        video.playsInline = true;
        
        // Try to play immediately
        video.play()
          .then(() => console.log('▶️ Video playing'))
          .catch(async (err) => {
            console.warn('⚠️ First play attempt failed:', err.message);
            // Wait for loadedmetadata event
            await new Promise((resolve) => {
              video.onloadedmetadata = resolve;
            });
            return video.play();
          })
          .then(() => console.log('▶️ Video playing after metadata'))
          .catch(e => console.error('❌ Video play error:', e));
      } else {
        console.error('❌ videoRef.current is null!');
      }

      const videoTrack = newStream.getVideoTracks()[0];
      const settings = videoTrack.getSettings();
      console.log('Camera initialized with settings:', settings);
      
      const device = availableDevices.find(d => d.deviceId === settings.deviceId);
      if (device) {
        setCurrentDevice(device);
      } else if (availableDevices.length > 0) {
        setCurrentDevice(availableDevices[0]);
      }

      return newStream;
    } catch (error: any) {
      console.error('Error initializing camera:', error);
      const errorMsg = error.name === 'NotAllowedError' 
        ? 'Permissions caméra refusées. Activez-les dans les paramètres.'
        : error.name === 'NotFoundError'
        ? 'Aucune caméra détectée sur cet appareil.'
        : error.name === 'NotReadableError'
        ? 'Caméra déjà utilisée par une autre application.'
        : "Impossible d'initialiser la caméra";
        
      toast({
        title: "Erreur caméra",
        description: errorMsg,
        variant: "destructive"
      });
      return null;
    }
  };

  const switchCamera = async (deviceId: string) => {
    // Save recording if active
    if (isRecording) {
      await stopVideoRecording();
    }
    
    await initializeCamera(deviceId);
  };

  const getLensTypeForZoom = (zoom: number): string | null => {
    if (zoom >= 1 && zoom < 1.5) return 'ultrawide';
    if (zoom >= 1.5 && zoom < 3) return 'main';
    if (zoom >= 3) return 'telephoto';
    return null;
  };

  const switchToLensForZoom = async (zoom: number) => {
    const targetLensType = getLensTypeForZoom(zoom);
    if (!targetLensType || !currentDevice) return;

    const currentLensType = currentDevice.label.toLowerCase();
    if (currentLensType.includes(targetLensType)) return;

    const targetDevice = devices.find(d => 
      d.label.toLowerCase().includes(targetLensType)
    );

    if (targetDevice && targetDevice.deviceId !== currentDevice.deviceId) {
      await switchCamera(targetDevice.deviceId);
      toast({
        title: "Objectif changé",
        description: `Passage à l'objectif ${targetLensType}`,
      });
    }
  };

  const applyZoom = async (zoomLevel: number) => {
    if (!stream) return;

    try {
      const videoTrack = stream.getVideoTracks()[0];
      const capabilities = videoTrack.getCapabilities() as any;

      if (capabilities.zoom) {
        await videoTrack.applyConstraints({
          advanced: [{ zoom: zoomLevel } as any]
        });
        setCurrentZoom(zoomLevel);
        
        if (isRecording) {
          console.log('Zoom applied during recording:', zoomLevel);
        }
      } else {
        // Auto lens switch based on zoom
        await switchToLensForZoom(zoomLevel);
        setCurrentZoom(zoomLevel);
      }
    } catch (error) {
      console.error('Error applying zoom:', error);
    }
  };

  const toggleFlash = async () => {
    if (!stream) return;

    try {
      const videoTrack = stream.getVideoTracks()[0];
      const capabilities = videoTrack.getCapabilities() as any;

      if (capabilities.torch) {
        await videoTrack.applyConstraints({
          advanced: [{ torch: !flashEnabled } as any]
        });
        setFlashEnabled(!flashEnabled);
        toast({
          title: flashEnabled ? "Flash désactivé" : "Flash activé",
        });
      } else {
        toast({
          title: "Flash non disponible",
          description: "Ce dispositif ne supporte pas le flash",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error toggling flash:', error);
      toast({
        title: "Erreur",
        description: "Impossible de contrôler le flash",
        variant: "destructive"
      });
    }
  };

  const capturePhoto = useCallback(async () => {
    if (!videoRef.current || !stream) return null;

    try {
      const canvas = document.createElement('canvas');
      const video = videoRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;

      ctx.drawImage(video, 0, 0);
      
      return new Promise<Blob | null>((resolve) => {
        canvas.toBlob((blob) => {
          resolve(blob);
        }, 'image/jpeg', 0.95);
      });
    } catch (error) {
      console.error('Error capturing photo:', error);
      return null;
    }
  }, [stream]);

  const startVideoRecording = useCallback(async (audioStream?: MediaStream) => {
    if (!stream) return;

    try {
      recordedChunksRef.current = [];
      
      // Combine video and audio streams
      let combinedStream = stream;
      if (audioStream) {
        combinedStream = new MediaStream([
          ...stream.getVideoTracks(),
          ...audioStream.getAudioTracks()
        ]);
      }

      // Apply Hasselblad-style video processing
      const videoTrack = combinedStream.getVideoTracks()[0];
      await videoTrack.applyConstraints({
        advanced: [{
          whiteBalanceMode: 'manual',
          colorTemperature: 5600,
          exposureMode: 'manual',
          brightness: 128,
          contrast: 128,
          saturation: 140, // Enhanced saturation for vibrant colors
          sharpness: 160,  // Enhanced sharpness
        } as any]
      });

      const mimeType = 'video/webm;codecs=vp9';
      const mediaRecorder = new MediaRecorder(combinedStream, {
        mimeType,
        videoBitsPerSecond: 50000000 // 50 Mbps for high quality
      });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start(100);
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);

      toast({
        title: "Enregistrement démarré",
        description: "Traitement vidéo Hasselblad activé",
      });
    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: "Erreur",
        description: "Impossible de démarrer l'enregistrement",
        variant: "destructive"
      });
    }
  }, [stream, toast]);

  const stopVideoRecording = useCallback(async (): Promise<Blob | null> => {
    if (!mediaRecorderRef.current || !isRecording) {
      console.warn('No active recording to stop');
      return null;
    }

    try {
      return new Promise((resolve) => {
        const mediaRecorder = mediaRecorderRef.current!;
        
        mediaRecorder.onstop = () => {
          const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
          recordedChunksRef.current = [];
          setIsRecording(false);
          mediaRecorderRef.current = null;
          resolve(blob);
        };

        mediaRecorder.stop();
      });
    } catch (error) {
      console.error('Error stopping recording:', error);
      recordedChunksRef.current = [];
      setIsRecording(false);
      mediaRecorderRef.current = null;
      return null;
    }
  }, [isRecording]);

  const updateVideoCodec = (codec: string) => {
    setVideoCodec(codec);
  };

  const updateFrameRate = (fps: number) => {
    setFrameRate(fps);
  };

  return {
    stream,
    devices,
    currentDevice,
    isRecording,
    flashEnabled,
    currentZoom,
    videoCodec,
    frameRate,
    videoRef,
    initialize: initializeCamera,
    initializeCamera,
    switchCamera,
    switchToLens: switchCamera,
    toggleFlash,
    applyZoom,
    autoZoomForLens: applyZoom,
    applyZoomWithAutoLens: applyZoom,
    capturePhoto,
    startVideoRecording,
    stopVideoRecording,
    getCameraDevices,
    updateVideoCodec,
    updateFrameRate
  };
};
