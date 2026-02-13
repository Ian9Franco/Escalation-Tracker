'use client';

import React, { useRef } from 'react';
import { Campaign, WeeklyRecord, FREQUENCY_PREFIX } from '@/lib/types';
import { formatCurrency } from '@/utils/calculations';
import { FileDown } from 'lucide-react';

interface ProjectionTableProps {
  campaigns: Campaign[];
  records: WeeklyRecord[];
  currentWeek: number;
}

export function ProjectionTable({ campaigns, records, currentWeek }: ProjectionTableProps) {
  const tableRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const startY = useRef(0);
  const scrollLeft = useRef(0);
  const scrollTop = useRef(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!tableRef.current) return;
    isDragging.current = true;
    startX.current = e.pageX - tableRef.current.offsetLeft;
    startY.current = e.pageY - tableRef.current.offsetTop;
    scrollLeft.current = tableRef.current.scrollLeft;
    scrollTop.current = tableRef.current.scrollTop;
    tableRef.current.style.cursor = 'grabbing';
    tableRef.current.style.userSelect = 'none';
  };

  const handleMouseUp = () => {
    isDragging.current = false;
    if (tableRef.current) {
      tableRef.current.style.cursor = 'grab';
      tableRef.current.style.removeProperty('user-select');
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current || !tableRef.current) return;
    e.preventDefault();
    const x = e.pageX - tableRef.current.offsetLeft;
    const y = e.pageY - tableRef.current.offsetTop;
    const walkX = (x - startX.current) * 2;
    const walkY = (y - startY.current) * 2;
    tableRef.current.scrollLeft = scrollLeft.current - walkX;
    tableRef.current.scrollTop = scrollTop.current - walkY;
  };

  const weeks = Array.from(new Set(records.map(r => r.week_number))).sort((a, b) => a - b);

  const renderRow = (camp: Campaign, label: string | null, isHeader: boolean) => {
    const campRecs = records.filter(r => r.campaign_id === camp.id);
    const campStrategy = Number(camp.increment_strategy);
    const latestBudget = campRecs.find(r => r.week_number === camp.current_week && (r.label === label || (!r.label && !label)))?.budget || 0;
    const projectedBudget = Math.round(latestBudget * (1 + campStrategy) * 100) / 100;

    const progress = camp.target_budget ? Math.min((campRecs.find(r => r.week_number === camp.current_week)?.budget || 0) / camp.target_budget * 100, 100) : 0;
    const isFinished = progress >= 100;
    const isPaused = camp.status === 'paused';

    let beamStatusClass = 'beam-active';
    if (isFinished) beamStatusClass = 'beam-finished';
    else if (isPaused) beamStatusClass = 'beam-paused';

    return (
      <tr key={`${camp.id}-${label || 'main'}`} className={`transition-all no-glow ${isHeader ? 'projection-row-header ' + beamStatusClass : 'projection-row-sub'} ${camp.status === 'paused' ? 'opacity-40 grayscale-[0.5]' : ''}`}>
        <td className={`p-6 ${!isHeader ? 'projection-sub-indent' : ''}`}>
          <div className="flex items-center gap-3">
            {isHeader && (
              <div className={`w-2 h-2 rounded-full ${isFinished ? 'bg-success shadow-[0_0_8px_rgba(34,197,94,0.5)]' :
                  isPaused ? 'bg-warning shadow-[0_0_8px_rgba(250,204,21,0.5)]' :
                    'bg-accent shadow-[0_0_8px_rgba(255,69,0,0.5)]'
                }`} />
            )}
            <div className="flex flex-col">
              <div className={`${isHeader ? 'font-black text-foreground uppercase italic' : 'font-medium text-muted-foreground'} tracking-tight`}>
                {label || camp.name}
              </div>
              {isHeader && (
                <div className="text-[9px] font-black text-muted-foreground/50 uppercase tracking-widest mt-0.5">
                  {camp.type === 'mixed_budget' ? 'Mixed Budget' : camp.type === 'adset_budget' ? 'Adset Budget' : 'Standard'}
                </div>
              )}
            </div>
          </div>
        </td>
        {weeks.map(week => {
          const budget = campRecs.find(r => r.week_number === week && (r.label === label || (!r.label && !label)))?.budget;
          const isCurrent = week === camp.current_week;
          return (
            <td key={week} className={`p-6 text-center tabular-nums font-mono text-xs ${isCurrent ? 'projection-current-week-column' : ''}`}>
              {budget ? (
                <span className={isCurrent ? 'bg-foreground/5 py-1 px-3 rounded-lg font-black text-foreground border border-foreground/10' : 'text-muted-foreground'}>
                  {formatCurrency(budget)}
                </span>
              ) : '—'}
            </td>
          );
        })}
        <td className="p-6 text-accent font-mono text-xs tabular-nums text-center font-black opacity-60 italic">{formatCurrency(projectedBudget)}</td>
      </tr>
    );
  };

  return (
    <section className="export-container overflow-hidden mb-20 bg-card border border-border rounded-[2.5rem] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.5)] border-beam-container beam-active no-glow reveal reveal-delay-2">
      {/* Print-only header with app logo */}
      <div className="print-header hidden">
        <div className="flex items-center gap-3">
          <img src="/android-chrome-192x192.png" alt="F-Tracker" className="print-logo-app" />
          <div>
            <h1 className="print-title">F-TRACKER</h1>
            <p className="print-subtitle">Estrategia de Escalado · Reporte</p>
          </div>
        </div>
      </div>

      <div className="p-8 border-b border-border flex justify-between items-center bg-secondary/20">
        <h2 className="text-2xl font-black text-foreground tracking-tight uppercase italic">Estrategia de Escalado</h2>
        <div className="flex items-center gap-4">
          <button
            onClick={() => window.print()}
            className="bg-accent text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-lg shadow-accent/20"
          >
            <FileDown className="w-3.5 h-3.5" /> Exportar Reporte
          </button>
          <div className="text-[10px] font-black text-accent uppercase tracking-widest bg-accent/10 px-4 py-2 rounded-full border border-accent/20 shadow-orange-glow/10">Vista de Proyección</div>
        </div>
      </div>
      <div
        ref={tableRef}
        onMouseDown={handleMouseDown}
        onMouseLeave={handleMouseUp}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
        className="max-h-[600px] overflow-auto cursor-grab active:cursor-grabbing select-none custom-scrollbar"
      >
        <table className="w-full text-left">
          <thead>
            <tr className="bg-secondary/10 text-muted-foreground text-[10px] font-black uppercase tracking-widest border-b border-border">
              <th className="p-8">Campaña / Plataforma</th>
              {weeks.map(week => (
                <th key={week} className={`p-8 ${week === currentWeek ? 'bg-accent/10 text-accent font-black' : 'text-muted-foreground'} text-center font-mono text-sm`}>E{week}</th>
              ))}
              <th className="p-8 text-center text-accent/50 italic opacity-60">Próxima</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {campaigns.filter(c => c.status !== 'deleted').map((camp) => {
              const campRecs = records.filter(r => r.campaign_id === camp.id);
              const labels = Array.from(new Set(campRecs.map(r => r.label).filter((l): l is string => !!l)));

              return (
                <React.Fragment key={camp.id}>
                  {renderRow(camp, null, true)}
                  {labels.map(l => renderRow(camp, l, false))}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Print-only footer with Fanger logo and copyright */}
      <div className="print-footer hidden">
        <img src="/Logo-Fanger.png" alt="Fanger Design" className="print-logo-fanger" />
        <span className="print-copyright">© 2026 ian.p · Internal Utility</span>
      </div>
    </section>
  );
}
