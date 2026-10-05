import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { deleteCurrentUserSelfAccount } from '../services/adminService';
import {
  User,
  ShieldCheck,
  Database,
  CheckCircle2,
  AlertCircle,
  Download,
  LogOut,
  Info,
  Crown,
  Megaphone,
  Trash2,
} from 'lucide-react';

interface SettingsViewProps {
  onOpenAuth: () => void;
  onNavigate?: (page: any) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onOpenAuth, onNavigate }) => {
  const { currentUser, isAdmin, logout, deleteAccount } = useAuth();
  const coachId = currentUser?.uid || 'local_coach';

  // Self account deletion modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteNotice, setDeleteNotice] = useState<string | null>(null);

  const handleDeleteSelfAccount = async () => {
    if (!currentUser) return;
    setDeleting(true);
    try {
      const res = await deleteAccount();
      setDeleteNotice(
        `Account eliminato con successo. I tuoi esercizi condivisi (${res.preservedSharedCount}) sono rimasti salvati e conservati nell'archivio esercizi.`
      );
      setIsDeleteModalOpen(false);
      setTimeout(() => {
        onNavigate?.('home');
      }, 2500);
    } catch (e: any) {
      console.error('Errore eliminazione account:', e);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Delete Notice Banner */}
      {deleteNotice && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-xs text-emerald-900 animate-in fade-in">
          <CheckCircle2 size={20} className="text-emerald-600 shrink-0" />
          <span>{deleteNotice}</span>
        </div>
      )}

      {/* Profilo Coach */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white font-black text-xl flex items-center justify-center">
              {currentUser?.displayName ? currentUser.displayName[0] : 'C'}
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 leading-tight">
                {currentUser?.displayName || 'Coach Volley'}
              </h3>
              <span className="text-xs text-slate-500 font-medium">
                {currentUser?.email || 'Nessun account collegato'}
              </span>
            </div>
          </div>

          {!currentUser ? (
            <button
              onClick={onOpenAuth}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-md"
            >
              Accedi o Registrati
            </button>
          ) : (
            <button
              onClick={() => logout()}
              className="px-4 py-2 bg-slate-100 hover:bg-red-50 text-slate-700 hover:text-red-600 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
            >
              <LogOut size={16} />
              <span>Esci</span>
            </button>
          )}
        </div>

        <div className="text-xs text-slate-600 leading-relaxed">
          Tutti i dati, gli schemi della lavagna tattica, gli esercizi e le schede di allenamento sono salvati su <strong>Google Firebase Firestore</strong> in modo persistente e protetto da regole di sicurezza personalizzate per il tuo account.
        </div>
      </div>

      {/* Sezione Eliminazione Account (Con Salvaguardia Esercizi Condivisi) */}
      {currentUser && !currentUser.isGuest && (
        <div className="bg-white p-6 rounded-2xl border border-red-100 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-red-50 text-red-600 rounded-xl shrink-0">
                <Trash2 size={22} />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">
                  Eliminazione Account Coach
                </h3>
                <p className="text-xs text-slate-500">
                  Elimina definitivamente il tuo account e le credenziali di accesso
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsDeleteModalOpen(true)}
              className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs rounded-xl transition border border-red-200 self-start sm:self-auto"
            >
              Elimina il Mio Account
            </button>
          </div>

          <div className="p-3.5 bg-blue-50/80 rounded-xl border border-blue-100 flex items-start gap-2.5 text-xs text-blue-900">
            <ShieldCheck size={18} className="text-blue-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <strong className="text-blue-950">Tutela dell'Archivio Esercizi:</strong>
              <p className="text-blue-800 leading-relaxed text-[11px]">
                In caso di eliminazione del tuo account, <strong>tutti gli esercizi che hai condiviso rimarranno comunque salvati e conservati nell'archivio esercizi</strong> della community a beneficio di tutti gli altri allenatori di pallavolo.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Sezione Amministrazione Web App */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white p-6 rounded-2xl border border-slate-800 shadow-md space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-400 text-slate-950 rounded-xl font-bold">
              <Crown size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-white">
                  Pannello di Amministrazione & Banner
                </h3>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-400 text-slate-950">
                  ADMIN
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Gestisci allenatori registrati, elimina account ed esercizi, e configura lo spazio banner a rotazione.
              </p>
            </div>
          </div>
        </div>

        <div className="pt-2 flex flex-wrap gap-2">
          {onNavigate && (
            <button
              type="button"
              onClick={() => onNavigate('admin')}
              className="px-5 py-2.5 bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-xs rounded-xl transition shadow-md flex items-center gap-2"
            >
              <Crown size={15} />
              <span>APRI PANNELLO AMMINISTRATORE</span>
            </button>
          )}
        </div>
      </div>

      {/* Specifiche Tecniche e Configurazione */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-3 text-xs text-slate-600">
        <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
          <Info size={18} className="text-blue-600" />
          <span>Informazioni Sistema & Database</span>
        </h3>
        <ul className="space-y-2 list-disc list-inside text-slate-500 pt-1">
          <li><strong>Database:</strong> Google Cloud Firestore (Enterprise Edition) con isolamento per Coach</li>
          <li><strong>Autenticazione:</strong> Firebase Auth (Google OAuth + Email/Password + Demo)</li>
          <li><strong>Lavagna Tattica:</strong> Motore Canvas interattivo ad alta risoluzione con proporzioni regolamentari 9x18m</li>
          <li><strong>Stampa Documenti:</strong> Generatore jsPDF multi-pagina vettoriale per schede esercizi e sedute di allenamento</li>
          <li><strong>Snapshot Storico:</strong> Gli allenamenti congelano la versione esatta degli esercizi inclusi al momento del salvataggio</li>
        </ul>
      </div>

      {/* Modal Eliminazione Account */}
      {isDeleteModalOpen && currentUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 size={24} />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-lg font-black text-slate-900">
                Eliminare il tuo account coach?
              </h3>
              <p className="text-xs text-slate-500">
                Stai per eliminare definitivamente il tuo profilo associato a <strong>{currentUser.email}</strong>.
              </p>
            </div>

            <div className="p-4 bg-blue-50 rounded-2xl border border-blue-200 text-xs text-blue-900 space-y-2">
              <div className="flex items-center gap-2 font-bold text-blue-950">
                <ShieldCheck size={18} className="text-blue-600 shrink-0" />
                <span>Tutela dei Tuoi Esercizi Condivisi</span>
              </div>
              <p className="text-[11px] text-blue-800 leading-relaxed">
                In conformità con il regolamento, <strong>tutti gli esercizi che hai condiviso rimarranno comunque salvati nell'archivio esercizi</strong> della community a disposizione di tutti gli allenatori di pallavolo.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                disabled={deleting}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
              >
                Annulla
              </button>
              <button
                type="button"
                onClick={handleDeleteSelfAccount}
                disabled={deleting}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl transition shadow-md shadow-red-600/25"
              >
                {deleting ? 'Eliminazione...' : 'Conferma Eliminazione'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
