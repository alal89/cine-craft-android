import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface VideoSettingsProps {
  videoCodec: string;
  frameRate: number;
  onCodecChange: (codec: string) => void;
  onFrameRateChange: (fps: number) => void;
}

const VideoSettings: React.FC<VideoSettingsProps> = ({
  videoCodec,
  frameRate,
  onCodecChange,
  onFrameRateChange
}) => {
  const codecOptions = [
    { value: 'video/mp4;codecs=h264', label: 'H.264 (MP4)' },
    { value: 'video/mp4;codecs=h265', label: 'H.265 (MP4)' },
    { value: 'video/webm;codecs=vp9', label: 'VP9 (WebM)' },
    { value: 'video/webm;codecs=vp8', label: 'VP8 (WebM)' },
    { value: 'video/raw', label: 'Non compressé' }
  ];

  const frameRateOptions = [
    { value: 24, label: '24 i/s' },
    { value: 30, label: '30 i/s' },
    { value: 60, label: '60 i/s' },
    { value: 90, label: '90 i/s' },
    { value: 120, label: '120 i/s' }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Paramètres Vidéo</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="codec-select">Codec Vidéo</Label>
          <Select
            value={videoCodec}
            onValueChange={onCodecChange}
          >
            <SelectTrigger id="codec-select">
              <SelectValue placeholder="Sélectionner un codec" />
            </SelectTrigger>
            <SelectContent>
              {codecOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="framerate-select">Images par Seconde</Label>
          <Select
            value={frameRate.toString()}
            onValueChange={(value) => onFrameRateChange(parseInt(value, 10))}
          >
            <SelectTrigger id="framerate-select">
              <SelectValue placeholder="Sélectionner FPS" />
            </SelectTrigger>
            <SelectContent>
              {frameRateOptions.map(option => (
                <SelectItem key={option.value} value={option.value.toString()}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
};

export default VideoSettings;