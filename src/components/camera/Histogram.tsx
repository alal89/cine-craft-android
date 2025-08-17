import { useEffect, useRef } from 'react';

export const Histogram = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Mock histogram data - in a real app, this would come from camera analysis
    const drawHistogram = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw RGB histograms
      const colors = ['#ff4444', '#44ff44', '#4444ff'];
      const data = [
        // Red channel
        Array.from({ length: 256 }, (_, i) => Math.random() * 50 + Math.sin(i / 20) * 20),
        // Green channel  
        Array.from({ length: 256 }, (_, i) => Math.random() * 60 + Math.cos(i / 25) * 25),
        // Blue channel
        Array.from({ length: 256 }, (_, i) => Math.random() * 40 + Math.sin(i / 30) * 15)
      ];

      colors.forEach((color, channelIndex) => {
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.7;
        ctx.beginPath();
        
        data[channelIndex].forEach((value, i) => {
          const x = (i / 256) * canvas.width;
          const y = canvas.height - (value / 100) * canvas.height;
          
          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        });
        
        ctx.stroke();
      });

      // Draw grid
      ctx.strokeStyle = '#ffffff20';
      ctx.lineWidth = 0.5;
      ctx.globalAlpha = 0.3;
      
      // Vertical lines
      for (let i = 0; i <= 4; i++) {
        const x = (i / 4) * canvas.width;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      
      // Horizontal lines
      for (let i = 0; i <= 2; i++) {
        const y = (i / 2) * canvas.height;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }
    };

    drawHistogram();
    const interval = setInterval(drawHistogram, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-cinema-surface-elevated p-3 rounded-lg">
      <h4 className="text-cinema-text-secondary text-xs font-medium mb-2">Histogramme RGB</h4>
      <canvas
        ref={canvasRef}
        width={200}
        height={80}
        className="w-full h-20 bg-black/20 rounded"
      />
    </div>
  );
};