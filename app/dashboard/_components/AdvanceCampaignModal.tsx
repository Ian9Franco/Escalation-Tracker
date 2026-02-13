'use client';

import { useState, useEffect } from 'react';
import { Campaign, WeeklyRecord } from '@/lib/types';
import { formatCurrency } from '@/utils/calculations';
import { X, Save, Calculator, AlertCircle } from 'lucide-react';

interface AdvanceCampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaign: Campaign;
  currentRecords: WeeklyRecord[];
  onConfirm: (customBudgets: { label: string | null; budget: number }[]) => void;
  strategyPct: number;
}

export function AdvanceCampaignModal({
  isOpen,
  onClose,
  campaign,
  currentRecords,
  onConfirm,
  strategyPct
}: AdvanceCampaignModalProps) {
  const [budgets, setBudgets] = useState<{ label: string | null; budget: string }[]>([]);

  useEffect(() => {
    if (isOpen) {
      const initialBudgets = currentRecords.map(r => ({
        label: r.label || null,
        budget: String(Math.round(Number(r.budget) * (1 + strategyPct / 100) * 100) / 100)
      }));
      setBudgets(initialBudgets);
    }
  }, [isOpen, currentRecords, strategyPct]);

  if (!isOpen) return null;

  const totalBudget = budgets.reduce((sum, b) => sum + (Number(b.budget) || 0), 0);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[200] flex items-center justify-center p-6 animate-in fade-in duration-300">
      <div className="bg-card border border-border rounded-[2.5rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="p-8 border-b border-border bg-accent/5 flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-black text-foreground tracking-tighter uppercase italic">Configurar Etapa {campaign.current_week + 1}</h2>
            <p className="text-sm font-bold text-muted-foreground mt-1 uppercase tracking-widest opacity-60">Personalizar presupuestos por {campaign.type === 'adset_budget' ? 'conjunto' : 'plataforma'}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-secondary rounded-full transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-8 max-h-[60vh] overflow-y-auto custom-scrollbar space-y-6">
          <div className="flex items-center gap-4 p-4 bg-secondary/20 rounded-2xl border border-border/50">
            <div className="p-3 bg-accent/10 rounded-xl">
              <Calculator className="w-6 h-6 text-accent" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Estrategia Aplicada</p>
              <p className="text-lg font-black text-foreground">+{strategyPct}% <span className="text-muted-foreground text-sm font-bold">(Sugerido)</span></p>
            </div>
          </div>

          <div className="space-y-4">
            {budgets.map((b, index) => (
              <div key={index} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-secondary/10 rounded-2xl border border-border/30 hover:border-accent/30 transition-colors group">
                <div className="flex-1">
                  <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-1">Identificador</p>
                  <p className="font-bold text-foreground text-lg italic uppercase">{b.label || 'Global'}</p>
                </div>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-black opacity-50">$</span>
                  <input
                    type="number"
                    value={b.budget}
                    onChange={(e) => {
                      const newBudgets = [...budgets];
                      newBudgets[index].budget = e.target.value;
                      setBudgets(newBudgets);
                    }}
                    className="bg-background border border-border/50 rounded-xl py-4 pl-8 pr-4 w-full sm:w-48 text-right font-black text-xl tabular-nums focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-8 bg-secondary/30 border-t border-border space-y-6">
          <div className="flex justify-between items-end px-2">
            <div>
              <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Presupuesto Sugerido</p>
              <p className="text-xl font-bold text-muted-foreground line-through opacity-50">
                {formatCurrency(currentRecords.reduce((sum, r) => sum + Number(r.budget), 0) * (1 + strategyPct / 100))}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black uppercase text-accent tracking-widest">Total Siguiente Etapa</p>
              <p className="text-4xl font-black text-foreground tabular-nums tracking-tighter italic">{formatCurrency(totalBudget)}</p>
            </div>
          </div>

          <button
            onClick={() => onConfirm(budgets.map(b => ({ label: b.label, budget: Number(b.budget) || 0 })))}
            className="w-full bg-accent text-white py-6 rounded-3xl font-black text-xl uppercase tracking-widest italic shadow-[0_20px_50px_-10px_rgba(255,69,0,0.4)] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3"
          >
            <Save className="w-6 h-6" /> Confirmar y Avanzar
          </button>
        </div>
      </div>
    </div>
  );
}
