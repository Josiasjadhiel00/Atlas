import React, { useEffect, useRef } from 'react';
import { AssistantState, AssistantTheme } from '../types';

interface ArcReactorCanvasProps {
  state: AssistantState;
  theme: AssistantTheme;
  voiceLevel?: number;
  voiceVolume?: number; // 0.0 to 1.0
  size?: number;
}

export const ArcReactorCanvas: React.FC<ArcReactorCanvasProps> = ({
  state,
  theme,
  voiceLevel,
  voiceVolume = 0,
  size = 260
}) => {
  const actualVoiceLevel = voiceLevel !== undefined ? voiceLevel : voiceVolume;
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let angleOuter = 0;
    let angleInner = 0;
    let pulsePhase = 0;
    let currentVoiceLevel = actualVoiceLevel;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    const render = () => {
      ctx.clearRect(0, 0, size, size);

      const cx = size / 2;
      const cy = size / 2;
      const radius = size / 2 - 18;

      // Speed modulation based on assistant state
      let speed = 0.015;
      if (state === 'listening') speed = 0.05;
      else if (state === 'thinking') speed = 0.08;
      else if (state === 'speaking') speed = 0.035 + currentVoiceLevel * 0.04;
      else if (state === 'executing') speed = 0.06;

      angleOuter += speed;
      angleInner -= speed * 1.35;
      pulsePhase += 0.06;

      // Palette definition
      let primaryColor = theme === 'gold' ? '#ffb300' : theme === 'emerald' ? '#00e676' : '#00e5ff';
      let secondaryColor = theme === 'gold' ? '#ff6f00' : theme === 'emerald' ? '#00b0ff' : '#0288d1';
      let glowRgba = theme === 'gold' ? 'rgba(255, 179, 0, ' : theme === 'emerald' ? 'rgba(0, 230, 118, ' : 'rgba(0, 229, 255, ';

      if (state === 'listening') {
        primaryColor = '#ffd600';
        secondaryColor = '#ff9100';
        glowRgba = 'rgba(255, 214, 0, ';
      } else if (state === 'thinking') {
        primaryColor = '#e040fb';
        secondaryColor = '#7c4dff';
        glowRgba = 'rgba(224, 64, 251, ';
      } else if (state === 'searching') {
        primaryColor = '#00f2ff';
        secondaryColor = '#3b82f6';
        glowRgba = 'rgba(0, 242, 255, ';
      } else if (state === 'executing') {
        primaryColor = '#ff9100';
        secondaryColor = '#ff3d00';
        glowRgba = 'rgba(255, 145, 0, ';
      } else if (state === 'speaking') {
        primaryColor = '#00e676';
        secondaryColor = '#00b0ff';
        glowRgba = 'rgba(0, 230, 118, ';
      } else if (state === 'offline') {
        primaryColor = '#64748b';
        secondaryColor = '#334155';
        glowRgba = 'rgba(100, 116, 139, ';
      } else if (state === 'error') {
        primaryColor = '#ff5252';
        secondaryColor = '#d50000';
        glowRgba = 'rgba(255, 82, 82, ';
      }

      const pulse = Math.sin(pulsePhase) * 0.12 + (state === 'speaking' ? 0.25 : 0.05);

      // 1. Glowing background haze
      const glowGrad = ctx.createRadialGradient(cx, cy, 5, cx, cy, radius * (1.1 + pulse));
      glowGrad.addColorStop(0, `${glowRgba}0.45)`);
      glowGrad.addColorStop(0.5, `${glowRgba}0.12)`);
      glowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, radius * 1.15, 0, Math.PI * 2);
      ctx.fill();

      // 2. Outer Segmented Rotating Ring
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(angleOuter);

      ctx.strokeStyle = primaryColor;
      ctx.lineWidth = 2;
      ctx.shadowColor = primaryColor;
      ctx.shadowBlur = 10;

      const segments = 12;
      for (let i = 0; i < segments; i++) {
        const start = (i * (Math.PI * 2)) / segments;
        const end = start + (Math.PI * 2) / (segments * 1.5);
        ctx.beginPath();
        ctx.arc(0, 0, radius * 0.9, start, end);
        ctx.stroke();
      }

      // Small tick marks on outer perimeter
      ctx.lineWidth = 1;
      for (let i = 0; i < 24; i++) {
        const rad = (i * Math.PI) / 12;
        const r1 = radius * 0.94;
        const r2 = radius * (i % 2 === 0 ? 1.0 : 0.97);
        ctx.beginPath();
        ctx.moveTo(Math.cos(rad) * r1, Math.sin(rad) * r1);
        ctx.lineTo(Math.cos(rad) * r2, Math.sin(rad) * r2);
        ctx.stroke();
      }
      ctx.restore();

      // 3. Counter-rotating Middle Ring with Triangular Aperture Notches
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(angleInner);

      ctx.strokeStyle = secondaryColor;
      ctx.lineWidth = 2.5;
      ctx.shadowBlur = 8;
      ctx.shadowColor = secondaryColor;

      const midRadius = radius * 0.68;
      for (let i = 0; i < 6; i++) {
        const start = (i * Math.PI * 2) / 6;
        const end = start + (Math.PI * 2) / 8;
        ctx.beginPath();
        ctx.arc(0, 0, midRadius, start, end);
        ctx.stroke();
      }

      // Locking chevrons
      ctx.fillStyle = primaryColor;
      for (let i = 0; i < 3; i++) {
        const chevAngle = (i * Math.PI * 2) / 3;
        const x = Math.cos(chevAngle) * midRadius * 0.9;
        const y = Math.sin(chevAngle) * midRadius * 0.9;
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // 4. Central Arc Reactor Core (Glowing Sphere with Plasma Mesh)
      const coreRadius = radius * 0.38 * (1 + pulse * 0.8);
      const coreGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreRadius);
      coreGrad.addColorStop(0, '#ffffff');
      coreGrad.addColorStop(0.3, primaryColor);
      coreGrad.addColorStop(0.8, secondaryColor);
      coreGrad.addColorStop(1, 'rgba(0, 0, 0, 0.2)');

      ctx.save();
      ctx.fillStyle = coreGrad;
      ctx.shadowColor = primaryColor;
      ctx.shadowBlur = 18;
      ctx.beginPath();
      ctx.arc(cx, cy, coreRadius, 0, Math.PI * 2);
      ctx.fill();

      // Core interior triangle emblem
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let i = 0; i < 3; i++) {
        const triAngle = angleOuter * 0.5 + (i * Math.PI * 2) / 3 - Math.PI / 2;
        const tx = cx + Math.cos(triAngle) * (coreRadius * 0.55);
        const ty = cy + Math.sin(triAngle) * (coreRadius * 0.55);
        if (i === 0) ctx.moveTo(tx, ty);
        else ctx.lineTo(tx, ty);
      }
      ctx.closePath();
      ctx.stroke();
      ctx.restore();

      // 5. Crosshair grid indicators
      ctx.strokeStyle = `${glowRgba}0.25)`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx - radius * 0.98, cy);
      ctx.lineTo(cx - radius * 0.75, cy);
      ctx.moveTo(cx + radius * 0.75, cy);
      ctx.lineTo(cx + radius * 0.98, cy);
      ctx.moveTo(cx, cy - radius * 0.98);
      ctx.lineTo(cx, cy - radius * 0.75);
      ctx.moveTo(cx, cy + radius * 0.75);
      ctx.lineTo(cx, cy + radius * 0.98);
      ctx.stroke();

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [state, theme, actualVoiceLevel, size]);

  return (
    <div className="relative flex items-center justify-center">
      <canvas
        ref={canvasRef}
        style={{ width: size, height: size }}
        className="pointer-events-none drop-shadow-[0_0_25px_rgba(0,229,255,0.3)]"
      />
    </div>
  );
};
