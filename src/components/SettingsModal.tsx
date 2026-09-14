import React, { useState, useEffect } from 'react';
import { 
  User, LogIn, LogOut, Shield, Sliders, Volume2, Globe, Laptop, 
  Smartphone, FolderLock, FileText, Check, AlertCircle, Sparkles, KeyRound,
  Mail, Lock, UserPlus, Zap
} from 'lucide-react';
import { 
  User as FirebaseUser, signInWithPopup, signOut, onAuthStateChanged,
  signInWithEmailAndPassword, createUserWithEmailAndPassword, signInAnonymously,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc, collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { auth, db, googleProvider } from '../lib/firebase';
import { VoiceSettings, SecurityPermissions, UserNote } from '../types';
import { sciFiAudio } from '../utils/audioSynth';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  voiceSettings: VoiceSettings;
  onUpdateVoiceSettings: (settings: VoiceSettings) => void;
  securityPermissions: SecurityPermissions;
  onUpdatePermissions: (perms: SecurityPermissions) => void;
  onTestVoice: () => void;
  activeModel?: string;
  onSelectModel?: (model: string) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  voiceSettings,
  onUpdateVoiceSettings,
  securityPermissions,
  onUpdatePermissions,
  onTestVoice,
  activeModel = 'gemini-3.8-flash',
  onSelectModel
}) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [activeTab, setActiveTab] = useState<'auth' | 'ai' | 'voice' | 'permissions' | 'cloud_notes'>('ai');
  const [authMode, setAuthMode] = useState<'google' | 'email_login' | 'email_signup'>('google');
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [notes, setNotes] = useState<UserNote[]>([]);

  // Email form fields
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [nameInput, setNameInput] = useState('');

  // Escuchar cambios de Auth de Firebase
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        // Cargar preferencias guardadas en la nube
        try {
          const userDocRef = doc(db, 'users', user.uid, 'settings', 'preferences');
          const docSnap = await getDoc(userDocRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.voiceSettings) onUpdateVoiceSettings(data.voiceSettings);
            if (data.securityPermissions) onUpdatePermissions(data.securityPermissions);
          }
        } catch (e) {
          console.error('Error cargando preferencias de nube:', e);
        }
      }
    });

    return () => unsubscribe();
  }, [onUpdateVoiceSettings, onUpdatePermissions]);

  // Escuchar notas y actividades del usuario sincronizadas
  useEffect(() => {
    if (!currentUser) {
      setNotes([]);
      return;
    }

    try {
      const notesRef = collection(db, 'users', currentUser.uid, 'notes');
      const q = query(notesRef, orderBy('createdAt', 'desc'), limit(15));
      const unsub = onSnapshot(q, (snapshot) => {
        const list: UserNote[] = [];
        snapshot.forEach((d) => {
          list.push({ id: d.id, ...d.data() } as UserNote);
        });
        setNotes(list);
      });
      return () => unsub();
    } catch (e) {
      console.error('Error escuchando notas de Firestore:', e);
    }
  }, [currentUser]);

  // Obtener voces nativas del sistema
  useEffect(() => {
    const updateVoices = () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        const v = window.speechSynthesis.getVoices();
        setAvailableVoices(v);
      }
    };
    updateVoices();
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }
  }, []);

  const handleGoogleSignIn = async () => {
    setAuthLoading(true);
    setAuthError(null);
    sciFiAudio.playBlip();
    try {
      const res = await signInWithPopup(auth, googleProvider);
      if (res.user) {
        sciFiAudio.playConfirmSound();
        // Guardar perfil inicial en Firestore
        await setDoc(doc(db, 'users', res.user.uid), {
          displayName: res.user.displayName || 'Usuario Stark',
          email: res.user.email,
          photoURL: res.user.photoURL,
          lastLogin: new Date().toISOString()
        }, { merge: true });
      }
    } catch (err: any) {
      console.error('Error al iniciar sesión con Google:', err);
      if (err.code === 'auth/popup-blocked' || err.message?.includes('invalid') || err.message?.includes('popup')) {
        setAuthError('El navegador o la ventana de escritorio bloqueó el popup de Google. Puedes usar "Correo y Contraseña" o "Acceso Rápido" abajo para conectar de inmediato.');
      } else {
        setAuthError(err.message || 'Error al conectar con Google.');
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput || !passwordInput) return;
    setAuthLoading(true);
    setAuthError(null);
    sciFiAudio.playBlip();
    try {
      const res = await signInWithEmailAndPassword(auth, emailInput, passwordInput);
      if (res.user) {
        sciFiAudio.playConfirmSound();
      }
    } catch (err: any) {
      console.error('Error login email:', err);
      setAuthError(err.message?.includes('user-not-found') || err.message?.includes('wrong-password') || err.message?.includes('invalid-credential')
        ? 'Correo o contraseña incorrectos. Si aún no tienes cuenta, usa la opción "Crear Cuenta".'
        : err.message || 'Error al iniciar sesión con correo.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput || !passwordInput) return;
    if (passwordInput.length < 6) {
      setAuthError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    setAuthLoading(true);
    setAuthError(null);
    sciFiAudio.playBlip();
    try {
      const res = await createUserWithEmailAndPassword(auth, emailInput, passwordInput);
      if (res.user) {
        if (nameInput) {
          await updateProfile(res.user, { displayName: nameInput });
        }
        await setDoc(doc(db, 'users', res.user.uid), {
          displayName: nameInput || res.user.email?.split('@')[0] || 'Comandante Stark',
          email: res.user.email,
          createdAt: new Date().toISOString()
        }, { merge: true });
        sciFiAudio.playConfirmSound();
      }
    } catch (err: any) {
      console.error('Error signup email:', err);
      setAuthError(err.message?.includes('email-already-in-use')
        ? 'Este correo ya está registrado. Selecciona "Iniciar Sesión".'
        : err.message || 'Error al registrar la cuenta.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleAnonymousSignIn = async () => {
    setAuthLoading(true);
    setAuthError(null);
    sciFiAudio.playBlip();
    try {
      const res = await signInAnonymously(auth);
      if (res.user) {
        sciFiAudio.playConfirmSound();
        await setDoc(doc(db, 'users', res.user.uid), {
          displayName: 'Comandante Local (Stark)',
          isAnonymous: true,
          createdAt: new Date().toISOString()
        }, { merge: true });
      }
    } catch (err: any) {
      console.error('Error anonymous login:', err);
      setAuthError(err.message || 'Error al iniciar modo invitado.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignOut = async () => {
    sciFiAudio.playBlip();
    await signOut(auth);
  };

  const saveSettingsToCloud = async () => {
    sciFiAudio.playConfirmSound();
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);

    if (currentUser) {
      try {
        await setDoc(doc(db, 'users', currentUser.uid, 'settings', 'preferences'), {
          voiceSettings,
          securityPermissions,
          updatedAt: new Date().toISOString()
        }, { merge: true });
      } catch (e) {
        console.error('Error guardando en Firestore:', e);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto font-mono">
      <div className="bg-[#020617] border-2 border-[#00f2ff] p-6 max-w-3xl w-full rounded-sm space-y-5 shadow-[0_0_50px_rgba(0,242,255,0.25)] relative my-8 text-white">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#00f2ff33] pb-3">
          <div className="flex items-center gap-2.5 font-bold text-base text-[#00f2ff]">
            <Sliders className="w-5 h-5" />
            CENTRO DE CONTROL & SINCRONIZACIÓN // STARK PROTOCOL
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-xs px-2.5 py-1 bg-black/60 border border-[#00f2ff33] rounded-sm cursor-pointer"
          >
            ✕ CERRAR
          </button>
        </div>

        {/* Tabs Bar */}
        <div className="flex flex-wrap gap-2 border-b border-[#00f2ff22] pb-2">
          <button
            onClick={() => setActiveTab('ai')}
            className={`px-3 py-1.5 text-xs font-bold rounded-sm border transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'ai'
                ? 'bg-[#00f2ff] text-black border-[#00f2ff]'
                : 'bg-black/60 text-gray-300 border-[#00f2ff33] hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            MOTOR IA // GEMINI
          </button>

          <button
            onClick={() => setActiveTab('auth')}
            className={`px-3 py-1.5 text-xs font-bold rounded-sm border transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'auth'
                ? 'bg-[#00f2ff] text-black border-[#00f2ff]'
                : 'bg-black/60 text-gray-300 border-[#00f2ff33] hover:text-white'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            {currentUser ? 'CUENTA GOOGLE' : 'LOGIN CON GOOGLE'}
          </button>

          <button
            onClick={() => setActiveTab('voice')}
            className={`px-3 py-1.5 text-xs font-bold rounded-sm border transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'voice'
                ? 'bg-[#00f2ff] text-black border-[#00f2ff]'
                : 'bg-black/60 text-gray-300 border-[#00f2ff33] hover:text-white'
            }`}
          >
            <Volume2 className="w-3.5 h-3.5" />
            MODULADOR DE VOZ
          </button>

          <button
            onClick={() => setActiveTab('permissions')}
            className={`px-3 py-1.5 text-xs font-bold rounded-sm border transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'permissions'
                ? 'bg-[#00f2ff] text-black border-[#00f2ff]'
                : 'bg-black/60 text-gray-300 border-[#00f2ff33] hover:text-white'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            PERMISOS Y CONTROL
          </button>

          <button
            onClick={() => setActiveTab('cloud_notes')}
            className={`px-3 py-1.5 text-xs font-bold rounded-sm border transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'cloud_notes'
                ? 'bg-[#00f2ff] text-black border-[#00f2ff]'
                : 'bg-black/60 text-gray-300 border-[#00f2ff33] hover:text-white'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            SINCRONIZACIÓN MÓVIL / PC
          </button>
        </div>

        {/* Tab 0: AI Models Selector & Cloud Intelligence */}
        {activeTab === 'ai' && (
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-[#00f2ff08] border border-[#00f2ff33] rounded-sm space-y-1">
              <div className="font-bold text-[#00f2ff] flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" />
                CEREBRO PRINCIPAL: GOOGLE GEMINI CLOUD (ATLAS AI 2.0)
              </div>
              <p className="text-gray-300 text-[11px] leading-relaxed">
                ATLAS 2.0 utiliza Google Gemini como motor principal en la nube con arquitectura de herramientas (Function Calling), seguridad por listas blancas y memoria persistente.
              </p>
            </div>

            <div className="space-y-2.5">
              <div className="font-bold text-gray-300">Modelos Disponibles:</div>
              
              {[
                {
                  id: 'gemini-3.8-flash',
                  name: 'Gemini 3.8 Flash (Recomendado)',
                  tag: 'Predeterminado / Rápido',
                  desc: 'Excelente equilibrio entre velocidad ultra rápida, razonamiento táctico, visión y bajo consumo de cuota.'
                },
                {
                  id: 'gemini-3.1-pro-preview',
                  name: 'Gemini 3.1 Pro',
                  tag: 'Razonamiento Complejo',
                  desc: 'Máxima potencia para generación y arquitectura de código complejo, planificación y análisis profundo.'
                },
                {
                  id: 'gemini-3.1-flash-lite',
                  name: 'Gemini 3.1 Flash Lite',
                  tag: 'Mínima Latencia',
                  desc: 'Optimizado para la menor latencia en tiempo de respuesta durante comandos de voz continuos.'
                },
                {
                  id: 'gemini-flash-latest',
                  name: 'Gemini Flash Latest',
                  tag: 'Canal Estable',
                  desc: 'Versión estable de última generación con soporte completo para navegación e integración.'
                }
              ].map((model) => (
                <div
                  key={model.id}
                  onClick={() => onSelectModel && onSelectModel(model.id)}
                  className={`p-3 rounded-sm border transition-all cursor-pointer flex items-center justify-between ${
                    activeModel === model.id
                      ? 'bg-[#00f2ff15] border-[#00f2ff] shadow-[0_0_15px_rgba(0,242,255,0.2)]'
                      : 'bg-black/50 border-[#00f2ff22] hover:border-[#00f2ff44]'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-xs">{model.name}</span>
                      <span className="text-[10px] px-1.5 py-0.5 bg-[#00f2ff22] text-[#00f2ff] rounded-sm font-semibold">
                        {model.tag}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-400">{model.desc}</p>
                  </div>
                  <div className="pl-3">
                    {activeModel === model.id ? (
                      <span className="text-emerald-400 font-bold flex items-center gap-1">
                        <Check className="w-4 h-4" /> ACTIVO
                      </span>
                    ) : (
                      <span className="text-gray-500 hover:text-white">SELECCIONAR</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 1: Google Authentication & Account Sync */}
        {activeTab === 'auth' && (
          <div className="space-y-4">
            {currentUser ? (
              <div className="p-4 bg-[#00f2ff08] border border-[#00f2ff44] rounded-sm space-y-3">
                <div className="flex items-center gap-3">
                  {currentUser.photoURL ? (
                    <img 
                      src={currentUser.photoURL} 
                      alt="Avatar" 
                      className="w-12 h-12 rounded-full border-2 border-[#00f2ff]" 
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-[#00f2ff22] border border-[#00f2ff] flex items-center justify-center">
                      <User className="w-6 h-6 text-[#00f2ff]" />
                    </div>
                  )}
                  <div>
                    <div className="text-sm font-bold text-white flex items-center gap-2">
                      <span>{currentUser.displayName || (currentUser.isAnonymous ? 'Comandante Local' : 'Usuario Stark')}</span>
                      <span className="text-[10px] bg-emerald-950 border border-emerald-500/60 text-emerald-400 px-2 py-0.5 rounded-sm">
                        {currentUser.isAnonymous ? 'MODO CLOUD LOCAL' : 'SINCRONIZADO'}
                      </span>
                    </div>
                    <div className="text-xs text-gray-400">{currentUser.email || 'Acceso por Token de Dispositivo'}</div>
                    <div className="text-[10px] text-[#00f2ff] mt-0.5">UID: {currentUser.uid}</div>
                  </div>
                </div>

                <div className="p-3 bg-black/60 border border-[#00f2ff22] text-xs text-gray-300 rounded-sm">
                  ⚡ Tu sesión está conectada con Firebase Cloud. Todas tus notas, búsquedas y ajustes se sincronizan automáticamente en tiempo real.
                </div>

                <button
                  onClick={handleSignOut}
                  className="px-4 py-2 bg-red-950/60 border border-red-500/60 hover:bg-red-900 text-red-300 text-xs font-bold rounded-sm flex items-center gap-2 cursor-pointer"
                >
                  <LogOut className="w-4 h-4" /> CERRAR SESIÓN
                </button>
              </div>
            ) : (
              <div className="p-5 bg-black/60 border border-[#00f2ff33] rounded-sm space-y-4">
                
                {/* Method Switcher Header */}
                <div className="flex items-center justify-between border-b border-[#00f2ff22] pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <KeyRound className="w-4 h-4 text-[#00f2ff]" />
                      VINCULACIÓN & ACCESO A LA NUBE
                    </h3>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Conéctate para sincronizar notas, comandos y hardware entre tu PC y tu teléfono móvil.
                    </p>
                  </div>
                </div>

                {/* Error Banner */}
                {authError && (
                  <div className="p-3 bg-red-950/70 border border-red-500/80 rounded-sm text-xs text-red-200 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    <div>{authError}</div>
                  </div>
                )}

                {/* Mode Tabs */}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => { setAuthMode('google'); setAuthError(null); }}
                    className={`flex-1 py-2 text-xs font-bold rounded-sm border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      authMode === 'google'
                        ? 'bg-[#00f2ff22] text-[#00f2ff] border-[#00f2ff]'
                        : 'bg-black/40 text-gray-400 border-gray-800 hover:text-white'
                    }`}
                  >
                    <Globe className="w-3.5 h-3.5" />
                    Google OAuth
                  </button>

                  <button
                    type="button"
                    onClick={() => { setAuthMode('email_login'); setAuthError(null); }}
                    className={`flex-1 py-2 text-xs font-bold rounded-sm border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      authMode === 'email_login' || authMode === 'email_signup'
                        ? 'bg-[#00f2ff22] text-[#00f2ff] border-[#00f2ff]'
                        : 'bg-black/40 text-gray-400 border-gray-800 hover:text-white'
                    }`}
                  >
                    <Mail className="w-3.5 h-3.5" />
                    Correo y Contraseña
                  </button>
                </div>

                {/* Option 1: Google OAuth */}
                {authMode === 'google' && (
                  <div className="text-center py-4 space-y-3">
                    <p className="text-xs text-gray-300">
                      Inicia sesión con un clic usando tu cuenta de Google.
                    </p>
                    <button
                      onClick={handleGoogleSignIn}
                      disabled={authLoading}
                      className="px-6 py-3 bg-[#00f2ff] hover:bg-[#00d4e0] text-black text-xs font-bold rounded-sm inline-flex items-center gap-2 shadow-[0_0_20px_rgba(0,242,255,0.4)] cursor-pointer transition-all disabled:opacity-50"
                    >
                      <LogIn className="w-4 h-4" />
                      {authLoading ? 'CONECTANDO CON GOOGLE...' : 'INICIAR SESIÓN CON GOOGLE'}
                    </button>
                  </div>
                )}

                {/* Option 2: Email & Password */}
                {(authMode === 'email_login' || authMode === 'email_signup') && (
                  <form onSubmit={authMode === 'email_login' ? handleEmailSignIn : handleEmailSignUp} className="space-y-3 pt-1">
                    {authMode === 'email_signup' && (
                      <div className="space-y-1">
                        <label className="text-[11px] text-gray-300 font-bold flex items-center gap-1">
                          <User className="w-3 h-3 text-[#00f2ff]" /> Tu Nombre o Alias:
                        </label>
                        <input
                          type="text"
                          required
                          value={nameInput}
                          onChange={(e) => setNameInput(e.target.value)}
                          placeholder="Ej: Josias Stark"
                          className="w-full bg-black/80 border border-[#00f2ff44] px-3 py-2 text-xs text-white focus:outline-none focus:border-[#00f2ff] rounded-sm"
                        />
                      </div>
                    )}

                    <div className="space-y-1">
                      <label className="text-[11px] text-gray-300 font-bold flex items-center gap-1">
                        <Mail className="w-3 h-3 text-[#00f2ff]" /> Correo Electrónico:
                      </label>
                      <input
                        type="email"
                        required
                        value={emailInput}
                        onChange={(e) => setEmailInput(e.target.value)}
                        placeholder="tu-correo@ejemplo.com"
                        className="w-full bg-black/80 border border-[#00f2ff44] px-3 py-2 text-xs text-white focus:outline-none focus:border-[#00f2ff] rounded-sm"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] text-gray-300 font-bold flex items-center gap-1">
                        <Lock className="w-3 h-3 text-[#00f2ff]" /> Contraseña:
                      </label>
                      <input
                        type="password"
                        required
                        value={passwordInput}
                        onChange={(e) => setPasswordInput(e.target.value)}
                        placeholder="Mínimo 6 caracteres"
                        className="w-full bg-black/80 border border-[#00f2ff44] px-3 py-2 text-xs text-white focus:outline-none focus:border-[#00f2ff] rounded-sm"
                      />
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setAuthMode(authMode === 'email_login' ? 'email_signup' : 'email_login');
                          setAuthError(null);
                        }}
                        className="text-xs text-[#00f2ff] hover:underline cursor-pointer"
                      >
                        {authMode === 'email_login' ? '¿No tienes cuenta? Crear una' : '¿Ya tienes cuenta? Iniciar Sesión'}
                      </button>

                      <button
                        type="submit"
                        disabled={authLoading}
                        className="px-5 py-2.5 bg-[#00f2ff] hover:bg-[#00d4e0] text-black text-xs font-bold rounded-sm flex items-center gap-1.5 shadow-[0_0_15px_rgba(0,242,255,0.3)] cursor-pointer disabled:opacity-50"
                      >
                        {authMode === 'email_login' ? <LogIn className="w-3.5 h-3.5" /> : <UserPlus className="w-3.5 h-3.5" />}
                        {authLoading ? 'PROCESANDO...' : authMode === 'email_login' ? 'INICIAR SESIÓN' : 'REGISTRARME'}
                      </button>
                    </div>
                  </form>
                )}

                {/* Option 3: Quick Instant Guest Access */}
                <div className="border-t border-[#00f2ff22] pt-3 flex items-center justify-between text-xs">
                  <span className="text-gray-400 text-[11px]">¿Quieres probar la sincronización de inmediato?</span>
                  <button
                    type="button"
                    onClick={handleAnonymousSignIn}
                    disabled={authLoading}
                    className="text-xs font-bold text-amber-400 hover:text-amber-300 border border-amber-500/40 bg-amber-950/30 px-3 py-1.5 rounded-sm flex items-center gap-1.5 cursor-pointer"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    Acceso Rápido Instantáneo
                  </button>
                </div>

              </div>
            )}
          </div>
        )}

        {/* Tab 2: Voice Customization */}
        {activeTab === 'voice' && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Voice Selector */}
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-gray-300 font-bold">Voz del Sistema (Síntesis Neural):</label>
                <select
                  value={voiceSettings.voiceURI || ''}
                  onChange={(e) => onUpdateVoiceSettings({ ...voiceSettings, voiceURI: e.target.value })}
                  className="w-full bg-black/80 border border-[#00f2ff44] px-3 py-2 text-xs text-white focus:outline-none focus:border-[#00f2ff] rounded-sm"
                >
                  <option value="">-- Voz por defecto en Español --</option>
                  {availableVoices
                    .filter((v) => v.lang.startsWith('es') || v.lang.startsWith('en'))
                    .map((v) => (
                      <option key={v.voiceURI} value={v.voiceURI} className="bg-slate-900 text-white">
                        {v.name} ({v.lang})
                      </option>
                    ))}
                </select>
              </div>

              {/* Pitch Slider */}
              <div className="space-y-1.5 bg-black/60 border border-[#00f2ff22] p-3 rounded-sm">
                <div className="flex justify-between font-bold text-gray-300">
                  <span>Tono / Pitch:</span>
                  <span className="text-[#00f2ff]">{voiceSettings.pitch}x</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="1.5"
                  step="0.1"
                  value={voiceSettings.pitch}
                  onChange={(e) => onUpdateVoiceSettings({ ...voiceSettings, pitch: parseFloat(e.target.value) })}
                  className="w-full accent-[#00f2ff] cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-gray-500">
                  <span>Grave (Robótico)</span>
                  <span>Agudo (Femenino)</span>
                </div>
              </div>

              {/* Rate / Speed Slider */}
              <div className="space-y-1.5 bg-black/60 border border-[#00f2ff22] p-3 rounded-sm">
                <div className="flex justify-between font-bold text-gray-300">
                  <span>Velocidad / Rate:</span>
                  <span className="text-[#00f2ff]">{voiceSettings.rate}x</span>
                </div>
                <input
                  type="range"
                  min="0.7"
                  max="1.5"
                  step="0.05"
                  value={voiceSettings.rate}
                  onChange={(e) => onUpdateVoiceSettings({ ...voiceSettings, rate: parseFloat(e.target.value) })}
                  className="w-full accent-[#00f2ff] cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-gray-500">
                  <span>Lenta / Pausada</span>
                  <span>Rápida / Dinámica</span>
                </div>
              </div>

              {/* Volume Slider */}
              <div className="space-y-1.5 bg-black/60 border border-[#00f2ff22] p-3 rounded-sm sm:col-span-2">
                <div className="flex justify-between font-bold text-gray-300">
                  <span>Volumen de Respuesta:</span>
                  <span className="text-emerald-400">{Math.round(voiceSettings.volume * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="1"
                  step="0.1"
                  value={voiceSettings.volume}
                  onChange={(e) => onUpdateVoiceSettings({ ...voiceSettings, volume: parseFloat(e.target.value) })}
                  className="w-full accent-emerald-400 cursor-pointer"
                />
              </div>

              {/* Natural Interruption & Continuous Conversation */}
              <label className="flex items-center justify-between p-3 bg-black/60 border border-[#00f2ff22] rounded-sm cursor-pointer hover:border-[#00f2ff44]">
                <div>
                  <div className="font-bold text-white">Interrupción Natural al Hablar</div>
                  <div className="text-[11px] text-gray-400">Si comienzas a hablar, ATLAS pausará su voz de inmediato para escucharte.</div>
                </div>
                <input
                  type="checkbox"
                  checked={voiceSettings.interruptOnSpeech ?? true}
                  onChange={(e) => onUpdateVoiceSettings({ ...voiceSettings, interruptOnSpeech: e.target.checked })}
                  className="w-4 h-4 accent-[#00f2ff] cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-3 bg-black/60 border border-[#00f2ff22] rounded-sm cursor-pointer hover:border-[#00f2ff44]">
                <div>
                  <div className="font-bold text-white">Modo Conversación Continua</div>
                  <div className="text-[11px] text-gray-400">Reabre el micrófono tras responder para mantener un diálogo natural sin clics repetidos.</div>
                </div>
                <input
                  type="checkbox"
                  checked={voiceSettings.continuousConversation ?? false}
                  onChange={(e) => onUpdateVoiceSettings({ ...voiceSettings, continuousConversation: e.target.checked })}
                  className="w-4 h-4 accent-emerald-400 cursor-pointer"
                />
              </label>

            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={onTestVoice}
                className="px-4 py-2 bg-[#00f2ff22] hover:bg-[#00f2ff33] border border-[#00f2ff] text-[#00f2ff] font-bold rounded-sm flex items-center gap-2 cursor-pointer"
              >
                <Volume2 className="w-4 h-4" /> PROBAR VOZ AHORA
              </button>
            </div>
          </div>
        )}

        {/* Tab 3: Security & Access Permissions Control */}
        {activeTab === 'permissions' && (
          <div className="space-y-3 text-xs">
            <p className="text-gray-400">
              Tú tienes el control total de qué herramientas puede ejecutar JARVIS en tu PC o en la nube:
            </p>

            <div className="space-y-2">
              {/* Permission: Web Search */}
              <label className="flex items-center justify-between p-3 bg-black/60 border border-[#00f2ff22] rounded-sm cursor-pointer hover:border-[#00f2ff44]">
                <div className="flex items-center gap-2.5">
                  <Globe className="w-4 h-4 text-[#00f2ff]" />
                  <div>
                    <div className="font-bold text-white">Búsqueda en Internet en Tiempo Real</div>
                    <div className="text-[11px] text-gray-400">Permite a JARVIS navegar en Google y recopilar datos actuales.</div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={securityPermissions.allowWebSearch}
                  onChange={(e) => onUpdatePermissions({ ...securityPermissions, allowWebSearch: e.target.checked })}
                  className="w-4 h-4 accent-[#00f2ff] cursor-pointer"
                />
              </label>

              {/* Permission: Open Apps */}
              <label className="flex items-center justify-between p-3 bg-black/60 border border-[#00f2ff22] rounded-sm cursor-pointer hover:border-[#00f2ff44]">
                <div className="flex items-center gap-2.5">
                  <Laptop className="w-4 h-4 text-emerald-400" />
                  <div>
                    <div className="font-bold text-white">Apertura y Lanzamiento de Programas (VS Code, Chrome, etc.)</div>
                    <div className="text-[11px] text-gray-400">Ejecuta binarios y aplicaciones en tu sistema operativo.</div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={securityPermissions.allowOpenApps}
                  onChange={(e) => onUpdatePermissions({ ...securityPermissions, allowOpenApps: e.target.checked })}
                  className="w-4 h-4 accent-emerald-400 cursor-pointer"
                />
              </label>

              {/* Permission: File & Folder creation */}
              <label className="flex items-center justify-between p-3 bg-black/60 border border-[#00f2ff22] rounded-sm cursor-pointer hover:border-[#00f2ff44]">
                <div className="flex items-center gap-2.5">
                  <FolderLock className="w-4 h-4 text-amber-400" />
                  <div>
                    <div className="font-bold text-white">Creación de Carpetas y Guardado de Archivos</div>
                    <div className="text-[11px] text-gray-400">Crea directorios en el Escritorio y genera archivos de notas.</div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={securityPermissions.allowCreateFiles}
                  onChange={(e) => onUpdatePermissions({ ...securityPermissions, allowCreateFiles: e.target.checked })}
                  className="w-4 h-4 accent-amber-400 cursor-pointer"
                />
              </label>

              {/* Permission: Terminal Confirmation */}
              <label className="flex items-center justify-between p-3 bg-black/60 border border-[#00f2ff22] rounded-sm cursor-pointer hover:border-[#00f2ff44]">
                <div className="flex items-center gap-2.5">
                  <Shield className="w-4 h-4 text-purple-400" />
                  <div>
                    <div className="font-bold text-white">Exigir Confirmación en Pantalla para Acciones Críticas</div>
                    <div className="text-[11px] text-gray-400">Muestra un diálogo de seguridad antes de borrar archivos o apagar.</div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={securityPermissions.requireConfirmForTerminal}
                  onChange={(e) => onUpdatePermissions({ ...securityPermissions, requireConfirmForTerminal: e.target.checked })}
                  className="w-4 h-4 accent-purple-400 cursor-pointer"
                />
              </label>
            </div>
          </div>
        )}

        {/* Tab 4: Cloud Notes & Mobile Activity Sync */}
        {activeTab === 'cloud_notes' && (
          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <div className="font-bold text-[#00f2ff]">HISTORIAL & NOTAS SINCRONIZADAS EN TIEMPO REAL:</div>
              <span className="text-gray-400 text-[11px]">{notes.length} registros</span>
            </div>

            {notes.length === 0 ? (
              <div className="p-6 bg-black/60 border border-[#00f2ff22] rounded-sm text-center text-gray-400">
                {currentUser ? (
                  <>
                    <FileText className="w-8 h-8 mx-auto mb-2 text-gray-600" />
                    No hay notas sincronizadas aún. Pídele a JARVIS: *"Guarda una nota llamada Ideas con el contenido..."*
                  </>
                ) : (
                  <>
                    <LogIn className="w-8 h-8 mx-auto mb-2 text-[#00f2ff]" />
                    Inicia sesión con Google en la pestaña "CUENTA GOOGLE" para ver tus datos sincronizados desde tu teléfono.
                  </>
                )}
              </div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {notes.map((n) => (
                  <div key={n.id} className="p-3 bg-black/80 border border-[#00f2ff33] rounded-sm space-y-1">
                    <div className="flex justify-between items-center text-[#00f2ff] font-bold">
                      <span>📄 {n.title}</span>
                      <span className="text-[10px] text-gray-500">{new Date(n.createdAt).toLocaleString()}</span>
                    </div>
                    <p className="text-gray-300 text-[11px]">{n.content}</p>
                    {n.syncedFrom && (
                      <span className="text-[9px] bg-slate-800 text-gray-400 px-1.5 py-0.5 rounded-sm">
                        Creado desde: {n.syncedFrom}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Modal Footer */}
        <div className="pt-3 border-t border-[#00f2ff33] flex items-center justify-between">
          <div className="text-[11px] text-emerald-400 flex items-center gap-1.5">
            {saveSuccess && (
              <>
                <Check className="w-3.5 h-3.5" /> ¡Preferencias guardadas y sincronizadas!
              </>
            )}
          </div>

          <div className="flex gap-2">
            <button
              onClick={saveSettingsToCloud}
              className="px-4 py-2 bg-[#00f2ff] hover:bg-[#00d4e0] text-black font-bold text-xs rounded-sm shadow-[0_0_15px_rgba(0,242,255,0.4)] cursor-pointer"
            >
              GUARDAR PREFERENCIAS
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
