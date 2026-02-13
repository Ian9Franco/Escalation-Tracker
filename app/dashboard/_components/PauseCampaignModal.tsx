'use client';

import React, { useState } from 'react';

import { Pause, Calendar, AlertTriangle, X } from 'lucide-react';

interface PauseCampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (date: Date | null) => void;
  campaignName: string;
}

export function PauseCampaignModal({ isOpen, onClose, onConfirm, campaignName }: PauseCampaignModalProps) {
  const [pauseType, setPauseType] = useState<'indefinite' | 'temporary'>('indefinite');
  const [tempDuration, setTempDuration] = useState<'1m' | '3m' | '5m' | 'custom'>('1m');
  const [customDate, setCustomDate] = useState('');

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (pauseType === 'indefinite') {
      onConfirm(null);
    } else {
      let date = new Date();
      if (tempDuration === 'custom' && customDate) {
        date = new Date(customDate);
      } else {
        const monthsToAdd = tempDuration === '1m' ? 1 : tempDuration === '3m' ? 3 : 5;
        date.setMonth(date.getMonth() + monthsToAdd);
      }
      onConfirm(date);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-card w-full max-w-md rounded-3xl shadow-2xl border border-border overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-warning/10 p-6 flex items-center gap-4 border-b border-warning/10">
          <div className="w-12 h-12 rounded-2xl bg-warning/20 flex items-center justify-center shadow-inner">
            <Pause className="w-6 h-6 text-warning" />
          </div>
          <div>
            <h3 className="text-lg font-black uppercase italic text-warning tracking-wide">Pausar Campaña</h3>
            <p className="text-sm font-medium text-muted-foreground line-clamp-1">{campaignName}</p>
          </div>
          <button onClick={onClose} className="ml-auto p-2 hover:bg-black/5 rounded-full transition-colors">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* content */}
        <div className="p-6 space-y-6">
          <p className="text-sm text-muted-foreground font-medium">
            Seleccioná cómo querés detener esta campaña. Podrás reactivarla manualmente en cualquier momento.
          </p>

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setPauseType('indefinite')}
              className={`p-4 rounded-xl border-2 text-left transition-all ${
                pauseType === 'indefinite'
                  ? 'border-warning bg-warning/5 ring-1 ring-warning/50'
                  : 'border-border hover:border-warning/30 hover:bg-secondary/50'
              }`}
            >
              <div className="font-black uppercase text-xs tracking-widest mb-1 flex items-center gap-2">
                <Pause className="w-3 h-3" /> Indefinida
              </div>
              <p className="text-[10px] text-muted-foreground font-medium leading-tight">
                La campaña se detiene hasta que decidas reanudarla manualmente.
              </p>
            </button>

            <button
              onClick={() => setPauseType('temporary')}
              className={`p-4 rounded-xl border-2 text-left transition-all ${
                pauseType === 'temporary'
                  ? 'border-warning bg-warning/5 ring-1 ring-warning/50'
                  : 'border-border hover:border-warning/30 hover:bg-secondary/50'
              }`}
            >
              <div className="font-black uppercase text-xs tracking-widest mb-1 flex items-center gap-2">
                <Calendar className="w-3 h-3" /> Temporal
              </div>
              <p className="text-[10px] text-muted-foreground font-medium leading-tight">
                Pausar por un tiempo determinado. Ideal para estacionalidad.
              </p>
            </button>
          </div>

          {pauseType === 'temporary' && (
            <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
              <label className="text-xs font-black uppercase text-muted-foreground tracking-widest">Duración de la pausa</label>
              <div className="flex gap-2">
                {['1m', '3m', '5m'].map((dur) => (
                  <button
                    key={dur}
                    onClick={() => { setTempDuration(dur as any); setCustomDate(''); }}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all ${
                      tempDuration === dur
                        ? 'bg-warning text-black border-warning shadow-lg shadow-warning/20'
                        : 'bg-secondary text-muted-foreground border-transparent hover:bg-secondary/80'
                    }`}
                  >
                    {dur === '1m' ? '1 Mes' : dur === '3m' ? '3 Meses' : '5 Meses'}
                  </button>
                ))}
              </div>
              
              <div className="relative">
                <button
                  onClick={() => setTempDuration('custom')}
                  className={`w-full py-2 rounded-lg text-xs font-bold border transition-all mb-2 ${
                    tempDuration === 'custom'
                      ? 'bg-warning/10 text-warning border-warning'
                      : 'bg-secondary text-muted-foreground border-transparent hover:bg-secondary/80'
                  }`}
                >
                   Elegir fecha específica
                </button>
                
                {tempDuration === 'custom' && (
                   <input
                   type="date"
                   value={customDate}
                   onChange={(e) => setCustomDate(e.target.value)}
                   min={new Date().toISOString().split('T')[0]}
                   className="w-full bg-secondary/50 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-warning/50 text-foreground"
                 />
                )}
              </div>
            </div>
          )}

          <div className="bg-secondary/30 p-3 rounded-lg flex items-start gap-3">
             <AlertTriangle className="w-4 h-4 text-warning shrink-0 mt-0.5" />
             <p className="text-[10px] text-muted-foreground font-medium">
                {pauseType === 'indefinite' 
                  ? 'La campaña no generará gastos ni avanzará de etapa mientras esté pausada.' 
                  : 'La campaña se reactivará automáticamente en la fecha seleccionada (funcionalidad futura) o servirá de recordatorio.'}
             </p>
          </div>

        </div>

        {/* Footer */}
        <div className="p-6 pt-0 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 rounded-xl font-bold text-sm text-muted-foreground hover:bg-secondary transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={pauseType === 'temporary' && tempDuration === 'custom' && !customDate}
            className="flex-1 px-4 py-3 rounded-xl font-black text-sm uppercase italic tracking-wider bg-warning text-black hover:bg-warning/90 transition-colors shadow-lg shadow-warning/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Confirmar Pausa
          </button>
        </div>
      </div>
    </div>
  );
}
