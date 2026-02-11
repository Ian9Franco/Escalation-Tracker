'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Campaign, WeeklyRecord, Client, FREQUENCY_PREFIX, FREQUENCY_LABELS } from '@/lib/types';
import { formatCurrency } from '@/utils/calculations';
import { 
  TrendingUp, Plus, ChevronRight, Activity, Calendar, 
  Target, Users, Briefcase, ChevronDown, CheckCircle2,
  MoreVertical, Pause, Trash2, Percent, Play, Clock
} from 'lucide-react';
import { NewClientModal } from '@/components/NewClientModal';
import { NewCampaignModal } from '@/components/NewCampaignModal';

export default function Dashboard() {
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [records, setRecords] = useState<WeeklyRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals & Menus
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [isCampaignModalOpen, setIsCampaignModalOpen] = useState(false);
  const [isClientDropdownOpen, setIsClientDropdownOpen] = useState(false);
  const [activeCampaignMenu, setActiveCampaignMenu] = useState<string | null>(null);
  const [overrideModal, setOverrideModal] = useState<{ campaignId: string; campName: string } | null>(null);
  const [overridePercent, setOverridePercent] = useState('');

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (selectedClient) {
      fetchCampaignData(selectedClient);
    }
  }, [selectedClient]);

  async function fetchInitialData() {
    try {
      const { data: clientList, error } = await supabase.from('clients').select('*').order('name');
      if (error) throw error;
      
      setClients(clientList || []);
      if (clientList && clientList.length > 0) {
        setSelectedClient(clientList[0].id);
      } else {
        setLoading(false);
      }
    } catch (err) {
      console.error('Error fetching clients:', err);
      setLoading(false);
    }
  }

  async function fetchCampaignData(clientId: string) {
    setLoading(true);
    try {
      const { data: camps } = await supabase
        .from('campaigns')
        .select('*')
        .eq('client_id', clientId)
        .order('name');
      
      const { data: recs } = await supabase
        .from('weekly_records')
        .select('*')
        .order('week_number', { ascending: false });

      setCampaigns(camps || []);
      setRecords(recs || []);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  }

  // Advance a SINGLE campaign
  async function handleAdvanceCampaign(campaign: Campaign, overrideStrategy?: number) {
    const nextPeriod = campaign.current_week + 1;
    const strategyToUse = overrideStrategy !== undefined ? overrideStrategy / 100 : Number(campaign.increment_strategy);

    try {
      const currentRecs = records.filter(r => r.campaign_id === campaign.id && r.week_number === campaign.current_week);
      const newRecords: any[] = [];
      
      // Check if it's a labeled campaign
      const labels = Array.from(new Set(
        records.filter(r => r.campaign_id === campaign.id).map(r => r.label).filter(l => l)
      ));

      if (labels.length > 0) {
        for (const label of labels) {
          const currentBudget = currentRecs.find(r => r.label === label)?.budget || 0;
          newRecords.push({
            campaign_id: campaign.id,
            week_number: nextPeriod,
            label: label,
            budget: Math.round(currentBudget * (1 + strategyToUse) * 100) / 100,
            is_projection: false,
            advanced_at: new Date().toISOString(),
            override_strategy: overrideStrategy !== undefined ? strategyToUse : null
          });
        }
      } else {
        const currentBudget = currentRecs.find(r => !r.label)?.budget || currentRecs[0]?.budget || 0;
        newRecords.push({
          campaign_id: campaign.id,
          week_number: nextPeriod,
          budget: Math.round(currentBudget * (1 + strategyToUse) * 100) / 100,
          is_projection: false,
          advanced_at: new Date().toISOString(),
          override_strategy: overrideStrategy !== undefined ? strategyToUse : null
        });
      }

      if (newRecords.length > 0) {
        const { error } = await supabase.from('weekly_records').insert(newRecords);
        if (error) throw error;
      }

      // Update ONLY this campaign's current_week
      const { error: campError } = await supabase
        .from('campaigns')
        .update({ current_week: nextPeriod })
        .eq('id', campaign.id);
      
      if (campError) throw campError;

      setActiveCampaignMenu(null);
      if (selectedClient) fetchCampaignData(selectedClient);
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  }

  async function handlePauseCampaign(campaignId: string) {
    if (!confirm('¿Pausar esta campaña?')) return;
    try {
      await supabase.from('campaigns').update({ status: 'paused' }).eq('id', campaignId);
      setActiveCampaignMenu(null);
      if (selectedClient) fetchCampaignData(selectedClient);
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  }

  async function handleResumeCampaign(campaignId: string) {
    try {
      await supabase.from('campaigns').update({ status: 'active' }).eq('id', campaignId);
      setActiveCampaignMenu(null);
      if (selectedClient) fetchCampaignData(selectedClient);
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  }

  async function handleDeleteCampaign(campaignId: string) {
    if (!confirm('¿Eliminar esta campaña? Esta acción no se puede deshacer.')) return;
    try {
      await supabase.from('campaigns').delete().eq('id', campaignId);
      setActiveCampaignMenu(null);
      if (selectedClient) fetchCampaignData(selectedClient);
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  }

  if (loading && !selectedClient && clients.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0a0a0a]">
        <Activity className="w-8 h-8 text-blue-500 animate-pulse" />
      </div>
    );
  }

  const currentWeek = campaigns.find(c => c.status === 'active')?.current_week || 1;

  return (
    <main className="p-4 md:p-8 max-w-7xl mx-auto min-h-screen">
      {/* Navbar / Client Selector */}
      <nav className="flex justify-between items-center mb-12 glass p-4">
        <div className="flex items-center gap-4">
          <div className="bg-blue-600 p-2 rounded-lg">
            <Activity className="text-white w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold gradient-text hidden md:block">Escalation Tracker</h1>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="relative group">
            <button 
              onClick={() => setIsClientDropdownOpen(!isClientDropdownOpen)}
              className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-lg border border-white/10 hover:bg-white/10 transition-colors"
            >
              <Users className="w-4 h-4 text-blue-400" />
              <span>{clients.find(c => c.id === selectedClient)?.name || 'Seleccionar Cliente'}</span>
              <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isClientDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            <div className={`absolute right-0 mt-2 w-56 dropdown-menu z-50 transition-all duration-200 ${isClientDropdownOpen ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible -translate-y-2'}`}>
              {clients.map(c => (
                <button 
                  key={c.id} 
                  onClick={() => {
                    setSelectedClient(c.id);
                    setIsClientDropdownOpen(false);
                  }}
                  className="dropdown-item first:rounded-t-xl"
                >
                  <Briefcase className="w-4 h-4 opacity-50" />
                  <span className="font-medium">{c.name}</span>
                  {selectedClient === c.id && <CheckCircle2 className="w-3 h-3 ml-auto text-blue-500" />}
                </button>
              ))}
              <div className="h-px bg-white/10 my-1 mx-2" />
              <button 
                onClick={() => {
                  setIsClientModalOpen(true);
                  setIsClientDropdownOpen(false);
                }}
                className="dropdown-item text-blue-400 hover:text-blue-300 font-bold"
              >
                <Plus className="w-4 h-4" /> Agregar Cliente
              </button>
            </div>
          </div>
        </div>
      </nav>

      <header className="mb-12 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold">Dashboard de Estrategia</h2>
          <p className="text-gray-400 mt-2 flex items-center gap-2">
            <Calendar className="w-4 h-4" /> Semana Actual: <span className="text-blue-400 font-semibold">S{currentWeek}</span>
          </p>
        </div>
        <button 
          onClick={() => setIsCampaignModalOpen(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 transition-colors px-6 py-3 rounded-xl font-semibold shadow-lg shadow-blue-900/20"
        >
          <Plus className="w-5 h-5" /> Nueva Campaña
        </button>
      </header>

      {/* Campaign Cards */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        {loading && campaigns.length === 0 ? (
             Array(3).fill(0).map((_, i) => <div key={i} className="glass p-6 h-48 animate-pulse" />)
        ) : (
          campaigns.map((campaign) => {
            // Calculate current budget
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
            const prefix = FREQUENCY_PREFIX[campaign.strategy_frequency] || 'S';
            const freqLabel = FREQUENCY_LABELS[campaign.strategy_frequency] || 'Semanal';

            return (
              <div key={campaign.id} className={`glass p-6 transition-all group flex flex-col justify-between relative ${isPaused ? 'opacity-60 border-yellow-500/30' : 'hover:border-blue-500/50'}`}>
                {/* Campaign Action Menu */}
                <div className="absolute top-4 right-4">
                  <button 
                    onClick={() => setActiveCampaignMenu(activeCampaignMenu === campaign.id ? null : campaign.id)}
                    className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <MoreVertical className="w-4 h-4 text-gray-500" />
                  </button>
                  
                  {activeCampaignMenu === campaign.id && (
                    <div className="absolute right-0 mt-1 dropdown-menu z-50 w-52">
                      {isPaused ? (
                        <button onClick={() => handleResumeCampaign(campaign.id)} className="dropdown-item text-green-400">
                          <Play className="w-4 h-4" /> Reanudar
                        </button>
                      ) : (
                        <>
                          <button onClick={() => handleAdvanceCampaign(campaign)} className="dropdown-item text-blue-400">
                            <ChevronRight className="w-4 h-4" /> Avanzar ({prefix}{campaign.current_week + 1})
                          </button>
                          <button 
                            onClick={() => {
                              setOverrideModal({ campaignId: campaign.id, campName: campaign.name });
                              setOverridePercent(String(strategyPct));
                              setActiveCampaignMenu(null);
                            }} 
                            className="dropdown-item text-yellow-400"
                          >
                            <Percent className="w-4 h-4" /> Avanzar con otro %
                          </button>
                          <button onClick={() => handlePauseCampaign(campaign.id)} className="dropdown-item text-orange-400">
                            <Pause className="w-4 h-4" /> Pausar
                          </button>
                        </>
                      )}
                      <div className="h-px bg-white/10 my-1 mx-2" />
                      <button onClick={() => handleDeleteCampaign(campaign.id)} className="dropdown-item text-red-400">
                        <Trash2 className="w-4 h-4" /> Eliminar
                      </button>
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex items-start mb-4 pr-8">
                    <div>
                      <h3 className="text-xl font-bold group-hover:text-blue-400 transition-colors leading-tight">{campaign.name}</h3>
                      {isPaused && <span className="text-[10px] text-yellow-400 font-bold uppercase"> ⏸ Pausada</span>}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-1">Presupuesto {prefix}{campaign.current_week}</p>
                      <p className="text-xl font-mono">{formatCurrency(currentBudget)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-1">Estrategia</p>
                      <p className="text-xl text-green-400 flex items-center gap-1">
                        <TrendingUp className="w-4 h-4" /> {strategyPct}%
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-1">Frecuencia</p>
                      <p className="text-sm text-gray-300 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {freqLabel}
                      </p>
                    </div>
                  </div>

                  {campaign.target_budget && (
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-xs font-bold uppercase tracking-wider">
                        <span className="text-gray-500 flex items-center gap-1"><Target className="w-3 h-3 text-red-500" /> Meta: {formatCurrency(campaign.target_budget)}</span>
                        <span className={isFinished ? "text-green-500" : "text-blue-400"}>{Math.round(progress)}%</span>
                      </div>
                      <div className="h-2 bg-white/5 rounded-full overflow-hidden border border-white/5">
                        <div 
                          className={`h-full transition-all duration-1000 ${isFinished ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-blue-600'}`} 
                          style={{ width: `${progress}%` }} 
                        />
                      </div>
                      <div className="flex justify-between text-[10px] text-gray-500">
                        {isFinished ? (
                          <span className="text-green-500 flex items-center gap-1 font-bold"><CheckCircle2 className="w-3 h-3" /> Objetivo Alcanzado</span>
                        ) : (
                          <span>Objetivo: {prefix}{campaign.target_week || '?'}</span>
                        )}
                        {campaign.estimated_target_date && (
                          <span className="text-blue-400">📅 {new Date(campaign.estimated_target_date).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })}</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-white/5 flex justify-between items-center mt-auto">
                  <div className="flex items-center gap-2">
                    <span className="bg-blue-500/10 text-blue-400 text-[10px] px-2 py-1 rounded-full border border-blue-400/20">
                      {campaign.type === 'mixed_budget' ? 'MIXED' : campaign.type === 'adset_budget' ? 'ADSET' : 'STANDARD'}
                    </span>
                  </div>
                  {!isPaused && (
                    <button 
                      onClick={() => handleAdvanceCampaign(campaign)}
                      className="bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 text-xs px-3 py-1.5 rounded-lg border border-blue-600/20 transition-colors font-bold"
                    >
                      Avanzar → {prefix}{campaign.current_week + 1}
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </section>

      {/* Progression Table */}
      <section className="glass overflow-hidden border border-white/5">
        <div className="p-6 border-b border-white/5 flex justify-between items-center">
          <h2 className="text-2xl font-bold flex items-center gap-2"><TrendingUp className="text-blue-400" /> Plan de Aumento Progresivo</h2>
          <div className="text-xs font-bold text-gray-500 uppercase tracking-widest bg-white/5 px-4 py-2 rounded-lg">Frecuencia: Variable por Campaña</div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-white/5 text-gray-400 text-[10px] font-black uppercase tracking-widest">
                <th className="p-6">Campaña / Conjunto</th>
                {records.length > 0 && Array.from(new Set(records.map(r => r.week_number))).sort((a,b) => a-b).map(week => (
                   <th key={week} className={`p-6 ${week === currentWeek ? 'bg-blue-600/10 text-blue-400' : 'text-gray-500'} font-mono`}>S{week}</th>
                ))}
                <th className="p-6 bg-white/5 opacity-50 italic">Próx. (Proy.)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {campaigns.filter(c => c.status !== 'deleted').map((camp) => {
                const isComplex = camp.type === 'mixed_budget' || camp.type === 'adset_budget';
                const campRecs = records.filter(r => r.campaign_id === camp.id);
                const labels = Array.from(new Set(campRecs.map(r => r.label).filter((l): l is string => !!l)));
                const weeks = Array.from(new Set(records.map(r => r.week_number))).sort((a,b) => a-b);
                const campStrategy = Number(camp.increment_strategy);
                
                const renderRow = (label: string | null) => {
                  const getBudget = (week: number) => {
                    return campRecs.find(r => r.week_number === week && (r.label === label || (!r.label && !label)))?.budget;
                  };
                  const latestBudget = getBudget(camp.current_week) || 0;
                  const projectedBudget = Math.round(latestBudget * (1 + campStrategy) * 100) / 100;
                  
                  return (
                    <tr key={`${camp.id}-${label || 'main'}`} className={`hover:bg-white/5 transition-colors border-l-2 border-transparent hover:border-blue-600 ${camp.status === 'paused' ? 'opacity-50' : ''}`}>
                      <td className="p-6">
                         <div className="font-bold text-sm">{label || camp.name}</div>
                         {label && <div className="text-[9px] text-gray-500 uppercase font-black">{camp.name}</div>}
                         {camp.status === 'paused' && <span className="text-[9px] text-yellow-400">⏸ Pausada</span>}
                      </td>
                      {weeks.map(week => (
                        <td key={week} className={`p-6 font-mono text-sm ${week === camp.current_week ? 'font-bold text-blue-400 bg-blue-600/5' : 'text-gray-500'}`}>
                            {formatCurrency(getBudget(week) || 0)}
                        </td>
                      ))}
                      <td className="p-6 text-gray-600 font-mono text-sm italic bg-white/5 opacity-50">{formatCurrency(projectedBudget)}</td>
                    </tr>
                  );
                };

                if (isComplex && labels.length > 0) {
                  return labels.map(l => renderRow(l));
                }
                return renderRow(null);
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Override % Modal */}
      {overrideModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#111] border border-white/10 rounded-2xl w-full max-w-sm p-6 space-y-4 shadow-2xl">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <Percent className="w-5 h-5 text-yellow-400" /> Avance Personalizado
            </h3>
            <p className="text-sm text-gray-400">
              Campaña: <span className="text-white font-semibold">{overrideModal.campName}</span>
            </p>
            <div>
              <label className="text-[10px] text-gray-500 uppercase font-bold mb-1 block">Porcentaje de Aumento (%)</label>
              <input 
                type="number" 
                value={overridePercent}
                onChange={e => setOverridePercent(e.target.value)}
                className="input font-mono text-lg"
                placeholder="20"
                min="0"
                step="1"
                autoFocus
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button 
                onClick={() => setOverrideModal(null)} 
                className="px-4 py-2 hover:bg-white/5 rounded-lg text-sm text-gray-400 transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={() => {
                  const camp = campaigns.find(c => c.id === overrideModal.campaignId);
                  if (camp) {
                    handleAdvanceCampaign(camp, parseFloat(overridePercent));
                  }
                  setOverrideModal(null);
                }}
                className="bg-yellow-600 hover:bg-yellow-500 text-white px-6 py-2 rounded-lg font-bold transition-all shadow-lg"
              >
                Avanzar con {overridePercent}%
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <NewClientModal 
        isOpen={isClientModalOpen}
        onClose={() => setIsClientModalOpen(false)}
        onSuccess={fetchInitialData}
      />

      <NewCampaignModal
        isOpen={isCampaignModalOpen}
        onClose={() => setIsCampaignModalOpen(false)}
        onSuccess={() => selectedClient && fetchCampaignData(selectedClient)}
        clients={clients}
        initialClientId={selectedClient}
      />
    </main>
  );
}
