import React, { useEffect, useRef } from 'react';
import { AssistantState, AssistantTheme } from '../types';

interface TacticalHudCanvasProps {
  state: AssistantState;
  voiceVolume?: number; // 0.0 to 1.0
  theme?: AssistantTheme;
  size?: number;
}

export const TacticalHudCanvas: React.FC<TacticalHudCanvasProps> = ({
  state,
  voiceVolume = 0,
  theme = 'cyan',
  size = 520
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let angleOuter = 0;
    let angleInner = 0;
    let angleGeared = 0;
    let pulsePhase = 0;
    let scanLineY = 0;

    const render = () => {
      const dpr = window.devicePixelRatio || 1;
      const w = size;
      const h = size;

      if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
        canvas.width = w * dpr;
        canvas.height = h * dpr;
      }

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, w, h);

      const cx = w / 2;
      const cy = h / 2;
      const maxR = w / 2 - 20;

      // Dynamic speed
      let rotSpeed = 0.008;
      if (state === 'listening') rotSpeed = 0.025;
      else if (state === 'thinking') rotSpeed = 0.045;
      else if (state === 'speaking') rotSpeed = 0.018 + voiceVolume * 0.03;
      else if (state === 'executing') rotSpeed = 0.03;

      angleOuter += rotSpeed;
      angleInner -= rotSpeed * 1.4;
      angleGeared += rotSpeed * 0.6;
      pulsePhase += 0.05;
      scanLineY = (scanLineY + 1.2) % h;

      const cyan = '#00f2ff';
      const cyanGlow = 'rgba(0, 242, 255, ';
      const activePulse = Math.sin(pulsePhase) * 0.15 + (state === 'speaking' ? voiceVolume * 0.4 : 0.05);

      // 1. Subtle Background Coordinate Grid Lines
      ctx.strokeStyle = `${cyanGlow}0.08)`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = 20; x < w; x += 40) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
      }
      for (let y = 20; y < h; y += 40) {
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
      }
      ctx.stroke();

      // 2. Large Outer Tactical Circles & Azimuth Degree Notches
      // Ring 1 (Degree Arc with numbers 30, 60, 70, 90)
      ctx.strokeStyle = `${cyanGlow}0.35)`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, maxR * 0.95, 0, Math.PI * 2);
      ctx.stroke();

      // Dashed Outer Ring
      ctx.save();
      ctx.setLineDash([4, 8]);
      ctx.strokeStyle = `${cyanGlow}0.45)`;
      ctx.beginPath();
      ctx.arc(cx, cy, maxR * 0.88, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // Degree Notches on outer ring
      ctx.font = '9px monospace';
      ctx.fillStyle = `${cyanGlow}0.7)`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const degreeMarks = [
        { deg: 30, label: '30' },
        { deg: 60, label: '60' },
        { deg: 70, label: '70' },
        { deg: 120, label: '120' },
        { deg: 150, label: '150' },
        { deg: 210, label: '210' },
        { deg: 240, label: '240' },
        { deg: 300, label: '300' },
        { deg: 330, label: '330' }
      ];

      for (let i = 0; i < 72; i++) {
        const rad = (i * 5 * Math.PI) / 180;
        const isMajor = i % 6 === 0;
        const isMedium = i % 3 === 0;
        const len = isMajor ? 9 : isMedium ? 6 : 3;
        const r1 = maxR * 0.95;
        const r2 = r1 - len;

        ctx.strokeStyle = isMajor ? cyan : `${cyanGlow}0.4)`;
        ctx.lineWidth = isMajor ? 1.5 : 1;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(rad) * r1, cy + Math.sin(rad) * r1);
        ctx.lineTo(cx + Math.cos(rad) * r2, cy + Math.sin(rad) * r2);
        ctx.stroke();
      }

      // Draw Degree Numbers
      degreeMarks.forEach(dm => {
        const rad = (dm.deg * Math.PI) / 180;
        const tx = cx + Math.cos(rad) * (maxR * 0.82);
        const ty = cy + Math.sin(rad) * (maxR * 0.82);
        ctx.fillText(dm.label, tx, ty);
      });

      // 3. Horizontal and Vertical Axis Crosshair Lines with Tick Ticks
      ctx.strokeStyle = `${cyanGlow}0.5)`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      // Horizontal
      ctx.moveTo(cx - maxR * 0.98, cy);
      ctx.lineTo(cx + maxR * 0.98, cy);
      // Vertical
      ctx.moveTo(cx, cy - maxR * 0.98);
      ctx.lineTo(cx, cy + maxR * 0.98);
      ctx.stroke();

      // Axis Ticks
      for (let step = 30; step < maxR * 0.95; step += 25) {
        ctx.beginPath();
        // X axis ticks
        ctx.moveTo(cx + step, cy - 3);
        ctx.lineTo(cx + step, cy + 3);
        ctx.moveTo(cx - step, cy - 3);
        ctx.lineTo(cx - step, cy + 3);
        // Y axis ticks
        ctx.moveTo(cx - 3, cy + step);
        ctx.lineTo(cx + 3, cy + step);
        ctx.moveTo(cx - 3, cy - step);
        ctx.lineTo(cx + 3, cy - step);
        ctx.stroke();
      }

      // 4. Rotating Outer HUD Segments Ring (Geared & Segmented)
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(angleOuter);

      const segments = 8;
      ctx.strokeStyle = cyan;
      ctx.lineWidth = 2.5;
      ctx.shadowColor = cyan;
      ctx.shadowBlur = 8;

      for (let s = 0; s < segments; s++) {
        const start = (s * Math.PI * 2) / segments;
        const end = start + (Math.PI * 2) / (segments * 1.8);
        ctx.beginPath();
        ctx.arc(0, 0, maxR * 0.68, start, end);
        ctx.stroke();

        // End notch blocks
        const bx = Math.cos(start) * (maxR * 0.68);
        const by = Math.sin(start) * (maxR * 0.68);
        ctx.fillStyle = cyan;
        ctx.fillRect(bx - 2, by - 2, 4, 4);
      }
      ctx.restore();

      // 5. Counter-rotating Middle Tactical Ring with Chamfer Brackets
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(angleInner);

      ctx.strokeStyle = `${cyanGlow}0.85)`;
      ctx.lineWidth = 2;
      ctx.shadowBlur = 6;
      ctx.shadowColor = cyan;

      const midR = maxR * 0.48;
      // 4 Wing Brackets
      for (let b = 0; b < 4; b++) {
        const bAngle = (b * Math.PI) / 2;
        const start = bAngle - 0.28;
        const end = bAngle + 0.28;
        ctx.beginPath();
        ctx.arc(0, 0, midR, start, end);
        ctx.stroke();

        // Outer wing bracket tabs
        const wx1 = Math.cos(start) * (midR + 7);
        const wy1 = Math.sin(start) * (midR + 7);
        const wx2 = Math.cos(start) * midR;
        const wy2 = Math.sin(start) * midR;
        ctx.beginPath();
        ctx.moveTo(wx1, wy1);
        ctx.lineTo(wx2, wy2);
        ctx.stroke();
      }

      // Small circular chevrons on inner perimeter
      for (let c = 0; c < 12; c++) {
        const cAngle = (c * Math.PI) / 6;
        const cxDot = Math.cos(cAngle) * (midR * 0.88);
        const cyDot = Math.sin(cAngle) * (midR * 0.88);
        ctx.fillStyle = c % 3 === 0 ? cyan : `${cyanGlow}0.4)`;
        ctx.beginPath();
        ctx.arc(cxDot, cyDot, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // 6. Central High-Tech Reticle & Core Target Locking Lens
      const coreR = maxR * 0.28 * (1 + activePulse * 0.5);

      // Radial Core Glow
      const coreGlow = ctx.createRadialGradient(cx, cy, 2, cx, cy, coreR * 1.5);
      coreGlow.addColorStop(0, 'rgba(0, 242, 255, 0.45)');
      coreGlow.addColorStop(0.4, 'rgba(0, 242, 255, 0.15)');
      coreGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = coreGlow;
      ctx.beginPath();
      ctx.arc(cx, cy, coreR * 1.5, 0, Math.PI * 2);
      ctx.fill();

      // Inner Concentric Reticle Rings
      ctx.strokeStyle = cyan;
      ctx.lineWidth = 1.5;
      ctx.shadowBlur = 10;
      ctx.shadowColor = cyan;

      // Circle 1
      ctx.beginPath();
      ctx.arc(cx, cy, coreR, 0, Math.PI * 2);
      ctx.stroke();

      // Circle 2 (Inner target)
      ctx.beginPath();
      ctx.arc(cx, cy, coreR * 0.6, 0, Math.PI * 2);
      ctx.stroke();

      // Center glowing cyan dot
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(cx, cy, 3.5, 0, Math.PI * 2);
      ctx.fill();

      // 4 Lock Brackets around center
      const bDist = coreR * 1.18;
      const bLen = 10;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;

      // Top Left
      ctx.beginPath();
      ctx.moveTo(cx - bDist + bLen, cy - bDist);
      ctx.lineTo(cx - bDist, cy - bDist);
      ctx.lineTo(cx - bDist, cy - bDist + bLen);
      ctx.stroke();

      // Top Right
      ctx.beginPath();
      ctx.moveTo(cx + bDist - bLen, cy - bDist);
      ctx.lineTo(cx + bDist, cy - bDist);
      ctx.lineTo(cx + bDist, cy - bDist + bLen);
      ctx.stroke();

      // Bottom Left
      ctx.beginPath();
      ctx.moveTo(cx - bDist + bLen, cy + bDist);
      ctx.lineTo(cx - bDist, cy + bDist);
      ctx.lineTo(cx - bDist, cy + bDist - bLen);
      ctx.stroke();

      // Bottom Right
      ctx.beginPath();
      ctx.moveTo(cx + bDist - bLen, cy + bDist);
      ctx.lineTo(cx + bDist, cy + bDist);
      ctx.lineTo(cx + bDist, cy + bDist - bLen);
      ctx.stroke();

      // Sub-scanline bar
      ctx.strokeStyle = `${cyanGlow}0.15)`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, scanLineY);
      ctx.lineTo(w, scanLineY);
      ctx.stroke();

      ctx.restore();
      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [state, voiceVolume, theme, size]);

  return (
    <div className="relative flex items-center justify-center pointer-events-none select-none">
      <canvas
        ref={canvasRef}
        style={{ width: size, height: size }}
        className="max-w-full h-auto drop-shadow-[0_0_20px_rgba(0,242,255,0.25)]"
      />
    </div>
  );
};
