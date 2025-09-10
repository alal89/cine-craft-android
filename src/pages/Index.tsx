import { useState, useEffect } from 'react';
// CameraPreview functionality now integrated directly
import { ControlPanel } from '@/components/camera/ControlPanel';
import { CaptureControls } from '@/components/camera/CaptureControls';
import { ZoomControls } from '@/components/camera/ZoomControls';
import { Histogram } from '@/components/camera/Histogram';
import { StatusDisplay } from '@/components/camera/StatusDisplay';
import { LensSelector } from '@/components/camera/LensSelector';
import { StorageSelector } from '@/components/camera/StorageSelector';
import { Button } from '@/components/ui/button';
import { Settings2, Menu, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useCamera } from '@/hooks/useCamera';
import { useStorage } from '@/hooks/useStorage';

const Index = () => {
  const [currentMode, setCurrentMode] = useState<'photo' | 'video'>('video');
  const [isRecording, setIsRecording] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  const [zoom, setZoom] = useState(1);
  const { toast } = useToast();
  
  // New hooks for advanced camera and storage management
  const camera = useCamera();
  const storage = useStorage();

  // Initialize camera on mount
  useEffect(() => {
    const initCamera = async () => {
      try {
        console.log('Initializing camera from Index component...');
        await camera.initialize();
        
        // Wait a bit for devices to be set
        setTimeout(() => {
          toast({
            title: "Caméra initialisée",
            description: `${camera.devices.length} objectif(s) détecté(s)`,
          });
        }, 100);
      } catch (error: any) {
        console.error('Camera init failed:', error);
        toast({
          title: "Erreur caméra",
          description: error.message || "Impossible d'initialiser la caméra. Vérifiez les permissions.",
          variant: "destructive" as any,
        });
      }
    };
    
    initCamera();
  }, []);

  const handleCapture = async () => {
    try {
      if (currentMode !== 'photo') return;
      
      const blob = await camera.capturePhoto();
      await storage.savePhoto(blob);
      
      toast({
        title: "Photo capturée",
        description: `Sauvegardée dans ${storage.selectedLocation.name}`,
      });
    } catch (error: any) {
      console.error('Photo capture failed:', error);
      toast({
        title: "Échec de la capture",
        description: error?.message || 'Réessayez',
        variant: "destructive" as any,
      });
    }
  };
  const handleStartRecording = async () => {
    try {
      setIsRecording(true);
      await camera.startVideoRecording();
      toast({
        title: "Enregistrement démarré",
        description: "Vidéo en cours...",
      });
    } catch (error: any) {
      setIsRecording(false);
      toast({
        title: "Erreur d'enregistrement",
        description: error?.message || 'Réessayez',
        variant: "destructive" as any,
      });
    }
  };

  const handleStopRecording = async () => {
    try {
      const blob = await camera.stopVideoRecording();
      setIsRecording(false);
      await storage.saveVideo(blob);
      
      toast({
        title: "Enregistrement terminé",
        description: `Sauvegardée dans ${storage.selectedLocation.name}`,
      });
    } catch (error: any) {
      setIsRecording(false);
      toast({
        title: "Erreur de sauvegarde",
        description: error?.message || 'Réessayez',
        variant: "destructive" as any,
      });
    }
  };

  const handleSwitchCamera = async () => {
    try {
      // Cycle through available lenses automatically
      const currentType = camera.currentDevice?.type || 'main';
      const lensOrder: Array<'main' | 'ultrawide' | 'telephoto'> = ['main', 'ultrawide', 'telephoto'];
      const currentIndex = lensOrder.indexOf(currentType);
      const nextType = lensOrder[(currentIndex + 1) % lensOrder.length];
      
      await camera.switchToLens(nextType);
      toast({
        title: "Objectif changé",
        description: `Basculé vers ${nextType === 'main' ? 'Principal' : nextType === 'ultrawide' ? 'Ultra Grand-Angle' : 'Téléobjectif'}`,
      });
    } catch (error: any) {
      console.error('Switch camera error:', error);
      toast({
        title: "Échec du basculement",
        description: error?.message || 'Objectif non disponible',
        variant: "destructive" as any,
      });
    }
  };
  const handleZoomChange = async (newZoom: number) => {
    setZoom(newZoom);
    await camera.applyZoom(newZoom);
  };
  return (
    <div className="min-h-screen bg-cinema-background flex flex-col relative overflow-hidden">
      {/* Status bar */}
      <StatusDisplay />

      {/* Main camera view */}
      <div className="flex-1 relative">
        <div className="absolute inset-0">
          <div className="w-full h-full bg-black overflow-hidden rounded-lg relative">
            {camera.stream ? (
              <video
                ref={camera.videoRef}
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
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-cinema-primary/20 flex items-center justify-center">
                    <span className="text-2xl">📸</span>
                  </div>
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
        </div>

        {/* Top controls overlay */}
        <div className="absolute top-4 left-4 right-4 flex justify-between items-start z-50">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              console.log('Menu button clicked, current showControls:', showControls);
              setShowControls(!showControls);
            }}
            className="bg-black/30 backdrop-blur-sm"
          >
            {showControls ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </Button>

          <div className="flex space-x-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowGrid(!showGrid)}
              className={`bg-black/30 backdrop-blur-sm ${showGrid ? 'bg-cinema-primary/30' : ''}`}
              title="Grille de niveau"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <line x1="9" y1="3" x2="9" y2="21"/>
                <line x1="15" y1="3" x2="15" y2="21"/>
                <line x1="3" y1="9" x2="21" y2="9"/>
                <line x1="3" y1="15" x2="21" y2="15"/>
              </svg>
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowControls(!showControls)}
              title={showControls ? "Fermer les paramètres" : "Ouvrir les paramètres"}
              className={`bg-black/30 backdrop-blur-sm ${showControls ? 'bg-cinema-primary/30' : ''}`}
            >
              <Settings2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {showControls && (
          <button aria-label="Fermer les paramètres" className="absolute inset-0 z-30 bg-black/30" onClick={() => setShowControls(false)} />
        )}

        {/* Side panel - lens selector, histogram and monitoring - ONLY show when controls are open */}
        {showControls && (
          <div className="absolute right-4 top-20 bottom-32 w-56 space-y-4 z-40 animate-slide-up">
            {/* Lens Selector */}
            <LensSelector
              devices={camera.devices}
              currentDevice={camera.currentDevice}
              onLensChange={camera.switchToLens}
              disabled={isRecording}
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
        <ZoomControls onZoomChange={handleZoomChange} />
      </div>

      {/* Control panel - collapsible */}
      {showControls && (
        <div className="absolute left-4 top-20 bottom-32 w-80 animate-slide-up z-40 space-y-4">
          <ControlPanel 
            currentMode={currentMode}
            onModeChange={setCurrentMode}
          />
          
          {/* Storage Selector */}
          <div className="bg-cinema-surface p-4 rounded-lg">
            <StorageSelector
              locations={storage.locations}
              selectedLocation={storage.selectedLocation}
              onLocationChange={storage.setSelectedLocation}
            />
          </div>
        </div>
      )}

      {/* Bottom capture controls */}
      <div className="relative z-20">
        <CaptureControls
          currentMode={currentMode}
          isRecording={isRecording}
          onCapture={handleCapture}
          onStartRecording={handleStartRecording}
          onStopRecording={handleStopRecording}
          onSwitchCamera={handleSwitchCamera}
        />
      </div>
    </div>
  );
};

export default Index;