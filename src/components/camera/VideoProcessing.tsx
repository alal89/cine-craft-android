import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';

interface VideoProcessingProps {
  noiseReduction: boolean;
  onNoiseReductionChange: (enabled: boolean) => void;
  colorEnhancement: boolean;
  onColorEnhancementChange: (enabled: boolean) => void;
  professionalMode: boolean;
  onProfessionalModeChange: (enabled: boolean) => void;
  sharpness: number;
  onSharpnessChange: (value: number) => void;
  saturation: number;
  onSaturationChange: (value: number) => void;
  contrast: number;
  onContrastChange: (value: number) => void;
}

const VideoProcessing: React.FC<VideoProcessingProps> = ({
  noiseReduction,
  onNoiseReductionChange,
  colorEnhancement,
  onColorEnhancementChange,
  professionalMode,
  onProfessionalModeChange,
  sharpness,
  onSharpnessChange,
  saturation,
  onSaturationChange,
  contrast,
  onContrastChange
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Traitement Vidéo Professionnel</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <Label htmlFor="professional-mode">Mode Hasselblad</Label>
          <Switch
            id="professional-mode"
            checked={professionalMode}
            onCheckedChange={onProfessionalModeChange}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="noise-reduction">Réduction de Bruit</Label>
          <Switch
            id="noise-reduction"
            checked={noiseReduction}
            onCheckedChange={onNoiseReductionChange}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="color-enhancement">Amélioration Couleur</Label>
          <Switch
            id="color-enhancement"
            checked={colorEnhancement}
            onCheckedChange={onColorEnhancementChange}
          />
        </div>

        {professionalMode && (
          <>
            <div className="space-y-2">
              <Label>Netteté: {sharpness.toFixed(1)}</Label>
              <Slider
                value={[sharpness]}
                onValueChange={(value) => onSharpnessChange(value[0])}
                min={0.5}
                max={2.0}
                step={0.1}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label>Saturation: {saturation.toFixed(1)}</Label>
              <Slider
                value={[saturation]}
                onValueChange={(value) => onSaturationChange(value[0])}
                min={0.5}
                max={2.0}
                step={0.1}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label>Contraste: {contrast.toFixed(1)}</Label>
              <Slider
                value={[contrast]}
                onValueChange={(value) => onContrastChange(value[0])}
                min={0.5}
                max={2.0}
                step={0.1}
                className="w-full"
              />
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default VideoProcessing;