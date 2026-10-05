import React from 'react';
import { useAuth } from '../context/AuthContext';
import { DashboardNews } from '../components/DashboardNews';
import {
  Newspaper,
  BookOpen,
  Crown,
  Volleyball,
  Sparkles,
  ShieldCheck,
  LogIn,
} from 'lucide-react';
import { ActivePage } from '../components/Sidebar';

interface NewsViewProps {
  onNavigate: (page: ActivePage, entityId?: string) => void;
  onOpenAuth?: () => void;
}

export const NewsView: React.FC<NewsViewProps> = ({ onNavigate, onOpenAuth }) => {
  const { currentUser, isAdmin } = useAuth();

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16 animate-in fade-in duration-300">
      
      {/* 1. TOP HEADER BANNER */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 text-white p-6 sm:p-8 border border-blue-900/60 shadow-xl">
        {/* Subtle grid background */}
        <div className="absolute inset-0 pointer-events-none opacity-20 overflow-hidden">
          <div className="absolute -right-16 -top-16 w-80 h-80 rounded-full bg-blue-600/30 blur-3xl" />
          <div className="absolute right-1/4 -bottom-16 w-80 h-80 rounded-full bg-amber-500/20 blur-3xl" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#3b82f615_1px,transparent_1px),linear-gradient(to_bottom,#3b82f615_1px,transparent_1px)] bg-[size:28px_28px]" />
        </div>

        <div className="relative z-10 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 text-slate-950 shadow-md">
              <Volleyball size={14} className="animate-spin-slow" />
              <span>PALLAVOLO FIPAV & FIVB</span>
            </span>

            {isAdmin ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-amber-400 text-slate-950 shadow-sm">
                <Crown size={14} />
                <span>Pannello Amministratore • Creazione & Modifica Notizie</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-900/70 text-blue-200 border border-blue-700/60">
                <BookOpen size={14} />
                <span>Consultazione Libera in Sola Lettura per Tutti</span>
              </span>
            )}
          </div>

          <div className="space-y-2 max-w-3xl">
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white flex items-center gap-3">
              <span className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-400">
                <Newspaper size={30} />
              </span>
              <span>News & Curiosità della Pallavolo</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Notizie federali, curiosità storiche del volley mondiale, chiarimenti e interpretazioni sul regolamento FIPAV e schede didattiche sui fondamentali tecnici.
            </p>
          </div>

          {/* Guest or non-logged in informative notice */}
          {!currentUser && (
            <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-white/5 border border-white/10 text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-amber-400 shrink-0" />
                <span>Questa bacheca è accessibile liberamente in <strong>sola lettura per tutti gli utenti</strong>. Gli amministratori possono accedere per pubblicare nuovi articoli.</span>
              </div>
              {onOpenAuth && (
                <button
                  type="button"
                  onClick={onOpenAuth}
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 self-start sm:self-auto cursor-pointer shadow-sm"
                >
                  <LogIn size={14} />
                  <span>Accedi</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 2. NEWS COMPONENT (Read-only for all regular users/guests; write/edit enabled only for administrators) */}
      <DashboardNews
        onNavigate={onNavigate}
        readOnly={!isAdmin}
        title="Bacheca Notizie & Curiosità"
        subtitle={
          isAdmin
            ? "Gestione completa articoli: puoi creare, modificare, eliminare e mettere in evidenza notizie per l'intera community."
            : "Articoli, aneddoti e approfondimenti sul volley in sola lettura a disposizione di atleti, coach e appassionati."
        }
        badgeLabel={isAdmin ? 'Gestione Admin' : 'Sola Lettura a Tutti'}
      />
    </div>
  );
};
