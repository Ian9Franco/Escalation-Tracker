'use client';

import { Campaign, FREQUENCY_LABELS } from '@/lib/types.ts';
import {
  Archive, ChevronRight, Pause, Play, Trash2, CheckCircle2
} from 'lucide-react';

interface CampaignSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  campaigns: Campaign[];
  handleRestoreCampaign: (id: string) => void;
  handlePermanentlyDeleteCampaign: (id: string) => void;
}

export function CampaignSidebar({ isOpen, onClose, campaigns, handleRestoreCampaign, handlePermanentlyDeleteCampaign }: CampaignSidebarProps) {
  return (
    <>
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[90] animate-in fade-in duration-300"
          onClick={onClose}
        />
      )}
      <div className={`fixed inset-y-0 right-0 w-85 bg-card border-l border-border shadow-2xl z-[100] transition-transform duration-500 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="h-full flex flex-col">
          <div className="p-6 border-b border-border flex justify-between items-center bg-secondary/20">
            <div className="flex items-center gap-2">
              <Archive className="w-5 h-5 text-accent" />
              <h3 className="font-black text-xs uppercase tracking-widest text-foreground">Gestión de Estados</h3>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-secondary rounded-full transition-colors text-muted-foreground">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-8 custom-scrollbar">
            {(['paused', 'completed', 'archived', 'deleted'] as const).map((status) => {
              const filtered = campaigns.filter(c => c.status === status);
              const label = status === 'paused' ? 'Pausadas' : status === 'completed' ? 'Completadas' : status === 'archived' ? 'Archivadas' : 'Papelera';
              const Icon = status === 'paused' ? Pause : status === 'completed' ? CheckCircle2 : status === 'archived' ? Archive : Trash2;
              
              return (
                <div key={status} className="space-y-4">
                  <div className="flex items-center gap-2 px-2">
                    <Icon className="w-3.5 h-3.5 text-muted-foreground opacity-50" />
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{label} ({filtered.length})</h4>
                  </div>
                  
                  <div className="space-y-2">
                    {filtered.length === 0 ? (
                      <p className="text-[10px] text-muted-foreground/40 italic px-2">No hay campañas aquí</p>
                    ) : (
                      filtered.map(camp => {
                        let sidebarBeamClass = '';
                        if (status === 'paused') sidebarBeamClass = 'beam-paused';
                        else if (status === 'completed') sidebarBeamClass = 'beam-finished';
                        else if (status === 'deleted') sidebarBeamClass = 'beam-trash';

                        return (
                          <div key={camp.id} className={`!p-4 !bg-secondary/30 rounded-2xl border border-border/50 group/item transition-all border-beam-container no-glow ${sidebarBeamClass}`}>
                          <div className="flex justify-between items-start mb-2 relative z-10">
                            <div className="space-y-0.5">
                              <p className="text-xs font-black text-foreground uppercase italic tracking-tight truncate max-w-[140px]">{camp.name}</p>
                              <p className="text-[9px] text-muted-foreground font-bold">{FREQUENCY_LABELS[camp.strategy_frequency]}</p>
                            </div>
                            <div className="flex gap-1">
                              <button 
                                onClick={() => handleRestoreCampaign(camp.id)}
                                title="Restaurar"
                                className="p-1.5 bg-accent/10 text-accent rounded-lg opacity-0 group-hover/item:opacity-100 transition-opacity hover:bg-accent/20"
                              >
                                <Play className="w-3.5 h-3.5" />
                              </button>
                              {status === 'deleted' && (
                                <button 
                                  onClick={() => handlePermanentlyDeleteCampaign(camp.id)}
                                  title="Borrar Permanentemente"
                                  className="p-1.5 bg-destructive/10 text-destructive rounded-lg opacity-0 group-hover/item:opacity-100 transition-opacity hover:bg-destructive/20"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Snippet Trigger para Sidebar (Lateral Moderno) */}
      <button 
        onClick={() => { if (!isOpen) { /* Parent handles open */ } }}
        className={`fixed right-0 top-1/2 -translate-y-1/2 bg-card border border-border border-r-0 pl-4 pr-3 py-8 rounded-l-3xl shadow-[-10px_0_30px_rgba(0,0,0,0.2)] z-[90] transition-all duration-500 hover:pl-6 group flex flex-col items-center gap-4 ${isOpen ? 'translate-x-full' : 'translate-x-0'}`}
        style={{ display: 'none' }} // Trigger is rendered in page.tsx directly
      >
        <div className="flex flex-col items-center gap-1 group-hover:scale-110 transition-transform">
          <Archive className="w-5 h-5 text-accent" />
        </div>
      </button>
    </>
  );
}
