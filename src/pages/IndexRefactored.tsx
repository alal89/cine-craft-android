import React, { useCallback, useEffect } from 'react';
import { CameraProvider, useCameraContext } from '@/contexts/CameraContext';
import { CameraView } from '@/components/camera/CameraView';
import { CameraControls } from '@/components/camera/CameraControls';
import { CaptureControls } from '@/components/camera/CaptureControls';
import { ZoomControls } from '@/components/camera/ZoomControls';
import { StatusDisplay } from '@/components/camera/StatusDisplay';
import { MobileSettingsPanel } from '@/components/camera/MobileSettingsPanel';
import { ControlPanel } from '@/components/camera/ControlPanel';
import { LensSelector } from '@/components/camera/LensSelector';
import { Histogram } from '@/components/camera/Histogram';
import { StorageSelector } from '@/components/camera/StorageSelector';
import VideoSettings from '@/components/camera/VideoSettings';
import { AudioSettings } from '@/components/camera/AudioSettings';
import { useToast } from '@/hooks/use-toast';
import { cameraLogger } from '@/utils/logger';

// Main camera component
const CameraApp = () => {
  const { state, camera, storage, audio, setCameraReady, setRecording, setZoom } = useCameraContext();
  const { toast } = useToast();

  // Initialize camera
  const initializeCamera = useCallback(async () => {
    try {
      cameraLogger.init('Initializing camera...');
      const stream = await camera.initialize();
      
      if (stream && stream.active) {
        cameraLogger.success('Camera stream active:', stream.id);
        setCameraReady(true);
        const deviceCount = camera.devices?.length || 0;
        
        toast({
          title: "Caméra prête",
          description: deviceCount > 0 ? `${deviceCount} objectif(s)` : "Caméra active",
        });
      } else {
        cameraLogger.error('Stream inactive or null');
      }
    } catch (error: any) {
      cameraLogger.error('Camera init failed:', error);
      toast({
        title: "Erreur caméra",
        description: error.message || "Appuyez pour réessayer",
        variant: "destructive" as any,
      });
    }
  }, [camera, setCameraReady, toast]);

  // Handle capture
  const handleCapture = useCallback(async () => {
    try {
      if (state.currentMode !== 'photo') return;
      
      const blob = await camera.capturePhoto();
      await storage.savePhoto(blob);
      
      toast({
        title: "Photo capturée",
        description: `Sauvegardée dans ${storage.selectedLocation.name}`,
      });
    } catch (error: any) {
      cameraLogger.error('Photo capture failed:', error);
      toast({
        title: "Échec de la capture",
        description: error?.message || 'Réessayez',
        variant: "destructive" as any,
      });
    }
  }, [state.currentMode, camera, storage, toast]);

  // Handle recording
  const handleStartRecording = useCallback(async () => {
    try {
      setRecording(true);
      await camera.startVideoRecording();
      cameraLogger.recording('Recording started');
      toast({
        title: "Enregistrement démarré",
        description: "Vidéo en cours...",
      });
    } catch (error: any) {
      setRecording(false);
      cameraLogger.error('Recording start failed:', error);
      toast({
        title: "Erreur d'enregistrement",
        description: error?.message || 'Réessayez',
        variant: "destructive" as any,
      });
    }
  }, [setRecording, camera, toast]);

  const handleStopRecording = useCallback(async () => {
    try {
      const blob = await camera.stopVideoRecording();
      setRecording(false);
      await storage.saveVideo(blob);
      
      cameraLogger.recording('Recording stopped and saved');
      toast({
        title: "Enregistrement terminé",
        description: `Sauvegardée dans ${storage.selectedLocation.name}`,
      });
    } catch (error: any) {
      setRecording(false);
      cameraLogger.error('Recording stop failed:', error);
      toast({
        title: "Erreur de sauvegarde",
        description: error?.message || 'Réessayez',
        variant: "destructive" as any,
      });
    }
  }, [setRecording, camera, storage, toast]);

  // Handle zoom change
  const handleZoomChange = useCallback(async (newZoom: number) => {
    setZoom(newZoom);
    try {
      await camera.applyZoom(newZoom);
      cameraLogger.zoom('Zoom changed to:', newZoom);
      
      // Update canvas size when using canvas zoom
      if (camera.zoomMode === 'canvas' && camera.canvasRef.current && camera.videoRef.current) {
        const canvas = camera.canvasRef.current;
        const video = camera.videoRef.current;
        const rect = video.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;
        camera.startCanvasZoom();
      }
    } catch (error) {
      cameraLogger.error('Zoom change failed:', error);
    }
  }, [setZoom, camera]);

  // Handle lens change
  const handleLensChange = useCallback(async (lensType: 'main' | 'ultrawide' | 'telephoto') => {
    try {
      // If recording, stop and save the video first
      if (state.isRecording) {
        try {
          const blob = await camera.stopVideoRecording();
          await storage.saveVideo(blob);
          toast({
            title: "Enregistrement sauvegardé",
            description: "Vidéo sauvegardée avant changement d'objectif",
          });
        } catch (saveError: any) {
          cameraLogger.error('Failed to save recording before lens change:', saveError);
          toast({
            title: "Erreur de sauvegarde",
            description: "Impossible de sauvegarder l'enregistrement",
            variant: "destructive" as any,
          });
        }
        setRecording(false);
      }

      // Find the device with the matching lens type
      const targetDevice = camera.devices.find(d => d.type === lensType);
      if (targetDevice) {
        await camera.switchCamera(targetDevice.deviceId);
      }
      
      const lensNames = {
        'main': 'Principal',
        'ultrawide': 'Ultra Grand-Angle', 
        'telephoto': 'Téléobjectif'
      };
      
      cameraLogger.success('Lens changed to:', lensNames[lensType]);
      toast({
        title: "Objectif changé",
        description: `Basculé vers ${lensNames[lensType]}`,
      });
    } catch (error: any) {
      cameraLogger.error('Lens change error:', error);
      toast({
        title: "Échec du changement d'objectif",
        description: error?.message || 'Objectif non disponible',
        variant: "destructive" as any,
      });
    }
  }, [state.isRecording, camera, storage, setRecording, toast]);

  // Handle camera switch
  const handleSwitchCamera = useCallback(async () => {
    try {
      const currentType = (camera.currentDevice?.type || 'main') as 'main' | 'ultrawide' | 'telephoto';
      const lensOrder: Array<'main' | 'ultrawide' | 'telephoto'> = ['main', 'ultrawide', 'telephoto'];
      const currentIndex = lensOrder.indexOf(currentType);
      const nextType = lensOrder[(currentIndex + 1) % lensOrder.length];
      
      await handleLensChange(nextType);
    } catch (error: any) {
      cameraLogger.error('Switch camera error:', error);
      toast({
        title: "Échec du basculement",
        description: error?.message || 'Objectif non disponible',
        variant: "destructive" as any,
      });
    }
  }, [camera.currentDevice, handleLensChange, toast]);

  return (
    <>
      {/* Mobile settings panel */}
      <MobileSettingsPanel
        isOpen={state.showControls}
        onClose={() => {/* handled by context */}}
        currentMode={state.currentMode}
        onModeChange={() => {/* handled by context */}}
        storage={storage}
        camera={camera}
        audio={audio}
      />

      <div className="min-h-screen bg-cinema-background flex flex-col relative overflow-hidden">
        {/* Status bar */}
        <StatusDisplay />

        {/* Main camera view */}
        <div className="flex-1 relative">
          <div className="absolute inset-0">
            <CameraView onInitializeCamera={initializeCamera} />
          </div>

          {/* Top controls overlay */}
          <CameraControls />

          {/* Side panel - Desktop only */}
          {state.showControls && (
            <div className="hidden lg:block absolute right-4 top-20 bottom-32 w-56 space-y-4 z-40 animate-slide-up">
              <LensSelector
                devices={camera.devices}
                currentDevice={camera.currentDevice}
                onLensChange={handleLensChange}
                disabled={state.isRecording}
              />
              
              <Histogram />
              
              {/* Exposure meter */}
              <div className="bg-cinema-surface-elevated/90 backdrop-blur-sm p-3 rounded-lg border border-cinema-primary/20">
                <h4 className="text-cinema-text-secondary text-xs font-medium mb-2">Exposition</h4>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-cinema-text-muted">-2</span>
                  <div className="flex-1 h-2 bg-black/20 rounded-full relative">
                    <div className="absolute left-1/2 top-0 w-0.5 h-full bg-cinema-text-primary"></div>
                    <div className="absolute left-1/3 top-0 w-1 h-full bg-cinema-primary rounded-full"></div>
                  </div>
                  <span className="text-xs text-cinema-text-muted">+2</span>
                </div>
              </div>

              {/* Audio levels */}
              <div className="bg-cinema-surface-elevated/90 backdrop-blur-sm p-3 rounded-lg border border-cinema-primary/20">
                <h4 className="text-cinema-text-secondary text-xs font-medium mb-2">Niveaux Audio</h4>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-cinema-text-muted w-4">L</span>
                    <div className="flex-1 h-1.5 bg-black/20 rounded-full overflow-hidden">
                      <div className="w-3/4 h-full bg-green-500 rounded-full animate-pulse"></div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-cinema-text-muted w-4">R</span>
                    <div className="flex-1 h-1.5 bg-black/20 rounded-full overflow-hidden">
                      <div className="w-2/3 h-full bg-green-500 rounded-full animate-pulse"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Zoom controls */}
          <ZoomControls 
            onZoomChange={handleZoomChange} 
            zoomMode={camera.zoomMode}
            currentZoom={camera.currentZoom}
          />
        </div>

        {/* Control panel - Desktop only */}
        {state.showControls && (
          <div className="hidden lg:block absolute left-4 top-20 bottom-32 w-80">
            <div className="h-full overflow-y-auto space-y-4">
              <ControlPanel 
                currentMode={state.currentMode}
                onModeChange={() => {/* handled by context */}}
              />
              
              <div className="bg-cinema-surface-elevated border border-cinema-primary/20 p-4 rounded-lg">
                <StorageSelector
                  locations={storage.locations}
                  selectedLocation={storage.selectedLocation}
                  onLocationChange={storage.setSelectedLocation}
                />
              </div>

              <VideoSettings
                videoCodec={camera.videoCodec}
                frameRate={camera.frameRate}
                onCodecChange={camera.updateVideoCodec}
                onFrameRateChange={camera.updateFrameRate}
              />

              <AudioSettings
                microphoneEnabled={audio.microphoneEnabled}
                audioGain={audio.audioGain}
                onMicrophoneToggle={audio.setMicrophoneEnabled}
                onAudioGainChange={audio.setAudioGain}
                onAudioDeviceChange={audio.switchAudioDevice}
              />
            </div>
          </div>
        )}

        {/* Bottom capture controls */}
        <div className="relative z-20">
          <CaptureControls
            currentMode={state.currentMode}
            isRecording={state.isRecording}
            onCapture={handleCapture}
            onStartRecording={handleStartRecording}
            onStopRecording={handleStopRecording}
            onSwitchCamera={handleSwitchCamera}
          />
        </div>
      </div>
    </>
  );
};

// Main component with provider
const Index = () => {
  return (
    <CameraProvider>
      <CameraApp />
    </CameraProvider>
  );
};

export default Index;