import React, { useEffect, useState, useRef } from 'react';

// ==========================================
// 1. RADAR BADGES (Sector A & C)
// ==========================================
export const RadarBadge: React.FC<{
  letter: 'A' | 'C';
  type: 'nuclear' | 'crosshair';
  code1: string;
  code2: string;
}> = ({ letter, type, code1, code2 }) => {
  const [angle, setAngle] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setAngle((prev) => (prev + 4) % 360);
    }, 40);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex items-center gap-2 select-none">
      {/* Circular Radar Graphic */}
      <div className="relative w-12 h-12 rounded-full border border-[#00f2ff66] bg-[#00f2ff08] flex items-center justify-center shadow-[0_0_10px_rgba(0,242,255,0.2)]">
        {/* Outer dashed ring */}
        <div
          className="absolute inset-1 rounded-full border border-dashed border-[#00f2ff44]"
          style={{ transform: `rotate(${angle}deg)` }}
        />

        {/* Sweep / Icon */}
        {type === 'nuclear' ? (
          <div className="relative w-7 h-7 flex items-center justify-center">
            <div
              className="absolute inset-0 rounded-full border-t-2 border-r-2 border-[#00f2ff] opacity-80"
              style={{ transform: `rotate(${angle * 1.5}deg)` }}
            />
            {/* 3 nuclear blades */}
            {[0, 120, 240].map((deg) => (
              <div
                key={deg}
                className="absolute w-1.5 h-3 bg-[#00f2ff] origin-bottom -top-1 rounded-xs opacity-75"
                style={{ transform: `rotate(${deg}deg)` }}
              />
            ))}
            <div className="w-1.5 h-1.5 rounded-full bg-white z-10" />
          </div>
        ) : (
          <div className="relative w-7 h-7 flex items-center justify-center">
            {/* Crosshair */}
            <div className="absolute w-full h-[1px] bg-[#00f2ff88]" />
            <div className="absolute h-full w-[1px] bg-[#00f2ff88]" />
            <div
              className="absolute inset-1 rounded-full border border-[#00f2ff]"
              style={{ transform: `rotate(-${angle * 2}deg)` }}
            />
            <div className="w-1.5 h-1.5 rounded-full bg-[#00f2ff] animate-ping" />
          </div>
        )}
      </div>

      {/* Red/Magenta Status Telemetry Chips */}
      <div className="flex flex-col gap-1 font-mono text-[9px]">
        <div className="px-1.5 py-0.5 bg-[#ef444422] border border-[#ef444488] text-[#ff4d6d] font-bold rounded-xs flex items-center justify-between min-w-[58px]">
          <span>{code1}</span>
          <span className="w-1.5 h-1.5 rounded-full bg-[#ff4d6d] animate-pulse" />
        </div>
        <div className="px-1.5 py-0.5 bg-[#ef444415] border border-[#ef444455] text-[#ff758f] rounded-xs font-semibold">
          {code2}
        </div>
      </div>

      {/* Large Glowing Letter Box */}
      <div className="w-8 h-8 rounded-sm bg-[#00f2ff15] border-2 border-[#00f2ff] text-[#00f2ff] font-bold font-mono text-base flex items-center justify-center shadow-[0_0_12px_rgba(0,242,255,0.4)]">
        {letter}
      </div>
    </div>
  );
};

// ==========================================
// 2. TACTICAL MEMORY BOX & STATUS LADDER
// ==========================================
export const TacticalMemoryBox: React.FC = () => {
  const ladderBars = [
    { label: 'TEST_001', val: 88 },
    { label: 'TEST_002', val: 62 },
    { label: 'TEST_003', val: 94 },
    { label: 'TEST_004', val: 45 },
    { label: 'TEST_005', val: 78 },
    { label: 'TEST_006', val: 83 },
    { label: 'TEST_007', val: 56 }
  ];

  return (
    <div className="border border-[#00f2ff44] bg-black/70 rounded-sm p-2.5 space-y-2 select-none relative overflow-hidden">
      {/* Corner Bracket Accents */}
      <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-[#00f2ff]" />
      <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-[#00f2ff]" />

      {/* Header Tag */}
      <div className="flex items-center justify-between border-b border-[#00f2ff33] pb-1">
        <span className="text-[11px] font-mono font-bold text-[#00f2ff] tracking-wider">
          [ 06_LOREAM2K.4 ]
        </span>
        <span className="text-[9px] font-mono text-emerald-400">SYNC_OK</span>
      </div>

      {/* Hex Stream Dump */}
      <div className="grid grid-cols-2 gap-1 font-mono text-[8px] text-[#00f2ffaa] leading-tight opacity-75">
        <div>0x8F4A 0x22B1</div>
        <div>0x00FE 0x99C2</div>
        <div>0x77A1 0x44D0</div>
        <div>0x12F8 0x33E5</div>
      </div>

      {/* Stepped Status Meters */}
      <div className="space-y-1.5 pt-1 border-t border-[#00f2ff22]">
        {ladderBars.map((bar, i) => (
          <div key={i} className="flex items-center gap-2 font-mono text-[9px]">
            <span className="text-gray-400 w-14 truncate">{bar.label}</span>
            <div className="flex-grow h-1.5 bg-black border border-[#00f2ff33] rounded-xs overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#00f2ff] to-cyan-300"
                style={{ width: `${bar.val}%` }}
              />
            </div>
            <span className="text-[#00f2ff] font-bold text-[8px] w-6 text-right">
              {bar.val}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ==========================================
// 3. VERTICAL SEGMENTED EQUALIZER METER
// ==========================================
export const SegmentedMeter: React.FC<{ activeBars?: number }> = ({ activeBars = 16 }) => {
  const total = 22;
  return (
    <div className="flex flex-col items-center gap-1 border border-[#00f2ff44] bg-black/80 p-1.5 rounded-sm select-none">
      <div className="w-5 flex flex-col-reverse gap-0.5 h-44 justify-between">
        {Array.from({ length: total }).map((_, idx) => {
          const isActive = idx < activeBars;
          const isHigh = idx > 16;
          return (
            <div
              key={idx}
              className={`w-full h-1 rounded-xs transition-all duration-100 ${
                isActive
                  ? isHigh
                    ? 'bg-[#ff0055] shadow-[0_0_6px_#ff0055]'
                    : 'bg-[#00f2ff] shadow-[0_0_4px_#00f2ff]'
                  : 'bg-[#00f2ff11]'
              }`}
            />
          );
        })}
      </div>
      <span className="text-[8px] font-mono text-[#00f2ff] font-bold">PWR</span>
    </div>
  );
};

// ==========================================
// 4. TELEMETRY CODE BLOCK & MICRO SPARKLINES
// ==========================================
export const TelemetryCodeBlock: React.FC = () => {
  return (
    <div className="space-y-2 font-mono text-[10px] text-[#00f2ffbb] select-none leading-tight">
      <div className="bg-black/60 border border-[#00f2ff33] p-2 rounded-sm space-y-1">
        <div className="text-gray-400">&lt;calc.res&gt;</div>
        <div className="pl-2 text-cyan-300">status = 0x8F</div>
        <div className="pl-2 text-gray-300">vector.matrix[0][1] = 0x00FE;</div>
        <div className="pl-2 text-emerald-400">
          response(req_id: 0x8F) =&gt; probability of collision: &lt;= 0x001
        </div>
        <div className="text-gray-400">&lt;/calc.res&gt;</div>
      </div>

      {/* Sparkline Micro Charts */}
      <div className="grid grid-cols-2 gap-2 pt-1">
        <div className="bg-black/50 border border-[#00f2ff22] p-1.5 rounded-sm space-y-1">
          <div className="flex justify-between text-[9px]">
            <span className="text-gray-400">LOREUM</span>
            <span className="text-[#00f2ff] font-bold">4.121</span>
          </div>
          <svg className="w-full h-4 text-[#00f2ff]" viewBox="0 0 100 20" fill="none">
            <path
              d="M 0,15 Q 15,2 30,12 T 60,8 T 85,16 T 100,6"
              stroke="currentColor"
              strokeWidth="1.5"
            />
          </svg>
        </div>

        <div className="bg-black/50 border border-[#00f2ff22] p-1.5 rounded-sm space-y-1">
          <div className="flex justify-between text-[9px]">
            <span className="text-gray-400">LOREUM</span>
            <span className="text-[#00f2ff] font-bold">12.624</span>
          </div>
          <svg className="w-full h-4 text-cyan-400" viewBox="0 0 100 20" fill="none">
            <path
              d="M 0,8 Q 20,18 40,5 T 70,14 T 90,4 T 100,12"
              stroke="currentColor"
              strokeWidth="1.5"
            />
          </svg>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 5. DATABASE INDICATION CHANNELS (Middle Right)
// ==========================================
export const DatabaseIndicators: React.FC = () => {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setPhase((p) => (p + 0.1) % (Math.PI * 2));
    }, 50);
    return () => clearInterval(id);
  }, []);

  const generateWave = (offset: number) => {
    let d = 'M 0,10';
    for (let x = 0; x <= 140; x += 10) {
      const y = 10 + Math.sin(x * 0.08 + phase + offset) * 7;
      d += ` L ${x},${y.toFixed(1)}`;
    }
    return d;
  };

  return (
    <div className="border border-[#00f2ff44] bg-black/70 rounded-sm p-2.5 space-y-2 select-none">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#00f2ff33] pb-1">
        <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-[#00f2ff]">
          <span className="text-cyan-400">:::</span> DATABASE <span className="text-cyan-400">:::</span>
        </div>
        <span className="text-[8px] font-mono text-gray-400">FUTURISTIC USER INTERFACE</span>
      </div>

      {/* Channels */}
      {[
        { id: 1, label: 'indication', offset: 0 },
        { id: 2, label: 'indication', offset: 1.5 },
        { id: 3, label: 'indication', offset: 3.0 }
      ].map((item) => (
        <div key={item.id} className="flex items-center gap-2 font-mono text-[9px]">
          <div className="flex items-center gap-1 bg-[#00f2ff22] border border-[#00f2ff] px-1.5 py-0.5 text-white font-bold rounded-xs min-w-[80px]">
            <span>{item.id}</span>
            <span className="text-gray-300 font-normal">{item.label}</span>
          </div>

          <div className="flex-grow h-6 bg-black/80 border border-[#00f2ff22] rounded-xs overflow-hidden flex items-center px-1">
            <svg className="w-full h-full text-[#00f2ff]" viewBox="0 0 140 20" fill="none">
              <path
                d={generateWave(item.offset)}
                stroke="currentColor"
                strokeWidth="1.5"
              />
            </svg>
          </div>
        </div>
      ))}
    </div>
  );
};

// ==========================================
// 6. RED DIGITAL MISSION CLOCK (00:01:02)
// ==========================================
export const RedDigitalClock: React.FC = () => {
  const [timeStr, setTimeStr] = useState('00:01:02');

  useEffect(() => {
    const start = Date.now();
    const id = setInterval(() => {
      const elapsed = Math.floor((Date.now() - start) / 1000);
      const h = String(Math.floor(elapsed / 3600)).padStart(2, '0');
      const m = String(Math.floor((elapsed % 3600) / 60)).padStart(2, '0');
      const s = String(elapsed % 60).padStart(2, '0');
      setTimeStr(`${h}:${m}:${s}`);
    }, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="border border-[#ff005588] bg-[#ff005515] p-2 rounded-sm flex items-center justify-between shadow-[0_0_15px_rgba(255,0,85,0.25)] select-none">
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-[#ff0055] animate-ping" />
        <span className="font-mono text-lg sm:text-xl font-black tracking-widest text-[#ff0055] drop-shadow-[0_0_8px_#ff0055]">
          {timeStr}
        </span>
      </div>

      <div className="flex items-center gap-1 opacity-80">
        <svg className="w-5 h-5 text-[#ff0055]" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2L2 22h20L12 2zm0 4l6.5 13h-13L12 6z" />
        </svg>
      </div>
    </div>
  );
};

// ==========================================
// 7. BOTTOM RIGHT AUDIO SPECTRUM WAVE
// ==========================================
export const AudioSpectrumWave: React.FC<{ voiceVolume?: number }> = ({ voiceVolume = 0 }) => {
  const [points, setPoints] = useState<number[]>(Array(24).fill(4));

  useEffect(() => {
    const id = setInterval(() => {
      setPoints((prev) =>
        prev.map(() => {
          const base = 4;
          const boost = voiceVolume * 22;
          return base + Math.floor(Math.random() * (12 + boost));
        })
      );
    }, 60);
    return () => clearInterval(id);
  }, [voiceVolume]);

  return (
    <div className="border border-[#00f2ff33] bg-black/60 p-2 rounded-sm flex items-center justify-between select-none">
      <div className="flex items-center gap-1 text-[9px] font-mono text-[#00f2ff]">
        <span className="w-1.5 h-1.5 bg-[#00f2ff] rounded-full animate-pulse" />
        <span>AUDIO_FREQ</span>
      </div>

      <div className="flex items-center gap-0.5 h-7">
        {points.map((h, idx) => (
          <div
            key={idx}
            className="w-1 bg-[#00f2ff] rounded-xs shadow-[0_0_4px_#00f2ff] transition-all duration-75"
            style={{ height: `${h}px` }}
          />
        ))}
      </div>
    </div>
  );
};

// ==========================================
// 8. GYRO DIAL (Bottom circular radars)
// ==========================================
export const GyroDial: React.FC<{ size?: number }> = ({ size = 64 }) => {
  const [angle, setAngle] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setAngle((a) => (a + 3) % 360);
    }, 40);
    return () => clearInterval(id);
  }, []);

  return (
    <div
      style={{ width: size, height: size }}
      className="relative rounded-full border border-[#00f2ff66] bg-black/60 flex items-center justify-center shadow-[0_0_12px_rgba(0,242,255,0.25)] select-none"
    >
      {/* Outer geared ring */}
      <div
        className="absolute inset-1 rounded-full border border-dashed border-[#00f2ff44]"
        style={{ transform: `rotate(${angle}deg)` }}
      />
      {/* Counter ring */}
      <div
        className="absolute inset-2.5 rounded-full border-t-2 border-b-2 border-[#00f2ff]"
        style={{ transform: `rotate(-${angle * 1.5}deg)` }}
      />
      {/* Center cross */}
      <div className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_6px_#ffffff]" />
    </div>
  );
};

// ==========================================
// 9. SCI-FI HUD BRACKET FRAMES (Top and Bottom)
// ==========================================
export const SciFiTopBrackets: React.FC = () => {
  return (
    <div className="w-full flex items-center justify-between px-2 text-[#00f2ff] opacity-80 pointer-events-none select-none">
      {/* Left wing bracket */}
      <div className="flex items-center gap-1">
        <div className="w-4 h-2 border-t-2 border-l-2 border-[#00f2ff]" />
        <div className="w-16 h-[2px] bg-gradient-to-r from-[#00f2ff] to-transparent" />
      </div>

      {/* Center notch crown */}
      <div className="flex items-center gap-2">
        <div className="w-10 h-[2px] bg-[#00f2ff44]" />
        <div className="w-4 h-2 border-t-2 border-x-2 border-[#00f2ff]" />
        <div className="w-10 h-[2px] bg-[#00f2ff44]" />
      </div>

      {/* Right wing bracket */}
      <div className="flex items-center gap-1">
        <div className="w-16 h-[2px] bg-gradient-to-l from-[#00f2ff] to-transparent" />
        <div className="w-4 h-2 border-t-2 border-r-2 border-[#00f2ff]" />
      </div>
    </div>
  );
};

export const SciFiBottomBrackets: React.FC = () => {
  return (
    <div className="w-full flex items-center justify-between px-2 text-[#00f2ff] opacity-80 pointer-events-none select-none">
      {/* Left bottom bracket */}
      <div className="flex items-center gap-1">
        <div className="w-4 h-2 border-b-2 border-l-2 border-[#00f2ff]" />
        <div className="w-16 h-[2px] bg-gradient-to-r from-[#00f2ff] to-transparent" />
      </div>

      {/* Center notch */}
      <div className="flex items-center gap-2">
        <div className="w-10 h-[2px] bg-[#00f2ff44]" />
        <div className="w-4 h-2 border-b-2 border-x-2 border-[#00f2ff]" />
        <div className="w-10 h-[2px] bg-[#00f2ff44]" />
      </div>

      {/* Right bottom bracket */}
      <div className="flex items-center gap-1">
        <div className="w-16 h-[2px] bg-gradient-to-l from-[#00f2ff] to-transparent" />
        <div className="w-4 h-2 border-b-2 border-r-2 border-[#00f2ff]" />
      </div>
    </div>
  );
};
