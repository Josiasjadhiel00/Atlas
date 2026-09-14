import React, { useEffect, useRef, useState } from 'react';

interface TerrainRadar3DProps {
  width?: number;
  height?: number;
}

export const TerrainRadar3D: React.FC<TerrainRadar3DProps> = ({
  width = 240,
  height = 110
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [selectedZone, setSelectedZone] = useState<'A1' | 'B2'>('A1');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let time = 0;

    const cols = 14;
    const rows = 10;

    const render = () => {
      const dpr = window.devicePixelRatio || 1;
      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
      }

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, width, height);

      time += 0.025;

      const originX = width / 2;
      const originY = 20;

      // Isometric projection points
      const grid: { x: number; y: number }[][] = [];

      for (let r = 0; r < rows; r++) {
        grid[r] = [];
        for (let c = 0; c < cols; c++) {
          // Normalized coords -1 to 1
          const nx = (c - cols / 2) / (cols / 2);
          const ny = (r - rows / 2) / (rows / 2);

          // Elevation formula: Hill in center with wave motion
          const dist = Math.sqrt(nx * nx + ny * ny);
          let z = Math.sin(dist * 3.5 - time) * 12 * Math.exp(-dist * 1.5);
          if (selectedZone === 'A1') {
            z += Math.sin(nx * 4 + time * 1.2) * 4;
          } else {
            z += Math.cos(ny * 4 + time * 1.2) * 4;
          }

          // 3D to 2D projection
          const isoX = originX + (c - cols / 2) * 13 - (r - rows / 2) * 7;
          const isoY = originY + r * 7 + (c - cols / 2) * 2 - z;

          grid[r][c] = { x: isoX, y: isoY };
        }
      }

      // Draw Grid Lines (Green/Cyan wireframe)
      ctx.lineWidth = 1;

      // Row lines
      for (let r = 0; r < rows; r++) {
        ctx.beginPath();
        const alpha = 0.3 + (r / rows) * 0.5;
        ctx.strokeStyle = `rgba(0, 242, 255, ${alpha})`;
        for (let c = 0; c < cols; c++) {
          const pt = grid[r][c];
          if (c === 0) ctx.moveTo(pt.x, pt.y);
          else ctx.lineTo(pt.x, pt.y);
        }
        ctx.stroke();
      }

      // Column lines
      for (let c = 0; c < cols; c++) {
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(0, 242, 255, 0.45)';
        for (let r = 0; r < rows; r++) {
          const pt = grid[r][c];
          if (r === 0) ctx.moveTo(pt.x, pt.y);
          else ctx.lineTo(pt.x, pt.y);
        }
        ctx.stroke();
      }

      // Peak highlight point
      const midPt = grid[Math.floor(rows / 2)][Math.floor(cols / 2)];
      if (midPt) {
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#00f2ff';
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(midPt.x, midPt.y, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [width, height, selectedZone]);

  return (
    <div className="relative border border-[#00f2ff33] bg-black/60 p-2 rounded-sm space-y-1 select-none">
      <div className="flex items-center justify-between text-[10px] font-mono border-b border-[#00f2ff22] pb-1">
        <div className="flex items-center gap-1 text-[#00f2ff] font-bold">
          <span className="w-1.5 h-1.5 bg-[#00f2ff] rounded-xs animate-pulse"></span>
          <span>GRID_SYSTEM // 3D MATRIX</span>
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => setSelectedZone('A1')}
            className={`px-1.5 py-0.5 text-[9px] font-mono rounded-xs border cursor-pointer ${
              selectedZone === 'A1'
                ? 'bg-[#00f2ff] text-black border-[#00f2ff] font-bold'
                : 'bg-black/60 text-gray-400 border-gray-700 hover:text-white'
            }`}
          >
            SELECT A1
          </button>
          <button
            onClick={() => setSelectedZone('B2')}
            className={`px-1.5 py-0.5 text-[9px] font-mono rounded-xs border cursor-pointer ${
              selectedZone === 'B2'
                ? 'bg-[#00f2ff] text-black border-[#00f2ff] font-bold'
                : 'bg-black/60 text-gray-400 border-gray-700 hover:text-white'
            }`}
          >
            SELECT B2
          </button>
        </div>
      </div>

      <div className="flex items-center justify-center overflow-hidden">
        <canvas
          ref={canvasRef}
          style={{ width, height }}
          className="max-w-full h-auto"
        />
      </div>
    </div>
  );
};
