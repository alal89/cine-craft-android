import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Camera, 
  Video, 
  Square, 
  RotateCcw,
  FlashlightIcon,
  Timer
} from 'lucide-react';

interface CaptureControlsProps {
  currentMode: 'photo' | 'video';
  isRecording: boolean;
  onCapture: () => void;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onSwitchCamera: () => void;
}

export const CaptureControls = ({
  currentMode,
  isRecording,
  onCapture,
  onStartRecording,
  onStopRecording,
  onSwitchCamera
}: CaptureControlsProps) => {
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [timerEnabled, setTimerEnabled] = useState(false);

  const handleMainAction = () => {
    if (currentMode === 'photo') {
      onCapture();
    } else {
      if (isRecording) {
        onStopRecording();
      } else {
        onStartRecording();
      }
    }
  };

  return (
    <div className="flex items-center justify-between w-full p-6 bg-cinema-surface">
      {/* Left controls */}
      <div className="flex space-x-4">
        <Button
          variant={flashEnabled ? 'default' : 'secondary'}
          size="lg"
          onClick={() => setFlashEnabled(!flashEnabled)}
          className="p-3"
        >
          <FlashlightIcon className="w-6 h-6" />
        </Button>
        
        <Button
          variant={timerEnabled ? 'default' : 'secondary'}
          size="lg"
          onClick={() => setTimerEnabled(!timerEnabled)}
          className="p-3"
        >
          <Timer className="w-6 h-6" />
        </Button>
      </div>

      {/* Main capture button */}
      <div className="relative">
        <Button
          size="lg"
          onClick={handleMainAction}
          className={`
            w-20 h-20 rounded-full border-4 border-white/30 
            ${isRecording 
              ? 'bg-accent hover:bg-accent/90 animate-pulse-glow' 
              : 'bg-gradient-cinema hover:opacity-90'
            }
            transition-all duration-300
          `}
        >
          {currentMode === 'photo' ? (
            <Camera className="w-8 h-8" />
          ) : isRecording ? (
            <Square className="w-6 h-6" />
          ) : (
            <Video className="w-8 h-8" />
          )}
        </Button>
        
        {/* Recording timer */}
        {isRecording && (
          <div className="absolute -top-8 left-1/2 transform -translate-x-1/2">
            <div className="bg-black/80 px-3 py-1 rounded-full">
              <span className="text-white text-sm font-mono">00:42</span>
            </div>
          </div>
        )}
      </div>

      {/* Right controls */}
      <div className="flex space-x-4">
        <Button
          variant="secondary"
          size="lg"
          onClick={onSwitchCamera}
          className="p-3"
        >
          <RotateCcw className="w-6 h-6" />
        </Button>
        
        {/* Gallery thumbnail placeholder */}
        <div className="w-12 h-12 bg-cinema-surface-elevated rounded-lg border-2 border-cinema-text-muted flex items-center justify-center">
          <div className="w-6 h-6 bg-gradient-cinema rounded-sm"></div>
        </div>
      </div>
    </div>
  );
};