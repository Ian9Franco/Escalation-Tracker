'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Lock, User, ArrowRight, Activity, AlertTriangle } from 'lucide-react';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Map username to internal email
    const email = username === 'ianp' ? 'ian9franco@gmail.com' : (username.includes('@') ? username : `${username}@fanger.design`);

    try {
      if (!supabase) throw new Error('Base de datos no conectada. Revisa Vercel env vars.');
      
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) throw signInError;

      router.push('/dashboard');
      router.refresh();
    } catch (err: any) {
      setError(err.message === 'Invalid login credentials' ? 'Credenciales incorrectas' : err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6 selection:bg-accent selection:text-white">
      <div className="w-full max-w-md animate-in fade-in zoom-in-95 duration-700">
        
        {/* Logo/Branding */}
        <div className="text-center mb-10 space-y-4">
          <div className="relative inline-block group">
            <div className="absolute -inset-2 bg-gradient-to-r from-accent to-orange-400 rounded-full blur opacity-30 group-hover:opacity-100 transition duration-1000"></div>
            <img 
              src="/android-chrome-192x192.png" 
              alt="Logo" 
              className="relative w-20 h-20 rounded-full border border-white/10 mx-auto shadow-2xl"
            />
          </div>
          <h1 className="text-3xl font-black uppercase italic tracking-tighter">Escalation Tracker</h1>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-[0.3em]">Acceso de Administrador</p>
        </div>

        {/* Login Card */}
        <div className="card-widget p-10 space-y-8 bg-card border-white/5 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.5)]">
          <form onSubmit={handleLogin} className="space-y-6">
            
            <div className="space-y-3">
              <label className="block text-[10px] font-black uppercase text-muted-foreground tracking-widest pl-1 flex items-center gap-2">
                <User className="w-3 h-3 text-accent" /> Usuario
              </label>
              <input
                required
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-secondary/50 border border-border rounded-2xl px-6 py-4 font-bold text-foreground focus:ring-4 focus:ring-accent/20 transition-all outline-none"
                placeholder="ianp"
                autoFocus
                autoComplete="username"
              />
            </div>

            <div className="space-y-3">
              <label className="block text-[10px] font-black uppercase text-muted-foreground tracking-widest pl-1 flex items-center gap-2">
                <Lock className="w-3 h-3 text-accent" /> Contraseña
              </label>
              <input
                required
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-secondary/50 border border-border rounded-2xl px-6 py-4 font-bold text-foreground focus:ring-4 focus:ring-accent/20 transition-all outline-none"
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </div>

            {error && (
              <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-2xl flex items-center gap-3 text-destructive animate-in shake-in duration-300">
                <AlertTriangle className="w-5 h-5" />
                <p className="text-xs font-bold">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-accent text-white py-5 rounded-2xl font-black text-lg shadow-[0_15px_40px_-10px_rgba(255,69,0,0.5)] hover:scale-[1.02] active:scale-95 transition-all uppercase italic flex items-center justify-center gap-4 group"
            >
              {loading ? (
                <Activity className="w-6 h-6 animate-spin" />
              ) : (
                <>
                  Ingresar <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer Link */}
        <div className="text-center mt-10">
          <a 
            href="https://www.fangerdesign.com.ar/contacto/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em] hover:text-accent transition-colors"
          >
            Powered by fanger.design
          </a>
        </div>
      </div>
    </div>
  );
}
