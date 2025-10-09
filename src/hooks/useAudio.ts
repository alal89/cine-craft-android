import { useState, useCallback, useEffect } from 'react';
import { cameraLogger } from '@/utils/logger';

export interface AudioDevice {
  deviceId: string;
  label: string;
  type: 'builtin' | 'usb' | 'bluetooth' | 'external';
  channels?: number;
  sampleRate?: number;
}

export const useAudio = () => {
  const [audioDevices, setAudioDevices] = useState<AudioDevice[]>([]);
  const [selectedAudioDevice, setSelectedAudioDevice] = useState<AudioDevice | null>(null);
  const [microphoneEnabled, setMicrophoneEnabled] = useState(true);
  const [audioGain, setAudioGain] = useState(1.0);

  const enumerateAudioDevices = useCallback(async (): Promise<AudioDevice[]> => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioInputs = devices.filter(device => device.kind === 'audioinput');
      
      const mappedDevices: AudioDevice[] = audioInputs.map(device => {
        let type: AudioDevice['type'] = 'builtin';
        
        // Detect device type based on label
        const label = device.label.toLowerCase();
        if (label.includes('usb') || label.includes('usb-c')) {
          type = 'usb';
        } else if (label.includes('bluetooth') || label.includes('airpods') || label.includes('headset')) {
          type = 'bluetooth';
        } else if (label.includes('external') || label.includes('microphone')) {
          type = 'external';
        }

        return {
          deviceId: device.deviceId,
          label: device.label || `Microphone ${type}`,
          type,
          channels: 2, // Default assumption
          sampleRate: 48000 // Default high quality
        };
      });

      cameraLogger.debug('Audio devices found:', mappedDevices);
      setAudioDevices(mappedDevices);
      
      return mappedDevices;
    } catch (error) {
      console.error('Failed to enumerate audio devices:', error);
      return [];
    }
  }, []); // Remove selectedAudioDevice dependency to prevent loop

  const switchAudioDevice = useCallback(async (deviceId: string): Promise<void> => {
    const device = audioDevices.find(d => d.deviceId === deviceId);
    if (!device) {
      throw new Error('Audio device not found');
    }
    
    setSelectedAudioDevice(device);
    console.log('Switched to audio device:', device.label);
  }, [audioDevices]);

  const getAudioConstraints = useCallback((): MediaStreamConstraints['audio'] => {
    if (!microphoneEnabled) {
      return false;
    }

    const constraints: any = {
      deviceId: selectedAudioDevice?.deviceId,
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: false, // Disable AGC for external mics
      sampleRate: selectedAudioDevice?.sampleRate || 48000,
      channelCount: selectedAudioDevice?.channels || 2
    };

    // Enhanced settings for USB/external microphones
    if (selectedAudioDevice?.type === 'usb' || selectedAudioDevice?.type === 'external') {
      constraints.echoCancellation = false; // External mics usually handle this
      constraints.noiseSuppression = false; // Let external mic handle this
      constraints.autoGainControl = false;
      constraints.sampleRate = 48000; // High quality for external mics
      constraints.channelCount = 2;
    }

    return constraints;
  }, [selectedAudioDevice, microphoneEnabled]);

  const checkUsbAudioSupport = useCallback(async (): Promise<boolean> => {
    try {
      // Check if we can request audio devices with specific constraints
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
          sampleRate: 48000
        }
      });
      
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch (error) {
      console.warn('Advanced audio constraints not supported:', error);
      return false;
    }
  }, []);

  // Auto-select audio device when devices change
  useEffect(() => {
    if (audioDevices.length > 0 && !selectedAudioDevice) {
      // Auto-select USB-C microphone if available
      const usbMic = audioDevices.find(d => d.type === 'usb');
      if (usbMic) {
        setSelectedAudioDevice(usbMic);
        console.log('Auto-selected USB microphone:', usbMic.label);
      } else {
        setSelectedAudioDevice(audioDevices[0]);
        console.log('Auto-selected first available microphone:', audioDevices[0].label);
      }
    }
  }, [audioDevices, selectedAudioDevice]);

  // Initialize audio devices on mount
  useEffect(() => {
    enumerateAudioDevices();
    
    // Listen for device changes
    const handleDeviceChange = () => {
      console.log('Audio devices changed, re-enumerating...');
      enumerateAudioDevices();
    };
    
    navigator.mediaDevices.addEventListener('devicechange', handleDeviceChange);
    
    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', handleDeviceChange);
    };
  }, [enumerateAudioDevices]);

  return {
    audioDevices,
    selectedAudioDevice,
    microphoneEnabled,
    audioGain,
    setMicrophoneEnabled,
    setAudioGain,
    switchAudioDevice,
    getAudioConstraints,
    enumerateAudioDevices,
    checkUsbAudioSupport
  };
};