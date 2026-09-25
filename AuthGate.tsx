import React, { useEffect, useState } from 'react';

interface AuthGateProps {
  children: React.ReactNode;
}

// Antes la app no pedía ninguna credencial: cualquiera que abriera la URL
// (en red local, o en internet si algún día se despliega) podía usar Atlas
// para controlar el equipo. Este componente bloquea el render de la app
// hasta que /api/auth/status confirme una sesión válida.
export function AuthGate({ children }: AuthGateProps) {
  const [status, setStatus] = useState<'checking' | 'authenticated' | 'locked' | 'unconfigured'>('checking');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const checkStatus = async () => {
    try {
      const res = await fetch('/api/auth/status', { credentials: 'same-origin' });
      const data = await res.json();
      if (data.authenticated) {
        setStatus('authenticated');
      } else if (!data.passwordConfigured) {
        setStatus('unconfigured');
      } else {
        setStatus('locked');
      }
    } catch {
      setStatus('locked');
    }
  };

  useEffect(() => {
    checkStatus();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ password })
      });
      const data = await res.json();
      if (data.success) {
        setStatus('authenticated');
      } else {
        setError(data.error || 'No se pudo iniciar sesión.');
      }
    } catch {
      setError('No se pudo comunicar con el servidor de Atlas.');
    } finally {
      setSubmitting(false);
      setPassword('');
    }
  };

  if (status === 'checking') {
    return (
      <div className="min-h-screen w-full bg-[#030712] flex items-center justify-center text-cyan-400 text-sm tracking-widest">
        VERIFICANDO SESIÓN...
      </div>
    );
  }

  if (status === 'authenticated') {
    return <>{children}</>;
  }

  if (status === 'unconfigured') {
    return (
      <div className="min-h-screen w-full bg-[#030712] flex items-center justify-center p-6">
        <div className="max-w-md w-full rounded-2xl border border-amber-500/30 bg-amber-500/5 p-6 text-amber-200 text-sm space-y-2">
          <p className="font-semibold">Atlas todavía no tiene contraseña configurada.</p>
          <p className="text-amber-300/80">
            Define <code className="px-1 rounded bg-black/30">ATLAS_ACCESS_PASSWORD</code> en tu archivo <code className="px-1 rounded bg-black/30">.env</code> y reinicia el servidor. Mientras esté vacía, nadie puede iniciar sesión y la interfaz se queda bloqueada aquí a propósito.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#030712] flex items-center justify-center p-6">
      <form
        onSubmit={handleSubmit}
        className="max-w-sm w-full rounded-2xl border border-[#00f2ff33] bg-[#050c20]/90 p-6 space-y-4 shadow-[0_0_40px_-10px_rgba(0,242,255,0.25)]"
      >
        <div className="text-center space-y-1">
          <div className="text-cyan-400 text-xs tracking-[0.3em]">A.T.L.A.S.</div>
          <div className="text-slate-300 text-sm">Acceso restringido</div>
        </div>
        <input
          type="password"
          autoFocus
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Contraseña"
          className="w-full rounded-xl bg-black/40 border border-[#00f2ff22] px-4 py-2.5 text-slate-100 placeholder-slate-500 outline-none focus:border-cyan-400/60"
        />
        {error && <div className="text-red-400 text-xs">{error}</div>}
        <button
          type="submit"
          disabled={submitting || !password}
          className="w-full rounded-xl bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 py-2.5 text-sm tracking-wide hover:bg-cyan-500/30 transition disabled:opacity-40"
        >
          {submitting ? 'Verificando…' : 'Entrar'}
        </button>
      </form>
    </div>
  );
}
