import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Client, CampaignType, Platform, STRATEGY_FREQUENCY, FREQUENCY_LABELS } from '@/lib/types';
import { X, Target, Save, Briefcase, Calendar, Info, Layers, Clock, Plus, Trash2 } from 'lucide-react';

interface NewCampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  clients: Client[];
  initialClientId: string | null;
  platform: Platform;
}

export function NewCampaignModal({ isOpen, onClose, onSuccess, clients, initialClientId, platform }: NewCampaignModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    client_id: initialClientId || '',
    name: '',
    type: 'campaign_budget' as CampaignType,
    currency: 'ARS',
    current_week: 1,
    initial_budget: '',
    increment_strategy: '0.20',
    target_budget: '',
    target_week: '',
    estimated_target_date: '',
    strategy_frequency: 'weekly' as STRATEGY_FREQUENCY
  });

  const [advancedLabels, setAdvancedLabels] = useState<{ id: string; value: string }[]>([
    { id: Math.random().toString(36).substr(2, 9), value: '' }
  ]);

  useEffect(() => {
    if (initialClientId) {
      setFormData(prev => ({ ...prev, client_id: initialClientId }));
    }
  }, [initialClientId]);

  useEffect(() => {
    if (formData.initial_budget && formData.target_budget && formData.increment_strategy) {
      const initial = Number(formData.initial_budget);
      const target = Number(formData.target_budget);
      const strategy = Number(formData.increment_strategy);
      const freq = formData.strategy_frequency;

      if (target > initial && strategy > 0) {
        const weeksNeeded = Math.ceil(Math.log(target / initial) / Math.log(1 + strategy));
        const estimatedWeek = formData.current_week + weeksNeeded;
        
        setFormData(prev => ({ ...prev, target_week: String(estimatedWeek) }));

        let daysToAdd = 0;
        if (freq === 'daily') daysToAdd = weeksNeeded;
        else if (freq === 'every_3_days') daysToAdd = weeksNeeded * 3;
        else if (freq === 'weekly') daysToAdd = weeksNeeded * 7;
        else if (freq === 'monthly') daysToAdd = weeksNeeded * 30;

        const targetDate = new Date();
        targetDate.setDate(targetDate.getDate() + daysToAdd);
        setFormData(prev => ({ ...prev, estimated_target_date: targetDate.toISOString() }));
      }
    }
  }, [formData.initial_budget, formData.target_budget, formData.increment_strategy, formData.current_week, formData.strategy_frequency]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      if (!supabase) throw new Error('Base de datos no configurada. Revisa las variables de entorno.');
      const { data: campaign, error: campError } = await supabase
        .from('campaigns')
        .insert([{
          client_id: formData.client_id,
          name: formData.name,
          type: formData.type,
          platform: platform,
          currency: formData.currency,
          current_week: formData.current_week,
          increment_strategy: formData.increment_strategy,
          initial_strategy: formData.increment_strategy,
          initial_budget: formData.initial_budget ? Number(formData.initial_budget) : 0,
          target_budget: formData.target_budget ? Number(formData.target_budget) : null,
          target_week: formData.target_week ? Number(formData.target_week) : null,
          estimated_target_date: formData.estimated_target_date || null,
          status: 'active',
          strategy_frequency: formData.strategy_frequency
        }])
        .select()
        .single();

      if (campError) throw campError;

      const records = [];
      const budget = Number(formData.initial_budget);

      if (formData.type === 'campaign_budget') {
        records.push({
          campaign_id: campaign.id,
          week_number: formData.current_week,
          budget: budget,
          is_projection: false
        });
      } else {
        const labels = advancedLabels.map(l => l.value.trim()).filter(l => l);
        if (labels.length === 0) throw new Error('Ingresa al menos un conjunto');
        const budgetPerLabel = budget / labels.length;
        for (const label of labels) {
          records.push({
            campaign_id: campaign.id,
            week_number: formData.current_week,
            label: label,
            budget: Math.round(budgetPerLabel * 100) / 100,
            is_projection: false
          });
        }
      }

      const { error: recError } = await supabase.from('weekly_records').insert(records);
      if (recError) throw recError;

      onSuccess();
      onClose();
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xl z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
      <div className="bg-card border border-border rounded-[2.5rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-300">
        <div className="flex justify-between items-center p-8 border-b border-border bg-secondary/20">
          <div className="flex items-center gap-4">
            <div className="bg-accent/20 p-3 rounded-2xl">
              <Target className="w-8 h-8 text-accent" />
            </div>
            <div>
              <h2 className="text-3xl font-black text-foreground tracking-tight">Nueva Campaña</h2>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{platform === 'meta' ? 'Meta Ads' : 'Google Ads'} · Configura la estrategia de escalado</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-secondary rounded-full transition-colors text-muted-foreground"
          >
            <X className="w-8 h-8" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 overflow-y-auto flex-1 space-y-10">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {/* Column 1 */}
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="block text-[10px] font-black uppercase text-muted-foreground tracking-widest pl-1 flex items-center gap-2">
                  <Briefcase className="w-3 h-3" /> Cliente
                </label>
                <select 
                  required
                  value={formData.client_id}
                  onChange={(e) => setFormData({...formData, client_id: e.target.value})}
                  className="w-full bg-secondary border border-border rounded-2xl px-5 py-4 font-bold text-foreground focus:ring-4 focus:ring-accent/20 transition-all outline-none appearance-none cursor-pointer"
                >
                  <option value="" disabled>Seleccionar cliente...</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-black uppercase text-muted-foreground tracking-widest pl-1">Nombre</label>
                <input
                  required
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-secondary border border-border rounded-2xl px-5 py-4 font-black text-foreground focus:ring-4 focus:ring-accent/20 transition-all outline-none"
                  placeholder="Ej. Traffic - Cold"
                />
              </div>

              <div className="space-y-3">
                 <label className="block text-[10px] font-black uppercase text-muted-foreground tracking-widest pl-1 flex items-center gap-2">
                  <Layers className="w-3 h-3" /> Estructura
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {(['campaign_budget', 'adset_budget'] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setFormData({...formData, type: t})}
                      className={`text-[10px] font-black uppercase py-3 rounded-xl border transition-all ${formData.type === t ? 'bg-accent text-white border-accent shadow-lg shadow-accent/20' : 'border-border text-muted-foreground hover:bg-secondary'}`}
                    >
                      {t === 'campaign_budget' ? (platform === 'meta' ? 'CBO' : 'Campaign') : (platform === 'meta' ? 'ABO' : 'Ad Group')}
                    </button>
                  ))}
                </div>
                
                {/* Dynamic Guide */}
                <div className="mt-4 p-4 bg-secondary/50 rounded-2xl border border-border/50 animate-in fade-in slide-in-from-top-1 duration-300">
                  <div className="flex items-start gap-3">
                    <div className="bg-accent/10 p-2 rounded-lg mt-0.5">
                      {formData.type === 'campaign_budget' ? <Target className="w-4 h-4 text-accent" /> : 
                       <Layers className="w-4 h-4 text-accent" />}
                    </div>
                    <div>
                      <h4 className="text-[10px] font-black uppercase text-foreground tracking-widest leading-none mb-1">
                        {formData.type === 'campaign_budget' 
                         ? (platform === 'meta' ? 'CBO — Campaign Budget Optimization' : 'Campaign Budget')
                         : (platform === 'meta' ? 'ABO — Ad Set Budget Optimization' : 'Ad Group Budget')}
                      </h4>
                      <p className="text-[11px] font-bold text-muted-foreground leading-relaxed">
                        {formData.type === 'campaign_budget' && (platform === 'meta' 
                          ? "Presupuesto único para toda la campaña (CBO). Meta distribuye automáticamente entre conjuntos."
                          : "Presupuesto a nivel campaña. Google optimiza la distribución entre grupos de anuncios.")}
                        {formData.type === 'adset_budget' && (platform === 'meta'
                          ? "Presupuesto individual por conjunto de anuncios (ABO). Control granular de audiencias."
                          : "Presupuesto individual por grupo de anuncios. Control granular de segmentación.")}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-black uppercase text-muted-foreground tracking-widest pl-1 flex items-center gap-2">
                   <Clock className="w-3 h-3" /> Frecuencia
                </label>
                <select
                    value={formData.strategy_frequency}
                    onChange={(e) => setFormData({...formData, strategy_frequency: e.target.value as STRATEGY_FREQUENCY})}
                    className="w-full bg-secondary border border-border rounded-2xl px-5 py-4 font-bold text-foreground focus:ring-4 focus:ring-accent/20 transition-all outline-none appearance-none cursor-pointer"
                >
                    {Object.entries(FREQUENCY_LABELS).map(([key, label]) => (
                        <option key={key} value={key}>{label}</option>
                    ))}
                </select>
              </div>
            </div>

            {/* Column 2 */}
            <div className="space-y-6">
               <div className="bg-secondary/30 p-6 rounded-[2rem] border border-border space-y-6">
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black uppercase text-muted-foreground tracking-widest pl-1">Presupuesto Inicial</label>
                    <div className="relative">
                      <span className="absolute left-6 top-1/2 -translate-y-1/2 text-muted-foreground font-black">$</span>
                      <input
                        required
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.initial_budget}
                        onChange={(e) => setFormData({...formData, initial_budget: e.target.value})}
                        className="w-full bg-card border border-border rounded-2xl pl-10 pr-6 py-5 font-black text-2xl text-foreground focus:ring-4 focus:ring-accent/20 transition-all outline-none tabular-nums"
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-[10px] font-black uppercase text-muted-foreground tracking-widest pl-1">Estrategia</label>
                    <select
                      value={formData.increment_strategy}
                      onChange={(e) => setFormData({...formData, increment_strategy: e.target.value})}
                      className="w-full bg-card border border-border rounded-2xl px-5 py-5 text-accent font-black text-lg focus:ring-4 focus:ring-accent/20 transition-all outline-none appearance-none cursor-pointer"
                    >
                      <option value="0.10">CONSERVADOR (10%)</option>
                      <option value="0.20">STANDARD (20%)</option>
                      <option value="0.30">AGRESIVO (30%)</option>
                    </select>
                  </div>
               </div>

               <div className="space-y-4">
                 <div className="space-y-2">
                    <label className="block text-[10px] font-black uppercase text-muted-foreground tracking-widest pl-1">Meta final (Opcional)</label>
                    <div className="relative">
                      <span className="absolute left-6 top-1/2 -translate-y-1/2 text-muted-foreground font-black">$</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.target_budget}
                        onChange={(e) => setFormData({...formData, target_budget: e.target.value})}
                        className="w-full bg-secondary border border-border rounded-2xl pl-10 pr-6 py-4 font-bold text-foreground focus:ring-4 focus:ring-accent/20 transition-all outline-none tabular-nums"
                        placeholder="Sin meta"
                      />
                    </div>
                  </div>
                  {formData.target_week && (
                    <div className="p-4 bg-accent/10 rounded-2xl border border-accent/20 flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                      <Info className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-black text-accent uppercase tracking-wider leading-none mb-1">Cálculo proyectado</p>
                        <p className="text-sm font-bold text-foreground">
                          Se alcanzará en la Etapa {formData.target_week} ({new Date(formData.estimated_target_date).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })})
                        </p>
                      </div>
                    </div>
                  )}
               </div>
            </div>
          </div>

          {/* Advanced Labels Field */}
          {formData.type !== 'campaign_budget' && (
            <div className="space-y-4 animate-in fade-in duration-500">
               <div className="flex justify-between items-center">
                 <label className="block text-[10px] font-black uppercase text-muted-foreground tracking-widest pl-1">
                    {platform === 'meta' ? 'Conjuntos de Anuncios' : 'Grupos de Anuncios'}
                 </label>
                 <button
                   type="button"
                   onClick={() => setAdvancedLabels([...advancedLabels, { id: Math.random().toString(36).substr(2, 9), value: '' }])}
                   className="text-[10px] font-black uppercase text-accent hover:opacity-80 flex items-center gap-1 transition-all"
                 >
                   <Plus className="w-3.5 h-3.5" /> Añadir
                 </button>
               </div>

               <div className="space-y-3">
                 {advancedLabels.map((label, index) => (
                   <div key={label.id} className="flex gap-3 group/item animate-in slide-in-from-left-2 duration-200">
                     <div className="flex-1 relative">
                        <input
                          type="text"
                          value={label.value}
                          onChange={(e) => {
                            const newLabels = [...advancedLabels];
                            newLabels[index].value = e.target.value;
                            setAdvancedLabels(newLabels);
                          }}
                          className="w-full bg-secondary border border-border rounded-xl px-4 py-3 font-bold text-sm text-foreground focus:ring-4 focus:ring-accent/20 transition-all outline-none"
                          placeholder={platform === 'meta' ? 'Ej. Lookalike 1%' : 'Ej. Keyword - Broad'}
                        />
                     </div>
                     {advancedLabels.length > 1 && (
                       <button
                         type="button"
                         onClick={() => setAdvancedLabels(advancedLabels.filter(l => l.id !== label.id))}
                         className="p-3 bg-secondary hover:bg-destructive/10 text-muted-foreground hover:text-destructive border border-border rounded-xl transition-all"
                       >
                         <Trash2 className="w-4 h-4" />
                       </button>
                     )}
                   </div>
                 ))}
               </div>

               <p className="text-[10px] font-bold text-muted-foreground uppercase opacity-60">
                 * El presupuesto inicial se dividirá equitativamente.
                 ({advancedLabels.filter(l => l.value.trim()).length > 0 ? (Number(formData.initial_budget || 0) / Math.max(1, advancedLabels.filter(l => l.value.trim()).length)).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' }) : '$0.00'} c/u)
               </p>
            </div>
          )}

        </form>

        <div className="p-8 border-t border-border bg-secondary/30 flex justify-end gap-5">
            <button
              type="button"
              onClick={onClose}
              className="px-10 py-4 font-bold text-muted-foreground hover:bg-secondary rounded-2xl transition-all"
            >
              Cerrar
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="bg-primary text-primary-foreground hover:opacity-90 px-12 py-4 rounded-2xl font-black flex items-center gap-3 shadow-2xl shadow-primary/20 transition-all disabled:opacity-50"
            >
              {loading ? 'Procesando...' : <><Save className="w-6 h-6" /> Guardar</>}
            </button>
        </div>
      </div>
    </div>
  );
}
