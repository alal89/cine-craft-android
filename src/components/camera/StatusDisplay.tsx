import { Battery, Wifi, Signal } from 'lucide-react';

export const StatusDisplay = () => {
  const currentTime = new Date().toLocaleTimeString('fr-FR', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });

  return (
    <div className="flex items-center justify-between w-full p-4 bg-gradient-to-b from-black/50 to-transparent text-white">
      {/* Left side - Camera info */}
      <div className="flex flex-col space-y-1">
        <div className="flex items-center space-x-3">
          <span className="text-xs bg-cinema-primary px-2 py-1 rounded">4K</span>
          <span className="text-xs bg-cinema-secondary px-2 py-1 rounded">60fps</span>
          <span className="text-xs bg-green-500 px-2 py-1 rounded">RAW</span>
        </div>
        <div className="text-xs text-white/70">
          ISO 200 • 1/60 • f/2.8 • 5600K
        </div>
      </div>

      {/* Center - Storage info */}
      <div className="text-center">
        <div className="text-sm font-mono">{currentTime}</div>
        <div className="text-xs text-white/70">2.1TB libre</div>
      </div>

      {/* Right side - System status */}
      <div className="flex items-center space-x-2">
        <Signal className="w-4 h-4" />
        <Wifi className="w-4 h-4" />
        <div className="flex items-center space-x-1">
          <Battery className="w-4 h-4" />
          <span className="text-xs">87%</span>
        </div>
      </div>
    </div>
  );
};