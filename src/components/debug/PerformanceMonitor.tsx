import React, { useState, useEffect, useRef } from 'react';
import { usePerformance } from '@/hooks/usePerformance';
import { cameraLogger } from '@/utils/logger';

interface PerformanceMonitorProps {
  enabled?: boolean;
}

export const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({ enabled = false }) => {
  const { fps, measureFPS } = usePerformance();
  const [renderCount, setRenderCount] = useState(0);
  const [memoryUsage, setMemoryUsage] = useState<any>(null);
  const renderCountRef = useRef(0);

  // Count renders
  useEffect(() => {
    renderCountRef.current += 1;
    setRenderCount(renderCountRef.current);
  });

  // Monitor memory usage
  useEffect(() => {
    if (!enabled) return;

    const checkMemory = () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        setMemoryUsage({
          used: Math.round(memory.usedJSHeapSize / 1024 / 1024), // MB
          total: Math.round(memory.totalJSHeapSize / 1024 / 1024), // MB
          limit: Math.round(memory.jsHeapSizeLimit / 1024 / 1024), // MB
          usage: Math.round((memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100), // %
        });
      }
    };

    const interval = setInterval(checkMemory, 1000);
    return () => clearInterval(interval);
  }, [enabled]);

  // Monitor FPS
  useEffect(() => {
    if (!enabled) return;

    const monitorFPS = () => {
      measureFPS();
      requestAnimationFrame(monitorFPS);
    };

    monitorFPS();
  }, [enabled, measureFPS]);

  if (!enabled) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-black/80 text-white p-3 rounded-lg text-xs font-mono z-50">
      <div className="space-y-1">
        <div>FPS: <span className={fps < 30 ? 'text-red-400' : fps < 50 ? 'text-yellow-400' : 'text-green-400'}>{fps}</span></div>
        <div>Renders: <span className="text-blue-400">{renderCount}</span></div>
        {memoryUsage && (
          <>
            <div>Memory: <span className="text-purple-400">{memoryUsage.used}MB</span></div>
            <div>Usage: <span className={memoryUsage.usage > 80 ? 'text-red-400' : 'text-green-400'}>{memoryUsage.usage}%</span></div>
          </>
        )}
      </div>
    </div>
  );
};