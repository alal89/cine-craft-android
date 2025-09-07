import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StorageLocation } from '@/hooks/useStorage';
import { FolderOpen, HardDrive, Cloud, Settings } from 'lucide-react';

interface StorageSelectorProps {
  locations: StorageLocation[];
  selectedLocation: StorageLocation;
  onLocationChange: (location: StorageLocation) => void;
}

export const StorageSelector = ({ locations, selectedLocation, onLocationChange }: StorageSelectorProps) => {
  const [expanded, setExpanded] = useState(false);

  const getLocationIcon = (type: 'internal' | 'external' | 'cloud') => {
    switch (type) {
      case 'internal':
        return <HardDrive className="w-4 h-4" />;
      case 'external':
        return <FolderOpen className="w-4 h-4" />;
      case 'cloud':
        return <Cloud className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-cinema-text-primary text-sm font-medium flex items-center">
          <FolderOpen className="w-4 h-4 mr-2" />
          Emplacement de sauvegarde
        </label>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setExpanded(!expanded)}
          className="h-6 px-2"
        >
          <Settings className="w-3 h-3" />
        </Button>
      </div>

      {/* Quick selector */}
      <Select
        value={selectedLocation.id}
        onValueChange={(value) => {
          const location = locations.find(l => l.id === value);
          if (location) onLocationChange(location);
        }}
      >
        <SelectTrigger className="bg-cinema-surface-elevated border-cinema-text-muted">
          <div className="flex items-center space-x-2">
            {getLocationIcon(selectedLocation.type)}
            <SelectValue />
          </div>
        </SelectTrigger>
        <SelectContent>
          {locations.map(location => (
            <SelectItem key={location.id} value={location.id}>
              <div className="flex items-center space-x-2">
                {getLocationIcon(location.type)}
                <span>{location.name}</span>
                {!location.available && (
                  <span className="text-red-400 text-xs">(Indisponible)</span>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Expanded info */}
      {expanded && (
        <div className="bg-cinema-surface-elevated/90 backdrop-blur-sm p-3 rounded-lg border border-cinema-primary/20 space-y-3">
          <div className="text-xs text-cinema-text-secondary">
            <div className="mb-2">
              <span className="text-cinema-text-muted">Chemin:</span>
              <br />
              <span className="font-mono text-cinema-text-primary break-all">
                {selectedLocation.path}
              </span>
            </div>
            
            {selectedLocation.freeSpace && (
              <div>
                <span className="text-cinema-text-muted">Espace libre:</span>
                <br />
                <span className="text-cinema-text-primary">
                  {selectedLocation.freeSpace}
                </span>
              </div>
            )}
          </div>

          {/* Storage format options */}
          <div className="space-y-2">
            <span className="text-cinema-text-secondary text-xs font-medium">Format de sauvegarde:</span>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-cinema-surface p-2 rounded text-xs">
                <div className="text-cinema-text-primary font-medium">Photos</div>
                <div className="text-cinema-text-muted">JPEG Haute qualité</div>
              </div>
              <div className="bg-cinema-surface p-2 rounded text-xs">
                <div className="text-cinema-text-primary font-medium">Vidéos</div>
                <div className="text-cinema-text-muted">WebM/MP4</div>
              </div>
            </div>
          </div>

          {/* Naming convention */}
          <div className="text-xs text-cinema-text-secondary">
            <span className="text-cinema-text-muted">Convention de nommage:</span>
            <br />
            <span className="font-mono text-cinema-text-primary">
              IMG_2024-01-15_14-30-25.jpg
            </span>
          </div>
        </div>
      )}
    </div>
  );
};