import React, { useEffect, useState } from 'react';
import { AssistantTheme, AssistantVoiceName } from './types';
import { LiveHudSimulator } from './components/LiveHudSimulator';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AuthGate } from './components/AuthGate';
import { warmUpSpeechVoices } from './utils/audioSynth';

export default function App() {
  const [theme, setTheme] = useState<AssistantTheme>('cyan');
  const [assistantName, setAssistantName] = useState<AssistantVoiceName>('Atlas');
  const [speechSynthesisActive, setSpeechSynthesisActive] = useState(true);

  // Dispara la carga de voces del navegador apenas arranca la app, en vez
  // de esperar a la primera vez que Atlas necesite hablar — así esa
  // primera respuesta no cae en la voz por defecto por las prisas.
  useEffect(() => {
    warmUpSpeechVoices();
  }, []);

  return (
    <ErrorBoundary>
      <AuthGate>
        <div translate="no" className="notranslate min-h-screen w-full bg-[#030712] text-slate-100 selection:bg-[#00f2ff33] selection:text-white relative overflow-x-hidden">
          {/* Main Application Cockpit */}
          <LiveHudSimulator
            theme={theme}
            assistantName={assistantName}
            speechSynthesisActiveProp={speechSynthesisActive}
            onThemeChange={setTheme}
            onNameChange={setAssistantName}
          />
        </div>
      </AuthGate>
    </ErrorBoundary>
  );
}
