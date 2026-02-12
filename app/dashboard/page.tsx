'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Campaign, WeeklyRecord, Client, FREQUENCY_PREFIX, FREQUENCY_LABELS, StrategyAdjustment } from '@/lib/types';
import { formatCurrency } from '@/utils/calculations';
import { 
  TrendingUp, Plus, ChevronRight, Activity, Calendar, 
  Target, Users, Briefcase, ChevronDown, CheckCircle2,
  MoreVertical, Pause, Trash2, Percent, Play, Clock,
  Moon, Sun, AlertTriangle, LogOut, Info, HelpCircle,
  Archive, AlertCircle, Info as InfoIcon, CheckCircle
} from 'lucide-react';
import { NewClientModal } from '@/components/NewClientModal';
import { NewCampaignModal } from '@/components/NewCampaignModal';

export const dynamic = 'force-dynamic';

export default function Dashboard() {
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [records, setRecords] = useState<WeeklyRecord[]>([]);
  const [adjustments, setAdjustments] = useState<StrategyAdjustment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'warning' | 'danger' | 'success' | 'info';
    onConfirm?: () => void;
    confirmText?: string;
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'info'
  });
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const router = useRouter();

  // Modals & Menus
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [isCampaignModalOpen, setIsCampaignModalOpen] = useState(false);
  const [isClientDropdownOpen, setIsClientDropdownOpen] = useState(false);
  const [activeCampaignMenu, setActiveCampaignMenu] = useState<string | null>(null);
  const [showStrategyInfo, setShowStrategyInfo] = useState<Record<string, boolean>>({});
  const [overrideModal, setOverrideModal] = useState<{ campaignId: string; campName: string } | null>(null);
  const [overridePercent, setOverridePercent] = useState('');

  useEffect(() => {
    checkAuthAndLoadProfile();
  }, []);

  async function checkAuthAndLoadProfile() {
    if (!supabase) return;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push('/login');
      return;
    }

    try {
      // Fetch profile
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (profile) {
        // Set theme
        if (profile.theme) {
          setTheme(profile.theme as 'dark' | 'light');
          if (profile.theme === 'dark') {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
        }
        
        // Set last client
        if (profile.last_client_id) {
          setSelectedClient(profile.last_client_id);
        }
      }
    } catch (err) {
      console.error('Error loading profile:', err);
    }

    fetchInitialData();
  }

  async function handleUpdateStrategy(campaignId: string, newPercent: number) {
    const strategyDecimal = newPercent / 100;
    try {
      const { data: campaign } = await supabase.from('campaigns').select('increment_strategy').eq('id', campaignId).single();
      const oldStrategy = campaign?.increment_strategy || 0;

      const { error } = await supabase
        .from('campaigns')
        .update({ increment_strategy: strategyDecimal })
        .eq('id', campaignId);
      
      if (error) throw error;

      // Guardar en el historial
      await supabase.from('strategy_adjustments').insert({
        campaign_id: campaignId,
        old_strategy: oldStrategy,
        new_strategy: strategyDecimal
      });

      setOverrideModal(null);
      if (selectedClient) fetchCampaignData(selectedClient);
    } catch (err: any) {
      alert('Error updating strategy: ' + err.message);
    }
  }

  async function handleLogout() {
    if (!supabase) return;
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  const toggleTheme = async () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
      localStorage.theme = 'dark';
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.theme = 'light';
    }

    // Persist to DB
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      await supabase.from('user_profiles').update({ theme: newTheme }).eq('id', session.user.id);
    }
  };

  useEffect(() => {
    if (selectedClient) {
      fetchCampaignData(selectedClient);
      persistLastClient(selectedClient);
    }
  }, [selectedClient]);

  async function persistLastClient(clientId: string) {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      await supabase.from('user_profiles').update({ last_client_id: clientId }).eq('id', session.user.id);
    }
  }

  async function fetchInitialData() {
    if (!supabase) {
      setLoading(false);
      return;
    }
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
    if (!supabase) return;
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

      const { data: adjList } = await supabase
        .from('strategy_adjustments')
        .select('*')
        .order('created_at', { ascending: true });

      setCampaigns(camps || []);
      setRecords(recs || []);
      setAdjustments(adjList || []);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleAdvanceCampaign(campaign: Campaign, overrideStrategy?: number) {
    const nextPeriod = campaign.current_week + 1;
    const strategyToUse = overrideStrategy !== undefined ? overrideStrategy / 100 : Number(campaign.increment_strategy);

    try {
      const currentRecs = records.filter(r => r.campaign_id === campaign.id && r.week_number === campaign.current_week);
      const newRecords: any[] = [];
      
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
    setShowConfirmation({
      isOpen: true,
      title: 'Pausar Campaña',
      message: '¿Estás seguro de que quieres pausar esta campaña? Podrás reanudarla en cualquier momento.',
      type: 'warning',
      confirmText: 'Pausar Ahora',
      onConfirm: async () => {
        try {
          await supabase.from('campaigns').update({ status: 'paused' }).eq('id', campaignId);
          setActiveCampaignMenu(null);
          if (selectedClient) fetchCampaignData(selectedClient);
          setShowConfirmation(prev => ({ ...prev, isOpen: false }));
        } catch (err: any) {
          alert('Error: ' + err.message);
        }
      }
    });
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
    setShowConfirmation({
      isOpen: true,
      title: 'Mover a Papelera',
      message: '¿Estás seguro de que quieres mover esta campaña a la papelera? Podrás restaurarla después desde la sección de Inactivas.',
      type: 'warning',
      confirmText: 'Mover a Papelera',
      onConfirm: async () => {
        try {
          await supabase.from('campaigns').update({ status: 'deleted' }).eq('id', campaignId);
          setActiveCampaignMenu(null);
          if (selectedClient) fetchCampaignData(selectedClient);
          setShowConfirmation(prev => ({ ...prev, isOpen: false }));
        } catch (err: any) {
          alert('Error: ' + err.message);
        }
      }
    });
  }

  async function handleArchiveCampaign(campaignId: string) {
    try {
      await supabase.from('campaigns').update({ status: 'archived' }).eq('id', campaignId);
      setActiveCampaignMenu(null);
      if (selectedClient) fetchCampaignData(selectedClient);
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  }
  async function handleRestoreCampaign(campaignId: string) {
    try {
      await supabase.from('campaigns').update({ status: 'active' }).eq('id', campaignId);
      if (selectedClient) fetchCampaignData(selectedClient);
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  }

  async function handleCompleteCampaign(campaignId: string) {
    try {
      await supabase.from('campaigns').update({ status: 'completed' }).eq('id', campaignId);
      setActiveCampaignMenu(null);
      if (selectedClient) fetchCampaignData(selectedClient);
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  }

  async function handlePermanentlyDeleteCampaign(campaignId: string) {
    setShowConfirmation({
      isOpen: true,
      title: '⚠️ PELIGRO: Eliminación Permanente',
      message: 'Esta acción eliminará PERMANENTEMENTE la campaña y TODO su historial de la base de datos. No se puede deshacer.',
      type: 'danger',
      confirmText: 'Eliminar Definitivamente',
      onConfirm: () => {
        setShowConfirmation({
          isOpen: true,
          title: '¿ESTÁS ABSOLUTAMENTE SEGURO?',
          message: 'Esta acción es definitiva y no hay vuelta atrás.',
          type: 'danger',
          confirmText: 'SÍ, BORRAR TODO',
          onConfirm: async () => {
            try {
              await supabase.from('campaigns').delete().eq('id', campaignId);
              if (selectedClient) fetchCampaignData(selectedClient);
            } catch (err: any) {
              alert('Error: ' + err.message);
            }
          }
        });
      }
    });
  }

  async function handleBulkAdvance() {
    const activeCampaigns = campaigns.filter(c => c.status === 'active');
    if (activeCampaigns.length === 0) return;

    // Check strategy consistency
    const strategies = new Set(activeCampaigns.map(c => Number(c.increment_strategy)));
    
    const processAdvance = async () => {
      setLoading(true);
      try {
        for (const camp of activeCampaigns) {
          // Check if already finished to skip
          const campaignRecords = records.filter(r => r.campaign_id === camp.id && r.week_number === camp.current_week);
          let currentBudget = 0;
          if (camp.type === 'mixed_budget' || camp.type === 'adset_budget') {
              currentBudget = campaignRecords.reduce((sum, r) => sum + Number(r.budget), 0);
          } else {
              currentBudget = campaignRecords.find(r => !r.label)?.budget || 0;
          }
          if (camp.target_budget && currentBudget >= camp.target_budget) continue;
          
          await handleAdvanceCampaign(camp);
        }
        setShowConfirmation(prev => ({ ...prev, isOpen: false }));
      } finally {
        setLoading(false);
      }
    };

    if (strategies.size > 1) {
      setShowConfirmation({
        isOpen: true,
        title: '⚠️ Estrategias Diferentes',
        message: 'Algunas campañas tienen porcentajes de estrategia distintos. ¿Deseas avanzar todas a su siguiente etapa de todas formas?',
        type: 'warning',
        confirmText: 'Avanzar de todas formas',
        onConfirm: processAdvance
      });
    } else {
      // Execute directly if strategies are identical
      processAdvance();
    }
  }

  if (loading && !selectedClient && clients.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Activity className="w-8 h-8 text-accent animate-pulse" />
      </div>
    );
  }

  const currentWeek = campaigns.find(c => c.status === 'active')?.current_week || 1;

  return (
    <main className="p-4 md:p-10 max-w-7xl mx-auto min-h-screen">
      {!supabase && (
        <div className="mb-8 p-4 bg-destructive/10 border border-destructive/20 rounded-[1.5rem] flex items-center gap-4 text-destructive animate-in slide-in-from-top-4 duration-500">
          <div className="bg-destructive/10 p-2 rounded-xl">
             <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <p className="font-black uppercase italic text-xs tracking-widest leading-none mb-1">Base de datos no conectada</p>
            <p className="text-sm font-bold opacity-80">Configura las variables de entorno en Vercel para ver tus datos.</p>
          </div>
        </div>
      )}
      {/* Premium Navbar */}
      <nav className="flex justify-between items-center mb-16 card-widget p-5 bg-card/10 backdrop-blur-xl border-white/5">
        <Link href="/" className="flex items-center gap-5 group/logo transition-all hover:opacity-80">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-accent to-orange-400 rounded-full blur opacity-40 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
            <img 
              src="/android-chrome-192x192.png" 
              alt="Logo" 
              className="relative w-10 h-10 rounded-full border border-white/10 object-cover shadow-orange-glow/20"
            />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-foreground uppercase italic group-hover/logo:text-accent transition-colors">F-Tracker</h1>
        </Link>
        
        <div className="flex items-center gap-6">
          <button
              onClick={toggleTheme}
              className="p-3 rounded-full hover:bg-secondary transition-all text-foreground bg-secondary/30 border border-white/5"
              aria-label="Toggle Theme"
          >
              {theme === 'dark' ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5 text-blue-600" />}
          </button>

          <div className="relative group/nav">
            <button 
              onClick={() => setIsClientDropdownOpen(!isClientDropdownOpen)}
              className="flex items-center gap-3 px-5 py-2.5 rounded-xl border border-border hover:border-accent/50 hover:bg-secondary transition-all text-foreground bg-secondary/20 shadow-sm"
            >
              <Users className="w-5 h-5 text-accent" />
              <span className="font-bold">{clients.find(c => c.id === selectedClient)?.name || 'Cliente'}</span>
              <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${isClientDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            <div className={`absolute right-0 mt-3 w-64 bg-card border border-border shadow-2xl rounded-2xl overflow-hidden z-50 transition-all duration-300 ${isClientDropdownOpen ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible -translate-y-2'}`}>
              <div className="p-2">
                {clients.map(c => (
                  <button 
                    key={c.id} 
                    onClick={() => {
                      setSelectedClient(c.id);
                      setIsClientDropdownOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-left hover:bg-secondary rounded-xl text-foreground transition-colors group/item"
                  >
                    <Briefcase className="w-4 h-4 opacity-40 group-hover/item:opacity-100" />
                    <span className="font-semibold">{c.name}</span>
                    {selectedClient === c.id && <CheckCircle2 className="w-4 h-4 ml-auto text-accent" />}
                  </button>
                ))}
              </div>
              <div className="h-px bg-border my-1" />
              <div className="p-2">
                <button 
                  onClick={() => {
                    setIsClientModalOpen(true);
                    setIsClientDropdownOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-left hover:bg-accent hover:text-white rounded-xl text-accent font-bold transition-all"
                >
                  <Plus className="w-5 h-5" /> Agregar Cliente
                </button>
              </div>
            </div>
          </div>

          <button
              onClick={handleLogout}
              className="p-3 rounded-xl hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all bg-secondary/30 border border-white/5 group flex items-center gap-2"
              title="Cerrar Sesión"
          >
              <LogOut className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
              <span className="text-[10px] font-black uppercase tracking-widest hidden md:block">Salir</span>
          </button>
        </div>
      </nav>

      <header className="mb-14 flex flex-col md:flex-row md:items-end justify-between gap-6 px-2">
        <div>
          <h2 className="text-5xl font-black tracking-tighter text-foreground mb-3 uppercase italic">Dashboard</h2>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-2 bg-accent/10 text-accent px-5 py-2 rounded-full text-xs font-black border border-accent/20 shadow-orange-glow/10">
              <Calendar className="w-4 h-4" /> ETAPA ACTUAL: E{currentWeek}
            </span>
          </div>
        </div>
        <div className="flex flex-col md:flex-row items-center gap-4">
          <button 
            onClick={handleBulkAdvance}
            disabled={loading || campaigns.filter(c => c.status === 'active').length === 0}
            className="bg-secondary text-foreground px-6 py-4 rounded-2xl font-black flex items-center gap-3 border border-border hover:bg-secondary/80 transition-all text-sm uppercase italic disabled:opacity-50"
          >
            <ChevronRight className="w-5 h-5 text-accent" /> Avanzar Todas
          </button>
          <button 
            onClick={() => setIsCampaignModalOpen(true)}
            disabled={!supabase}
            className="bg-accent text-white px-8 py-4 rounded-2xl font-black flex items-center gap-3 shadow-[0_10px_40px_-10px_rgba(255,69,0,0.5)] hover:scale-[1.05] transition-all text-lg uppercase italic disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed"
          >
            <Plus className="w-6 h-6" /> Nueva Campaña
          </button>
        </div>
      </header>

      {/* Grid of Widgets */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
        {loading && campaigns.length === 0 ? (
             Array(3).fill(0).map((_, i) => <div key={i} className="card-widget p-8 h-64 animate-pulse bg-secondary/50 border-transparent" />)
        ) : (
          campaigns.filter(c => c.status === 'active').map((campaign) => {
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
              <div key={campaign.id} className={`card-widget p-8 transition-all group flex flex-col justify-between relative bg-card border-beam-container ${isPaused ? 'opacity-60 grayscale-[0.5]' : ''} ${isFinished ? 'border-success/30 shadow-[0_0_40px_-10px_rgba(34,197,94,0.2)]' : ''}`}>
                
                {/* Header Widget */}
                <div className="flex justify-between items-start mb-8">
                  <div className="space-y-1">
                    <h3 className="text-2xl font-black text-foreground group-hover:text-accent transition-colors leading-none tracking-tight uppercase italic">{campaign.name}</h3>
                    <div className="flex gap-2 items-center">
                      <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${isFinished ? 'bg-success/10 text-success border-success/20' : 'bg-accent/10 text-accent border-accent/20'}`}>
                        {campaign.type === 'mixed_budget' ? 'MIX' : campaign.type === 'adset_budget' ? 'ADSET' : 'STD'}
                      </span>
                      {isPaused && <span className="text-[10px] text-warning font-black uppercase">⏸ PAUSADA</span>}
                      {isFinished && <span className="text-[10px] text-success font-black uppercase flex items-center gap-1">🏆 ÉXITO</span>}
                      <button 
                        onClick={() => setShowStrategyInfo(prev => ({ ...prev, [campaign.id]: !prev[campaign.id] }))}
                        className={`p-1 rounded-md transition-colors ${showStrategyInfo[campaign.id] ? 'bg-accent/20 text-accent' : 'text-muted-foreground hover:text-accent'}`}
                        title="Ver detalle de cálculo"
                      >
                        <HelpCircle className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="relative">
                    <button 
                      onClick={() => setActiveCampaignMenu(activeCampaignMenu === campaign.id ? null : campaign.id)}
                      className="p-2 hover:bg-secondary rounded-full transition-colors text-muted-foreground hover:text-accent border border-transparent hover:border-accent/30"
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
                <div className="grid grid-cols-2 gap-6 mb-8">
                  <div className="space-y-1">
                    <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest pl-1">Presupuesto {prefix}{campaign.current_week}</p>
                    <p className="text-3xl font-black text-foreground tabular-nums tracking-tighter">{formatCurrency(currentBudget)}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest pl-1">Estrategia</p>
                    <p className={`text-3xl font-black tracking-tighter flex items-end gap-1 ${isFinished ? 'text-success' : 'text-accent'}`}>
                      {strategyPct}% <TrendingUp className="w-5 h-5 mb-1" />
                    </p>
                  </div>
                </div>

                {/* Strategy Info Card (Explanatory Logic) */}
                {showStrategyInfo[campaign.id] && (
                  <div className="mb-6 animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="p-5 bg-accent/[0.03] rounded-2xl border border-accent/10 space-y-4 border-beam-container">
                      <div className="flex items-center gap-2 mb-1 border-b border-accent/10 pb-2">
                         <Info className="w-3.5 h-3.5 text-accent" />
                         <p className="text-[10px] font-black uppercase text-foreground tracking-widest">¿Cómo llegamos a este número?</p>
                      </div>
                      
                      <div className="space-y-3">
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
                                  const showAll = campAdjs.length <= 3;
                                  return (
                                    <div className="space-y-1">
                                      {campAdjs.slice(0, 3).map((adj, idx) => (
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
          })
        )}
      </section>

      {/* Advanced Progression Table */}
      <section className="card-widget overflow-hidden mb-20 bg-card border-none shadow-[0_40px_80px_-20px_rgba(0,0,0,0.5)]">
        <div className="p-8 border-b border-border flex justify-between items-center bg-secondary/20">
          <h2 className="text-2xl font-black text-foreground tracking-tight uppercase italic">Estrategia de Escalado</h2>
          <div className="text-[10px] font-black text-accent uppercase tracking-widest bg-accent/10 px-4 py-2 rounded-full border border-accent/20 shadow-orange-glow/10">Vista de Proyección</div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-secondary/10 text-muted-foreground text-[10px] font-black uppercase tracking-widest border-b border-border">
                <th className="p-8">Campaña / Plataforma</th>
                {records.length > 0 && Array.from(new Set(records.map(r => r.week_number))).sort((a,b) => a-b).map(week => (
                   <th key={week} className={`p-8 ${week === currentWeek ? 'bg-accent/10 text-accent font-black' : 'text-muted-foreground'} text-center font-mono text-sm`}>E{week}</th>
                ))}
                <th className="p-8 text-center text-accent/50 italic opacity-60">Próxima</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {campaigns.filter(c => c.status !== 'deleted').map((camp) => {
                const campRecs = records.filter(r => r.campaign_id === camp.id);
                const labels = Array.from(new Set(campRecs.map(r => r.label).filter((l): l is string => !!l)));
                const weeks = Array.from(new Set(records.map(r => r.week_number))).sort((a,b) => a-b);
                const campStrategy = Number(camp.increment_strategy);
                
                const renderRow = (label: string | null) => {
                  const latestBudget = campRecs.find(r => r.week_number === camp.current_week && (r.label === label || (!r.label && !label)))?.budget || 0;
                  const projectedBudget = Math.round(latestBudget * (1 + campStrategy) * 100) / 100;
                  
                  return (
                    <tr key={`${camp.id}-${label || 'main'}`} className={`hover:bg-accent/[0.03] transition-all border-l-4 border-transparent hover:border-accent ${camp.status === 'paused' ? 'opacity-40' : ''}`}>
                      <td className="p-8">
                         <div className="flex items-center gap-2">
                           <span className={`text-[8px] font-black px-1.5 py-0.5 rounded border border-accent/20 bg-accent/5 text-accent`}>
                             {camp.type === 'mixed_budget' ? 'MIX' : camp.type === 'adset_budget' ? 'ADSET' : 'STD'}
                           </span>
                           <div className="font-bold text-foreground">{label || camp.name}</div>
                         </div>
                         {label && <div className="text-[10px] text-muted-foreground font-black uppercase mt-1 opacity-60 ml-10">— {camp.name}</div>}
                      </td>
                      {weeks.map(week => {
                        const budget = campRecs.find(r => r.week_number === week && (r.label === label || (!r.label && !label)))?.budget;
                        return (
                          <td key={week} className={`p-8 text-center font-mono text-sm tabular-nums ${week === camp.current_week ? 'font-black text-foreground bg-accent/[0.02]' : 'text-muted-foreground'}`}>
                              {budget ? formatCurrency(budget) : '—'}
                          </td>
                        );
                      })}
                      <td className="p-8 text-accent font-mono text-sm tabular-nums text-center font-black opacity-40 italic">{formatCurrency(projectedBudget)}</td>
                    </tr>
                  );
                };

                if (labels.length > 0) return labels.map(l => renderRow(l));
                return renderRow(null);
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Override Modal Refinement */}
      {overrideModal && (
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
      )}

      {/* Standard Modals */}
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

      {/* Simple Footer */}
      <footer className="py-20 border-t border-border mt-20 opacity-60 hover:opacity-100 transition-opacity">
         <div className="flex flex-col md:flex-row justify-between items-center gap-10">
            <a 
              href="https://www.fangerdesign.com.ar/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="group cursor-pointer transition-all duration-500 hover:scale-110 active:scale-95"
            >
              <img 
                src={theme === 'dark' ? '/Logo-Fanger.png' : '/Logo-Fanger-Footer-black-V1.0-1.png'} 
                alt="Fanger Logo" 
                className="h-8 w-auto object-contain transition-opacity duration-300 group-hover:opacity-100 opacity-80"
              />
            </a>
            
            <div className="flex gap-8">
               <a 
                 href="https://ian-pontorno-portfolio.vercel.app/" 
                 target="_blank" 
                 rel="noopener noreferrer"
                 className="text-[10px] font-black uppercase text-muted-foreground tracking-widest hover:text-accent transition-colors"
               >
                 © 2026 Ian Pontorno
               </a>
               <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Internal Utility</span>
            </div>
         </div>
      </footer>

      {/* Sidebar de Estados (Archivo/Pausadas/Completadas) */}
      <div className={`fixed inset-y-0 right-0 w-80 bg-card border-l border-border shadow-2xl z-[100] transition-transform duration-500 ease-in-out ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="h-full flex flex-col">
          <div className="p-6 border-b border-border flex justify-between items-center bg-secondary/20">
            <div className="flex items-center gap-2">
              <Archive className="w-5 h-5 text-accent" />
              <h3 className="font-black text-xs uppercase tracking-widest text-foreground">Gestión de Estados</h3>
            </div>
            <button onClick={() => setIsSidebarOpen(false)} className="p-2 hover:bg-secondary rounded-full transition-colors text-muted-foreground">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-8 custom-scrollbar">
            {['paused', 'completed', 'archived', 'deleted'].map((status) => {
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
                      filtered.map(camp => (
                        <div key={camp.id} className="p-4 bg-secondary/30 rounded-2xl border border-border/50 group/item hover:border-accent/30 transition-all">
                          <div className="flex justify-between items-start mb-2">
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
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Custom Confirmation Modal */}
      {showConfirmation.isOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[200] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-card border border-border rounded-[2.5rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300">
            <div className={`p-8 border-b border-border flex flex-col items-center text-center space-y-4 ${
              showConfirmation.type === 'danger' ? 'bg-destructive/10' : 
              showConfirmation.type === 'warning' ? 'bg-warning/10' : 
              'bg-accent/10'
            }`}>
              <div className={`p-4 rounded-2xl ${
                showConfirmation.type === 'danger' ? 'bg-destructive/20 text-destructive' : 
                showConfirmation.type === 'warning' ? 'bg-warning/20 text-warning' : 
                'bg-accent/20 text-accent'
              }`}>
                {showConfirmation.type === 'danger' ? <AlertCircle className="w-10 h-10" /> : 
                 showConfirmation.type === 'warning' ? <AlertTriangle className="w-10 h-10" /> : 
                 <InfoIcon className="w-10 h-10" />}
              </div>
              <div>
                <h2 className="text-2xl font-black text-foreground tracking-tight uppercase italic">{showConfirmation.title}</h2>
                <p className="text-sm font-bold text-muted-foreground mt-2">{showConfirmation.message}</p>
              </div>
            </div>
            <div className="p-8 bg-secondary/30 flex flex-col gap-3">
              {showConfirmation.onConfirm && (
                <button
                  onClick={showConfirmation.onConfirm}
                  className={`w-full py-4 rounded-2xl font-black text-lg transition-all shadow-xl ${
                    showConfirmation.type === 'danger' ? 'bg-destructive text-white shadow-destructive/20 hover:bg-destructive/90' : 
                    showConfirmation.type === 'warning' ? 'bg-warning text-white shadow-warning/20 hover:bg-warning/90' : 
                    'bg-accent text-white shadow-accent/20 hover:bg-accent/90'
                  }`}
                >
                  {showConfirmation.confirmText || 'Confirmar'}
                </button>
              )}
              <button
                onClick={() => setShowConfirmation(prev => ({ ...prev, isOpen: false }))}
                className="w-full py-4 font-bold text-muted-foreground hover:bg-secondary rounded-2xl transition-all"
              >
                {showConfirmation.onConfirm ? 'Cancelar' : 'Entendido'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Snippet Trigger para Sidebar (Lateral Moderno) */}
      <button 
        onClick={() => setIsSidebarOpen(true)}
        className={`fixed right-0 top-1/2 -translate-y-1/2 bg-card border border-border border-r-0 pl-4 pr-3 py-8 rounded-l-3xl shadow-[-10px_0_30px_rgba(0,0,0,0.2)] z-[90] transition-all duration-500 hover:pl-6 group flex flex-col items-center gap-4 ${isSidebarOpen ? 'translate-x-full' : 'translate-x-0'}`}
      >
        <div className="flex flex-col items-center gap-1 group-hover:scale-110 transition-transform">
          <Archive className="w-5 h-5 text-accent" />
          <div className="w-5 h-5 bg-accent text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-card">
            {campaigns.filter(c => ['paused', 'completed', 'archived', 'deleted'].includes(c.status)).length}
          </div>
        </div>
        <div className="[writing-mode:vertical-lr] text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground group-hover:text-foreground transition-colors py-2 border-t border-border mt-2">
          Gestionar Inactivas
        </div>
      </button>
    </main>
  );
}
