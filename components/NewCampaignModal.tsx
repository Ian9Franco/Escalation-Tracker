'use client';
import { useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { X, TrendingUp, Target, Calendar, Clock, Zap } from 'lucide-react';
import { Client, FREQUENCY_LABELS, FREQUENCY_DAYS } from '@/lib/types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  clients: Client[];
  initialClientId?: string | null;
}

export function NewCampaignModal({ isOpen, onClose, onSuccess, clients, initialClientId }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form State
  const [clientId, setClientId] = useState(initialClientId || '');
  const [name, setName] = useState('');
  const [type, setType] = useState('campaign_budget');
  const [initialBudget, setInitialBudget] = useState('');
  const [targetBudget, setTargetBudget] = useState('');
  const [targetWeek, setTargetWeek] = useState('');
  const [currentWeek, setCurrentWeek] = useState('1');
  const [strategy, setStrategy] = useState('20');
  const [frequency, setFrequency] = useState('weekly');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);

  // Auto-calculate target periods and date
  const calculation = useMemo(() => {
    const initial = parseFloat(initialBudget);
    const target = parseFloat(targetBudget);
    const pct = parseFloat(strategy) / 100;

    if (!initial || !target || !pct || initial <= 0 || target <= initial || pct <= 0) {
      return null;
    }

    const periods = Math.ceil(Math.log(target / initial) / Math.log(1 + pct));
    const daysPerPeriod = FREQUENCY_DAYS[frequency] || 7;
    const totalDays = periods * daysPerPeriod;

    const start = new Date(startDate);
    const endDate = new Date(start);
    endDate.setDate(endDate.getDate() + totalDays);

    return {
      periods,
      totalDays,
      endDate,
      endDateStr: endDate.toLocaleDateString('es-AR', { 
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' 
      }),
    };
  }, [initialBudget, targetBudget, strategy, frequency, startDate]);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!clientId) return setError('Selecciona un cliente');

    setLoading(true);
    setError('');

    const pct = parseFloat(strategy) / 100;
    // Use manually entered target week, or auto-calculated, or null
    const finalTargetWeek = targetWeek 
      ? parseInt(targetWeek) 
      : calculation?.periods || null;

    try {
      const { data: camp, error: campErr } = await supabase
        .from('campaigns')
        .insert({
          client_id: clientId,
          name,
          type,
          status: 'active',
          current_week: parseInt(currentWeek),
          increment_strategy: pct,
          strategy_frequency: frequency,
          start_date: startDate,
          estimated_target_date: calculation?.endDate?.toISOString().split('T')[0] || null,
          target_budget: targetBudget ? parseFloat(targetBudget) : null,
          target_week: finalTargetWeek
        })
        .select()
        .single();
      
      if (campErr) throw campErr;

      // Insert initial record
      if (initialBudget) {
        const { error: recErr } = await supabase
          .from('weekly_records')
          .insert({
            campaign_id: camp.id,
            week_number: parseInt(currentWeek),
            budget: parseFloat(initialBudget),
            is_projection: false,
            advanced_at: new Date().toISOString()
          });
        
        if (recErr) throw recErr;
      }
      
      // Reset & Close
      setName('');
      setInitialBudget('');
      setTargetBudget('');
      setTargetWeek('');
      setStrategy('20');
      setFrequency('weekly');
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al crear campaña');
    } finally {
      setLoading(false);
    }
  }

  const frequencyLabel = frequency === 'weekly' ? 'Semana' : frequency === 'daily' ? 'Día' : frequency === 'every_3_days' ? 'Período' : 'Mes';

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#111] border border-white/10 rounded-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200 shadow-2xl shadow-blue-900/10 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/5">
          <h3 className="font-bold flex items-center gap-2 text-lg">
            <TrendingUp className="w-5 h-5 text-blue-500" /> Nueva Campaña
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Row 1: Client + Name */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Cliente</label>
              <select 
                value={clientId}
                onChange={e => setClientId(e.target.value)}
                className="input"
                required
              >
                <option value="">Seleccionar...</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            <div>
              <label className="label">Tipo de Presupuesto</label>
              <select 
                value={type} 
                onChange={e => setType(e.target.value)} 
                className="input"
              >
                <option value="campaign_budget">Campaña (ABO/CBO)</option>
                <option value="adset_budget">Conjunto de Anuncios</option>
                <option value="mixed_budget">Mixto</option>
              </select>
            </div>

            <div className="col-span-2">
              <label className="label">Nombre de la Campaña</label>
              <input 
                type="text" 
                value={name}
                onChange={e => setName(e.target.value)}
                className="input"
                placeholder="Ej: Black Friday Sale"
                required
              />
            </div>
          </div>

          {/* Row 2: Strategy Config */}
          <div className="border-t border-white/5 pt-4">
            <label className="label text-green-400 flex items-center gap-2 mb-3">
              <Zap className="w-4 h-4" /> Estrategia de Aumento
            </label>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-[10px] text-gray-500 uppercase font-bold mb-1 block">Porcentaje (%)</label>
                <input 
                  type="number" 
                  value={strategy}
                  onChange={e => setStrategy(e.target.value)}
                  className="input font-mono text-lg"
                  placeholder="20"
                  min="0"
                  step="1"
                  required
                />
              </div>
              <div>
                <label className="text-[10px] text-gray-500 uppercase font-bold mb-1 block">Frecuencia</label>
                <select
                  value={frequency}
                  onChange={e => setFrequency(e.target.value)}
                  className="input"
                >
                  {Object.entries(FREQUENCY_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] text-gray-500 uppercase font-bold mb-1 block">{frequencyLabel} de Inicio</label>
                <input 
                  type="number" 
                  value={currentWeek}
                  onChange={e => setCurrentWeek(e.target.value)}
                  className="input"
                  min="1"
                  required
                />
              </div>
            </div>
          </div>

          {/* Row 3: Budget & Target */}
          <div className="border-t border-white/5 pt-4">
            <label className="label text-blue-400 flex items-center gap-2 mb-3">
              <Target className="w-4 h-4" /> Objetivos & Presupuesto
            </label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] text-gray-500 uppercase font-bold mb-1 block">Presupuesto Inicial ($)</label>
                <input 
                  type="number" 
                  value={initialBudget}
                  onChange={e => setInitialBudget(e.target.value)}
                  className="input font-mono text-lg"
                  placeholder="0.00"
                  step="0.01"
                  required
                />
              </div>
              <div>
                <label className="text-[10px] text-gray-500 uppercase font-bold mb-1 block">Meta de Inversión ($)</label>
                <input 
                  type="number" 
                  value={targetBudget}
                  onChange={e => setTargetBudget(e.target.value)}
                  className="input font-mono text-lg border-blue-500/20 focus:border-blue-500"
                  placeholder="Opcional"
                  step="0.01"
                />
              </div>
              <div>
                <label className="text-[10px] text-gray-500 uppercase font-bold mb-1 block">Fecha de Inicio</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  className="input"
                />
              </div>
              <div>
                <label className="text-[10px] text-gray-500 uppercase font-bold mb-1 block">{frequencyLabel} Objetivo</label>
                <input 
                  type="number" 
                  value={targetWeek}
                  onChange={e => setTargetWeek(e.target.value)}
                  className="input"
                  placeholder={calculation ? `Auto: ${calculation.periods}` : 'Ej: 8'}
                />
              </div>
            </div>
          </div>

          {/* Auto-calculation preview */}
          {calculation && (
            <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4 space-y-2">
              <p className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-2">
                <Clock className="w-3.5 h-3.5" /> Proyección Automática
              </p>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-500 text-xs">Períodos necesarios:</span>
                  <p className="font-mono font-bold text-white">{calculation.periods} {frequencyLabel.toLowerCase()}s</p>
                </div>
                <div>
                  <span className="text-gray-500 text-xs">Días totales:</span>
                  <p className="font-mono font-bold text-white">{calculation.totalDays} días</p>
                </div>
                <div className="col-span-2">
                  <span className="text-gray-500 text-xs">Fecha estimada de meta:</span>
                  <p className="font-bold text-green-400 capitalize">{calculation.endDateStr}</p>
                </div>
              </div>
            </div>
          )}

          {error && <p className="text-red-500 text-sm bg-red-500/10 p-3 rounded-lg border border-red-500/20">{error}</p>}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 hover:bg-white/5 rounded-lg text-sm text-gray-400 transition-colors">
              Cancelar
            </button>
            <button 
              type="submit" 
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg font-bold transition-all disabled:opacity-50 shadow-lg shadow-blue-600/20"
            >
              {loading ? 'Guardando...' : 'Crear Campaña'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
