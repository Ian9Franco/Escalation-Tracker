'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Campaign, WeeklyRecord, Client, StrategyAdjustment, Platform } from '@/lib/types';
import { Activity, AlertTriangle, Archive } from 'lucide-react';
import { NewClientModal } from '@/components/NewClientModal';
import { NewCampaignModal } from '@/components/NewCampaignModal';

// Dashboard components
import { DashboardNavbar } from './_components/DashboardNavbar';
import { DashboardHeader } from './_components/DashboardHeader';
import { CampaignCard } from './_components/CampaignCard';
import { ProjectionTable } from './_components/ProjectionTable';
import { CampaignSidebar } from './_components/CampaignSidebar';
import { OverrideModal } from './_components/OverrideModal';
import { ConfirmationModal } from './_components/ConfirmationModal';
import { PauseCampaignModal } from './_components/PauseCampaignModal';
import { AdvanceCampaignModal } from './_components/AdvanceCampaignModal';

// DnD Imports
import {
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Sortable Item Wrapper Component
function SortableCampaignItem({ campaign, ...props }: { campaign: Campaign } & any) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: campaign.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <CampaignCard
      campaign={campaign}
      setNodeRef={setNodeRef}
      style={style}
      attributes={attributes}
      listeners={listeners}
      {...props}
    />
  );
}

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
  const [pauseModal, setPauseModal] = useState<{ campaignId: string; campName: string } | null>(null);
  const [advanceModal, setAdvanceModal] = useState<{ campaign: Campaign; records: WeeklyRecord[]; strategyPct: number } | null>(null);
  
  // DnD Sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // ─── Effects ───────────────────────────────────────────────────

  useEffect(() => {
    checkAuthAndLoadProfile();
  }, []);

  useEffect(() => {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active');
        }
      });
    }, observerOptions);

    const revealElements = document.querySelectorAll('.reveal');
    revealElements.forEach(el => observer.observe(el));

    return () => observer.disconnect();
  }, [loading, selectedClient]);

  useEffect(() => {
    if (isSidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [isSidebarOpen]);

  useEffect(() => {
    if (selectedClient) {
      fetchCampaignData(selectedClient);
      persistLastClient(selectedClient);
    }
  }, [selectedClient]);

  // ─── Auth & Data ──────────────────────────────────────────────

  async function checkAuthAndLoadProfile() {
    if (!supabase) return;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push('/login');
      return;
    }

    let profileClientId: string | null = null;

    try {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (profile) {
        if (profile.theme) {
          setTheme(profile.theme as 'dark' | 'light');
          if (profile.theme === 'dark') {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
        }
        if (profile.last_client_id) {
          profileClientId = profile.last_client_id;
          setSelectedClient(profile.last_client_id);
        }
      }
    } catch (err) {
      console.error('Error loading profile:', err);
    }

    fetchInitialData(profileClientId);
  }

  async function persistLastClient(clientId: string) {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      await supabase.from('user_profiles').update({ last_client_id: clientId }).eq('id', session.user.id);
    }
  }

  async function fetchInitialData(knownClientId?: string | null) {
    try {
      const { data } = await supabase.from('clients').select('*').order('name');
      if (data && data.length > 0) {
        setClients(data);

        // Determine the final client ID to use
        const finalClientId = knownClientId || selectedClient || data[0].id;

        // Always set it (ensures state is correct)
        setSelectedClient(finalClientId);

        // Directly fetch campaign data — don't rely only on useEffect
        await fetchCampaignData(finalClientId);
        return; // fetchCampaignData handles setLoading(false)
      }
    } catch (err) {
      console.error('Error fetching clients:', err);
    }
    setLoading(false);
  }

  async function fetchCampaignData(clientId: string) {
    setLoading(true);
    try {
      const { data: campData } = await supabase
        .from('campaigns')
        .select('*')
        .eq('client_id', clientId)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: false });

      if (campData) setCampaigns(campData);

      const campaignIds = (campData || []).map((c: Campaign) => c.id);
      if (campaignIds.length > 0) {
        const { data: recData } = await supabase
          .from('weekly_records')
          .select('*')
          .in('campaign_id', campaignIds)
          .order('week_number');
        if (recData) setRecords(recData);

        const { data: adjData } = await supabase
          .from('strategy_adjustments')
          .select('*')
          .in('campaign_id', campaignIds)
          .order('created_at', { ascending: false });
        if (adjData) setAdjustments(adjData);
      } else {
        setRecords([]);
        setAdjustments([]);
      }
    } finally {
      setLoading(false);
    }
  }

  // ─── Campaign Actions ─────────────────────────────────────────

  async function handleAdvanceCampaign(campaign: Campaign, overrideStrategy?: number) {
    if (!supabase) return;
    
    const strategyPct = overrideStrategy || Math.round(Number(campaign.increment_strategy) * 100);
    const campaignRecords = records.filter(r => r.campaign_id === campaign.id && r.week_number === campaign.current_week);

    // If campaign has adsets/platforms, show the custom budget modal
    if (campaign.type === 'adset_budget' || campaign.type === 'mixed_budget') {
      setAdvanceModal({ campaign, records: campaignRecords, strategyPct });
      return;
    }

    // Standard single-budget advance
    setLoading(true);
    try {
      const newWeek = campaign.current_week + 1;
      const strategy = strategyPct / 100;

      const newRecords = campaignRecords.map(record => ({
        campaign_id: campaign.id,
        week_number: newWeek,
        budget: Math.round(Number(record.budget) * (1 + strategy) * 100) / 100,
        label: record.label || null,
        advanced_at: new Date().toISOString()
      }));

      if (newRecords.length > 0) {
        const { error: insertError } = await supabase
          .from('weekly_records')
          .insert(newRecords);
        if (insertError) throw insertError;
      }

      const { error: updateError } = await supabase
        .from('campaigns')
        .update({ current_week: newWeek })
        .eq('id', campaign.id);
      if (updateError) throw updateError;

      if (selectedClient) await fetchCampaignData(selectedClient);
    } catch (err: any) {
      setShowConfirmation({
        isOpen: true,
        title: '❌ Error',
        message: 'Error al avanzar: ' + err.message,
        type: 'danger'
      });
    } finally {
      setLoading(false);
    }
  }

  async function processCustomAdvance(customBudgets: { label: string | null; budget: number }[]) {
    if (!supabase || !advanceModal) return;

    setLoading(true);
    try {
      const { campaign } = advanceModal;
      const newWeek = campaign.current_week + 1;

      const newRecords = customBudgets.map(cb => ({
        campaign_id: campaign.id,
        week_number: newWeek,
        budget: cb.budget,
        label: cb.label,
        advanced_at: new Date().toISOString()
      }));

      const { error: insertError } = await supabase
        .from('weekly_records')
        .insert(newRecords);
      if (insertError) throw insertError;

      const { error: updateError } = await supabase
        .from('campaigns')
        .update({ current_week: newWeek })
        .eq('id', campaign.id);
      if (updateError) throw updateError;

      setAdvanceModal(null);
      if (selectedClient) await fetchCampaignData(selectedClient);
    } catch (err: any) {
      alert('Error al avanzar con presupuestos personalizados: ' + err.message);
    } finally {
      setLoading(false);
    }
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

  async function handlePauseCampaign(campaignId: string) {
    if (!supabase) return;
    const campaign = campaigns.find(c => c.id === campaignId);
    if (campaign) {
      setPauseModal({ campaignId: campaign.id, campName: campaign.name });
    }
  }

  async function processPauseCampaign(date: Date | null) {
    if (!supabase || !pauseModal) return;
    
    setLoading(true);
    try {
      const updates: any = { status: 'paused' };
      if (date) {
        updates.paused_until = date.toISOString();
      } else {
        updates.paused_until = null;
      }

      const { error } = await supabase
        .from('campaigns')
        .update(updates)
        .eq('id', pauseModal.campaignId);

      if (error) throw error;

      setPauseModal(null);
      if (selectedClient) await fetchCampaignData(selectedClient);
    } catch (err: any) {
      setShowConfirmation({
        isOpen: true,
        title: '❌ Error al pausar',
        message: err.message,
        type: 'danger'
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleResumeCampaign(campaignId: string) {
    if (!supabase) return;
    // Clears paused_until when resuming
    await supabase.from('campaigns').update({ status: 'active', paused_until: null }).eq('id', campaignId);
    if (selectedClient) fetchCampaignData(selectedClient);
  }

  async function handleDeleteCampaign(campaignId: string) {
    if (!supabase) return;
    setShowConfirmation({
      isOpen: true,
      title: '🗑️ Mover a Papelera',
      message: 'La campaña se moverá a la papelera. Podrás restaurarla o borrarla permanentemente después.',
      type: 'warning',
      confirmText: 'Mover a Papelera',
      onConfirm: async () => {
        await supabase.from('campaigns').update({ status: 'deleted' }).eq('id', campaignId);
        setShowConfirmation(prev => ({ ...prev, isOpen: false }));
        if (selectedClient) fetchCampaignData(selectedClient);
      }
    });
  }

  async function handleArchiveCampaign(campaignId: string) {
    if (!supabase) return;
    await supabase.from('campaigns').update({ status: 'archived' }).eq('id', campaignId);
    if (selectedClient) fetchCampaignData(selectedClient);
  }

  async function handleRestoreCampaign(campaignId: string) {
    if (!supabase) return;
    await supabase.from('campaigns').update({ status: 'active' }).eq('id', campaignId);
    if (selectedClient) fetchCampaignData(selectedClient);
  }

  async function handleCompleteCampaign(campaignId: string) {
    if (!supabase) return;
    await supabase.from('campaigns').update({ status: 'completed' }).eq('id', campaignId);
    if (selectedClient) fetchCampaignData(selectedClient);
  }

  async function handlePermanentlyDeleteCampaign(campaignId: string) {
    if (!supabase) return;
    setShowConfirmation({
      isOpen: true,
      title: '⚠️ Borrar Permanentemente',
      message: 'Esta acción es IRREVERSIBLE. ¿Deseas continuar?',
      type: 'danger',
      confirmText: 'Sí, Borrar',
      onConfirm: () => {
        setShowConfirmation({
          isOpen: true,
          title: '🔴 Confirmación Final',
          message: 'Se eliminarán TODOS los datos de esta campaña. Esta acción NO se puede deshacer.',
          type: 'danger',
          confirmText: 'BORRAR DEFINITIVAMENTE',
          onConfirm: async () => {
            await supabase.from('weekly_records').delete().eq('campaign_id', campaignId);
            await supabase.from('strategy_adjustments').delete().eq('campaign_id', campaignId);
            await supabase.from('campaigns').delete().eq('id', campaignId);
            setShowConfirmation(prev => ({ ...prev, isOpen: false }));
            if (selectedClient) fetchCampaignData(selectedClient);
          }
        });
      }
    });
  }

  async function handleRollbackCampaign(campaignId: string) {
    if (!supabase) return;

    const campaign = campaigns.find(c => c.id === campaignId);
    if (!campaign || campaign.current_week <= 1) return;

    setShowConfirmation({
      isOpen: true,
      title: '↩️ Confirmar Retroceso',
      message: `¿Estás seguro de que quieres volver a la semana ${campaign.current_week - 1}? Esto eliminará los registros de presupuesto de la semana actual (${campaign.current_week}).`,
      type: 'warning',
      onConfirm: async () => {
        setLoading(true);
        try {
          // Delete records for current week
          const { error: deleteError } = await supabase
            .from('weekly_records')
            .delete()
            .eq('campaign_id', campaignId)
            .eq('week_number', campaign.current_week);
          
          if (deleteError) throw deleteError;

          // Revert week number
          const { error: updateError } = await supabase
            .from('campaigns')
            .update({ current_week: campaign.current_week - 1 })
            .eq('id', campaignId);
          
          if (updateError) throw updateError;

          if (selectedClient) await fetchCampaignData(selectedClient);
        } catch (err: any) {
          console.error(err);
          alert('Error al retroceder la campaña');
        } finally {
          setLoading(false);
          setShowConfirmation(prev => ({ ...prev, isOpen: false }));
        }
      }
    });
  }

  async function handleRollbackAll() {
    if (!supabase || activeMetaCampaigns.length === 0) return;

    const canRollback = activeMetaCampaigns.filter(c => c.current_week > 1);
    if (canRollback.length === 0) return;

    setShowConfirmation({
      isOpen: true,
      title: '↩️ Retroceder TODAS',
      message: `¿Retroceder las ${canRollback.length} campañas activas a su etapa anterior? Esto eliminará los datos de la semana actual.`,
      type: 'warning',
      onConfirm: async () => {
        setLoading(true);
        try {
          for (const campaign of canRollback) {
            await supabase
              .from('weekly_records')
              .delete()
              .eq('campaign_id', campaign.id)
              .eq('week_number', campaign.current_week);

            await supabase
              .from('campaigns')
              .update({ current_week: campaign.current_week - 1 })
              .eq('id', campaign.id);
          }
          if (selectedClient) await fetchCampaignData(selectedClient);
        } catch (err: any) {
          console.error(err);
        } finally {
          setLoading(false);
          setShowConfirmation(prev => ({ ...prev, isOpen: false }));
        }
      }
    });
  }

  async function handleBulkAdvance() {
    const activeCampaigns = campaigns.filter(c => c.status === 'active' && (!c.platform || c.platform === 'meta'));
    if (activeCampaigns.length === 0) return;

    const strategies = new Set(activeCampaigns.map(c => Number(c.increment_strategy)));

    const processAdvance = async () => {
      setShowConfirmation(prev => ({ ...prev, isOpen: false }));
      setLoading(true);
      try {
        for (const camp of activeCampaigns) {
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
      processAdvance();
    }
  }

  // DnD Handle Drag End
  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (active.id !== over?.id && over) {
      setCampaigns((items) => {
        const oldIndex = items.findIndex((c) => c.id === active.id);
        const newIndex = items.findIndex((c) => c.id === over.id);
        
        const newItems = arrayMove(items, oldIndex, newIndex);
        
        // Persist new order
        persistOrder(newItems);
        
        return newItems;
      });
    }
  }

  async function persistOrder(items: Campaign[]) {
    if (!supabase) return;
    
    // Create updates array
    const updates = items.map((campaign, index) => ({
      id: campaign.id,
      sort_order: index
    }));

    // Update locally to reflect formatting if needed (already done in state)

    try {
      // In a real app, you might want to batch this or use an RPC
      // For now, loop invalidations or simple upserts
      for (const update of updates) {
        await supabase.from('campaigns').update({ sort_order: update.sort_order }).eq('id', update.id);
      }
    } catch (err) {
      console.error('Error saving order', err);
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

    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      await supabase.from('user_profiles').update({ theme: newTheme }).eq('id', session.user.id);
    }
  };

  // ─── Loading Screen ───────────────────────────────────────────

  if (loading && !selectedClient && clients.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Activity className="w-8 h-8 text-accent animate-pulse" />
      </div>
    );
  }

  // Helper: treat campaigns without platform as 'meta' (legacy data)
  const isMetaCampaign = (c: Campaign) => !c.platform || c.platform === 'meta';
  const metaCampaigns = campaigns.filter(isMetaCampaign);
  const activeMetaCampaigns = metaCampaigns.filter(c => c.status === 'active' || c.status === 'paused');
  const currentWeek = activeMetaCampaigns[0]?.current_week || 1;

  // ─── Render ────────────────────────────────────────────────────

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

      <DashboardNavbar
        theme={theme}
        toggleTheme={toggleTheme}
        clients={clients}
        selectedClient={selectedClient}
        setSelectedClient={setSelectedClient}
        isClientDropdownOpen={isClientDropdownOpen}
        setIsClientDropdownOpen={setIsClientDropdownOpen}
        setIsClientModalOpen={setIsClientModalOpen}
        handleLogout={handleLogout}
      />

      <DashboardHeader
        currentWeek={currentWeek}
        onAdvanceAll={handleBulkAdvance}
        onRollbackAll={handleRollbackAll}
        canRollback={activeMetaCampaigns.some(c => c.current_week > 1)}
        loading={loading}
        campaigns={metaCampaigns}
        setIsCampaignModalOpen={setIsCampaignModalOpen}
        supabaseConnected={!!supabase}
        platform="meta"
      />

      {/* Grid of Campaign Cards */}
      <section className="mb-20 reveal reveal-delay-1">
        <DndContext 
          sensors={sensors} 
          collisionDetection={closestCenter} 
          onDragEnd={handleDragEnd}
        >
          <SortableContext 
            items={activeMetaCampaigns.map(c => c.id)}
            strategy={rectSortingStrategy}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {loading && activeMetaCampaigns.length === 0 ? (
                Array(3).fill(0).map((_, i) => <div key={i} className="card-widget p-8 h-64 animate-pulse bg-secondary/50 border-transparent" />)
              ) : activeMetaCampaigns.length === 0 ? (
                <div className="col-span-full text-center py-20 opacity-50 italic">No hay campañas de Meta activas</div>
              ) : (
                activeMetaCampaigns.map((campaign) => (
                  <SortableCampaignItem
                    key={campaign.id}
                    campaign={campaign}
                    records={records}
                    adjustments={adjustments}
                    activeCampaignMenu={activeCampaignMenu}
                    setActiveCampaignMenu={setActiveCampaignMenu}
                    showStrategyInfo={showStrategyInfo}
                    setShowStrategyInfo={setShowStrategyInfo}
                    handleAdvanceCampaign={handleAdvanceCampaign}
                    handleRollbackCampaign={handleRollbackCampaign}
                    handlePauseCampaign={handlePauseCampaign}
                    handleResumeCampaign={handleResumeCampaign}
                    handleDeleteCampaign={handleDeleteCampaign}
                    handleArchiveCampaign={handleArchiveCampaign}
                    handleCompleteCampaign={handleCompleteCampaign}
                    setOverrideModal={setOverrideModal}
                    setOverridePercent={setOverridePercent}
                  />
                ))
              )}
            </div>
          </SortableContext>
        </DndContext>
      </section>

      <ProjectionTable
        campaigns={metaCampaigns}
        records={records}
        currentWeek={currentWeek}
      />

      <OverrideModal
        overrideModal={overrideModal}
        overridePercent={overridePercent}
        setOverridePercent={setOverridePercent}
        setOverrideModal={setOverrideModal}
        handleUpdateStrategy={handleUpdateStrategy}
      />

      <PauseCampaignModal
        isOpen={!!pauseModal}
        onClose={() => setPauseModal(null)}
        onConfirm={processPauseCampaign}
        campaignName={pauseModal?.campName || ''}
      />

      {advanceModal && (
        <AdvanceCampaignModal
          isOpen={!!advanceModal}
          onClose={() => setAdvanceModal(null)}
          campaign={advanceModal.campaign}
          currentRecords={advanceModal.records}
          strategyPct={advanceModal.strategyPct}
          onConfirm={processCustomAdvance}
        />
      )}

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
        platform="meta"
      />

      {/* Footer */}
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

      <CampaignSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        campaigns={campaigns}
        handleRestoreCampaign={handleRestoreCampaign}
        handlePermanentlyDeleteCampaign={handlePermanentlyDeleteCampaign}
      />

      <ConfirmationModal
        showConfirmation={showConfirmation}
        setShowConfirmation={setShowConfirmation}
      />

      {/* Sidebar Trigger Button */}
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
