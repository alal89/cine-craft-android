import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Mic, MicOff, Usb, Bluetooth, Speaker } from 'lucide-react';
import { useAudio } from '@/hooks/useAudio';

interface AudioSettingsProps {
  microphoneEnabled: boolean;
  audioGain: number;
  onMicrophoneToggle: (enabled: boolean) => void;
  onAudioGainChange: (gain: number) => void;
  onAudioDeviceChange: (deviceId: string) => void;
}

export const AudioSettings = ({
  microphoneEnabled,
  audioGain,
  onMicrophoneToggle,
  onAudioGainChange,
  onAudioDeviceChange
}: AudioSettingsProps) => {
  const audio = useAudio();

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'usb':
        return <Usb className="w-4 h-4" />;
      case 'bluetooth':
        return <Bluetooth className="w-4 h-4" />;
      case 'external':
        return <Mic className="w-4 h-4" />;
      default:
        return <Speaker className="w-4 h-4" />;
    }
  };

  const getDeviceTypeLabel = (type: string) => {
    switch (type) {
      case 'usb':
        return 'USB-C';
      case 'bluetooth':
        return 'Bluetooth';
      case 'external':
        return 'Externe';
      default:
        return 'Intégré';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {microphoneEnabled ? (
            <Mic className="w-5 h-5 text-green-500" />
          ) : (
            <MicOff className="w-5 h-5 text-red-500" />
          )}
          Paramètres Audio
        </CardTitle>
        <CardDescription>
          Configuration du microphone et des périphériques audio
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Microphone On/Off */}
        <div className="flex items-center justify-between">
          <Label htmlFor="microphone-toggle">Microphone</Label>
          <Switch
            id="microphone-toggle"
            checked={microphoneEnabled}
            onCheckedChange={onMicrophoneToggle}
          />
        </div>

        {/* Audio Device Selection */}
        <div className="space-y-2">
          <Label>Périphérique audio</Label>
          <Select
            value={audio.selectedAudioDevice?.deviceId || ''}
            onValueChange={(deviceId) => {
              audio.switchAudioDevice(deviceId);
              onAudioDeviceChange(deviceId);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner un microphone" />
            </SelectTrigger>
            <SelectContent>
              {audio.audioDevices.map((device) => (
                <SelectItem key={device.deviceId} value={device.deviceId}>
                  <div className="flex items-center gap-2">
                    {getDeviceIcon(device.type)}
                    <span className="flex-1">{device.label}</span>
                    <Badge variant="secondary" className="text-xs">
                      {getDeviceTypeLabel(device.type)}
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {/* USB-C Detection Status */}
          {audio.audioDevices.some(d => d.type === 'usb') && (
            <div className="flex items-center gap-2 text-sm text-green-600">
              <Usb className="w-4 h-4" />
              <span>Micro USB-C détecté</span>
            </div>
          )}
        </div>

        {/* Audio Gain */}
        {microphoneEnabled && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Gain audio</Label>
              <span className="text-sm text-muted-foreground">
                {Math.round(audioGain * 100)}%
              </span>
            </div>
            <Slider
              value={[audioGain]}
              onValueChange={(values) => onAudioGainChange(values[0])}
              min={0.1}
              max={2.0}
              step={0.1}
              className="w-full"
            />
          </div>
        )}

        {/* Audio Quality Info */}
        {audio.selectedAudioDevice && (
          <div className="p-3 bg-muted rounded-lg space-y-1">
            <div className="text-sm font-medium">Qualité audio</div>
            <div className="text-xs text-muted-foreground">
              Fréquence: {audio.selectedAudioDevice.sampleRate || 48000} Hz
            </div>
            <div className="text-xs text-muted-foreground">
              Canaux: {audio.selectedAudioDevice.channels || 2}
            </div>
            {audio.selectedAudioDevice.type === 'usb' && (
              <div className="text-xs text-green-600">
                ✓ Qualité studio activée
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};