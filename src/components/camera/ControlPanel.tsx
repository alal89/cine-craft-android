import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Settings, 
  Sun, 
  Focus, 
  Volume2, 
  Film,
  Camera,
  Mic
} from 'lucide-react';

interface ControlPanelProps {
  currentMode: 'photo' | 'video';
  onModeChange: (mode: 'photo' | 'video') => void;
}

export const ControlPanel = ({ currentMode, onModeChange }: ControlPanelProps) => {
  const [iso, setIso] = useState([100]);
  const [isAutoIso, setIsAutoIso] = useState(true);
  const [shutter, setShutter] = useState([60]);
  const [focus, setFocus] = useState([50]);
  const [whiteBalance, setWhiteBalance] = useState([5600]);
  const [audioGain, setAudioGain] = useState([0]);

  return (
    <div className="bg-cinema-surface-elevated border border-cinema-primary/20 rounded-lg flex flex-col h-auto lg:h-full">
      <div className="p-4">
        <div className="space-y-6">
          {/* Mode Selector */}
          <div className="flex space-x-2">
        <Button
          variant={currentMode === 'photo' ? 'default' : 'secondary'}
          onClick={() => onModeChange('photo')}
          className="flex-1"
        >
          <Camera className="w-4 h-4 mr-2" />
          Photo
        </Button>
        <Button
          variant={currentMode === 'video' ? 'default' : 'secondary'}
          onClick={() => onModeChange('video')}
          className="flex-1"
        >
          <Film className="w-4 h-4 mr-2" />
          Vidéo
        </Button>
      </div>

      {/* Resolution Settings */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-cinema-text-primary text-sm font-medium">
            {currentMode === 'video' ? 'Résolution Vidéo' : 'Format Photo'}
          </label>
        </div>
        <Select defaultValue={currentMode === 'video' ? '4k' : 'raw'}>
          <SelectTrigger className="bg-cinema-surface-elevated border-cinema-text-muted">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {currentMode === 'video' ? (
              <>
                <SelectItem value="1080p">1080p (1920x1080)</SelectItem>
                <SelectItem value="4k">4K (3840x2160)</SelectItem>
                <SelectItem value="8k">8K (7680x4320)</SelectItem>
              </>
            ) : (
              <>
                <SelectItem value="jpeg">JPEG (Standard)</SelectItem>
                <SelectItem value="raw">RAW (Professionnel)</SelectItem>
                <SelectItem value="heif">HEIF (Haute qualité)</SelectItem>
              </>
            )}
          </SelectContent>
        </Select>
      </div>

      {/* Audio Settings */}
      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <Mic className="w-4 h-4 text-cinema-text-secondary" />
          <label className="text-cinema-text-primary text-sm font-medium">Audio</label>
        </div>
        <Select defaultValue="wav32">
          <SelectTrigger className="bg-cinema-surface-elevated border-cinema-text-muted">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="wav16">WAV PCM 16-bit</SelectItem>
            <SelectItem value="wav24">WAV PCM 24-bit</SelectItem>
            <SelectItem value="wav32">WAV PCM 32-bit Float</SelectItem>
            <SelectItem value="mp3">MP3 320kbps</SelectItem>
          </SelectContent>
        </Select>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-cinema-text-secondary">Gain Audio</span>
            <span className="text-sm text-cinema-text-primary">{audioGain[0]}dB</span>
          </div>
          <Slider
            value={audioGain}
            onValueChange={setAudioGain}
            max={30}
            min={-30}
            step={1}
            className="w-full"
          />
        </div>
      </div>

      {/* Manual Controls */}
      <div className="space-y-4">
        <h3 className="text-cinema-text-primary font-medium flex items-center">
          <Settings className="w-4 h-4 mr-2" />
          Contrôles Manuels
        </h3>
        
        {/* ISO */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-cinema-text-secondary">ISO</span>
            <div className="flex items-center space-x-2">
              <Button
                variant={isAutoIso ? 'default' : 'secondary'}
                size="sm"
                onClick={() => setIsAutoIso(!isAutoIso)}
                className="text-xs px-2 py-1 h-6"
              >
                {isAutoIso ? 'AUTO' : 'MAN'}
              </Button>
              <span className="text-sm text-cinema-text-primary">
                {isAutoIso ? 'AUTO' : iso[0]}
              </span>
            </div>
          </div>
          <Slider
            value={iso}
            onValueChange={setIso}
            max={12800}
            min={50}
            step={50}
            className={`w-full ${isAutoIso ? 'opacity-50 pointer-events-none' : ''}`}
            disabled={isAutoIso}
          />
        </div>

        {/* Shutter Speed */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-cinema-text-secondary">Vitesse</span>
            <span className="text-sm text-cinema-text-primary">1/{shutter[0]}</span>
          </div>
          <Slider
            value={shutter}
            onValueChange={setShutter}
            max={1000}
            min={1}
            step={1}
            className="w-full"
          />
        </div>

        {/* Focus */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Focus className="w-4 h-4 text-cinema-text-secondary" />
            <span className="text-sm text-cinema-text-secondary">Focus</span>
            <span className="text-sm text-cinema-text-primary">{focus[0]}%</span>
          </div>
          <Slider
            value={focus}
            onValueChange={setFocus}
            max={100}
            min={0}
            step={1}
            className="w-full"
          />
        </div>

        {/* White Balance */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Sun className="w-4 h-4 text-cinema-text-secondary" />
            <span className="text-sm text-cinema-text-secondary">Balance Blancs</span>
            <span className="text-sm text-cinema-text-primary">{whiteBalance[0]}K</span>
          </div>
          <Slider
            value={whiteBalance}
            onValueChange={setWhiteBalance}
            max={10000}
            min={2000}
            step={100}
            className="w-full"
          />
        </div>
      </div>
      </div>
      </div>
    </div>
  );
};