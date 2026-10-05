import React from 'react';
import { Menu, PlusCircle, Dumbbell, User, Crown } from 'lucide-react';
import { ActivePage } from './Sidebar';
import { useAuth } from '../context/AuthContext';

interface HeaderProps {
  activePage: ActivePage;
  onNavigate: (page: ActivePage) => void;
  onOpenMobileSidebar: () => void;
  onOpenAuth: () => void;
}

const PAGE_TITLES: Record<ActivePage, { title: string; subtitle: string }> = {
  home: {
    title: 'Home',
    subtitle: 'Piattaforma professionale per allenatori di pallavolo: lavagna tattica, esercizi e gestione squadra',
  },
  dashboard: {
    title: 'Dashboard Allenatore',
    subtitle: 'Panoramica rapida delle attività e statistiche',
  },
  news: {
    title: 'News & Curiosità',
    subtitle: 'Notizie, curiosità storiche, regolamento FIPAV e approfondimenti tecnici sul volley',
  },
  exercises: {
    title: 'Archivio Esercizi',
    subtitle: 'Catalogo completo degli schemi e delle esercitazioni',
  },
  new_exercise: {
    title: 'Crea Nuovo Esercizio',
    subtitle: 'Imposta scheda tecnica e lavagna tattica interattiva',
  },
  edit_exercise: {
    title: 'Modifica Esercizio',
    subtitle: 'Aggiorna i parametri didattici o la lavagna',
  },
  workouts: {
    title: 'Archivio Allenamenti',
    subtitle: 'Pianificazione delle sessioni e storico con snapshot',
  },
  history: {
    title: 'Storico Allenamenti',
    subtitle: 'Archivio cronologico sedute passate, filtri e duplicazione',
  },
  new_workout: {
    title: 'Nuovo Allenamento',
    subtitle: 'Costruisci la sessione con calcolo tempi e drag & drop',
  },
  edit_workout: {
    title: 'Modifica Allenamento',
    subtitle: 'Modifica la struttura della sessione',
  },
  teams: {
    title: 'Gestione Squadre',
    subtitle: 'Le tue squadre e categorie giovanili o seniores',
  },
  team_detail: {
    title: 'Dettaglio Squadra',
    subtitle: 'Atleti, allenamenti, calendario e statistiche squadra',
  },
  rotations: {
    title: 'Sistemi di Gioco & Rotazioni',
    subtitle: 'Gestione posizioni P1-P6, cambio rotazione e libero',
  },
  tactical_schemes: {
    title: 'Archivio Schemi Tattici',
    subtitle: 'Libreria tattica: ricezione, attacco, muro, difesa e transizioni',
  },
  calendar: {
    title: 'Calendario Allenamenti',
    subtitle: 'Pianificazione temporale delle sedute di allenamento',
  },
  settings: {
    title: 'Impostazioni & Account',
    subtitle: 'Configurazione coach, sicurezza account e specifiche sistema',
  },
  admin: {
    title: 'Pannello di Amministrazione',
    subtitle: 'Gestione utenti registrati, moderazione esercizi e spazio banner a rotazione',
  },
};

export const Header: React.FC<HeaderProps> = ({
  activePage,
  onNavigate,
  onOpenMobileSidebar,
  onOpenAuth,
}) => {
  const { currentUser, isAdmin } = useAuth();
  const pageMeta = PAGE_TITLES[activePage] || {
    title: 'Volley Coach Manager',
    subtitle: '',
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 py-3.5 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileSidebar}
          className="lg:hidden p-2 rounded-xl text-slate-700 hover:bg-slate-100 transition"
          aria-label="Apri menu"
        >
          <Menu size={22} />
        </button>

        <div>
          <h2 className="text-lg sm:text-xl font-black text-slate-900 leading-tight">
            {pageMeta.title}
          </h2>
          <p className="text-xs text-slate-500 hidden sm:block">
            {pageMeta.subtitle}
          </p>
        </div>
      </div>

      {/* Quick Action Buttons for PC / Tablet */}
      <div className="flex items-center gap-2 sm:gap-3">
        {!currentUser ? (
          <button
            onClick={onOpenAuth}
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-sm"
          >
            <User size={15} />
            <span>Accedi / Registrati</span>
          </button>
        ) : (
          <>
            {isAdmin && activePage !== 'admin' && (
              <button
                onClick={() => onNavigate('admin')}
                className="flex items-center gap-1.5 px-3 py-2 bg-amber-400 hover:bg-amber-500 text-slate-950 rounded-xl text-xs font-black transition shadow-sm"
                title="Accedi al pannello di amministrazione"
              >
                <Crown size={15} />
                <span className="hidden sm:inline">Pannello Admin</span>
              </button>
            )}

            {activePage !== 'new_exercise' && (
              <button
                onClick={() => onNavigate('new_exercise')}
                className="hidden md:flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
              >
                <PlusCircle size={16} />
                <span>Nuovo Esercizio</span>
              </button>
            )}

            {activePage !== 'new_workout' && (
              <button
                onClick={() => onNavigate('new_workout')}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
              >
                <Dumbbell size={16} />
                <span className="hidden sm:inline">Nuovo Allenamento</span>
                <span className="sm:hidden">Allenamento</span>
              </button>
            )}

            <div
              onClick={onOpenAuth}
              className={`w-8 h-8 rounded-full text-white text-xs font-bold flex items-center justify-center cursor-pointer shadow-sm ${
                currentUser.isGuest ? 'bg-amber-500' : 'bg-blue-600'
              }`}
              title={currentUser.displayName || currentUser.email || 'Profilo Coach'}
            >
              {currentUser.displayName ? currentUser.displayName[0] : 'C'}
            </div>
          </>
        )}
      </div>
    </header>
  );
};
