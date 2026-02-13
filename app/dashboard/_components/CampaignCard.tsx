'use client';

import { Campaign, WeeklyRecord, StrategyAdjustment, FREQUENCY_PREFIX, FREQUENCY_LABELS } from '@/lib/types';
import { formatCurrency } from '@/utils/calculations';
import { AnimatedCurrency } from './AnimatedCurrency';
import {
  TrendingUp, ChevronRight, MoreVertical, Pause, Trash2, Percent, Play, Clock,
  HelpCircle, Info, Archive, CheckCircle2
} from 'lucide-react';

interface CampaignCardProps {
  campaign: Campaign;
  records: WeeklyRecord[];
  adjustments: StrategyAdjustment[];
  activeCampaignMenu: string | null;
  setActiveCampaignMenu: (id: string | null) => void;
  showStrategyInfo: Record<string, boolean>;
  setShowStrategyInfo: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  handleAdvanceCampaign: (campaign: Campaign) => void;
  handlePauseCampaign: (id: string) => void;
  handleResumeCampaign: (id: string) => void;
  handleDeleteCampaign: (id: string) => void;
  handleArchiveCampaign: (id: string) => void;
  handleCompleteCampaign: (id: string) => void;
  setOverrideModal: (value: { campaignId: string; campName: string } | null) => void;
  setOverridePercent: (value: string) => void;
}

export function CampaignCard({
  campaign, records, adjustments,
  activeCampaignMenu, setActiveCampaignMenu,
  showStrategyInfo, setShowStrategyInfo,
  handleAdvanceCampaign, handlePauseCampaign, handleResumeCampaign,
  handleDeleteCampaign, handleArchiveCampaign, handleCompleteCampaign,
  setOverrideModal, setOverridePercent
}: CampaignCardProps) {
  let currentBudget = 0;
  const campaignRecords = records.filter(r => r.campaign_id === campaign.id && r.week_number === campaign.current_week);

  if (campaign.type === 'mixed_budget' || campaign.type === 'adset_budget') {
    currentBudget = campaignRecords.reduce((sum, r) => sum + Number(r.budget), 0);
  } else {
    const record = campaignRecords.find(r => !r.label);
    currentBudget = record?.budget || 0;
  }

  const strategyPct = Math.round(Number(campaign.increment_strategy) * 100);
  const progress = campaign.target_budget ? Math.min((currentBudget / campaign.target_budget) * 100, 100) : 0;
  const isFinished = progress >= 100;
  const isPaused = campaign.status === 'paused';

  let beamStatusClass = 'beam-active';
  if (isFinished) beamStatusClass = 'beam-finished';
  else if (isPaused) beamStatusClass = 'beam-paused';

  const prefix = FREQUENCY_PREFIX[campaign.strategy_frequency] || 'E';
  const freqLabel = FREQUENCY_LABELS[campaign.strategy_frequency] || 'Semanal';

  // Inferencia de presupuesto inicial para campañas viejas
  let displayInitialBudget = campaign.initial_budget;
  if (!displayInitialBudget || displayInitialBudget <= 0) {
    const allCampaignRecords = records.filter(r => r.campaign_id === campaign.id);
    if (allCampaignRecords.length > 0) {
      const minWeek = Math.min(...allCampaignRecords.map(r => r.week_number));
      displayInitialBudget = allCampaignRecords
        .filter(r => r.week_number === minWeek)
        .reduce((sum, r) => sum + Number(r.budget), 0);
    }
  }

  return (
    <div className={`card-widget p-8 transition-all group flex flex-col justify-between relative bg-card border-beam-container ${beamStatusClass} ${isFinished ? 'border-success/30' : ''} reveal`}>

      {/* Header Widget */}
      <div className="flex justify-between items-start mb-8">
        <div className="space-y-1">
          <h3 className="text-2xl font-black text-foreground transition-colors leading-none tracking-tight uppercase italic">{campaign.name}</h3>
          <div className="flex gap-2 items-center">
            <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${isFinished ? 'bg-success/10 text-success border-success/20' :
                isPaused ? 'bg-warning/10 text-warning border-warning/20' :
                  'bg-accent/10 text-accent border-accent/20'
              }`}>
              {campaign.type === 'mixed_budget' ? 'MIX' : campaign.type === 'adset_budget' ? 'ADSET' : 'STD'}
            </span>
            {isPaused && (
              <span className="text-[10px] text-warning font-black uppercase">
                ⏸ {campaign.paused_until 
                  ? `PAUSADA (Vuelve: ${new Date(campaign.paused_until).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })})`
                  : 'PAUSADA INDEFINIDA'}
              </span>
            )}
            {isFinished && <span className="text-[10px] text-success font-black uppercase flex items-center gap-1">🏆 ÉXITO</span>}
            <button
              onClick={() => setShowStrategyInfo(prev => ({ ...prev, [campaign.id]: !prev[campaign.id] }))}
              className={`p-1 rounded-md transition-colors hover-status-color ${showStrategyInfo[campaign.id] ? 'bg-accent/20 text-accent' : 'text-muted-foreground'}`}
              title="Ver detalle de cálculo"
            >
              <HelpCircle className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="relative">
          <button
            onClick={() => setActiveCampaignMenu(activeCampaignMenu === campaign.id ? null : campaign.id)}
            className="p-2 hover:bg-secondary rounded-full transition-colors text-muted-foreground hover-status-color border border-transparent hover:border-current/30"
          >
            <MoreVertical className="w-5 h-5" />
          </button>

          {activeCampaignMenu === campaign.id && (
            <div className="absolute right-0 mt-3 bg-card border border-border shadow-2xl rounded-2xl z-50 w-60 overflow-hidden animate-in fade-in slide-in-from-top-2">
              <div className="p-2">
                {isPaused ? (
                  <button onClick={() => handleResumeCampaign(campaign.id)} className="w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-success/10 text-success font-bold rounded-xl transition-colors">
                    <Play className="w-4 h-4" /> Reanudar
                  </button>
                ) : isFinished ? (
                  <div className="px-4 py-6 text-center space-y-2">
                    <div className="w-10 h-10 bg-success/10 rounded-full flex items-center justify-center mx-auto border border-success/20">
                      <TrendingUp className="w-5 h-5 text-success" />
                    </div>
                    <p className="text-[10px] font-black uppercase text-success tracking-widest italic">¡Objetivo Completado!</p>
                    <p className="text-[9px] text-muted-foreground font-medium italic">Esta campaña ha alcanzado su meta presupuestal con éxito.</p>
                  </div>
                ) : (
                  <>
                    <button onClick={() => handleAdvanceCampaign(campaign)} className="w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-accent/10 text-accent font-bold rounded-xl transition-colors">
                      <ChevronRight className="w-4 h-4" /> Avanzar a {prefix}{campaign.current_week + 1}
                    </button>
                    <button
                      onClick={() => {
                        setOverrideModal({ campaignId: campaign.id, campName: campaign.name });
                        setOverridePercent(String(strategyPct));
                        setActiveCampaignMenu(null);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-secondary text-foreground font-semibold rounded-xl transition-colors"
                    >
                      <Percent className="w-4 h-4" /> Ajustar Estrategia %
                    </button>
                    <button onClick={() => handlePauseCampaign(campaign.id)} className="w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-warning/10 text-warning font-bold rounded-xl transition-colors">
                      <Pause className="w-4 h-4" /> Pausar
                    </button>
                  </>
                )}
              </div>
              <div className="h-px bg-border" />
              <div className="p-2 space-y-1">
                {isFinished ? (
                  <button
                    onClick={() => handleCompleteCampaign(campaign.id)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-success/10 text-success font-bold rounded-xl transition-colors"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Finalizar y Archivar
                  </button>
                ) : (
                  <button
                    onClick={() => handleArchiveCampaign(campaign.id)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-secondary text-muted-foreground font-semibold rounded-xl transition-colors"
                  >
                    <Archive className="w-4 h-4" /> Archivar
                  </button>
                )}
                <button onClick={() => handleDeleteCampaign(campaign.id)} className="w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-destructive/10 text-destructive font-bold rounded-xl transition-colors">
                  <Trash2 className="w-4 h-4" /> Mover a Papelera
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="flex flex-col sm:flex-row sm:justify-between gap-6 mb-8">
        <div className="space-y-1 min-w-0 flex-1">
          <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest pl-1">Presupuesto {prefix}{campaign.current_week}</p>
          <AnimatedCurrency value={currentBudget} className="text-xl font-black text-foreground tabular-nums tracking-tighter truncate block" />
        </div>
        <div className="space-y-1 min-w-0">
          <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest pl-1">Estrategia</p>
          <p className={`text-xl font-black tracking-tighter flex items-end gap-1 ${isFinished ? 'text-success' : 'text-accent'}`}>
            {strategyPct}% <TrendingUp className="w-4 h-4 mb-1" />
          </p>
        </div>
      </div>

      {/* Strategy Info Card */}
      {showStrategyInfo[campaign.id] && (
        <div className="mb-6 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="p-5 bg-accent/[0.03] rounded-2xl border border-accent/10 space-y-4 border-beam-container">
            <div className="flex items-center gap-2 mb-1 border-b border-accent/10 pb-2">
              <Info className="w-3.5 h-3.5 text-accent" />
              <p className="text-[10px] font-black uppercase text-foreground tracking-widest">¿Cómo llegamos a este número?</p>
            </div>

            <div className="space-y-3">
              {isPaused && (
                <div className="flex items-start gap-4">
                  <div className="text-[9px] bg-warning/10 px-2 py-1 rounded font-black text-warning w-14 text-center text-[7px]">ESTADO</div>
                  <p className="text-[11px] font-bold text-muted-foreground leading-tight">
                    <span className="text-warning">Pausada</span>
                    {campaign.paused_until ? (
                      <> hasta el <span className="text-foreground">{new Date(campaign.paused_until).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })}</span></>
                    ) : (
                      ' indefinidamente'
                    )}
                  </p>
                </div>
              )}      
              <div className="flex items-start gap-4">
                <div className="text-[9px] bg-secondary/50 px-2 py-1 rounded font-black text-muted-foreground w-14 text-center text-[7px]">CREACIÓN</div>
                <p className="text-[11px] font-bold text-muted-foreground leading-tight">
                  Registrada el: <span className="text-foreground">{campaign.created_at ? new Date(campaign.created_at).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' }) : 'No disponible'}</span>
                </p>
              </div>

              <div className="flex items-start gap-4">
                <div className="text-[9px] bg-secondary/50 px-2 py-1 rounded font-black text-muted-foreground w-14 text-center text-[7px]">INICIAL</div>
                <p className="text-[11px] font-bold text-muted-foreground leading-tight">
                  Presupuesto arranque: <span className="text-foreground">{displayInitialBudget > 0 ? formatCurrency(displayInitialBudget) : 'No registrado'}</span>
                </p>
              </div>

              <div className="flex items-start gap-4">
                <div className="text-[9px] bg-accent/10 px-2 py-1 rounded font-black text-accent w-14 text-center text-[7px]">ESCALA</div>
                <div className="space-y-2 flex-1">
                  <p className="text-[11px] font-bold text-muted-foreground leading-tight">
                    Original: <span className="text-foreground">{Math.round((campaign.initial_strategy || campaign.increment_strategy) * 100)}%</span>
                  </p>

                  {adjustments.filter(a => a.campaign_id === campaign.id).length > 0 && (
                    <div className="space-y-1.5 pt-1 border-t border-accent/5">
                      <p className="text-[9px] font-black uppercase text-accent tracking-widest opacity-60">Ajustes manuales:</p>
                      {(() => {
                        const campAdjs = adjustments.filter(a => a.campaign_id === campaign.id);
                        return (
                          <div className="space-y-1">
                            {campAdjs.slice(0, 3).map((adj) => (
                              <div key={adj.id} className="flex justify-between items-center text-[10px] bg-accent/5 px-2 py-1 rounded border border-accent/10">
                                <span className="text-muted-foreground font-medium">{new Date(adj.created_at).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })}</span>
                                <span className="font-black text-foreground">{Math.round(adj.old_strategy * 100)}% → {Math.round(adj.new_strategy * 100)}%</span>
                              </div>
                            ))}
                            {campAdjs.length > 3 && (
                              <details className="group">
                                <summary className="list-none cursor-pointer text-[9px] font-black text-accent uppercase tracking-tighter hover:underline flex items-center gap-1">
                                  Ver {campAdjs.length - 3} ajustes más...
                                </summary>
                                <div className="space-y-1 mt-1 animate-in fade-in slide-in-from-top-1">
                                  {campAdjs.slice(3).map((adj) => (
                                    <div key={adj.id} className="flex justify-between items-center text-[10px] bg-accent/5 px-2 py-1 rounded border border-accent/10">
                                      <span className="text-muted-foreground font-medium">{new Date(adj.created_at).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })}</span>
                                      <span className="font-black text-foreground">{Math.round(adj.old_strategy * 100)}% → {Math.round(adj.new_strategy * 100)}%</span>
                                    </div>
                                  ))}
                                </div>
                              </details>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="text-[9px] bg-secondary/50 px-2 py-1 rounded font-black text-muted-foreground w-14 text-center text-[7px]">ORIGEN</div>
                <p className="text-[11px] font-bold text-muted-foreground leading-tight">
                  Etapa anterior ({prefix}{campaign.current_week - 1 || 0}): <span className="text-foreground">{formatCurrency(currentBudget / (1 + Number(campaign.increment_strategy)))}</span>
                </p>
              </div>

              {(campaign.type === 'adset_budget' || campaign.type === 'mixed_budget') && (
                <div className="flex items-start gap-4">
                  <div className="text-[9px] bg-secondary/50 px-2 py-1 rounded font-black text-muted-foreground w-14 text-center">DISTRIB.</div>
                  <p className="text-[11px] font-bold text-muted-foreground leading-tight">
                    El total se divide entre <span className="text-accent">{Array.from(new Set(records.filter(r => r.campaign_id === campaign.id && r.label).map(r => r.label))).length || campaignRecords.length}</span> {campaign.type === 'adset_budget' ? 'conjuntos' : 'plataformas'}.
                  </p>
                </div>
              )}

              <div className="flex items-start gap-4 pt-2 border-t border-accent/5">
                <div className="text-[9px] bg-accent/10 px-2 py-1 rounded font-black text-accent w-14 text-center">TOTAL</div>
                <p className="text-[11px] font-mono text-foreground font-black tracking-tight">
                  {formatCurrency(currentBudget / (1 + Number(campaign.increment_strategy)))} + {strategyPct}% = {formatCurrency(currentBudget)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Progress Widget */}
      {campaign.target_budget && (
        <div className="space-y-4 mb-8 p-4 bg-secondary/20 rounded-2xl border border-border/10 border-beam-container">
          <div className="flex justify-between items-end">
            <div className="space-y-1">
              <span className="text-[10px] text-muted-foreground font-black uppercase tracking-widest block">Objetivo</span>
              <span className="text-sm font-bold text-foreground">{formatCurrency(campaign.target_budget)}</span>
            </div>
            <span className={`text-xl font-black tabular-nums ${isFinished ? "text-success" : "text-accent"}`}>{Math.round(progress)}%</span>
          </div>

          <div className="progress-container">
            <div
              className={`progress-fill ${isFinished ? 'finished' : ''} ${!isPaused && !isFinished ? 'shadow-[0_0_15px_rgba(255,69,0,0.5)]' : ''}`}
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="flex justify-between text-[10px] font-black uppercase text-muted-foreground tracking-widest">
            <span>{isFinished ? "Finalizado" : `Estimado: ${prefix}${campaign.target_week || '?'}`}</span>
            {campaign.estimated_target_date && !isFinished && (
              <span className="text-accent underline underline-offset-4 decoration-accent/30">{new Date(campaign.estimated_target_date).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })}</span>
            )}
          </div>
        </div>
      )}

      {/* Breakdown List */}
      {(campaign.type === 'adset_budget' || campaign.type === 'mixed_budget') && (
        <div className="mb-8 space-y-2">
          <div className="flex justify-between items-center mb-1">
            <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest pl-1">
              {campaign.type === 'adset_budget' ? 'Conjuntos' : 'Plataformas'}
            </p>
            <p className="text-[9px] font-bold text-accent uppercase opacity-60">Presupuesto individual</p>
          </div>
          <div className="space-y-1 max-h-[120px] overflow-y-auto pr-1 scrollbar-thin">
            {campaignRecords.length > 0 && (campaignRecords.every(r => !r.label) ? [campaignRecords[0]] : campaignRecords.filter(r => r.label)).map((r) => (
              <div key={r.id} className="flex justify-between items-center p-3 bg-secondary/30 rounded-xl border border-border/50 group/item transition-all hover:bg-secondary/50">
                <span className="text-xs font-bold text-foreground truncate max-w-[150px]">{r.label || 'Global'}</span>
                <span className="text-xs font-black text-accent tabular-nums">{formatCurrency(r.budget)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Footer */}
      <div className="pt-6 border-t border-border mt-auto flex justify-between items-center">
        <div className="flex items-center gap-2 text-[10px] font-black uppercase text-muted-foreground tracking-widest">
          <Clock className="w-3.5 h-3.5" /> {freqLabel}
        </div>
        {!isPaused && !isFinished && (
          <button
            onClick={() => handleAdvanceCampaign(campaign)}
            className="bg-accent text-white px-5 py-2 rounded-xl text-xs font-black shadow-lg shadow-accent/20 hover:scale-105 active:scale-95 transition-all uppercase tracking-widest italic"
          >
            Siguiente Etapa
          </button>
        )}
      </div>
    </div>
  );
}
