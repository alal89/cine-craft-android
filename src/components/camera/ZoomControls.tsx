import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Plus, Minus, ZoomIn } from 'lucide-react';

interface ZoomControlsProps {
  onZoomChange: (zoom: number) => void;
  zoomMode?: 'native' | 'canvas';
  currentZoom?: number;
}

export const ZoomControls = ({ onZoomChange, zoomMode, currentZoom }: ZoomControlsProps) => {
  const [zoom, setZoom] = useState([currentZoom || 1]);

  const handleZoomChange = (newZoom: number[]) => {
    setZoom(newZoom);
    onZoomChange(newZoom[0]);
  };

  const zoomIn = () => {
    const newZoom = Math.min(zoom[0] + 0.5, 10);
    handleZoomChange([newZoom]);
  };

  const zoomOut = () => {
    const newZoom = Math.max(zoom[0] - 0.5, 1);
    handleZoomChange([newZoom]);
  };

  const resetZoom = () => {
    handleZoomChange([1]);
  };

  return (
    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-30">
      <div className="bg-black/60 backdrop-blur-sm rounded-full px-4 py-2 flex items-center space-x-3">
        {/* Zoom Out Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={zoomOut}
          disabled={zoom[0] <= 1}
          className="w-8 h-8 p-0 text-white hover:bg-white/20"
        >
          <Minus className="w-4 h-4" />
        </Button>

        {/* Zoom Slider */}
        <div className="flex items-center space-x-3 min-w-32">
          <ZoomIn className="w-4 h-4 text-white/70" />
          <Slider
            value={zoom}
            onValueChange={handleZoomChange}
            max={10}
            min={1}
            step={0.1}
            className="flex-1"
          />
        </div>

        {/* Zoom Level Display */}
        <button 
          onClick={resetZoom}
          className="text-white text-sm font-mono bg-cinema-primary/20 px-2 py-1 rounded min-w-12 hover:bg-cinema-primary/30 transition-colors flex items-center space-x-1"
        >
          <span>{zoom[0].toFixed(1)}x</span>
          {zoomMode && (
            <span className="text-xs opacity-70">
              {zoomMode === 'canvas' ? '🔍' : '📷'}
            </span>
          )}
        </button>

        {/* Zoom In Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={zoomIn}
          disabled={zoom[0] >= 10}
          className="w-8 h-8 p-0 text-white hover:bg-white/20"
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};