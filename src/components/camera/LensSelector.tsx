import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CameraDevice } from '@/hooks/useCamera';

interface LensSelectorProps {
  devices: CameraDevice[];
  currentDevice: CameraDevice | null;
  onLensChange: (type: 'main' | 'ultrawide' | 'telephoto') => void;
  disabled?: boolean;
}

export const LensSelector = ({ devices, currentDevice, onLensChange, disabled }: LensSelectorProps) => {
  const lensOrder: Array<'main' | 'ultrawide' | 'telephoto'> = ['ultrawide', 'main', 'telephoto'];
  
  const getLensIcon = (type: 'main' | 'ultrawide' | 'telephoto') => {
    switch (type) {
      case 'ultrawide':
        return '🔍'; // Ultra wide
      case 'main':
        return '📸'; // Main camera
      case 'telephoto':
        return '🔭'; // Telephoto
    }
  };

  const getLensLabel = (type: 'main' | 'ultrawide' | 'telephoto') => {
    switch (type) {
      case 'ultrawide':
        return '0.6x';
      case 'main':
        return '1x';
      case 'telephoto':
        return '2x';
    }
  };

  const getDisplayName = (type: 'main' | 'ultrawide' | 'telephoto') => {
    switch (type) {
      case 'ultrawide':
        return 'Ultra Grand-Angle';
      case 'main':
        return 'Principal';
      case 'telephoto':
        return 'Téléobjectif';
    }
  };

  return (
    <div className="space-y-4">
      {/* Quick lens switcher */}
      <div className="flex items-center justify-center space-x-2 bg-black/30 backdrop-blur-sm rounded-full p-2">
        {lensOrder.map(type => {
          const device = devices.find(d => d.type === type);
          if (!device) return null;
          
          const isActive = currentDevice?.type === type;
          
          return (
            <Button
              key={type}
              variant={isActive ? "default" : "secondary"}
              size="sm"
              onClick={() => onLensChange(type)}
              disabled={disabled}
              className={`
                min-w-16 h-10 rounded-full transition-all duration-200
                ${isActive 
                  ? 'bg-cinema-primary text-white shadow-lg scale-105' 
                  : 'bg-white/20 text-white hover:bg-white/30'
                }
              `}
            >
              <span className="text-lg mr-1">{getLensIcon(type)}</span>
              <span className="text-xs font-mono">{getLensLabel(type)}</span>
            </Button>
          );
        })}
      </div>

      {/* Current lens info */}
      {currentDevice && (
        <div className="bg-cinema-surface-elevated/90 backdrop-blur-sm p-3 rounded-lg border border-cinema-primary/20">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-cinema-text-primary text-sm font-medium">
              {getDisplayName((currentDevice.type || 'main') as 'main' | 'ultrawide' | 'telephoto')}
            </h4>
            <Badge variant="secondary" className="text-xs">
              {currentDevice.megapixels}MP
            </Badge>
          </div>
          
          <div className="grid grid-cols-2 gap-2 text-xs text-cinema-text-secondary">
            <div>
              <span className="text-cinema-text-muted">Ouverture:</span>
              <br />
              <span className="text-cinema-text-primary">{currentDevice.aperture}</span>
            </div>
            <div>
              <span className="text-cinema-text-muted">Capteur:</span>
              <br />
              <span className="text-cinema-text-primary">
                {currentDevice.features?.find(f => f.includes('Sony')) || 'Auto-détecté'}
              </span>
            </div>
          </div>
          
          {currentDevice.features && currentDevice.features.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {currentDevice.features
                .filter(f => !f.includes('Sony'))
                .map((feature, index) => (
                <Badge key={index} variant="outline" className="text-xs py-0 px-1">
                  {feature}
                </Badge>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};