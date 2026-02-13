'use client';

import { useState, useEffect } from 'react';
import { Percent, Target, Save, X, Layers } from 'lucide-react';
import { Campaign, WeeklyRecord } from '@/lib/types';
import { formatCurrency } from '@/utils/calculations';

interface OverrideModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaign: Campaign | null;
  currentRecords: WeeklyRecord[];
  handleUpdateStrategy: (campaignId: string, data: { 
    strategyPct: number; 
    targetBudget: number; 
    adsetTargets: Record<string, number> 
  }) => void;
}

export function OverrideModal({ 
  isOpen, 
  onClose, 
  campaign, 
  currentRecords,
  handleUpdateStrategy 
}: OverrideModalProps) {
  const [strategyPct, setStrategyPct] = useState('');
  const [targetBudget, setTargetBudget] = useState('');
  const [adsetTargets, setAdsetTargets] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen && campaign) {
      setStrategyPct(String(Math.round(Number(campaign.increment_strategy) * 100)));
      setTargetBudget(String(campaign.target_budget || ''));
      
      const targets: Record<string, string> = {};
      const labels = currentRecords.map(r => r.label).filter((l): l is string => !!l);
      labels.forEach(label => {
        targets[label] = String(campaign.adset_targets?.[label] || '');
      });
      setAdsetTargets(targets);
    }
  }, [isOpen, campaign, currentRecords]);

  if (!isOpen || !campaign) return null;

  const isAdset = campaign.type === 'adset_budget' || campaign.type === 'mixed_budget';

  const handleConfirm = () => {
    const finalAdsetTargets: Record<string, number> = {};
    Object.entries(adsetTargets).forEach(([label, value]) => {
      finalAdsetTargets[label] = Number(value) || 0;
    });

    handleUpdateStrategy(campaign.id, {
      strategyPct: parseFloat(strategyPct) || 0,
      targetBudget: Number(targetBudget) || 0,
      adsetTargets: finalAdsetTargets
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[200] flex items-center justify-center p-6 animate-in fade-in duration-300">
      <div className="bg-card border border-border rounded-[2.5rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="p-8 border-b border-border bg-accent/5 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-accent/10 rounded-2xl">
              <Percent className="w-8 h-8 text-accent" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-foreground tracking-tighter uppercase italic">Ajustar Estrategia</h2>
              <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest opacity-60">{campaign.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-secondary rounded-full transition-colors text-muted-foreground">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-8 space-y-8 max-h-[60vh] overflow-y-auto custom-scrollbar">
          {/* Strategy Percentage */}
          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest pl-1 flex items-center gap-2">
              <Percent className="w-3 h-3" /> Porcentaje de Escalado
            </label>
            <div className="relative">
              <input 
                type="number" 
                value={strategyPct}
                onChange={e => setStrategyPct(e.target.value)}
                className="w-full bg-secondary/50 border border-border rounded-2xl py-6 text-center text-4xl font-black text-foreground focus:ring-4 focus:ring-accent/20 transition-all tabular-nums outline-none"
                placeholder="20"
                autoFocus
              />
              <span className="absolute right-8 top-1/2 -translate-y-1/2 text-xl font-black text-accent">%</span>
            </div>
          </div>

          {/* Target Budget */}
          <div className="space-y-3 pt-4 border-t border-border/50">
            <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest pl-1 flex items-center gap-2">
              <Target className="w-3 h-3" /> Presupuesto Objetivo (Total)
            </label>
            <div className="relative">
              <span className="absolute left-6 top-1/2 -translate-y-1/2 text-muted-foreground font-black">$</span>
              <input 
                type="number" 
                value={targetBudget}
                onChange={e => setTargetBudget(e.target.value)}
                className="w-full bg-secondary/20 border border-border rounded-2xl py-5 pl-12 pr-6 text-xl font-black text-foreground focus:ring-4 focus:ring-accent/20 transition-all tabular-nums outline-none"
                placeholder="Sin objetivo"
              />
            </div>
          </div>

          {/* Adset Specific Targets */}
          {isAdset && Object.keys(adsetTargets).length > 0 && (
            <div className="space-y-4 pt-4 border-t border-border/50">
              <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest pl-1 flex items-center gap-2">
                <Layers className="w-3 h-3" /> Objetivos por Conjunto
              </label>
              <div className="space-y-3">
                {Object.keys(adsetTargets).map(label => (
                  <div key={label} className="flex items-center justify-between gap-4 p-4 bg-secondary/10 rounded-2xl border border-border/30 group">
                    <span className="text-xs font-black uppercase italic text-muted-foreground group-hover:text-foreground transition-colors">{label}</span>
                    <div className="relative w-40">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-bold text-xs">$</span>
                      <input 
                        type="number" 
                        value={adsetTargets[label]}
                        onChange={e => setAdsetTargets({ ...adsetTargets, [label]: e.target.value })}
                        className="w-full bg-background border border-border/50 rounded-xl py-2 pl-8 pr-3 text-right font-bold text-sm text-foreground focus:ring-2 focus:ring-accent/30 outline-none tabular-nums"
                        placeholder="0"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-8 bg-secondary/30 border-t border-border flex gap-4">
          <button 
            onClick={onClose} 
            className="flex-1 py-4 font-bold text-muted-foreground hover:bg-secondary rounded-2xl transition-all uppercase text-xs tracking-widest"
          >
            Cancelar
          </button>
          <button 
            onClick={handleConfirm}
            className="flex-[2] bg-accent text-white py-4 font-black rounded-2xl shadow-xl shadow-accent/30 transition-all hover:scale-[1.02] flex items-center justify-center gap-3 uppercase text-xs tracking-widest italic"
          >
            <Save className="w-5 h-5" /> Guardar Cambios
          </button>
        </div>
      </div>
    </div>
  );
}
