import React, { useEffect, useRef } from 'react';
import { AssistantState } from '../types';

interface AtlasHoloSphereProps {
  state: AssistantState;
  voiceVolume?: number;
  size?: number;
}

export const AtlasHoloSphere: React.FC<AtlasHoloSphereProps> = ({
  state,
  voiceVolume = 0,
  size = 380
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let rotationY = 0;
    let rotationX = 0.25;
    let ringAngle1 = 0;
    let ringAngle2 = Math.PI / 3;
    let pulsePhase = 0;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    const render = () => {
      ctx.clearRect(0, 0, size, size);

      const cx = size / 2;
      const cy = size / 2 - 25; // Slightly above center to allow room for the pedestal
      const radius = 95;

      // Dynamics based on state
      let speedMultiplier = 1;
      if (state === 'listening') speedMultiplier = 2.2;
      else if (state === 'thinking' || state === 'searching') speedMultiplier = 2.8;
      else if (state === 'speaking') speedMultiplier = 1.6 + voiceVolume * 1.5;

      rotationY += 0.008 * speedMultiplier;
      ringAngle1 += 0.015 * speedMultiplier;
      ringAngle2 -= 0.012 * speedMultiplier;
      pulsePhase += 0.05 * speedMultiplier;

      const dynamicPulse = Math.sin(pulsePhase) * 0.08 + (voiceVolume * 0.15);
      const currentRadius = radius * (1 + dynamicPulse);

      // --- 1. PEDESTAL & LIGHT BEAMS (AT BASE) ---
      const baseCy = cy + 130;
      
      // Light projection beam from pedestal up to sphere
      const beamGrad = ctx.createLinearGradient(cx, baseCy, cx, cy + 40);
      beamGrad.addColorStop(0, 'rgba(0, 242, 255, 0.45)');
      beamGrad.addColorStop(0.4, 'rgba(0, 180, 255, 0.15)');
      beamGrad.addColorStop(1, 'rgba(0, 242, 255, 0)');

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(cx - 75, baseCy);
      ctx.lineTo(cx - 35, cy + 40);
      ctx.lineTo(cx + 35, cy + 40);
      ctx.lineTo(cx + 75, baseCy);
      ctx.closePath();
      ctx.fillStyle = beamGrad;
      ctx.fill();
      ctx.restore();

      // Pedestal Rings (Perspective Ellipses)
      const drawPedestalRing = (yOffset: number, rx: number, ry: number, strokeColor: string, fillGrad?: boolean) => {
        ctx.save();
        ctx.beginPath();
        ctx.ellipse(cx, baseCy + yOffset, rx, ry, 0, 0, Math.PI * 2);
        if (fillGrad) {
          const pGrad = ctx.createRadialGradient(cx, baseCy + yOffset, 5, cx, baseCy + yOffset, rx);
          pGrad.addColorStop(0, 'rgba(0, 242, 255, 0.35)');
          pGrad.addColorStop(0.7, 'rgba(0, 130, 255, 0.15)');
          pGrad.addColorStop(1, 'rgba(2, 6, 23, 0.9)');
          ctx.fillStyle = pGrad;
          ctx.fill();
        }
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 1.5;
        ctx.shadowColor = strokeColor;
        ctx.shadowBlur = 10;
        ctx.stroke();
        ctx.restore();
      };

      // Base bottom shadow & outer glow
      drawPedestalRing(20, 140, 26, 'rgba(0, 180, 255, 0.25)', false);
      drawPedestalRing(12, 120, 22, 'rgba(0, 242, 255, 0.5)', true);
      drawPedestalRing(4, 95, 18, 'rgba(0, 242, 255, 0.85)', true);
      drawPedestalRing(-4, 68, 13, '#00f2ff', true);
      drawPedestalRing(-10, 42, 8, 'rgba(255, 255, 255, 0.9)', false);

      // --- 2. BACK ORBITAL ENERGY RING ---
      const drawOrbitalRing = (angle: number, tiltX: number, tiltY: number, color1: string, color2: string) => {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(angle);
        
        ctx.beginPath();
        ctx.ellipse(0, 0, currentRadius * 1.5, currentRadius * 0.45, 0, 0, Math.PI * 2);
        const ringGrad = ctx.createLinearGradient(-currentRadius * 1.5, 0, currentRadius * 1.5, 0);
        ringGrad.addColorStop(0, color1);
        ringGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.8)');
        ringGrad.addColorStop(1, color2);
        ctx.strokeStyle = ringGrad;
        ctx.lineWidth = 2.2;
        ctx.shadowColor = color1;
        ctx.shadowBlur = 15;
        ctx.stroke();

        // Orbital energy beads/particles
        const particleAngle = angle * 2.5;
        const px = Math.cos(particleAngle) * (currentRadius * 1.5);
        const py = Math.sin(particleAngle) * (currentRadius * 0.45);
        ctx.beginPath();
        ctx.arc(px, py, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#00f2ff';
        ctx.shadowBlur = 10;
        ctx.fill();

        ctx.restore();
      };

      // Draw Ring 1 (inclined)
      drawOrbitalRing(ringAngle1, 0.4, 0.2, '#00f2ff', '#3b82f6');
      // Draw Ring 2 (counter-inclined)
      drawOrbitalRing(-ringAngle2, 0.3, 0.5, '#8b5cf6', '#00f2ff');

      // --- 3. HOLOGRAPHIC 3D SPHERE ---
      // Outer sphere ambient glow
      const sphereGlow = ctx.createRadialGradient(cx, cy, currentRadius * 0.3, cx, cy, currentRadius * 1.35);
      sphereGlow.addColorStop(0, 'rgba(0, 242, 255, 0.35)');
      sphereGlow.addColorStop(0.6, 'rgba(59, 130, 246, 0.18)');
      sphereGlow.addColorStop(0.85, 'rgba(139, 92, 246, 0.1)');
      sphereGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.beginPath();
      ctx.arc(cx, cy, currentRadius * 1.35, 0, Math.PI * 2);
      ctx.fillStyle = sphereGlow;
      ctx.fill();

      // Sphere Outer Boundary Ring
      ctx.beginPath();
      ctx.arc(cx, cy, currentRadius, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(0, 242, 255, 0.85)';
      ctx.lineWidth = 2;
      ctx.shadowColor = '#00f2ff';
      ctx.shadowBlur = 18;
      ctx.stroke();

      // Sphere inner atmospheric gradient
      const sphereInner = ctx.createRadialGradient(cx - currentRadius * 0.3, cy - currentRadius * 0.3, 5, cx, cy, currentRadius);
      sphereInner.addColorStop(0, 'rgba(0, 242, 255, 0.45)');
      sphereInner.addColorStop(0.5, 'rgba(20, 80, 180, 0.25)');
      sphereInner.addColorStop(0.9, 'rgba(2, 6, 23, 0.8)');
      sphereInner.addColorStop(1, 'rgba(0, 242, 255, 0.6)');

      ctx.beginPath();
      ctx.arc(cx, cy, currentRadius - 1, 0, Math.PI * 2);
      ctx.fillStyle = sphereInner;
      ctx.fill();

      // Longitude Wireframe Lines
      const numLongitudes = 8;
      for (let i = 0; i < numLongitudes; i++) {
        const theta = rotationY + (i * Math.PI) / numLongitudes;
        const rx = Math.cos(theta) * currentRadius;
        
        ctx.save();
        ctx.beginPath();
        ctx.ellipse(cx, cy, Math.abs(rx), currentRadius, 0, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(0, 242, 255, ${0.12 + Math.abs(rx / currentRadius) * 0.2})`;
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.restore();
      }

      // Latitude Wireframe Lines
      const latitudes = [-0.65, -0.35, 0, 0.35, 0.65];
      latitudes.forEach((lat) => {
        const yOffset = lat * currentRadius;
        const latRadius = Math.sqrt(currentRadius * currentRadius - yOffset * yOffset);
        
        ctx.save();
        ctx.beginPath();
        ctx.ellipse(cx, cy + yOffset, latRadius, latRadius * 0.28, 0, 0, Math.PI * 2);
        ctx.strokeStyle = lat === 0 ? 'rgba(0, 242, 255, 0.5)' : 'rgba(0, 242, 255, 0.2)';
        ctx.lineWidth = lat === 0 ? 1.5 : 0.8;
        ctx.stroke();
        ctx.restore();
      });

      // --- 4. FLOATING STYLIZED "A" GLYPH (CENTER OF SPHERE) ---
      ctx.save();
      ctx.translate(cx, cy);
      const glyphScale = 1.15 + Math.sin(pulsePhase * 1.5) * 0.05;
      ctx.scale(glyphScale, glyphScale);

      // Stylized triangular A geometry
      ctx.beginPath();
      // Outer triangle apex and legs
      ctx.moveTo(0, -38);
      ctx.lineTo(26, 28);
      ctx.lineTo(13, 28);
      ctx.lineTo(8, 14);
      ctx.lineTo(-8, 14);
      ctx.lineTo(-13, 28);
      ctx.lineTo(-26, 28);
      ctx.closePath();

      // Inner triangle cutout
      ctx.moveTo(0, -18);
      ctx.lineTo(-5, 5);
      ctx.lineTo(5, 5);
      ctx.closePath();

      // Fill with glowing gradient
      const glyphGrad = ctx.createLinearGradient(0, -38, 0, 28);
      glyphGrad.addColorStop(0, '#ffffff');
      glyphGrad.addColorStop(0.3, '#00f2ff');
      glyphGrad.addColorStop(0.8, '#2563eb');
      glyphGrad.addColorStop(1, '#60a5fa');

      ctx.fillStyle = glyphGrad;
      ctx.shadowColor = '#00f2ff';
      ctx.shadowBlur = 25;
      ctx.fill('evenodd');

      // Bright white accent line on top apex
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.lineWidth = 1.2;
      ctx.stroke();

      ctx.restore();

      // Floating sparkles / energy particles around core
      for (let p = 0; p < 12; p++) {
        const particleAngle = pulsePhase * 0.8 + (p * Math.PI * 2) / 12;
        const dist = (currentRadius * 0.5) + (Math.sin(pulsePhase + p) * 35);
        const px = cx + Math.cos(particleAngle) * dist;
        const py = cy + Math.sin(particleAngle) * (dist * 0.65);
        
        ctx.beginPath();
        ctx.arc(px, py, 1.5, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 242, 255, 0.7)';
        ctx.shadowColor = '#00f2ff';
        ctx.shadowBlur = 6;
        ctx.fill();
      }

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [state, voiceVolume, size]);

  return (
    <div className="relative flex items-center justify-center select-none pointer-events-none">
      <canvas
        ref={canvasRef}
        style={{ width: size, height: size }}
        className="w-full h-auto max-w-[380px] drop-shadow-[0_0_35px_rgba(0,242,255,0.3)]"
      />
    </div>
  );
};
