import React, { useState, useEffect, useRef } from 'react';
import { Camera, RefreshCw, Eye, Sparkles, X, CheckCircle, AlertTriangle } from 'lucide-react';
import { AssistantVoiceName } from '../types';
import { sciFiAudio, speakSpanish } from '../utils/audioSynth';

interface OpticalVisionScannerProps {
  onAnalyzeResult?: (text: string) => void;
  assistantName?: AssistantVoiceName;
}

export const OpticalVisionScanner: React.FC<OpticalVisionScannerProps> = ({
  onAnalyzeResult,
  assistantName = 'Atlas'
}) => {
  const [isActive, setIsActive] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [analysisText, setAnalysisText] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Start Camera Stream
  const startCamera = async () => {
    setCameraError(null);
    setAnalysisText(null);
    try {
      sciFiAudio.playBlip();
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Dispositivo sin soporte de captura');
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'environment' }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
      setIsActive(true);
      setCapturedImage(null);
    } catch (err: any) {
      const isNotFound = err?.name === 'NotFoundError' || err?.message?.includes('Requested device not found') || err?.name === 'DevicesNotFoundError';
      const isNotAllowed = err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError';
      const msg = isNotFound
        ? 'No se detectó cámara física conectada en este equipo. Puedes cargar una foto abajo.'
        : isNotAllowed
        ? 'Permiso de cámara denegado por el navegador.'
        : 'Cámara no disponible en este dispositivo. Puedes subir una imagen.';
      setCameraError(msg);
    }
  };

  // Stop Camera Stream
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsActive(false);
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Capture Still Frame
  const captureFrame = () => {
    if (!videoRef.current) return;
    sciFiAudio.playExecution();
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    setCapturedImage(dataUrl);
    stopCamera();
    analyzeSnapshot(dataUrl);
  };

  // Upload custom file as fallback
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setCapturedImage(dataUrl);
      analyzeSnapshot(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  // Send to Gemini Vision API
  const analyzeSnapshot = async (imageData: string) => {
    setIsScanning(true);
    setAnalysisText('Analizando imagen con visión multimodal de Gemini...');
    sciFiAudio.playScan();

    try {
      const res = await fetch('/api/assistant/analyze-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageData,
          prompt: `Eres ${assistantName}, el sistema de visión artificial táctica de Tony Stark. Analiza minuciosamente los objetos, textos, códigos o componentes presentes en esta imagen. Explica de forma concisa y profesional qué es, su utilidad y estado.`
        })
      });

      const data = await res.json();
      if (data.success && data.analysis) {
        setAnalysisText(data.analysis);
        if (onAnalyzeResult) onAnalyzeResult(data.analysis);
        speakSpanish(data.analysis.slice(0, 180), assistantName);
        sciFiAudio.playSuccess();
      } else {
        setAnalysisText(data.error || 'No se pudo procesar la imagen.');
      }
    } catch (err: any) {
      console.error('Vision analysis error:', err);
      setAnalysisText('Error de conexión con el motor visual de Gemini.');
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="border border-[#00f2ff44] bg-black/80 rounded-sm p-2.5 space-y-2 select-none relative overflow-hidden">
      {/* Sci-Fi Corner Brackets */}
      <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-[#00f2ff]" />
      <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-[#00f2ff]" />

      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#00f2ff33] pb-1.5">
        <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-[#00f2ff]">
          <Eye className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
          <span>VISIÓN ÓPTICA // GEMINI VISION</span>
        </div>
        <span className={`text-[8px] font-mono font-bold px-1.5 py-0.2 rounded-xs border ${
          isActive ? 'bg-emerald-950/80 text-emerald-400 border-emerald-500 animate-pulse' :
          isScanning ? 'bg-amber-950/80 text-amber-400 border-amber-500 animate-pulse' :
          'bg-[#00f2ff11] text-[#00f2ff] border-[#00f2ff33]'
        }`}>
          {isActive ? 'FEED ACTIVO' : isScanning ? 'ESCANEANDO...' : 'STANDBY'}
        </span>
      </div>

      {/* Camera Viewport or Snapshot Preview */}
      <div className="relative w-full h-36 bg-black border border-[#00f2ff33] rounded-xs overflow-hidden flex items-center justify-center">
        {/* Active Camera Video */}
        {isActive && (
          <video
            ref={videoRef}
            playsInline
            muted
            className="w-full h-full object-cover"
            style={{ transform: `scale(${zoomLevel})` }}
          />
        )}

        {/* Captured Snapshot */}
        {!isActive && capturedImage && (
          <img
            src={capturedImage}
            alt="Captura HUD"
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        )}

        {/* Placeholder when idle */}
        {!isActive && !capturedImage && (
          <div className="flex flex-col items-center justify-center p-3 text-center space-y-1.5">
            <Camera className="w-6 h-6 text-[#00f2ff66]" />
            <div className="text-[10px] font-mono text-gray-400">
              Escanea objetos, código en pantalla o documentos en tiempo real
            </div>
          </div>
        )}

        {/* HUD Reticle Overlay */}
        {(isActive || isScanning) && (
          <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-between p-2">
            {/* Top Bar with scan line */}
            <div className="w-full flex justify-between text-[8px] font-mono text-[#00f2ff]">
              <span>OPTICAL_MATRIX</span>
              <span>ZOOM: {zoomLevel}X</span>
            </div>

            {/* Central Target Crosshair */}
            <div className="relative w-16 h-16 border border-[#00f2ff88] rounded-full flex items-center justify-center animate-pulse">
              <div className="w-full h-[1px] bg-[#00f2ff66]" />
              <div className="h-full w-[1px] bg-[#00f2ff66] absolute" />
              <div className="w-2 h-2 rounded-full bg-[#00f2ff] shadow-[0_0_8px_#00f2ff]" />
            </div>

            {/* Laser scanning vertical bar */}
            {isScanning && (
              <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-[#00f2ff] to-transparent shadow-[0_0_10px_#00f2ff] animate-bounce" />
            )}

            <div className="w-full flex justify-between text-[8px] font-mono text-emerald-400">
              <span>TARGET_LOCKED</span>
              <span>RES: 640x480</span>
            </div>
          </div>
        )}

        {cameraError && (
          <div className="absolute inset-0 bg-black/90 p-2 flex flex-col items-center justify-center text-center space-y-1">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            <span className="text-[9px] font-mono text-amber-300">{cameraError}</span>
          </div>
        )}
      </div>

      {/* Control Buttons */}
      <div className="flex items-center gap-1.5 font-mono text-[9px]">
        {!isActive ? (
          <button
            onClick={startCamera}
            className="flex-1 py-1.5 bg-[#00f2ff] hover:bg-cyan-300 text-black font-bold rounded-xs flex items-center justify-center gap-1 transition-all cursor-pointer shadow-[0_0_8px_rgba(0,242,255,0.4)]"
          >
            <Camera className="w-3 h-3" />
            <span>ACTIVAR CÁMARA</span>
          </button>
        ) : (
          <button
            onClick={captureFrame}
            className="flex-1 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-xs flex items-center justify-center gap-1 transition-all cursor-pointer shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse"
          >
            <Sparkles className="w-3 h-3" />
            <span>CAPTURAR & ANALIZAR</span>
          </button>
        )}

        {isActive && (
          <button
            onClick={() => setZoomLevel((z) => (z === 1 ? 1.5 : z === 1.5 ? 2 : 1))}
            className="px-2 py-1.5 bg-black/80 border border-[#00f2ff44] text-[#00f2ff] rounded-xs cursor-pointer hover:bg-[#00f2ff22]"
            title="Ajustar Zoom"
          >
            {zoomLevel}X
          </button>
        )}

        {isActive && (
          <button
            onClick={stopCamera}
            className="p-1.5 bg-red-950/80 border border-red-500 text-red-300 rounded-xs cursor-pointer hover:bg-red-900"
            title="Detener cámara"
          >
            <X className="w-3 h-3" />
          </button>
        )}

        {/* Upload File Input */}
        <label className="px-2 py-1.5 bg-black/80 border border-[#00f2ff44] text-gray-300 hover:text-white rounded-xs cursor-pointer flex items-center gap-1">
          <span>SUBIR</span>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
          />
        </label>
      </div>

      {/* Analysis Result Box */}
      {analysisText && (
        <div className="bg-black/90 border border-cyan-500/40 p-2 rounded-xs space-y-1 font-mono text-[9px]">
          <div className="flex items-center justify-between text-[#00f2ff] font-bold">
            <span className="flex items-center gap-1">
              <CheckCircle className="w-3 h-3 text-emerald-400" /> REPORTE VISUAL STARK:
            </span>
            <button
              onClick={() => setAnalysisText(null)}
              className="text-gray-400 hover:text-white text-[8px]"
            >
              CERRAR
            </button>
          </div>
          <div className="text-gray-200 text-[9px] leading-relaxed max-h-24 overflow-y-auto pr-1">
            {analysisText}
          </div>
        </div>
      )}
    </div>
  );
};
