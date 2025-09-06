import { useState } from 'react';
import { CameraPreview } from '@/components/camera/CameraPreview';
import { ControlPanel } from '@/components/camera/ControlPanel';
import { CaptureControls } from '@/components/camera/CaptureControls';
import { ZoomControls } from '@/components/camera/ZoomControls';
import { Histogram } from '@/components/camera/Histogram';
import { StatusDisplay } from '@/components/camera/StatusDisplay';
import { Button } from '@/components/ui/button';
import { Settings2, Menu, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Index = () => {
  const [currentMode, setCurrentMode] = useState<'photo' | 'video'>('video');
  const [isRecording, setIsRecording] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  const [zoom, setZoom] = useState(1);
  const { toast } = useToast();

  const handleCapture = () => {
    toast({
      title: "Photo capturée",
      description: "Image sauvegardée en format RAW",
    });
  };

  const handleStartRecording = () => {
    setIsRecording(true);
    toast({
      title: "Enregistrement démarré",
      description: "Vidéo 4K 60fps en cours...",
    });
  };

  const handleStopRecording = () => {
    setIsRecording(false);
    toast({
      title: "Enregistrement terminé",
      description: "Vidéo sauvegardée avec succès",
    });
  };

  const handleSwitchCamera = () => {
    toast({
      title: "Basculement caméra",
      description: "Passage à la caméra arrière",
    });
  };

  const handleZoomChange = (newZoom: number) => {
    setZoom(newZoom);
  };

  return (
    <div className="min-h-screen bg-cinema-background flex flex-col relative overflow-hidden">
      {/* Status bar */}
      <StatusDisplay />

      {/* Main camera view */}
      <div className="flex-1 relative">
        <div className="absolute inset-0">
          <CameraPreview 
            isRecording={isRecording} 
            currentMode={currentMode} 
            zoom={zoom}
            showGrid={showGrid}
          />
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

        {/* Side panel - histogram and monitoring - ONLY show when controls are open */}
        {showControls && (
          <div className="absolute right-4 top-20 bottom-32 w-56 space-y-4 z-40 animate-slide-up">
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
        <div className="absolute left-4 top-20 bottom-32 w-80 animate-slide-up z-40">
          <ControlPanel 
            currentMode={currentMode}
            onModeChange={setCurrentMode}
          />
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