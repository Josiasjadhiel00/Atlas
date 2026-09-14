import React, { useEffect, useRef } from 'react';

interface Holo3DDiscProps {
  size?: number;
}

export const Holo3DDisc: React.FC<Holo3DDiscProps> = ({ size = 160 }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let angle = 0;

    const render = () => {
      const dpr = window.devicePixelRatio || 1;
      const w = size;
      const h = size * 0.75;

      if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
        canvas.width = w * dpr;
        canvas.height = h * dpr;
      }

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, w, h);

      angle += 0.015;
      const cx = w / 2;
      const cy = h / 2 + 5;
      const rx = w / 2 - 12;
      const ry = (w / 2 - 12) * 0.45; // Isometric compression

      // Cylinder Height layers (from bottom to top)
      const layers = 5;
      const layerHeight = 3.5;

      for (let i = layers; i >= 0; i--) {
        const layerY = cy - i * layerHeight;
        const alpha = i === 0 ? 0.9 : 0.45 - i * 0.06;

        ctx.strokeStyle = `rgba(0, 242, 255, ${alpha})`;
        ctx.lineWidth = i === 0 ? 2 : 1;
        ctx.beginPath();
        ctx.ellipse(cx, layerY, rx * (1 - i * 0.03), ry * (1 - i * 0.03), 0, 0, Math.PI * 2);
        ctx.stroke();

        if (i === 0) {
          // Top cap fill
          const grad = ctx.createRadialGradient(cx, layerY, 5, cx, layerY, rx);
          grad.addColorStop(0, 'rgba(0, 242, 255, 0.35)');
          grad.addColorStop(0.7, 'rgba(0, 150, 255, 0.15)');
          grad.addColorStop(1, 'rgba(0, 30, 60, 0.6)');
          ctx.fillStyle = grad;
          ctx.fill();
        }
      }

      // Rotating Segmented Rings on Top Cap
      ctx.save();
      ctx.translate(cx, cy - layers * layerHeight);
      ctx.scale(1, 0.45); // Isometric squash
      ctx.rotate(angle);

      // Outer toothed gear
      ctx.strokeStyle = '#00f2ff';
      ctx.lineWidth = 2;
      const teeth = 16;
      for (let t = 0; t < teeth; t++) {
        const a1 = (t * Math.PI * 2) / teeth;
        const a2 = a1 + Math.PI / teeth;
        const r1 = rx * 0.85;
        const r2 = rx * 0.92;
        ctx.beginPath();
        ctx.arc(0, 0, r1, a1, a2);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(Math.cos(a1) * r1, Math.sin(a1) * r1);
        ctx.lineTo(Math.cos(a1) * r2, Math.sin(a1) * r2);
        ctx.stroke();
      }

      // Middle counter-rotating ring
      ctx.rotate(-angle * 2.2);
      ctx.strokeStyle = 'rgba(0, 242, 255, 0.7)';
      ctx.lineWidth = 1.5;
      for (let s = 0; s < 4; s++) {
        const sa = (s * Math.PI) / 2;
        ctx.beginPath();
        ctx.arc(0, 0, rx * 0.55, sa, sa + 0.9);
        ctx.stroke();
      }

      // Center glowing core
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, 0, 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();

      // Laser pillar lines connecting base to top
      const laserCount = 6;
      for (let l = 0; l < laserCount; l++) {
        const lAngle = angle * 0.5 + (l * Math.PI * 2) / laserCount;
        const lx = cx + Math.cos(lAngle) * rx * 0.9;
        const lyBase = cy + Math.sin(lAngle) * ry * 0.9;
        const lyTop = cy - layers * layerHeight + Math.sin(lAngle) * (ry * (1 - layers * 0.03)) * 0.9;

        ctx.strokeStyle = 'rgba(0, 242, 255, 0.4)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(lx, lyBase);
        ctx.lineTo(lx, lyTop);
        ctx.stroke();
      }

      ctx.restore();
      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [size]);

  return (
    <div className="relative flex flex-col items-center justify-center select-none">
      <canvas
        ref={canvasRef}
        style={{ width: size, height: size * 0.75 }}
        className="drop-shadow-[0_0_15px_rgba(0,242,255,0.3)]"
      />
    </div>
  );
};
