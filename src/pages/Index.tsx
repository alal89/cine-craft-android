import { useState } from 'react';
import { CameraPreview } from '@/components/camera/CameraPreview';
import { ControlPanel } from '@/components/camera/ControlPanel';
import { CaptureControls } from '@/components/camera/CaptureControls';
import { Histogram } from '@/components/camera/Histogram';
import { StatusDisplay } from '@/components/camera/StatusDisplay';
import { Button } from '@/components/ui/button';
import { Settings2, Menu } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Index = () => {
  const [currentMode, setCurrentMode] = useState<'photo' | 'video'>('video');
  const [isRecording, setIsRecording] = useState(false);
  const [showControls, setShowControls] = useState(true);
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

  return (
    <div className="min-h-screen bg-cinema-background flex flex-col relative overflow-hidden">
      {/* Status bar */}
      <StatusDisplay />

      {/* Main camera view */}
      <div className="flex-1 relative">
        <div className="absolute inset-0">
          <CameraPreview isRecording={isRecording} currentMode={currentMode} />
        </div>

        {/* Top controls overlay */}
        <div className="absolute top-4 left-4 right-4 flex justify-between items-start z-10">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowControls(!showControls)}
            className="bg-black/30 backdrop-blur-sm"
          >
            <Menu className="w-4 h-4" />
          </Button>

          <div className="flex space-x-2">
            <Button
              variant="secondary"
              size="sm"
              className="bg-black/30 backdrop-blur-sm"
            >
              <Settings2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Side panel - histogram and monitoring */}
        <div className="absolute right-4 top-20 bottom-32 w-56 space-y-4 z-10">
          <Histogram />
          
          {/* Exposure meter */}
          <div className="bg-cinema-surface-elevated p-3 rounded-lg">
            <h4 className="text-cinema-text-secondary text-xs font-medium mb-2">Exposition</h4>
            <div className="flex items-center space-x-2">
              <span className="text-xs text-cinema-text-muted">-2</span>
              <div className="flex-1 h-2 bg-black/20 rounded-full relative">
                <div className="absolute left-1/2 top-0 w-0.5 h-full bg-white"></div>
                <div className="absolute left-1/3 top-0 w-1 h-full bg-cinema-primary rounded-full"></div>
              </div>
              <span className="text-xs text-cinema-text-muted">+2</span>
            </div>
          </div>

          {/* Audio levels */}
          <div className="bg-cinema-surface-elevated p-3 rounded-lg">
            <h4 className="text-cinema-text-secondary text-xs font-medium mb-2">Niveaux Audio</h4>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <span className="text-xs text-cinema-text-muted w-4">L</span>
                <div className="flex-1 h-1.5 bg-black/20 rounded-full overflow-hidden">
                  <div className="w-3/4 h-full bg-green-500 rounded-full"></div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-cinema-text-muted w-4">R</span>
                <div className="flex-1 h-1.5 bg-black/20 rounded-full overflow-hidden">
                  <div className="w-2/3 h-full bg-green-500 rounded-full"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Control panel - collapsible */}
      {showControls && (
        <div className="absolute left-4 top-20 bottom-32 w-80 animate-slide-up z-10">
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