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
  applyZoomWithAutoLens: (value: number, autoSwitchLens?: boolean) => Promise<void>;
  toggleFlash: () => Promise<void>;
}

export const useCamera = () => {
  const [devices, setDevices] = useState<CameraDevice[]>([]);
  const [currentDevice, setCurrentDevice] = useState<CameraDevice | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [videoCodec, setVideoCodec] = useState<string>('video/mp4;codecs=h264');
  const [frameRate, setFrameRate] = useState<number>(30);
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  const identifyLensType = (label: string): 'main' | 'ultrawide' | 'telephoto' => {
    const lower = (label || '').toLowerCase();
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
      /back|rear|environment|facing back/i.test(d.label || '') && 
      !/front|selfie|user|facing front/i.test(d.label || '')
    );
    
    // Fallback: if no back cameras detected, use all video devices except front
    if (backCameras.length === 0) {
      console.log('No back cameras detected, using all non-front video devices');
      backCameras = videoDevices.filter(d => !/front|selfie|user|facing front/i.test(d.label || ''));
    }

    return backCameras.map((device, index) => {
      // OnePlus 11 specific detection based on labels
      let type: 'main' | 'ultrawide' | 'telephoto';
      let megapixels: number;
      let aperture: string;
      let features: string[];
      
      // OnePlus 11 camera mapping based on device labels
      if ((device.label || '').includes('back:0')) {
        // Main camera - 50MP Sony IMX890
        type = 'main';
        megapixels = 50;
        aperture = 'f/1.8';
        features = ['OIS', 'EIS', 'Sony IMX890'];
      } else if ((device.label || '').includes('back:2')) {
        // Ultra-wide camera - 48MP Sony IMX581  
        type = 'ultrawide';
        megapixels = 48;
        aperture = 'f/2.2';
        features = ['115° FOV', 'Macro', 'Sony IMX581'];
      } else if ((device.label || '').includes('back:3')) {
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
        label: device.label || 'Caméra inconnue',
        type,
        megapixels,
        aperture,
        features
      };
    });
  };

  const enumerateDevices = useCallback(async (): Promise<CameraDevice[]> => {
    try {
      console.log('Starting device enumeration...');
      
      // First request basic permissions with any available camera
      let tempStream: MediaStream | null = null;
      try {
        tempStream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment' }, // Try back camera first
          audio: false
        });
        console.log('Got camera permission with environment facing mode');
      } catch (envError) {
        console.log('Environment facing mode failed, trying any camera...');
        try {
          tempStream = await navigator.mediaDevices.getUserMedia({ 
            video: true,
            audio: false
          });
          console.log('Got camera permission with any camera');
        } catch (anyError) {
          console.error('Camera permission completely denied:', anyError);
          throw new Error('Permission caméra refusée');
        }
      }
      
      // Stop the temp stream to free up resources
      if (tempStream) {
        tempStream.getTracks().forEach(track => track.stop());
      }
      
      // Wait a bit for resources to be freed
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Now enumerate devices (should have labels after permission)
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      console.log('All devices found:', allDevices.map(d => ({ kind: d.kind, label: d.label, deviceId: d.deviceId })));
      
      const videoDevices = allDevices.filter(d => d.kind === 'videoinput');
      console.log('Video input devices:', videoDevices);
      
      if (videoDevices.length === 0) {
        console.warn('No video devices detected');
        return [];
      }
      
      const cameraDevices = detectOnePlusLenses(allDevices);
      console.log('Detected camera devices:', cameraDevices);
      
      setDevices(cameraDevices);
      return cameraDevices;
    } catch (error) {
      console.error('Device enumeration failed:', error);
      return [];
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

  const stopVideoRecording = useCallback(async (): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const mediaRecorder = mediaRecorderRef.current;
      if (!mediaRecorder) {
        reject(new Error('No active recording'));
        return;
      }

      if (mediaRecorder.state === 'inactive') {
        reject(new Error('Recording already stopped'));
        return;
      }

      mediaRecorder.onstop = () => {
        try {
          const type = (mediaRecorder as any).mimeType || 'video/webm';
          const blob = new Blob(recordedChunksRef.current, { type });
          recordedChunksRef.current = [];
          setIsRecording(false);
          mediaRecorderRef.current = null;
          resolve(blob);
        } catch (error) {
          console.error('Error creating video blob:', error);
          recordedChunksRef.current = [];
          setIsRecording(false);
          mediaRecorderRef.current = null;
          reject(error);
        }
      };

      mediaRecorder.onerror = (event) => {
        console.error('Recording error:', event);
        recordedChunksRef.current = [];
        setIsRecording(false);
        mediaRecorderRef.current = null;
        reject(new Error('Recording failed'));
      };
      
      try {
        mediaRecorder.stop();
      } catch (error) {
        console.error('Error stopping recording:', error);
        setIsRecording(false);
        mediaRecorderRef.current = null;
        reject(error);
      }
    });
  }, []);

  const switchToDevice = useCallback(async (deviceId: string): Promise<void> => {
    try {
      console.log('Switching to device:', deviceId);

      // Stop recording if active before switching
      if (isRecording && mediaRecorderRef.current) {
        console.log('Stopping active recording before lens switch');
        try {
          if (mediaRecorderRef.current.state === 'recording') {
            await stopVideoRecording();
          }
        } catch (stopError) {
          console.warn('Error stopping recording:', stopError);
          setIsRecording(false);
          mediaRecorderRef.current = null;
        }
      }

      // Find device or use fallback
      let device = devices.find(d => d.deviceId === deviceId);
      if (!device) {
        console.warn('Device not found, creating fallback');
        device = { deviceId, label: 'Caméra', type: 'main' } as CameraDevice;
      }

      const constraints: MediaStreamConstraints = {
        video: {
          deviceId: deviceId === 'default' ? undefined : { exact: deviceId },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          frameRate: { ideal: frameRate }
        } as MediaTrackConstraints,
        audio: false  // Don't request audio when switching devices
      };

      await startStream(constraints);
      setCurrentDevice(device);
      
      console.log(`Successfully switched to ${device.type} lens:`, device.label);
    } catch (error) {
      console.error('Failed to switch device:', error);
      throw error;
    }
  }, [devices, startStream, isRecording, frameRate, stopVideoRecording]);

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

    // Get audio stream separately for recording
    let audioStream: MediaStream | null = null;
    try {
      audioStream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000,
          channelCount: 2
        }
      });
    } catch (audioError) {
      console.warn('Audio stream not available for recording:', audioError);
    }

    // Combine video and audio streams for recording
    const recordingStream = new MediaStream();
    
    // Add video tracks
    const videoTrack = stream.getVideoTracks()[0];
    if (videoTrack) {
      recordingStream.addTrack(videoTrack);
      try {
        // Apply Hasselblad-style professional settings
        await videoTrack.applyConstraints({
          width: { ideal: 4096 },
          height: { ideal: 2304 },
          frameRate: { ideal: frameRate },
          aspectRatio: { ideal: 16/9 },
          // Professional video enhancement settings
          exposureMode: 'manual',
          whiteBalanceMode: 'manual',
          focusMode: 'continuous',
          // Noise reduction and image enhancement
          noiseSuppression: true,
          echoCancellation: false,
          autoGainControl: false
        } as any);
        console.log('Professional video settings applied');
      } catch (e) {
        console.warn('Some professional settings not supported:', e);
      }
    }

    // Add audio tracks if available
    if (audioStream) {
      audioStream.getAudioTracks().forEach(track => {
        recordingStream.addTrack(track);
      });
    }

    // Pick the best supported codec/container based on user preference
    const codecPreferences = [videoCodec];
    const fallbackCandidates = [
      'video/mp4;codecs=h264',
      'video/mp4;codecs=avc1', 
      'video/mp4',
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm;codecs=vp9',
      'video/webm;codecs=vp8',
      'video/webm'
    ];
    
    const candidates = [...codecPreferences, ...fallbackCandidates];

    let chosen: string | undefined = undefined;
    for (const c of candidates) {
      try {
        if ((window as any).MediaRecorder?.isTypeSupported?.(c)) {
          chosen = c;
          break;
        }
      } catch (_) {
        // ignore detection errors
      }
    }

    // Enhanced recording options for professional quality
    const options: MediaRecorderOptions = chosen ? { 
      mimeType: chosen,
      videoBitsPerSecond: 20000000, // 20 Mbps for high quality
      audioBitsPerSecond: 320000    // 320 kbps for audio
    } : {
      videoBitsPerSecond: 20000000,
      audioBitsPerSecond: 320000
    };
    console.log('Using MIME type for recording:', chosen ?? '(browser default)');

    let mediaRecorder: MediaRecorder;
    try {
      mediaRecorder = new MediaRecorder(recordingStream, options);
    } catch (err) {
      console.warn('Preferred MIME init failed, retrying with browser default', err);
      try {
        mediaRecorder = new MediaRecorder(recordingStream, { videoBitsPerSecond: 20000000 });
      } catch (fallbackErr) {
        mediaRecorder = new MediaRecorder(recordingStream);
      }
    }

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        recordedChunksRef.current.push(event.data);
      }
    };

    mediaRecorderRef.current = mediaRecorder;
    mediaRecorder.start(100); // Smaller chunks for better quality
    setIsRecording(true);
  }, [stream, videoCodec, frameRate]);

  const applyZoom = useCallback(async (value: number): Promise<void> => {
    try {
      const track = stream?.getVideoTracks()[0];
      if (!track) {
        console.warn('No video track available for zoom');
        return;
      }
      
      const capabilities = track.getCapabilities?.();
      
      if (capabilities && 'zoom' in capabilities) {
        const zoomCapability = (capabilities as any).zoom;
        const clampedValue = Math.max(
          zoomCapability.min || 1, 
          Math.min(zoomCapability.max || 10, value)
        );
        
         await track.applyConstraints({
          advanced: [{ zoom: clampedValue } as any]
        });
        console.log('Applied native zoom:', clampedValue);
      } else {
        console.warn('Zoom not supported by current camera');
      }
      
      // If recording, ensure zoom is captured in video
      if (isRecording && mediaRecorderRef.current) {
        console.log('Zoom applied during recording - will be captured in video');
      }
    } catch (e) {
      console.warn('Native zoom application failed:', e);
    }
  }, [stream, isRecording]);

  // Auto lens switching based on zoom level
  const applyZoomWithAutoLens = useCallback(async (value: number, autoSwitchLens: boolean = true): Promise<void> => {
    try {
      // Auto switch lens based on zoom level if enabled
      if (autoSwitchLens && devices.length > 1) {
        let targetLens: 'ultrawide' | 'main' | 'telephoto' = 'main';
        
        if (value < 0.8) {
          targetLens = 'ultrawide';
        } else if (value > 2.5) {
          targetLens = 'telephoto';
        } else {
          targetLens = 'main';
        }
        
        const targetDevice = devices.find(d => d.type === targetLens);
        if (targetDevice && targetDevice.deviceId !== currentDevice?.deviceId) {
          console.log(`Auto switching to ${targetLens} lens for zoom ${value}x`);
          await switchToDevice(targetDevice.deviceId);
          return; // Don't apply zoom immediately, let the lens switch handle it
        }
      }
      
      // Apply zoom to current lens
      await applyZoom(value);
    } catch (e) {
      console.warn('Auto zoom with lens switching failed:', e);
      // Fallback to regular zoom
      await applyZoom(value);
    }
  }, [devices, currentDevice, applyZoom, switchToDevice]);

  const toggleFlash = useCallback(async (): Promise<void> => {
    try {
      const track = stream?.getVideoTracks()[0];
      if (!track) {
        console.warn('No video track available for flash');
        throw new Error('Aucun flux vidéo disponible');
      }
      
      const capabilities = track.getCapabilities?.() as any;
      console.log('Track capabilities:', capabilities);
      
      if (capabilities && capabilities.torch) {
        const newFlashState = !flashEnabled;
        try {
          await track.applyConstraints({
            advanced: [{ torch: newFlashState }] as any
          });
          setFlashEnabled(newFlashState);
          console.log('Flash toggled successfully:', newFlashState);
        } catch (constraintError) {
          console.warn('Flash constraint failed, trying direct approach:', constraintError);
          // Try alternative method for flash
          try {
            await track.applyConstraints({
              torch: newFlashState
            } as any);
            setFlashEnabled(newFlashState);
            console.log('Flash toggled with direct method:', newFlashState);
          } catch (directError) {
            console.error('Both flash methods failed:', directError);
            throw new Error('Flash non disponible sur cet appareil');
          }
        }
      } else if (capabilities && capabilities.fillLightMode) {
        // Try alternative flash API
        const newFlashState = !flashEnabled;
        await track.applyConstraints({
          advanced: [{ fillLightMode: newFlashState ? 'flash' : 'off' }] as any
        });
        setFlashEnabled(newFlashState);
        console.log('Flash toggled via fillLightMode:', newFlashState);
      } else {
        console.warn('No flash capability available');
        throw new Error('Flash non pris en charge par cette caméra');
      }
    } catch (e) {
      console.error('Flash toggle failed:', e);
      setFlashEnabled(false);
      throw e;
    }
  }, [stream, flashEnabled]);

  const updateVideoCodec = useCallback((codec: string) => {
    setVideoCodec(codec);
    console.log('Video codec set to:', codec);
  }, []);

  const updateFrameRate = useCallback((fps: number) => {
    setFrameRate(fps);
    console.log('Frame rate set to:', fps);
  }, []);

  const autoZoomForLens = useCallback(async (lensType: 'main' | 'ultrawide' | 'telephoto'): Promise<void> => {
    const zoomLevels = {
      'ultrawide': 0.5,
      'main': 1.0,
      'telephoto': 2.0
    };
    
    try {
      await applyZoom(zoomLevels[lensType]);
      console.log(`Auto zoom applied for ${lensType} lens: ${zoomLevels[lensType]}x`);
    } catch (e) {
      console.warn('Auto zoom not supported:', e);
    }
  }, [applyZoom]);

  const initialize = useCallback(async (): Promise<void> => {
    try {
      console.log('Starting camera initialization...');
      
      // Create fallback device immediately to show something to user
      const fallbackDevice: CameraDevice = {
        deviceId: 'default',
        label: 'Caméra principale',
        type: 'main',
        megapixels: 12,
        aperture: 'f/1.8',
        features: ['Standard']
      };
      
      setDevices([fallbackDevice]);
      setCurrentDevice(fallbackDevice);
      
      // Start stream with basic constraints first
      try {
        const constraints: MediaStreamConstraints = {
          video: {
            facingMode: 'environment',
            width: { ideal: 1920 },
            height: { ideal: 1080 },
            frameRate: { ideal: frameRate }
          },
          audio: false  // Don't request audio during initialization
        };
        
        await startStream(constraints);
        console.log('Camera stream started with environment facing mode');
      } catch (environmentError) {
        console.warn('Environment facing mode failed, trying basic video:', environmentError);
        try {
          const basicConstraints: MediaStreamConstraints = {
            video: true,
            audio: false
          };
          
          await startStream(basicConstraints);
          console.log('Basic camera stream started successfully');
        } catch (basicError) {
          console.error('All camera initialization attempts failed:', basicError);
          throw new Error('Impossible de démarrer la caméra. Vérifiez les permissions.');
        }
      }
        
        // Now try to enumerate devices in background
        setTimeout(async () => {
          try {
            const detectedDevices = await enumerateDevices();
            console.log('Background enumeration found:', detectedDevices.length, 'devices');
            
            if (detectedDevices.length > 0) {
              setDevices(detectedDevices);
              
              // Try to switch to main camera if available
              const mainCamera = detectedDevices.find(d => d.type === 'main') || detectedDevices[0];
              if (mainCamera && mainCamera.deviceId !== 'default') {
                try {
                  await switchToDevice(mainCamera.deviceId);
                  console.log('Switched to detected main camera:', mainCamera.label);
                } catch (switchError) {
                  console.warn('Could not switch to main camera, staying with default');
                }
              }
            }
          } catch (enumError) {
            console.warn('Background enumeration failed:', enumError);
          }
        }, 1000);
        
      } catch (streamError) {
        console.error('Failed to start camera stream:', streamError);
        throw new Error('Impossible de démarrer la caméra. Vérifiez les permissions.');
      }
      
    } catch (error) {
      console.error('Camera initialization failed:', error);
      throw error;
    }
  }, [enumerateDevices, startStream, frameRate, switchToDevice]);

  return {
    devices,
    currentDevice,
    stream,
    isRecording,
    flashEnabled,
    videoRef,
    videoCodec,
    frameRate,
    initialize,
    switchToDevice,
    switchToLens,
    capturePhoto,
    startVideoRecording,
    stopVideoRecording,
    applyZoom,
    applyZoomWithAutoLens,
    toggleFlash,
    updateVideoCodec,
    updateFrameRate,
    autoZoomForLens,
    enumerateDevices
  };
};