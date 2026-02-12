'use client';

import { Percent } from 'lucide-react';

interface OverrideModalProps {
  overrideModal: { campaignId: string; campName: string } | null;
  overridePercent: string;
  setOverridePercent: (value: string) => void;
  setOverrideModal: (value: { campaignId: string; campName: string } | null) => void;
  handleUpdateStrategy: (campaignId: string, newPercent: number) => void;
}

export function OverrideModal({ overrideModal, overridePercent, setOverridePercent, setOverrideModal, handleUpdateStrategy }: OverrideModalProps) {
  if (!overrideModal) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-2xl z-[100] flex items-center justify-center p-6 animate-in fade-in duration-500">
      <div className="bg-card border border-accent/20 rounded-[3rem] w-full max-w-sm p-10 space-y-8 shadow-[0_0_80px_-20px_rgba(255,69,0,0.3)] border-t border-white/5">
        <div className="text-center space-y-4">
          <div className="w-20 h-20 bg-accent/10 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-accent/20 shadow-orange-glow/10">
            <Percent className="w-10 h-10 text-accent" />
          </div>
          <h3 className="font-black text-3xl tracking-tighter text-foreground uppercase italic leading-none">Ajuste Manual</h3>
          <p className="text-sm text-muted-foreground leading-relaxed px-4">Establece un porcentaje específico para escalar <span className="text-accent font-bold">{overrideModal.campName}</span></p>
        </div>
        
        <div className="space-y-6">
          <div className="relative">
            <input 
              type="number" 
              value={overridePercent}
              onChange={e => setOverridePercent(e.target.value)}
              className="w-full bg-secondary/50 border border-white/5 rounded-3xl py-8 text-center text-5xl font-black text-foreground focus:ring-4 focus:ring-accent/20 transition-all tabular-nums outline-none"
              placeholder="20"
              autoFocus
            />
            <span className="absolute right-8 top-1/2 -translate-y-1/2 text-2xl font-black text-accent">%</span>
          </div>
          
          <div className="flex gap-4">
            <button 
              onClick={() => setOverrideModal(null)} 
              className="flex-1 py-5 font-bold text-muted-foreground hover:bg-secondary rounded-2xl transition-all uppercase text-xs tracking-widest"
            >
              Cancelar
            </button>
            <button 
              onClick={() => {
                if (overrideModal) {
                  handleUpdateStrategy(overrideModal.campaignId, parseFloat(overridePercent));
                }
              }}
              className="flex-[2] bg-accent text-white py-5 font-black rounded-2xl shadow-xl shadow-accent/30 transition-all hover:scale-[1.02] uppercase text-xs tracking-widest italic"
            >
              Confirmar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
