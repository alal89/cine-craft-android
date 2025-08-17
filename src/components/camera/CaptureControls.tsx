import { useState, useEffect } from 'react';
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
  const [recordingTime, setRecordingTime] = useState(0);

  // Timer effect for recording
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isRecording) {
      setRecordingTime(0);
      interval = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else {
      setRecordingTime(0);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isRecording]);

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

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
            w-20 h-20 rounded-full border-4 border-white/30 flex flex-col items-center justify-center
            ${isRecording 
              ? 'bg-red-600 hover:bg-red-700 animate-pulse-glow' 
              : 'bg-gradient-cinema hover:opacity-90'
            }
            transition-all duration-300
          `}
        >
          {currentMode === 'photo' ? (
            <Camera className="w-8 h-8" />
          ) : isRecording ? (
            <>
              <Square className="w-6 h-6 mb-1" />
              <span className="text-xs font-mono leading-none">
                {formatTime(recordingTime)}
              </span>
            </>
          ) : (
            <Video className="w-8 h-8" />
          )}
        </Button>
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