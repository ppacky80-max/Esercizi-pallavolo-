import React, { useState } from 'react';
import {
  Volleyball,
  ArrowRight,
  ClipboardList,
  Dumbbell,
  Printer,
  Sparkles,
  ShieldCheck,
  Layers,
  Clock,
  Users,
  Smartphone,
  CheckCircle2,
  LogIn,
  LayoutDashboard,
  Maximize2,
  Play,
  RotateCw,
  Award,
  Calendar,
  Compass,
  Zap,
  HelpCircle,
  Share2,
  ChevronRight,
  BookOpen,
  Target,
  Newspaper,
  Flame,
  Trophy,
} from 'lucide-react';
import { ActivePage } from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';
import { RotatingBanner } from '../components/RotatingBanner';
import { DashboardNews } from '../components/DashboardNews';

interface LandingPageProps {
  onNavigate: (page: ActivePage, entityId?: string) => void;
  onOpenAuth: () => void;
}

// Tactical court interactive demo presets
type TacticalDemoMode = 'p1' | 'attacco' | 'ricezione' | 'difesa';
type FondamentaleVolley = 'battuta' | 'ricezione' | 'alzata' | 'attacco' | 'muro' | 'difesa';

const FONDAMENTALI_VOLLEY: Record<
  FondamentaleVolley,
  {
    nome: string;
    titolo: string;
    descrizione: string;
    consigliCoach: string[];
    zonaFocus: string;
    colore: string;
  }
> = {
  battuta: {
    nome: 'Battuta',
    titolo: 'Battuta & Servizio d’Inizio Gioco',
    descrizione:
      'Il fondamentale d’attacco per eccellenza: battuta float tattica senza rotazione per mettere in difficoltà la ricezione avversaria o jump serve potente a oltre 110 km/h.',
    consigliCoach: [
      'Lancio palla sempre coerente e ripetibile (altezza 1-2 metri sopra la testa per la float).',
      'Punto d’impatto con la mano tesa e rigida al centro del pallone per annullare lo spin.',
      'Mirare ai punti di conflitto tra i ricettori (tra 5 e 6 o tra 1 e 6).',
    ],
    zonaFocus: 'Zona 1 avversaria e linee di fondo',
    colore: 'bg-amber-500 text-slate-950',
  },
  ricezione: {
    nome: 'Ricezione',
    titolo: 'Ricezione a 3 con il Libero',
    descrizione:
      'La base della costruzione offensiva: lettura della traiettoria avversaria, spostamento rapido con piano di rimbalzo del bagher orientato verso la zona di alzata (posto 2/3).',
    consigliCoach: [
      'Gambe piegate a baricentro basso, anticipando la rotazione del battitore.',
      'Piano del bagher fermo al contatto senza spingere con le spalle ma assecondando con le gambe.',
      'Comunicazione ad alta voce: "Mia!" prima che la sfera superi la rete.',
    ],
    zonaFocus: 'Zona 2/3 (tra 2.5m e 3m da rete)',
    colore: 'bg-blue-600 text-white',
  },
  alzata: {
    nome: 'Alzata',
    titolo: 'Regia & Distribuzione del Palleggiatore',
    descrizione:
      'Il fulcro tattico del sistema 5-1 o 4-2: scelta del tempo d’attacco (primo tempo C3, palla alta S4, fast C2, pipe da seconda linea S6) in base alla posizione del muro avversario.',
    consigliCoach: [
      'Mani pronte sopra la fronte con dita a coppa e polsi flessibili.',
      'Busto eretto e neutro per non svelare la direzione dell’alzata ai centrali avversari.',
      'Sfruttare l’attacco di pipe da zona 6 per sorprendere le difese a muro schierato.',
    ],
    zonaFocus: 'Zone 4, 3, 2 e 6 (Pipe)',
    colore: 'bg-purple-600 text-white',
  },
  attacco: {
    nome: 'Attacco',
    titolo: 'Fase Offensiva & Rincorsa a 3-4 Passi',
    descrizione:
      'Rincorsa ritmata (destro-sinistro-destro-stacco o inverso), caricamento delle braccia ad arco e colpo alla massima elevazione con frustata di polso per direzionare la palla.',
    consigliCoach: [
      'Penultimo passo lungo e radente, ultimo passo rapido di blocco per convertire la velocità orizzontale in verticale.',
      'Braccio non dominante puntato verso la sfera per mantenere l’equilibrio e mirare.',
      'Variare sempre colpo: diagonale stretta, parallela, mani-fuori del muro e pallonetto corto.',
    ],
    zonaFocus: 'Bordo superiore della rete e campo avversario',
    colore: 'bg-rose-600 text-white',
  },
  muro: {
    nome: 'Muro',
    titolo: 'Muro a 2 / 3 & Lettura dell’Attaccante',
    descrizione:
      'Prima linea di difesa attiva: salto coordinato a rete, mani aperte e dita rigide che invadono il campo avversario per bloccare la traiettoria o toccare la palla per la difesa.',
    consigliCoach: [
      'Occhi sul palleggiatore e poi sulla spalla dell’attaccante, mai solo sul pallone.',
      'Penetrazione decisa oltre il nastro con polsi bloccati per evitare il tocco morbido sotto rete.',
      'Centrale rapido nei passi accostati o incrociati per chiudere con la banda esterna.',
    ],
    zonaFocus: 'Rete e nastro superiore (2.43m / 2.24m)',
    colore: 'bg-emerald-600 text-white',
  },
  difesa: {
    nome: 'Difesa',
    titolo: 'Difesa in Campo & Copertura d’Attacco',
    descrizione:
      'Reattività e sacrificio: posizione fondamentale d’attesa a baricentro bassissimo, recupero in tuffo/rullata e copertura immediata sul proprio attaccante per la ricostruzione.',
    consigliCoach: [
      'Piedi fermi e peso sulle punte al momento dell’impatto dell’attaccante avversario.',
      'Copertura d’attacco a semicerchio stretto attorno al compagno che salta a schiacciare.',
      'Rigenerare l’azione alzando la palla alta verso il centro del campo per contrattaccare.',
    ],
    zonaFocus: 'Zone 1, 6, 5 e retro-muro',
    colore: 'bg-indigo-600 text-white',
  },
};

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate, onOpenAuth }) => {
  const { currentUser, loginAsDemoCoach } = useAuth();
  const [activeDemo, setActiveDemo] = useState<TacticalDemoMode>('p1');
  const [selectedFondamentale, setSelectedFondamentale] = useState<FondamentaleVolley>('battuta');
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const handleDemoEntry = () => {
    if (currentUser) {
      onNavigate('dashboard');
    } else {
      loginAsDemoCoach();
      onNavigate('dashboard');
    }
  };

  // Tactical demo positions for the interactive miniature Taraflex court
  const demoTactics = {
    p1: {
      title: 'Rotazione P1 (Palleggiatore in Zona 1)',
      subtitle: 'Disposizione di partenza con ricezione a 3 e alzata da posto 2/3',
      players: [
        { label: 'P1', role: 'P', num: 1, x: '82%', y: '78%', color: 'bg-amber-500 text-slate-950' },
        { label: 'S1', role: 'S', num: 7, x: '80%', y: '25%', color: 'bg-blue-600 text-white' },
        { label: 'C1', role: 'C', num: 12, x: '55%', y: '25%', color: 'bg-emerald-600 text-white' },
        { label: 'O', role: 'O', num: 9, x: '20%', y: '25%', color: 'bg-purple-600 text-white' },
        { label: 'S2', role: 'S', num: 4, x: '25%', y: '75%', color: 'bg-blue-600 text-white' },
        { label: 'L', role: 'L', num: 5, x: '52%', y: '80%', color: 'bg-rose-500 text-white' },
      ],
      ball: { x: '52%', y: '15%' },
      arrow: 'M 52% 15% Q 65% 45% 80% 70%',
    },
    attacco: {
      title: 'Fase di Attacco & Rincorsa',
      subtitle: 'Alzata al centro (primo tempo) e palla alta in posto 4',
      players: [
        { label: 'P', role: 'P', num: 1, x: '65%', y: '32%', color: 'bg-amber-500 text-slate-950' },
        { label: 'S4', role: 'S', num: 7, x: '20%', y: '28%', color: 'bg-blue-600 text-white' },
        { label: 'C3', role: 'C', num: 12, x: '50%', y: '30%', color: 'bg-emerald-600 text-white' },
        { label: 'O2', role: 'O', num: 9, x: '82%', y: '28%', color: 'bg-purple-600 text-white' },
        { label: 'S6', role: 'S', num: 4, x: '35%', y: '75%', color: 'bg-blue-600 text-white' },
        { label: 'L5', role: 'L', num: 5, x: '68%', y: '75%', color: 'bg-rose-500 text-white' },
      ],
      ball: { x: '65%', y: '32%' },
      arrow: 'M 65% 32% L 22% 28%',
    },
    ricezione: {
      title: 'Schema di Ricezione a 3 con Libero',
      subtitle: 'Copertura delle zone 1, 6 e 5 con attaccanti pronti alla transizione',
      players: [
        { label: 'P', role: 'P', num: 1, x: '75%', y: '32%', color: 'bg-amber-500 text-slate-950' },
        { label: 'S', role: 'S', num: 7, x: '25%', y: '68%', color: 'bg-blue-600 text-white' },
        { label: 'C', role: 'C', num: 12, x: '50%', y: '35%', color: 'bg-emerald-600 text-white' },
        { label: 'O', role: 'O', num: 9, x: '80%', y: '40%', color: 'bg-purple-600 text-white' },
        { label: 'S', role: 'S', num: 4, x: '75%', y: '68%', color: 'bg-blue-600 text-white' },
        { label: 'L', role: 'L', num: 5, x: '50%', y: '78%', color: 'bg-rose-500 text-white' },
      ],
      ball: { x: '50%', y: '10%' },
      arrow: 'M 50% 10% Q 50% 45% 50% 75%',
    },
    difesa: {
      title: 'Disposizione Difensiva & Muro a 2',
      subtitle: 'Muro su posto 4 avversario e piazzamento in diagonale e parallela',
      players: [
        { label: 'C', role: 'C', num: 12, x: '35%', y: '26%', color: 'bg-emerald-600 text-white' },
        { label: 'O', role: 'O', num: 9, x: '20%', y: '26%', color: 'bg-purple-600 text-white' },
        { label: 'S', role: 'S', num: 7, x: '80%', y: '35%', color: 'bg-blue-600 text-white' },
        { label: 'L', role: 'L', num: 5, x: '25%', y: '70%', color: 'bg-rose-500 text-white' },
        { label: 'S', role: 'S', num: 4, x: '55%', y: '82%', color: 'bg-blue-600 text-white' },
        { label: 'P', role: 'P', num: 1, x: '80%', y: '65%', color: 'bg-amber-500 text-slate-950' },
      ],
      ball: { x: '25%', y: '15%' },
      arrow: 'M 25% 15% L 27% 26%',
    },
  };

  const currentDemo = demoTactics[activeDemo];

  const faqs = [
    {
      q: 'La Web App funziona su smartphone, tablet e PC?',
      a: 'Sì, la piattaforma è 100% responsive ed ottimizzata per touch screen. Puoi usarla dal computer in ufficio per programmare le sedute e direttamente dal tablet o telefono a bordo campo in palestra durante gli allenamenti.',
    },
    {
      q: 'Come posso portare gli allenamenti e gli schemi in palestra?',
      a: 'Hai diverse opzioni: puoi generare e stampare il PDF ad alta risoluzione (scheda singolo esercizio o fascicolo completo della seduta), consultare la web app dal tablet/smartphone anche senza stampare, oppure proiettare la schermata a tutto schermo con la Modalità Presentazione per spiegare i movimenti agli atleti.',
    },
    {
      q: 'Cosa include la Lavagna Tattica Intelligente?',
      a: 'Include il campo regolamentare FIPAV 9x18m in formato Taraflex, Parquet e FIVB, tutti i ruoli federali (Palleggiatore, Schiacciatore/Banda, Centrale, Opposto, Libero, Allenatore), attrezzi (palla, coni, plinti, canestri, blocchi muro), frecce vettoriali con curve di Bézier, timeline multi-fase animata e generatori automatici per le rotazioni P1-P6 e schemi di gioco.',
    },
    {
      q: 'I dati e gli esercizi rimangono salvati in modo sicuro?',
      a: 'Sì, quando accedi con il tuo account tutti i tuoi esercizi, squadre, rotazioni e sedute vengono salvati nel database cloud Firebase, sincronizzati istantaneamente tra tutti i tuoi dispositivi e protetti da accessi non autorizzati.',
    },
    {
      q: 'Come faccio ad aggiungere la Web App alla schermata Home del telefono?',
      a: 'Apri l\'indirizzo web su Safari (su iPhone) o su Chrome (su Android), tocca il tasto Condividi/Menu del browser e seleziona "Aggiungi alla schermata Home". L\'applicazione funzionerà come una vera app nativa a schermo intero.',
    },
  ];

  return (
    <div className="space-y-12 max-w-6xl mx-auto pb-20 animate-in fade-in duration-300">
      
      {/* 1. HERO SECTION: DYNAMIC VOLLEYBALL THEME */}
      <section className="relative rounded-3xl overflow-hidden shadow-2xl border border-blue-900/60 bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 text-white">
        
        {/* Court Net & Boundary Line Graphic Background */}
        <div className="absolute inset-0 pointer-events-none opacity-20 overflow-hidden">
          <div className="absolute -right-20 -top-20 w-96 h-96 rounded-full bg-blue-600/30 blur-3xl" />
          <div className="absolute right-1/3 -bottom-20 w-96 h-96 rounded-full bg-amber-500/20 blur-3xl" />
          {/* Subtle Court Net Grid */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#3b82f615_1px,transparent_1px),linear-gradient(to_bottom,#3b82f615_1px,transparent_1px)] bg-[size:32px_32px]" />
        </div>

        <div className="relative z-10 p-6 sm:p-10 lg:p-12">
          
          {/* Kicker Tag */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 text-slate-950 shadow-md">
              <Volleyball size={14} className="animate-spin-slow" />
              <span>HOME • PRESENTAZIONE WEB APP PALLAVOLO</span>
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
            
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-5">
              <h1 className="text-3xl sm:text-5xl lg:text-5xl font-black tracking-tight leading-[1.15] text-white">
                Il Centro di Comando per <span className="bg-gradient-to-r from-amber-300 via-amber-400 to-orange-400 bg-clip-text text-transparent">Allenatori di Pallavolo</span>
              </h1>

              <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl">
                Progetta schemi tattici con la <strong>Lavagna Intelligente 9x18m</strong>, gestisci rotazioni <strong>P1–P6</strong> con il Libero, organizza il catalogo esercizi nelle <strong>14 categorie federali</strong> e costruisci sedute complete con calcolo automatico dei tempi e <strong>stampa PDF</strong> per la palestra.
              </p>

              {/* Primary Call to Action Buttons */}
              <div className="pt-2 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => (currentUser ? onNavigate('dashboard') : onOpenAuth())}
                  className="px-6 py-3.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-500 text-white rounded-2xl font-black text-sm shadow-xl shadow-blue-600/30 transition flex items-center gap-2.5 transform hover:-translate-y-0.5 cursor-pointer"
                >
                  <LayoutDashboard size={18} />
                  <span>
                    {currentUser
                      ? 'ACCEDI ALLA DASHBOARD'
                      : 'ENTRA NELL’APP (ACCEDI O REGISTRATI)'}
                  </span>
                  <ArrowRight size={16} />
                </button>

                <button
                  type="button"
                  onClick={handleDemoEntry}
                  className="px-5 py-3.5 bg-slate-800/90 hover:bg-slate-750 text-slate-200 hover:text-white rounded-2xl font-bold text-sm border border-slate-700 hover:border-slate-600 transition flex items-center gap-2 cursor-pointer shadow-sm"
                  title="Esplora tutte le funzionalità senza registrazione"
                >
                  <Sparkles size={16} className="text-amber-400" />
                  <span>Accesso Rapido Demo</span>
                </button>
              </div>

              {/* Fast Stats Row */}
              <div className="pt-4 grid grid-cols-3 gap-3 border-t border-slate-800/80 text-left">
                <div>
                  <div className="text-lg sm:text-2xl font-black text-amber-400">14</div>
                  <div className="text-[11px] text-slate-400 font-medium">Categorie Didattiche</div>
                </div>
                <div>
                  <div className="text-lg sm:text-2xl font-black text-blue-400">9 x 18m</div>
                  <div className="text-[11px] text-slate-400 font-medium">Campo Regolamentare</div>
                </div>
                <div>
                  <div className="text-lg sm:text-2xl font-black text-emerald-400">100%</div>
                  <div className="text-[11px] text-slate-400 font-medium">Cloud & Stampa PDF</div>
                </div>
              </div>
            </div>

            {/* Right: Interactive Taraflex Court Simulation */}
            <div className="lg:col-span-5">
              <div className="bg-slate-900/90 rounded-3xl p-4 sm:p-5 border border-slate-800 shadow-2xl space-y-3">
                
                {/* Court Interactive Controls */}
                <div className="flex items-center justify-between gap-1 pb-2 border-b border-slate-800">
                  <div className="flex items-center gap-1.5 text-xs font-black text-slate-300">
                    <Compass size={15} className="text-amber-400" />
                    <span>ANTEPRIMA LAVAGNA</span>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    FIPAV / FIVB Live
                  </span>
                </div>

                {/* Preset selector pills */}
                <div className="grid grid-cols-4 gap-1 p-1 bg-slate-950 rounded-xl text-[11px] font-bold">
                  {(['p1', 'attacco', 'ricezione', 'difesa'] as TacticalDemoMode[]).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setActiveDemo(mode)}
                      className={`py-1.5 rounded-lg uppercase tracking-wider transition cursor-pointer text-center ${
                        activeDemo === mode
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>

                {/* Miniature Volleyball Taraflex Court Graphic */}
                <div className="relative aspect-[16/10] w-full rounded-2xl overflow-hidden border-2 border-slate-700 bg-[#0f3460] shadow-inner select-none">
                  
                  {/* Outer Free Zone (Blue Taraflex) */}
                  <div className="absolute inset-0 bg-[#16213e]" />

                  {/* Inner Playing Court (Orange/Terracotta Taraflex) */}
                  <div className="absolute inset-[6%] bg-[#e9643a] border-2 border-white shadow-md">
                    
                    {/* Center Line & Net */}
                    <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-white -translate-x-1/2" />
                    <div className="absolute left-1/2 -top-1 -bottom-1 w-2.5 bg-slate-950/80 -translate-x-1/2 border-x border-white/50 flex flex-col justify-between py-1">
                      <div className="w-full h-2 bg-red-600" />
                      <div className="w-full h-2 bg-red-600" />
                    </div>

                    {/* 3-Meter Attack Lines */}
                    <div className="absolute left-[33%] top-0 bottom-0 w-0.5 bg-white/90 border-r border-dashed border-white/60" />
                    <div className="absolute left-[67%] top-0 bottom-0 w-0.5 bg-white/90 border-l border-dashed border-white/60" />

                    {/* Zone Numbers watermark */}
                    <div className="absolute inset-0 grid grid-cols-2 grid-rows-3 pointer-events-none opacity-25 text-white font-black text-xs p-2">
                      <div className="flex items-center justify-center">IV</div>
                      <div className="flex items-center justify-center">II</div>
                      <div className="flex items-center justify-center">III</div>
                      <div className="flex items-center justify-center">III</div>
                      <div className="flex items-center justify-center">V</div>
                      <div className="flex items-center justify-center">I</div>
                    </div>

                    {/* Dynamic Players on court */}
                    {currentDemo.players.map((p, idx) => (
                      <div
                        key={idx}
                        style={{ left: p.x, top: p.y }}
                        className={`absolute -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center font-black text-[10px] shadow-lg border border-white/80 transition-all duration-500 ${p.color}`}
                        title={`${p.label} - ${p.role}`}
                      >
                        {p.label}
                      </div>
                    ))}

                    {/* Volleyball ball */}
                    <div
                      style={{ left: currentDemo.ball.x, top: currentDemo.ball.y }}
                      className="absolute -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-gradient-to-br from-amber-300 via-blue-500 to-amber-400 border border-white shadow-md animate-bounce"
                      title="Pallone"
                    />
                  </div>
                </div>

                {/* Demo Description Card */}
                <div className="text-left bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                  <div className="text-xs font-black text-white">{currentDemo.title}</div>
                  <div className="text-[11px] text-slate-400 leading-snug">{currentDemo.subtitle}</div>
                </div>

                {/* Direct Action Link */}
                <button
                  type="button"
                  onClick={() => onNavigate('tactical_schemes')}
                  className="w-full py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 hover:text-white rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 border border-blue-500/30 cursor-pointer"
                >
                  <Maximize2 size={13} />
                  <span>APRI LA LAVAGNA TATTICA COMPLETA</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ROTATING BANNER SLIDER (Gestito dall'amministratore) */}
      <section>
        <RotatingBanner onNavigate={onNavigate} />
      </section>

      {/* 2. PRESENTAZIONE SUITE COMPLETA DELLE FUNZIONALITÀ */}
      <section className="space-y-6">
        
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <div className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-blue-600">
            <Zap size={14} />
            <span>LA SUITE COMPLETA PER LA PALLAVOLO</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Tutto ciò che serve al coach moderno
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Una piattaforma integrata progettata sui regolamenti FIPAV e FIVB, per seguire la squadra dal riscaldamento alla partita.
          </p>
        </div>

        {/* 6 Core Functional Modules Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          
          {/* Module 1: Lavagna Tattica Intelligente */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 flex flex-col justify-between hover:border-blue-500 hover:shadow-md transition group">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
                <Volleyball size={26} />
              </div>
              <h3 className="text-lg font-black text-slate-900 group-hover:text-blue-600 transition">
                Lavagna Tattica Intelligente
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Campo proporzionato 9x18m con linea dei 3 metri, rete bicolore con aste e zone 1-6. Schiera giocatori con ruoli e maglia, traccia frecce dirette o curve di rincorsa e gestisci sequenze multi-fase animate.
              </p>
              <ul className="text-xs text-slate-500 space-y-1.5 pt-1 border-t border-slate-100">
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                  <span>Timeline con animazione fluida tra le fasi</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                  <span>Generatori rapidi 6 giocatori, Libero e rotazioni</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                  <span>Temi Taraflex, Parquet, FIVB Azzurro e Stampa</span>
                </li>
              </ul>
            </div>

            <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-400">Schermo Intero & PDF</span>
              <button
                type="button"
                onClick={() => onNavigate('tactical_schemes')}
                className="text-xs font-black text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
              >
                <span>Vai alla Lavagna</span>
                <ArrowRight size={13} />
              </button>
            </div>
          </div>

          {/* Module 2: Archivio Esercizi */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 flex flex-col justify-between hover:border-blue-500 hover:shadow-md transition group">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-600 flex items-center justify-center font-bold">
                <ClipboardList size={26} />
              </div>
              <h3 className="text-lg font-black text-slate-900 group-hover:text-blue-600 transition">
                Archivio Esercizi FIPAV
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Catalogo master strutturato nelle 14 categorie tecniche ufficiali: Riscaldamento, Ricezione, Difesa, Copertura, Alzata, Battuta, Muro, Attacco, Breakpoint, Cambiopalla e Gioco Globale.
              </p>
              <ul className="text-xs text-slate-500 space-y-1.5 pt-1 border-t border-slate-100">
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                  <span>Filtri per livello (Base, Intermedio, Avanzato)</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                  <span>Numero atleti minimo/massimo e materiale</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                  <span>Duplicazione istantanea e salvataggio preferiti</span>
                </li>
              </ul>
            </div>

            <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-400">14 Categorie Didattiche</span>
              <button
                type="button"
                onClick={() => onNavigate('exercises')}
                className="text-xs font-black text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
              >
                <span>Esplora Archivio</span>
                <ArrowRight size={13} />
              </button>
            </div>
          </div>

          {/* Module 3: Workout Planner */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 flex flex-col justify-between hover:border-emerald-500 hover:shadow-md transition group">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
                <Dumbbell size={26} />
              </div>
              <h3 className="text-lg font-black text-slate-900 group-hover:text-emerald-600 transition">
                Pianificatore Allenamento
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Componi la seduta ideale trascinando gli esercizi. Il sistema calcola in tempo reale la durata totale rispetto all'orario di palestra a disposizione, avvisandoti visivamente in caso di sforamento.
              </p>
              <ul className="text-xs text-slate-500 space-y-1.5 pt-1 border-t border-slate-100">
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                  <span>Controllo orario programmato vs tempo palestra</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                  <span>Snapshot storico congelato per ogni seduta</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                  <span>Creazione rapida di nuovi esercizi al volo</span>
                </li>
              </ul>
            </div>

            <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-400">Timeline al minuto</span>
              <button
                type="button"
                onClick={() => onNavigate('new_workout')}
                className="text-xs font-black text-emerald-600 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
              >
                <span>Crea Seduta</span>
                <ArrowRight size={13} />
              </button>
            </div>
          </div>

          {/* Module 4: Sistemi di Gioco & Rotazioni */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 flex flex-col justify-between hover:border-purple-500 hover:shadow-md transition group">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-600 flex items-center justify-center font-bold">
                <RotateCw size={26} />
              </div>
              <h3 className="text-lg font-black text-slate-900 group-hover:text-purple-600 transition">
                Rotazioni & Sistemi di Gioco
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Gestione completa dei sistemi tattici: 5-1 con palleggiatore unico, 4-2 e 6-2. Analisi immediata delle 6 rotazioni ufficiali (P1–P6) con verifica visiva dei falli di posizione e sovrapposizione.
              </p>
              <ul className="text-xs text-slate-500 space-y-1.5 pt-1 border-t border-slate-100">
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                  <span>Rotazione rapida P1, P2, P3, P4, P5, P6</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                  <span>Entrata/uscita automatica del Libero sul centrale</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                  <span>Fase di ricezione, cambio palla e contrattacco</span>
                </li>
              </ul>
            </div>

            <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-400">Modulo Tattico 5-1</span>
              <button
                type="button"
                onClick={() => onNavigate('rotations')}
                className="text-xs font-black text-purple-600 hover:text-purple-800 flex items-center gap-1 cursor-pointer"
              >
                <span>Gestisci Rotazioni</span>
                <ArrowRight size={13} />
              </button>
            </div>
          </div>

          {/* Module 5: Gestione Squadre & Roster */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 flex flex-col justify-between hover:border-indigo-500 hover:shadow-md transition group">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center font-bold">
                <Users size={26} />
              </div>
              <h3 className="text-lg font-black text-slate-900 group-hover:text-indigo-600 transition">
                Squadre, Roster & Presenze
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Gestisci le tue formazioni giovanili e seniores. Crea la scheda anagrafica degli atleti con maglia, ruolo, altezza, dati fisici e tieni traccia delle presenze agli allenamenti e alle partite.
              </p>
              <ul className="text-xs text-slate-500 space-y-1.5 pt-1 border-t border-slate-100">
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                  <span>Scheda tecnica dettagliata per ogni atleta</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                  <span>Calendario eventi, gare e sedute tecniche</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                  <span>Storico allenamenti associati alla squadra</span>
                </li>
              </ul>
            </div>

            <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-400">Anagrafica Atleti</span>
              <button
                type="button"
                onClick={() => onNavigate('teams')}
                className="text-xs font-black text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
              >
                <span>Gestisci Squadre</span>
                <ArrowRight size={13} />
              </button>
            </div>
          </div>

          {/* Module 6: Esportazione Stampa PDF per la Palestra */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 flex flex-col justify-between hover:border-rose-500 hover:shadow-md transition group">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-600 flex items-center justify-center font-bold">
                <Printer size={26} />
              </div>
              <h3 className="text-lg font-black text-slate-900 group-hover:text-rose-600 transition">
                Stampa PDF & Schede Cartacee
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Genera in un istante schede professionali A4 per la cartellina del coach in palestra. Ogni esercizio include il diagramma vettoriale ad alta risoluzione, obiettivi, tempi e note didattiche.
              </p>
              <ul className="text-xs text-slate-500 space-y-1.5 pt-1 border-t border-slate-100">
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                  <span>Fascicolo seduta completo multi-pagina</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                  <span>Esportazione schemi in formato PNG ad alta densità</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                  <span>Funziona sempre, anche offline in palestra</span>
                </li>
              </ul>
            </div>

            <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-400">PDF Vettoriale A4</span>
              <button
                type="button"
                onClick={() => onNavigate('workouts')}
                className="text-xs font-black text-rose-600 hover:text-rose-800 flex items-center gap-1 cursor-pointer"
              >
                <span>Vedi Sedute</span>
                <ArrowRight size={13} />
              </button>
            </div>
          </div>

        </div>
      </section>

      {/* 2.5 I 6 FONDAMENTALI DELLA PALLAVOLO FIPAV (Interattivi con consigli per il coach) */}
      <section className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/10 text-amber-700 border border-amber-300/40 rounded-full text-xs font-black uppercase tracking-wider">
              <Trophy size={14} className="text-amber-500" />
              <span>DIDATTICA FEDERALE FIPAV</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              I 6 Fondamentali Tecnici della Pallavolo
            </h2>
            <p className="text-xs text-slate-500 max-w-2xl leading-relaxed">
              Dalla battuta alla difesa: clicca su ciascun fondamentale per consultare obiettivi tecnici, indicazioni metodologiche e le zone del campo coinvolte.
            </p>
          </div>
        </div>

        {/* Fundamental Pills Selector */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {(Object.keys(FONDAMENTALI_VOLLEY) as FondamentaleVolley[]).map((fKey) => {
            const fond = FONDAMENTALI_VOLLEY[fKey];
            const isSelected = selectedFondamentale === fKey;
            return (
              <button
                key={fKey}
                type="button"
                onClick={() => setSelectedFondamentale(fKey)}
                className={`p-3 rounded-2xl text-left font-black text-xs transition duration-200 flex flex-col justify-between border cursor-pointer ${
                  isSelected
                    ? `${fond.colore} shadow-md border-transparent scale-[1.02]`
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200/80'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span className="uppercase tracking-wider text-[11px]">{fond.nome}</span>
                  <Volleyball size={14} className={isSelected ? 'text-current opacity-90' : 'text-slate-400'} />
                </div>
                <span className={`text-[10px] font-medium leading-tight ${isSelected ? 'opacity-90' : 'text-slate-500'}`}>
                  {fKey === 'battuta' && 'Attacco Iniziale'}
                  {fKey === 'ricezione' && 'Costruzione Bagher'}
                  {fKey === 'alzata' && 'Regia Palleggio'}
                  {fKey === 'attacco' && 'Schiacciata & Pipe'}
                  {fKey === 'muro' && 'Prima Linea a Rete'}
                  {fKey === 'difesa' && 'Reattività & Copertura'}
                </span>
              </button>
            );
          })}
        </div>

        {/* Selected Fundamental Card Detail */}
        {(() => {
          const activeItem = FONDAMENTALI_VOLLEY[selectedFondamentale];
          return (
            <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white rounded-2xl p-5 sm:p-7 border border-blue-800/40 shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-400">
                    FONDAMENTALE TECNICO ANALIZZATO
                  </span>
                  <h3 className="text-lg sm:text-xl font-black text-white">{activeItem.titolo}</h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-white/10 text-blue-200 rounded-xl text-xs font-semibold border border-white/10">
                    Focus: {activeItem.zonaFocus}
                  </span>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-3xl">
                {activeItem.descrizione}
              </p>

              <div className="pt-2 border-t border-slate-800/80 space-y-2">
                <span className="text-[11px] font-black uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                  <Sparkles size={13} />
                  <span>Consigli Pratici per il Coach:</span>
                </span>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {activeItem.consigliCoach.map((tip, idx) => (
                    <div key={idx} className="bg-white/5 p-3 rounded-xl border border-white/10 text-xs text-slate-300 leading-relaxed flex items-start gap-2">
                      <CheckCircle2 size={15} className="text-emerald-400 shrink-0 mt-0.5" />
                      <span>{tip}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })()}
      </section>

      {/* 2.6 SEZIONE NEWS & CURIOSITÀ DAL MONDO DELLA PALLAVOLO (Visibili in sola lettura a tutti) */}
      <section id="volley-news" className="space-y-4">
        <DashboardNews
          readOnly={true}
          title="News & Curiosità dal Mondo della Pallavolo"
          subtitle="Notizie federali, curiosità storiche, chiarimenti sul regolamento FIPAV e approfondimenti tecnici curati dalla nostra redazione tecnica. Consultabili liberamente in sola lettura da tutti gli atleti e allenatori."
          badgeLabel="Sola Lettura a Tutti"
        />
      </section>

      {/* 3. IL METODO VOLLEY COACH IN 4 PASSI */}
      <section className="bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white rounded-3xl p-6 sm:p-10 border border-slate-800 shadow-xl space-y-8">
        
        <div className="text-center max-w-xl mx-auto space-y-2">
          <span className="text-xs font-black uppercase tracking-wider text-amber-400">
            DALLA PROGETTAZIONE AL CAMPO
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-white">
            Come Funziona il Metodo Volley Coach
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Un flusso di lavoro rapido e lineare studiato appositamente per allenatori di ogni categoria.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          <div className="bg-white/5 rounded-2xl p-5 border border-white/10 space-y-3 relative">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white font-black text-sm flex items-center justify-center shadow-md">
              1
            </div>
            <h4 className="font-bold text-sm text-white">Progetta sulla Lavagna</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Disponi gli atleti sul campo 9x18m, traccia traiettorie di battuta, alzate e schemi di attacco o carica template preimpostati.
            </p>
          </div>

          <div className="bg-white/5 rounded-2xl p-5 border border-white/10 space-y-3 relative">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white font-black text-sm flex items-center justify-center shadow-md">
              2
            </div>
            <h4 className="font-bold text-sm text-white">Componi la Seduta</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Seleziona gli esercizi, calcola la durata precisa e pianifica l'intensità di riscaldamento, tecnica, fase gioco e defaticamento.
            </p>
          </div>

          <div className="bg-white/5 rounded-2xl p-5 border border-white/10 space-y-3 relative">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 font-black text-sm flex items-center justify-center shadow-md">
              3
            </div>
            <h4 className="font-bold text-sm text-white">Porta in Palestra</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Stampa il PDF con gli schemi tattici sulla cartellina o consulta la seduta dal tablet a bordo campo durante l'allenamento.
            </p>
          </div>

          <div className="bg-white/5 rounded-2xl p-5 border border-white/10 space-y-3 relative">
            <div className="w-9 h-9 rounded-xl bg-purple-600 text-white font-black text-sm flex items-center justify-center shadow-md">
              4
            </div>
            <h4 className="font-bold text-sm text-white">Archivia & Migliora</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Mantieni lo storico completo delle sedute, monitora le presenze atleti e riutilizza le tue migliori esercitazioni nel tempo.
            </p>
          </div>

        </div>
      </section>

      {/* 4. DOMANDE FREQUENTI (FAQ) */}
      <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-md space-y-6">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-blue-600">
            <HelpCircle size={14} />
            <span>RISPOSTE RAPIDE</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900">
            Domande Frequenti per gli Allenatori
          </h2>
        </div>

        <div className="divide-y divide-slate-100">
          {faqs.map((faq, index) => {
            const isOpen = activeFaq === index;
            return (
              <div key={index} className="py-4">
                <button
                  type="button"
                  onClick={() => setActiveFaq(isOpen ? null : index)}
                  className="w-full flex items-center justify-between text-left gap-4 font-bold text-sm text-slate-900 hover:text-blue-600 transition cursor-pointer"
                >
                  <span>{faq.q}</span>
                  <ChevronRight
                    size={16}
                    className={`text-slate-400 shrink-0 transition-transform duration-200 ${
                      isOpen ? 'rotate-90 text-blue-600' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed pr-6 animate-in fade-in">
                    {faq.a}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 6. CALL TO ACTION FINALE */}
      <section className="relative rounded-3xl overflow-hidden p-8 sm:p-12 text-center bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-950 text-white shadow-2xl border border-blue-800/50 space-y-5">
        <div className="max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-amber-400 text-slate-950">
            <Sparkles size={14} />
            <span>PRONTO PER LA PALESTRA</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
            Inizia Subito a Gestire la Tua Squadra
          </h2>
          <p className="text-xs sm:text-sm text-blue-100/90 max-w-xl mx-auto leading-relaxed">
            Accedi con la tua email per salvare gli schemi sul cloud, oppure prova subito l'applicazione in modalità demo con un solo clic.
          </p>
        </div>

        <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => (currentUser ? onNavigate('dashboard') : onOpenAuth())}
            className="px-8 py-4 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 rounded-2xl font-black text-sm shadow-xl shadow-amber-400/20 transition inline-flex items-center gap-2.5 transform hover:-translate-y-0.5 cursor-pointer"
          >
            <LayoutDashboard size={18} />
            <span>
              {currentUser
                ? "VAI ALLA TUA DASHBOARD"
                : "ACCEDI O REGISTRATI ORA"}
            </span>
            <ArrowRight size={16} />
          </button>

          {!currentUser && (
            <button
              type="button"
              onClick={handleDemoEntry}
              className="px-6 py-4 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-bold text-sm backdrop-blur-md transition inline-flex items-center gap-2 border border-white/20 cursor-pointer"
            >
              <Sparkles size={16} className="text-amber-400" />
              <span>Entra Subito in Modalità Demo</span>
            </button>
          )}
        </div>
      </section>

    </div>
  );
};
