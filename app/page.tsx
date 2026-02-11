'use client';

import Link from 'next/link';
import { 
  TrendingUp, Activity, CheckCircle2, ChevronRight, 
  Target, Zap, Shield, BarChart3, Users, Clock
} from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-accent selection:text-white">
      {/* Premium Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-background/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4 group cursor-pointer">
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-accent to-orange-400 rounded-full blur opacity-20 group-hover:opacity-100 transition duration-500"></div>
              <img 
                src="/android-chrome-192x192.png" 
                alt="Logo" 
                className="relative w-10 h-10 rounded-full border border-white/10"
              />
            </div>
            <span className="text-xl font-black uppercase italic tracking-tighter">Escalation Tracker</span>
          </div>

          <div className="flex items-center gap-8">
            <Link href="/dashboard" className="text-sm font-bold opacity-60 hover:opacity-100 transition-opacity uppercase tracking-widest hidden md:block border-b border-transparent hover:border-accent">
              Dashboard
            </Link>
            <Link 
              href="/dashboard" 
              className="bg-accent text-white px-6 py-2.5 rounded-xl font-black text-xs uppercase italic shadow-lg shadow-accent/20 hover:scale-105 transition-all"
            >
              Cargar Datos
            </Link>
          </div>
        </div>
      </nav>

      {/* Intro Section */}
      <section className="pt-40 pb-20 px-6">
        <div className="max-w-5xl mx-auto text-center space-y-10">
          <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-accent/10 border border-accent/20 text-accent text-xs font-black uppercase tracking-widest">
            <Activity className="w-4 h-4" /> Gestión Interna de Escalamiento
          </div>
          
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-[0.9] uppercase italic">
            Control preciso <br />
            <span className="text-accent underline decoration-accent/20 decoration-8 underline-offset-8">de presupuesto</span>
          </h1>

          <p className="text-xl md:text-2xl text-muted-foreground font-medium max-w-3xl mx-auto">
            Herramienta diseñada para el seguimiento de aumentos progresivos en pauta. 
            Menos hojas de cálculo, más visibilidad sobre las proyecciones semanales.
          </p>

          <div className="pt-10 flex flex-col md:flex-row items-center justify-center gap-6">
             <Link 
              href="/dashboard" 
              className="bg-accent text-white px-12 py-6 rounded-[2rem] font-black text-xl shadow-[0_20px_50px_-10px_rgba(255,69,0,0.5)] hover:scale-110 active:scale-95 transition-all uppercase italic flex items-center gap-4"
            >
              Abrir Tracker <ChevronRight className="w-6 h-6 border-2 border-white/20 rounded-full" />
            </Link>
          </div>
        </div>
      </section>

      {/* Purpose Section */}
      <section className="py-32 px-6 border-y border-white/5 bg-accent/[0.02]">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-20 items-center">
           <div className="space-y-8">
              <h2 className="text-4xl md:text-6xl font-black tracking-tighter uppercase italic leading-none">
                ¿Por qué lo hice?
              </h2>
              <p className="text-lg text-muted-foreground">
                Manejar el escalado de campañas (como las de Zoffa y otros clientes) manualmente consume tiempo y es propenso a errores de cálculo. 
                Creé esta web app para automatizar mis propias proyecciones y tener un historial claro de cada etapa sin depender de archivos de Excel.
              </p>
              
              <ul className="space-y-4">
                 {[
                   { icon: Shield, text: "Seguimiento riguroso de la frecuencia de aumento." },
                   { icon: BarChart3, text: "Cálculo automático de presupuestos proyectados." },
                   { icon: Users, text: "Organizado por cliente y tipo de estructura." }
                 ].map((item, i) => (
                   <li key={i} className="flex items-center gap-4 text-foreground font-bold">
                     <div className="bg-accent/10 p-2 rounded-lg"><item.icon className="w-5 h-5 text-accent" /></div>
                     {item.text}
                   </li>
                 ))}
              </ul>
           </div>
           
           <div className="relative group">
              <div className="absolute -inset-4 bg-accent/20 rounded-[3rem] blur-3xl opacity-30 group-hover:opacity-100 transition duration-1000"></div>
              <div className="relative p-8 bg-card border border-border rounded-[2.5rem] shadow-2xl space-y-6">
                 <div className="flex items-center justify-between mb-8">
                    <div className="space-y-1">
                       <div className="badge-orange">Estrategia ACTIVA</div>
                       <div className="text-2xl font-black italic uppercase">Escalado 20%</div>
                    </div>
                    <div className="text-4xl font-black text-accent">S4</div>
                 </div>
                 <div className="progress-container">
                    <div className="progress-fill shadow-[0_0_20px_rgba(255,69,0,0.5)]" style={{ width: '70%' }}></div>
                 </div>
                 <div className="flex justify-between font-black uppercase italic text-[10px] text-muted-foreground">
                    <span>SEMANA ACTUAL</span>
                    <span>OBJETIVO</span>
                 </div>
              </div>
           </div>
        </div>
      </section>

      {/* Logic */}
      <section className="py-32 px-6">
         <div className="max-w-7xl mx-auto space-y-20">
            <div className="text-center space-y-4">
               <h2 className="text-4xl md:text-6xl font-black tracking-tighter uppercase italic leading-none">Funcionamiento</h2>
               <p className="text-muted-foreground uppercase font-black text-xs tracking-[0.3em]">Lógica de uso interno</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
               {[
                 { 
                   title: "Configuración", 
                   desc: "Registro de cliente y definición de presupuesto base vs meta final.",
                   icon: Target
                 },
                 { 
                   title: "Estrategia", 
                   desc: "Definición de frecuencia (diaria, semanal, etc.) y porcentaje fijo.",
                   icon: TrendingUp
                 },
                 { 
                   title: "Avance", 
                   desc: "Registro del paso a la siguiente etapa con ajuste automático de montos.",
                   icon: Activity
                 }
               ].map((step, i) => (
                 <div key={i} className="card-widget p-10 space-y-6 hover:shadow-orange-glow/10 border-transparent hover:border-accent/30 group">
                    <div className="w-16 h-16 bg-accent/10 rounded-2xl flex items-center justify-center border border-accent/20 group-hover:scale-110 transition-transform">
                      <step.icon className="w-8 h-8 text-accent" />
                    </div>
                    <h3 className="text-2xl font-black uppercase italic tracking-tight">{step.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{step.desc}</p>
                 </div>
               ))}
            </div>
         </div>
      </section>

      {/* Footer */}
      <footer className="py-20 border-t border-white/5 px-6">
         <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-10">
            <div className="flex items-center gap-4 group">
              <img 
                src="/android-chrome-192x192.png" 
                alt="Logo" 
                className="w-8 h-8 rounded-full border border-white/10"
              />
              <span className="font-black uppercase italic text-sm tracking-tighter opacity-40">fanger.design</span>
            </div>
            
            <div className="flex gap-8">
               <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">© 2026 Internal Utility</span>
               <Link href="/dashboard" className="text-[10px] font-black uppercase text-accent tracking-widest hover:underline decoration-2 underline-offset-4">Dashboard</Link>
            </div>
         </div>
      </footer>
    </div>
  );
}
