import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { X, Save, Building2 } from 'lucide-react';

interface NewClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function NewClientModal({ isOpen, onClose, onSuccess }: NewClientModalProps) {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    try {
      if (!supabase) throw new Error('Base de datos no configurada. Revisa las variables de entorno.');
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No hay sesión activa.');

      const { error } = await supabase.from('clients').insert([{ 
        name,
        user_id: session.user.id
      }]);
      if (error) throw error;
      
      onSuccess();
      onClose();
      setName('');
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xl z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
      <div className="bg-card border border-border rounded-[2.5rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="flex justify-between items-center p-8 border-b border-border bg-secondary/20">
          <div>
            <h2 className="text-2xl font-black flex items-center gap-3 text-foreground tracking-tight">
              <div className="bg-accent/20 p-2 rounded-xl">
                <Building2 className="w-6 h-6 text-accent" />
              </div>
              Nuevo Cliente
            </h2>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-secondary rounded-full transition-colors text-muted-foreground"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          <div className="space-y-3">
            <label className="block text-[10px] font-black uppercase text-muted-foreground tracking-widest pl-1">Nombre de la Empresa</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-secondary border border-border rounded-2xl px-6 py-4 text-lg font-bold text-foreground focus:ring-4 focus:ring-accent/20 transition-all outline-none"
              placeholder="Ej. Acme Corp"
              autoFocus
            />
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-4 font-bold text-muted-foreground hover:bg-secondary rounded-2xl transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-[2] bg-primary text-primary-foreground hover:opacity-90 py-4 rounded-2xl font-black flex items-center justify-center gap-3 transition-all disabled:opacity-50 shadow-xl shadow-primary/10"
            >
              {loading ? 'Guardando...' : <><Save className="w-5 h-5" /> Crear Cliente</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
