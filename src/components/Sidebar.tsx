import React from 'react';
import {
  Home,
  LayoutDashboard,
  Database,
  PlusCircle,
  Dumbbell,
  History,
  Users,
  Calendar,
  Settings,
  LogOut,
  LogIn,
  Volleyball,
  User,
  X,
  Lock,
  Sparkles,
  ShieldCheck,
  RotateCw,
  Layers,
  Crown,
  Newspaper,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export type ActivePage =
  | 'home'
  | 'dashboard'
  | 'news'
  | 'exercises'
  | 'new_exercise'
  | 'edit_exercise'
  | 'workouts'
  | 'history'
  | 'new_workout'
  | 'edit_workout'
  | 'teams'
  | 'team_detail'
  | 'rotations'
  | 'tactical_schemes'
  | 'calendar'
  | 'settings'
  | 'admin';

interface SidebarProps {
  activePage: ActivePage;
  onNavigate: (page: ActivePage) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  onOpenAuth: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activePage,
  onNavigate,
  isOpenMobile,
  onCloseMobile,
  onOpenAuth,
}) => {
  const { currentUser, isAdmin, logout } = useAuth();

  // If user is not logged in: show 'home' and 'news' (News & Curiosità in sola lettura).
  // All other functional tool links become available when registered or with Demo login!
  const menuItems = !currentUser
    ? [
        {
          id: 'home' as ActivePage,
          label: 'Home',
          icon: <Home size={20} />,
        },
        {
          id: 'news' as ActivePage,
          label: 'News & Curiosità',
          icon: <Newspaper size={20} />,
        },
      ]
    : [
        {
          id: 'home' as ActivePage,
          label: 'Home',
          icon: <Home size={20} />,
        },
        {
          id: 'dashboard' as ActivePage,
          label: 'Dashboard',
          icon: <LayoutDashboard size={20} />,
        },
        {
          id: 'news' as ActivePage,
          label: 'News & Curiosità',
          icon: <Newspaper size={20} />,
        },
        {
          id: 'exercises' as ActivePage,
          label: 'Archivio Esercizi',
          icon: <Database size={20} />,
        },
        {
          id: 'new_exercise' as ActivePage,
          label: 'Nuovo Esercizio',
          icon: <PlusCircle size={20} />,
          highlight: true,
        },
        {
          id: 'workouts' as ActivePage,
          label: 'Archivio Allenamenti',
          icon: <Dumbbell size={20} />,
        },
        {
          id: 'history' as ActivePage,
          label: 'Storico',
          icon: <History size={20} />,
        },
        {
          id: 'new_workout' as ActivePage,
          label: 'Nuovo Allenamento',
          icon: <PlusCircle size={20} />,
          highlight: true,
        },
        {
          id: 'teams' as ActivePage,
          label: 'Squadre',
          icon: <Users size={20} />,
        },
        {
          id: 'rotations' as ActivePage,
          label: 'Rotazioni',
          icon: <RotateCw size={20} />,
        },
        {
          id: 'tactical_schemes' as ActivePage,
          label: 'Lavagna Tattica',
          icon: <Layers size={20} />,
        },
        {
          id: 'calendar' as ActivePage,
          label: 'Calendario',
          icon: <Calendar size={20} />,
        },
        {
          id: 'settings' as ActivePage,
          label: 'Impostazioni',
          icon: <Settings size={20} />,
        },
        ...(isAdmin
          ? [
              {
                id: 'admin' as ActivePage,
                label: 'Amministrazione',
                icon: <Crown size={20} className="text-amber-400" />,
                adminBadge: true,
              },
            ]
          : []),
      ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-72 bg-gradient-to-b from-blue-950 via-slate-900 to-slate-950 text-white flex flex-col transition-transform duration-300 ease-in-out border-r border-slate-800 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand header */}
        <div className="p-6 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-amber-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Volleyball size={24} className="text-white" />
            </div>
            <div>
              <h1 className="font-black text-lg tracking-tight leading-none text-white">
                VOLLEY COACH
              </h1>
              <span className="text-[11px] font-bold text-amber-400 tracking-wider">
                ESERCIZI PALLAVOLO
              </span>
            </div>
          </div>
          <button
            onClick={onCloseMobile}
            className="lg:hidden text-slate-400 hover:text-white p-1"
          >
            <X size={20} />
          </button>
        </div>

        {/* Coach Profile Card */}
        <div className="px-4 py-3 mx-4 my-3 rounded-xl bg-slate-800/50 border border-slate-700/50 flex items-center justify-between">
          <div className="flex items-center gap-2.5 truncate">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold uppercase text-white flex-shrink-0 ${currentUser?.isGuest ? 'bg-amber-500' : currentUser ? 'bg-blue-600' : 'bg-slate-700'}`}>
              {currentUser?.displayName ? currentUser.displayName[0] : <Lock size={14} />}
            </div>
            <div className="truncate">
              <span className="block text-xs font-bold text-slate-200 truncate">
                {currentUser?.displayName || 'Ospite non loggato'}
              </span>
              <span className="block text-[10px] text-slate-400 truncate">
                {currentUser?.isGuest
                  ? 'Accesso Demo Coach'
                  : currentUser?.email
                  ? currentUser.email
                  : 'Accedi per sbloccare'}
              </span>
            </div>
          </div>
          {!currentUser ? (
            <button
              onClick={onOpenAuth}
              className="p-1.5 bg-blue-600 hover:bg-blue-500 rounded-lg text-white text-xs font-bold transition flex items-center gap-1 shadow-sm"
              title="Accedi o Login Demo"
            >
              <LogIn size={14} />
            </button>
          ) : (
            <button
              onClick={() => logout()}
              className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-700/50 rounded-lg transition"
              title="Disconnetti"
            >
              <LogOut size={16} />
            </button>
          )}
        </div>

        {/* Nav Links */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive =
              activePage === item.id ||
              (item.id === 'exercises' && activePage === 'edit_exercise') ||
              (item.id === 'workouts' && activePage === 'edit_workout');

            return (
              <button
                key={item.id}
                onClick={() => {
                  onNavigate(item.id);
                  onCloseMobile();
                }}
                className={`w-full flex items-center gap-3.5 px-3.5 py-3 rounded-xl text-xs font-bold tracking-wide transition text-left ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                    : item.highlight
                    ? 'text-amber-300 hover:bg-slate-800/70 hover:text-amber-200'
                    : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                }`}
              >
                <span
                  className={
                    isActive
                      ? 'text-white'
                      : item.highlight
                      ? 'text-amber-400'
                      : 'text-slate-400'
                  }
                >
                  {item.icon}
                </span>
                <span className="flex-1">{item.label}</span>
                {(item as any).adminBadge && (
                  <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-amber-400 text-slate-950 uppercase tracking-wider shadow-sm">
                    ADMIN
                  </span>
                )}
                {item.highlight && !isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                )}
              </button>
            );
          })}

          {/* Locked Notice & Login CTA if not logged in */}
          {!currentUser && (
            <div className="mt-4 p-4 rounded-2xl bg-gradient-to-br from-blue-900/60 via-indigo-950/60 to-slate-900/90 border border-blue-500/30 text-center space-y-3 shadow-inner">
              <div className="w-9 h-9 rounded-xl bg-amber-400/20 text-amber-400 mx-auto flex items-center justify-center">
                <Lock size={18} />
              </div>
              <div>
                <h4 className="text-xs font-black text-white uppercase tracking-wider">
                  Menu Riservato
                </h4>
                <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                  Registrati o usa il <strong>Login Demo</strong> per sbloccare la Dashboard, la Lavagna Tattica, l'Archivio Esercizi e gli Allenamenti.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  onOpenAuth();
                  onCloseMobile();
                }}
                className="w-full py-2.5 px-3 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-lg transition flex items-center justify-center gap-1.5"
              >
                <Sparkles size={14} />
                <span>Accedi o Login Demo</span>
              </button>
            </div>
          )}
        </nav>

        {/* Footer info */}
        <div className="p-4 border-t border-slate-800 text-[11px] text-slate-500 text-center">
          <span>Ideato per allenatori di pallavolo</span>
          <span className="block text-[10px] text-slate-600 mt-0.5">
            Tablet, PC & Mobile compatibile
          </span>
        </div>
      </aside>
    </>
  );
};
