import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { ControlPanel } from './ControlPanel';
import { StorageSelector } from './StorageSelector';
import VideoSettings from './VideoSettings';
import { AudioSettings } from './AudioSettings';

interface MobileSettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  currentMode: 'photo' | 'video';
  onModeChange: (mode: 'photo' | 'video') => void;
  storage: any;
  camera: any;
  audio: any;
}

export const MobileSettingsPanel = ({
  isOpen,
  onClose,
  currentMode,
  onModeChange,
  storage,
  camera,
  audio
}: MobileSettingsPanelProps) => {
  console.log('🎛️ MobileSettingsPanel render - isOpen:', isOpen);
  
  if (!isOpen) {
    console.log('❌ Panel not open, returning null');
    return null;
  }

  console.log('✅ Panel is open, rendering...');

  const handleBackdropClick = (e: React.MouseEvent) => {
    console.log('🖱️ Backdrop clicked');
    e.preventDefault();
    e.stopPropagation();
    // Only close if clicking directly on backdrop, not children
    if (e.target === e.currentTarget) {
      console.log('🚪 Closing from backdrop');
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[9999] bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 lg:hidden"
      onClick={handleBackdropClick}
      onTouchStart={(e) => {
        console.log('👆 Touch start on panel');
        e.stopPropagation();
      }}
    >
      {/* Close button */}
      <div className="sticky top-0 z-10 flex items-center justify-between p-4 bg-gray-900/95 backdrop-blur-sm border-b border-white/10">
        <h2 className="text-white text-lg font-semibold">Paramètres</h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onClose();
          }}
          className="text-white hover:bg-white/10"
        >
          <X className="w-5 h-5" />
        </Button>
      </div>
      
      <div className="overflow-y-auto h-[calc(100vh-72px)] p-4 space-y-4">
        <div className="space-y-4 pb-8">
          <ControlPanel 
            currentMode={currentMode}
            onModeChange={onModeChange}
          />
          
          {/* Storage Selector */}
          <div className="bg-cinema-surface-elevated border border-cinema-primary/20 p-4 rounded-lg">
            <StorageSelector
              locations={storage.locations}
              selectedLocation={storage.selectedLocation}
              onLocationChange={storage.setSelectedLocation}
            />
          </div>

          {/* Video Settings */}
          <VideoSettings
            videoCodec={camera.videoCodec}
            frameRate={camera.frameRate}
            onCodecChange={camera.updateVideoCodec}
            onFrameRateChange={camera.updateFrameRate}
          />

          {/* Audio Settings */}
          <AudioSettings
            microphoneEnabled={audio.microphoneEnabled}
            audioGain={audio.audioGain}
            onMicrophoneToggle={audio.setMicrophoneEnabled}
            onAudioGainChange={audio.setAudioGain}
            onAudioDeviceChange={audio.switchAudioDevice}
          />
        </div>
      </div>
    </div>
  );
};
