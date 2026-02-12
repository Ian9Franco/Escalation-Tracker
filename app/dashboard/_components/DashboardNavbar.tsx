'use client';

import Link from 'next/link';
import { Client } from '@/lib/types';
import {
  Users, Briefcase, ChevronDown, CheckCircle2,
  Plus, Moon, Sun, LogOut
} from 'lucide-react';

interface DashboardNavbarProps {
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  clients: Client[];
  selectedClient: string | null;
  setSelectedClient: (id: string) => void;
  isClientDropdownOpen: boolean;
  setIsClientDropdownOpen: (open: boolean) => void;
  setIsClientModalOpen: (open: boolean) => void;
  handleLogout: () => void;
}

export function DashboardNavbar({
  theme, toggleTheme, clients, selectedClient, setSelectedClient,
  isClientDropdownOpen, setIsClientDropdownOpen, setIsClientModalOpen, handleLogout
}: DashboardNavbarProps) {
  return (
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
  );
}
