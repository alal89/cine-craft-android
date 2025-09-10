import { useState, useRef, useCallback } from 'react';

export interface CameraDevice {
  deviceId: string;
  label: string;
  type: 'main' | 'ultrawide' | 'telephoto';
  megapixels?: number;
  aperture?: string;
  features?: string[];
}

export interface CameraAPI {
  devices: CameraDevice[];
  currentDevice: CameraDevice | null;
  switchToDevice: (deviceId: string) => Promise<void>;
  switchToLens: (type: 'main' | 'ultrawide' | 'telephoto') => Promise<void>;
  capturePhoto: () => Promise<Blob>;
  startVideoRecording: () => Promise<void>;
  stopVideoRecording: () => Promise<Blob>;
  applyZoom: (value: number) => Promise<void>;
  toggleFlash: () => Promise<void>;
}

export const useCamera = () => {
  const [devices, setDevices] = useState<CameraDevice[]>([]);
  const [currentDevice, setCurrentDevice] = useState<CameraDevice | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [flashEnabled, setFlashEnabled] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  const identifyLensType = (label: string): 'main' | 'ultrawide' | 'telephoto' => {
    const lower = label.toLowerCase();
    if (lower.includes('ultra') || lower.includes('wide') || lower.includes('macro')) {
      return 'ultrawide';
    }
    if (lower.includes('tele') || lower.includes('zoom') || lower.includes('portrait')) {
      return 'telephoto';
    }
    return 'main';
  };

  const detectOnePlusLenses = (devices: MediaDeviceInfo[]): CameraDevice[] => {
    const videoDevices = devices.filter(d => d.kind === 'videoinput');
    console.log('Video devices:', videoDevices.map(d => ({ label: d.label, deviceId: d.deviceId })));
    
    // Filter for back cameras only
    let backCameras = videoDevices.filter(d => 
      /back|rear|environment|facing back/i.test(d.label) && 
      !/front|selfie|user|facing front/i.test(d.label)
    );
    
    // Fallback: if no back cameras detected, use all video devices except front
    if (backCameras.length === 0) {
      console.log('No back cameras detected, using all non-front video devices');
      backCameras = videoDevices.filter(d => !/front|selfie|user|facing front/i.test(d.label));
    }

    return backCameras.map((device, index) => {
      // OnePlus 11 specific detection based on labels
      let type: 'main' | 'ultrawide' | 'telephoto';
      let megapixels: number;
      let aperture: string;
      let features: string[];
      
      // OnePlus 11 camera mapping based on device labels
      if (device.label.includes('back:0')) {
        // Main camera - 50MP Sony IMX890
        type = 'main';
        megapixels = 50;
        aperture = 'f/1.8';
        features = ['OIS', 'EIS', 'Sony IMX890'];
      } else if (device.label.includes('back:2')) {
        // Ultra-wide camera - 48MP Sony IMX581  
        type = 'ultrawide';
        megapixels = 48;
        aperture = 'f/2.2';
        features = ['115° FOV', 'Macro', 'Sony IMX581'];
      } else if (device.label.includes('back:3')) {
        // Telephoto camera - 32MP Sony IMX709
        type = 'telephoto';
        megapixels = 32;
        aperture = 'f/2.0';
        features = ['2x Zoom', 'Portrait', 'Sony IMX709'];
      } else {
        // Fallback assignment for unknown cameras
        if (index === 0) {
          type = 'main';
          megapixels = 50;
          aperture = 'f/1.8';
          features = ['OIS', 'EIS', 'Sony IMX890'];
        } else if (index === 1) {
          type = 'ultrawide';
          megapixels = 48;
          aperture = 'f/2.2';
          features = ['115° FOV', 'Macro', 'Sony IMX581'];
        } else {
          type = 'telephoto';
          megapixels = 32;
          aperture = 'f/2.0';
          features = ['2x Zoom', 'Portrait', 'Sony IMX709'];
        }
      }

      return {
        deviceId: device.deviceId,
        label: device.label,
        type,
        megapixels,
        aperture,
        features
      };
    });
  };

  const enumerateDevices = useCallback(async (): Promise<CameraDevice[]> => {
    try {
      // First request basic permissions and stop the stream immediately
      const tempStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      console.log('Got temp stream for permissions');
      
      // Stop the temp stream to free up resources
      tempStream.getTracks().forEach(track => track.stop());
      
      // Now enumerate devices (should have labels after permission)
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      console.log('All devices found:', allDevices.map(d => ({ kind: d.kind, label: d.label, deviceId: d.deviceId })));
      
      const videoDevices = allDevices.filter(d => d.kind === 'videoinput');
      console.log('Video input devices:', videoDevices);
      
      if (videoDevices.length === 0) {
        throw new Error('Aucun périphérique vidéo détecté');
      }
      
      const cameraDevices = detectOnePlusLenses(allDevices);
      console.log('Detected camera devices:', cameraDevices);
      
      setDevices(cameraDevices);
      return cameraDevices;
    } catch (error) {
      console.error('Failed to enumerate devices:', error);
      throw error;
    }
  }, []);

  const startStream = useCallback(async (constraints: MediaStreamConstraints): Promise<MediaStream> => {
    // Stop existing stream
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }

    const newStream = await navigator.mediaDevices.getUserMedia(constraints);
    setStream(newStream);

    if (videoRef.current) {
      videoRef.current.srcObject = newStream;
      try {
        await videoRef.current.play();
      } catch (e) {
        console.error('Video play failed:', e);
      }
    }

    return newStream;
  }, [stream]);

  const switchToDevice = useCallback(async (deviceId: string): Promise<void> => {
    try {
      console.log('Switching to device:', deviceId);
      console.log('Available devices (state):', devices.map(d => ({ id: d.deviceId, label: d.label, type: d.type })));

      // Try to find device in state, but don't fail if not yet populated
      let device = devices.find(d => d.deviceId === deviceId) || null;
      if (!device) {
        console.warn('Device not found in state list, creating fallback camera meta');
        device = { deviceId, label: 'Caméra', type: 'main' } as CameraDevice;
      }

      const constraints: MediaStreamConstraints = {
        video: {
          deviceId: { exact: deviceId },
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        } as MediaTrackConstraints,
        audio: true
      };

      await startStream(constraints);
      setCurrentDevice(device);
      console.log(`Successfully switched to ${device.type} lens:`, device.label);
    } catch (error) {
      console.error('Failed to switch device:', error);
      throw error;
    }
  }, [devices, startStream]);

  const switchToLens = useCallback(async (type: 'main' | 'ultrawide' | 'telephoto'): Promise<void> => {
    const device = devices.find(d => d.type === type);
    if (!device) {
      throw new Error(`${type} lens not available`);
    }
    await switchToDevice(device.deviceId);
  }, [devices, switchToDevice]);

  const capturePhoto = useCallback(async (): Promise<Blob> => {
    if (!stream || !videoRef.current) {
      throw new Error('Camera not ready');
    }

    const video = videoRef.current;
    
    // Try ImageCapture API first (best quality)
    try {
      const track = stream.getVideoTracks()[0];
      if ('ImageCapture' in window) {
        const imageCapture = new (window as any).ImageCapture(track);
        const blob = await imageCapture.takePhoto();
        if (blob) return blob;
      }
    } catch (e) {
      console.warn('ImageCapture failed, using canvas fallback:', e);
    }

    // Canvas fallback
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas context not available');

    canvas.width = video.videoWidth || 1920;
    canvas.height = video.videoHeight || 1080;
    ctx.drawImage(video, 0, 0);

    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Canvas toBlob failed'));
      }, 'image/jpeg', 0.95);
    });
  }, [stream]);

  const startVideoRecording = useCallback(async (): Promise<void> => {
    if (!stream) throw new Error('Camera not ready');

    recordedChunksRef.current = [];
    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: 'video/webm;codecs=vp9'
    });

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        recordedChunksRef.current.push(event.data);
      }
    };

    mediaRecorderRef.current = mediaRecorder;
    mediaRecorder.start(1000); // 1 second chunks
    setIsRecording(true);
  }, [stream]);

  const stopVideoRecording = useCallback(async (): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const mediaRecorder = mediaRecorderRef.current;
      if (!mediaRecorder || !isRecording) {
        reject(new Error('No active recording'));
        return;
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        setIsRecording(false);
        resolve(blob);
      };

      mediaRecorder.stop();
    });
  }, [isRecording]);

  const applyZoom = useCallback(async (value: number): Promise<void> => {
    try {
      const track = stream?.getVideoTracks()[0];
      const capabilities = track?.getCapabilities?.();
      
      if (capabilities && 'zoom' in capabilities) {
        await track.applyConstraints({
          advanced: [{ zoom: value } as any]
        });
        console.log('Applied native zoom:', value);
      }
    } catch (e) {
      console.warn('Native zoom not supported:', e);
    }
  }, [stream]);

  const toggleFlash = useCallback(async (): Promise<void> => {
    try {
      const track = stream?.getVideoTracks()[0];
      if (!track) throw new Error('Aucun flux vidéo disponible');
      
      const capabilities = track.getCapabilities?.() as any;
      
      if (capabilities && capabilities.torch) {
        const newFlashState = !flashEnabled;
        await track.applyConstraints({
          advanced: [{ torch: newFlashState }] as any
        });
        setFlashEnabled(newFlashState);
        console.log('Flash toggled:', newFlashState);
      } else {
        throw new Error('Flash non supporté sur cet appareil');
      }
    } catch (e) {
      console.warn('Flash not supported:', e);
      throw e;
    }
  }, [stream, flashEnabled]);

  const initialize = useCallback(async (): Promise<void> => {
    try {
      console.log('Starting camera initialization...');
      const detectedDevices = await enumerateDevices();
      console.log('Enumerated devices:', detectedDevices);
      
      if (detectedDevices.length === 0) {
        throw new Error('Aucun objectif détecté. Vérifiez les permissions caméra.');
      }
      
      // Auto-select main camera or first available
      const mainCamera = detectedDevices.find(d => d.type === 'main') || detectedDevices[0];
      console.log('Selected camera:', mainCamera);
      
      if (mainCamera) {
        await switchToDevice(mainCamera.deviceId);
        console.log('Camera initialization completed successfully');
      } else {
        throw new Error('Impossible de sélectionner un objectif');
      }
    } catch (error) {
      console.error('Camera initialization failed:', error);
      throw error;
    }
  }, [enumerateDevices, switchToDevice]);

  return {
    devices,
    currentDevice,
    stream,
    isRecording,
    flashEnabled,
    videoRef,
    initialize,
    switchToDevice,
    switchToLens,
    capturePhoto,
    startVideoRecording,
    stopVideoRecording,
    applyZoom,
    toggleFlash,
    enumerateDevices
  };
};