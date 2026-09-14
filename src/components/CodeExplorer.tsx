import React, { useState } from 'react';
import { 
  FolderTree, FileCode, Copy, Check, Download, Package, 
  Terminal, Shield, Layers, FileText, ChevronRight, Eye, Server, Smartphone
} from 'lucide-react';
import { PYTHON_PROJECT_FILES } from '../data/pythonProjectFiles';
import { PythonFileDefinition } from '../types';
import { exportProjectAsZip, downloadSingleFile } from '../utils/zipExporter';

export const CodeExplorer: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<PythonFileDefinition>(
    PYTHON_PROJECT_FILES.find(f => f.path === 'backend_servidor/main.py') || PYTHON_PROJECT_FILES[0]
  );
  const [copied, setCopied] = useState(false);
  const [isZipping, setIsZipping] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const categories = [
    { id: 'all', label: `Todos los Archivos (${PYTHON_PROJECT_FILES.length})` },
    { id: 'core', label: 'Backend FastAPI' },
    { id: 'brain', label: 'Cerebro & Tools (OS)' },
    { id: 'voice', label: 'Voz (Whisper/TTS/Wake)' },
    { id: 'gui', label: 'Frontend Cliente Web/Mobile' },
    { id: 'config', label: 'Configuración & .env' },
    { id: 'scripts', label: 'Lanzador LAN & Setup' }
  ];

  const filteredFiles = activeCategory === 'all' 
    ? PYTHON_PROJECT_FILES 
    : PYTHON_PROJECT_FILES.filter(f => f.category === activeCategory);

  const handleCopy = () => {
    navigator.clipboard.writeText(selectedFile.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadAll = async () => {
    try {
      setIsZipping(true);
      await exportProjectAsZip();
    } catch (e) {
      console.error(e);
      alert('Error generando el archivo ZIP.');
    } finally {
      setIsZipping(false);
    }
  };

  return (
    <div className="w-full flex flex-col space-y-6">
      
      {/* Header with Download ZIP CTA */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#00f2ff08] border border-[#00f2ff44] p-5 rounded-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-[#00f2ff] opacity-40 pointer-events-none" />
        
        <div>
          <div className="text-[10px] opacity-60 uppercase tracking-[0.2em] text-[#00f2ff] mb-1">
            SOURCE CODE MANIFEST // MULTIPLATFORM REPOSITORY
          </div>
          <h2 className="text-lg font-mono font-bold text-white flex items-center gap-2">
            <Package className="w-5 h-5 text-[#00f2ff]" />
            CÓDIGO FUENTE COMPLETO (BACKEND + FRONTEND CLIENTE)
          </h2>
          <p className="text-xs text-gray-300 mt-1 font-mono">
            Arquitectura desacoplada en <code>backend_servidor/</code> (FastAPI con Function Calling) y <code>frontend_cliente/</code> (Web HUD para Móvil/Tablet).
          </p>
        </div>

        <button
          id="download-project-zip-btn"
          onClick={handleDownloadAll}
          disabled={isZipping}
          className="flex items-center gap-2 px-4 py-2.5 rounded-sm bg-[#00f2ff] hover:bg-[#00d4e0] text-black font-mono font-bold text-xs tracking-wider uppercase transition-all shadow-[0_0_15px_rgba(0,242,255,0.4)] disabled:opacity-50 cursor-pointer"
        >
          <Download className="w-4 h-4" />
          {isZipping ? 'GENERANDO ZIP...' : 'DESCARGAR PROYECTO .ZIP'}
        </button>
      </div>

      {/* Category Filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
        {categories.map((cat) => (
          <button
            key={cat.id}
            id={`filter-cat-${cat.id}`}
            onClick={() => setActiveCategory(cat.id)}
            className={`px-3.5 py-1.5 rounded-sm text-xs font-mono whitespace-nowrap border transition-all cursor-pointer ${
              activeCategory === cat.id
                ? 'bg-[#00f2ff22] text-white border-[#00f2ff] shadow-[0_0_10px_rgba(0,242,255,0.25)]'
                : 'bg-black/40 text-gray-400 border-[#00f2ff22] hover:text-[#00f2ff] hover:border-[#00f2ff55]'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Main Grid: Tree vs Code View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Sidebar: File Tree */}
        <div className="lg:col-span-4 bg-[#00f2ff08] border border-[#00f2ff44] rounded-sm p-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-[#00f2ff] opacity-40 pointer-events-none" />

          <div className="text-xs font-mono font-bold text-white border-b border-[#00f2ff22] pb-2 mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FolderTree className="w-4 h-4 text-[#00f2ff]" />
              <span>ESTRUCTURA DE ARCHIVOS</span>
            </div>
            <span className="text-[10px] text-[#00f2ff] opacity-60 font-mono">{filteredFiles.length} FILES</span>
          </div>

          <div className="space-y-1.5 max-h-[550px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-[#00f2ff33]">
            {filteredFiles.map((file) => {
              const isSelected = selectedFile.path === file.path;
              return (
                <button
                  key={file.path}
                  id={`select-file-${file.filename.replace('.', '_')}`}
                  onClick={() => setSelectedFile(file)}
                  className={`w-full text-left px-3 py-2 rounded-sm font-mono text-xs flex items-center justify-between border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#00f2ff22] text-[#00f2ff] border-[#00f2ff] shadow-[0_0_10px_rgba(0,242,255,0.2)]'
                      : 'bg-black/30 text-gray-300 border-[#00f2ff15] hover:bg-[#00f2ff11] hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <FileCode className={`w-3.5 h-3.5 ${isSelected ? 'text-[#00f2ff]' : 'text-gray-500'}`} />
                    <span className="truncate">{file.path}</span>
                  </div>
                  <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isSelected ? 'rotate-90 text-[#00f2ff]' : 'text-gray-600'}`} />
                </button>
              );
            })}
          </div>

          {/* Quick Info Box */}
          <div className="mt-4 pt-3 border-t border-[#00f2ff22] bg-black/50 rounded-sm p-3 text-[11px] font-mono text-gray-400">
            <div className="text-[#00f2ff] font-bold mb-1">🛡️ Seguridad en Acciones OS:</div>
            Las herramientas con efectos destructivos (como <code>delete_path</code> o <code>shutdown</code>) requieren la validación explícita mediante un token de un solo uso antes de su ejecución.
          </div>
        </div>

        {/* Right Code Viewer */}
        <div className="lg:col-span-8 bg-black border border-[#00f2ff44] rounded-sm p-5 flex flex-col shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-[#00f2ff] opacity-40 pointer-events-none" />

          {/* File Header Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#00f2ff33] pb-3 mb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-sm bg-[#00f2ff15] border border-[#00f2ff55] text-[#00f2ff] font-mono text-[10px] uppercase font-bold">
                  {selectedFile.category}
                </span>
                <h3 className="font-mono text-sm font-bold text-white">
                  {selectedFile.path}
                </h3>
              </div>
              <p className="text-xs text-gray-400 mt-1 font-mono">
                {selectedFile.description}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                id="copy-code-btn"
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-[#00f2ff15] border border-[#00f2ff44] hover:bg-[#00f2ff25] text-[#00f2ff] text-xs font-mono transition-all cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-[#00f2ff]" />}
                {copied ? 'Copiado' : 'Copiar'}
              </button>

              <button
                id="download-file-btn"
                onClick={() => downloadSingleFile(selectedFile.filename, selectedFile.code)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-[#00f2ff22] border border-[#00f2ff] hover:bg-[#00f2ff33] text-white text-xs font-mono transition-all cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-[#00f2ff]" />
                Descargar
              </button>
            </div>
          </div>

          {/* Code Viewer with Syntax Block */}
          <div className="relative bg-[#020617] rounded-sm border border-[#00f2ff22] p-4 overflow-x-auto max-h-[500px] scrollbar-thin scrollbar-thumb-[#00f2ff33]">
            <pre className="font-mono text-xs text-gray-200 leading-relaxed">
              <code>{selectedFile.code}</code>
            </pre>
          </div>

        </div>

      </div>

    </div>
  );
};
