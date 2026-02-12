import Link from 'next/link';
import { Campaign, Platform } from '@/lib/types';
import { Calendar, ChevronRight, Plus, LayoutGrid, Search } from 'lucide-react';

interface DashboardHeaderProps {
  currentWeek: number;
  handleBulkAdvance: () => void;
  loading: boolean;
  campaigns: Campaign[];
  setIsCampaignModalOpen: (open: boolean) => void;
  supabaseConnected: boolean;
  platform: Platform;
}

export function DashboardHeader({ currentWeek, handleBulkAdvance, loading, campaigns, setIsCampaignModalOpen, supabaseConnected, platform }: DashboardHeaderProps) {
  return (
    <header className="mb-14 flex flex-col md:flex-row md:items-end justify-between gap-6 px-2 reveal">
      <div className="space-y-6">
        {/* Platform Switcher */}
        <div className="flex p-1 bg-secondary/50 border border-border rounded-full w-fit">
          <Link 
            href="/dashboard" 
            className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-widest transition-all ${platform === 'meta' ? 'bg-background text-foreground shadow-sm border border-border/50' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <LayoutGrid className="w-3.5 h-3.5" /> Meta Ads
          </Link>
          <Link 
            href="/dashboard/google" 
            className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-widest transition-all ${platform === 'google' ? 'bg-background text-foreground shadow-sm border border-border/50' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <Search className="w-3.5 h-3.5" /> Google Ads
          </Link>
        </div>

        <div>
          <h2 className="text-5xl font-black tracking-tighter text-foreground mb-3 uppercase italic">Dashboard</h2>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-2 bg-accent/10 text-accent px-5 py-2 rounded-full text-xs font-black border border-accent/20 shadow-orange-glow/10">
              <Calendar className="w-4 h-4" /> ETAPA ACTUAL: E{currentWeek}
            </span>
          </div>
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
          disabled={!supabaseConnected}
          className="bg-accent text-white px-8 py-4 rounded-2xl font-black flex items-center gap-3 shadow-[0_10px_40px_-10px_rgba(255,69,0,0.5)] hover:scale-[1.05] transition-all text-lg uppercase italic disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed"
        >
          <Plus className="w-6 h-6" /> Nueva Campaña
        </button>
      </div>
    </header>
  );
}
