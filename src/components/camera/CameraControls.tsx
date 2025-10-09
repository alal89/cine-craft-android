import React, { memo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Settings2, Menu, X } from 'lucide-react';
import { useCameraContext } from '@/contexts/CameraContext';
import { cameraLogger } from '@/utils/logger';

export const CameraControls = memo(() => {
  const { state, toggleControls, setGrid, camera } = useCameraContext();
  const { showControls, showGrid } = state;

  const handleFlashToggle = useCallback(async () => {
    try {
      await camera.toggleFlash();
      cameraLogger.success(camera.flashEnabled ? "Flash activé" : "Flash désactivé");
    } catch (error: any) {
      cameraLogger.error('Flash error handled:', error);
    }
  }, [camera]);

  const handleGridToggle = useCallback(() => {
    setGrid(!showGrid);
    cameraLogger.debug('Grid toggled:', !showGrid);
  }, [setGrid, showGrid]);

  const handleSettingsToggle = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    cameraLogger.settings('Settings button clicked');
    toggleControls();
  }, [toggleControls]);

  const handleMenuToggle = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    cameraLogger.settings('Menu button clicked');
    toggleControls();
  }, [toggleControls]);

  return (
    <div className="absolute top-4 left-4 right-4 flex justify-between items-start z-50">
      {/* Menu Button */}
      <Button
        variant="secondary"
        size="sm"
        onClick={handleMenuToggle}
        onTouchStart={(e) => e.stopPropagation()}
        onTouchEnd={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        className="bg-black/30 backdrop-blur-sm"
      >
        {showControls ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
      </Button>

      {/* Right Controls */}
      <div className="flex space-x-2">
        {/* Flash toggle */}
        <Button
          variant="secondary" 
          size="sm"
          onClick={handleFlashToggle}
          className={`bg-black/30 backdrop-blur-sm ${camera.flashEnabled ? 'bg-yellow-500/30' : ''}`}
          title="Flash"
        >
          ⚡
        </Button>
        
        {/* Grid toggle */}
        <Button
          variant="secondary"
          size="sm"
          onClick={handleGridToggle}
          className={`bg-black/30 backdrop-blur-sm ${showGrid ? 'bg-cinema-primary/30' : ''}`}
          title="Grille de niveau"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
            <line x1="9" y1="3" x2="9" y2="21"/>
            <line x1="15" y1="3" x2="15" y2="21"/>
            <line x1="3" y1="9" x2="21" y2="9"/>
            <line x1="3" y1="15" x2="21" y2="15"/>
          </svg>
        </Button>

        {/* Settings toggle */}
        <Button
          variant="secondary"
          size="sm"
          onClick={handleSettingsToggle}
          onTouchStart={(e) => e.stopPropagation()}
          onTouchEnd={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          title={showControls ? "Fermer les paramètres" : "Ouvrir les paramètres"}
          className={`bg-black/30 backdrop-blur-sm ${showControls ? 'bg-cinema-primary/30' : ''}`}
        >
          <Settings2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
});

CameraControls.displayName = 'CameraControls';