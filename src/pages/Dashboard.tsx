import React, { useEffect, useState } from 'react';
import { Esercizio, Allenamento, Squadra } from '../types';
import { fetchExercises, seedDemoExercisesIfEmpty } from '../services/exerciseService';
import { fetchWorkouts, updateWorkoutStatus } from '../services/workoutService';
import { fetchTeams, seedDemoTeamsIfEmpty } from '../services/teamService';
import { seedDemoPlayersIfEmpty } from '../services/playerService';
import { seedDemoEventsIfEmpty } from '../services/eventService';
import { useAuth } from '../context/AuthContext';
import {
  PlusCircle,
  Dumbbell,
  Star,
  Calendar,
  ClipboardList,
  ChevronRight,
  Clock,
  Sparkles,
  Users,
  Printer,
  Edit,
  History,
  CheckCircle2,
  MapPin,
  ArrowRight,
} from 'lucide-react';
import { generaPdfSingoloEsercizio, generaPdfAllenamentoCompleto } from '../utils/pdfGenerator';
import { ActivePage } from '../components/Sidebar';
import { RotatingBanner } from '../components/RotatingBanner';

interface DashboardProps {
  onNavigate: (page: ActivePage, entityId?: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const { currentUser, isAdmin } = useAuth();
  const coachId = currentUser?.uid || 'local_coach';

  const [exercises, setExercises] = useState<Esercizio[]>([]);
  const [workouts, setWorkouts] = useState<Allenamento[]>([]);
  const [teams, setTeams] = useState<Squadra[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [exList, wkList, tmList] = await Promise.all([
        fetchExercises(coachId),
        fetchWorkouts(coachId),
        fetchTeams(coachId),
      ]);
      setExercises(exList);
      setWorkouts(wkList);
      setTeams(tmList);
    } catch (err) {
      console.warn('Errore caricamento dati dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [coachId]);

  const handleSeedDemoData = async () => {
    setSeeding(true);
    try {
      await seedDemoTeamsIfEmpty(coachId);
      await seedDemoExercisesIfEmpty(coachId);
      const updatedTeams = await fetchTeams(coachId);
      await seedDemoPlayersIfEmpty(coachId, updatedTeams);
      await seedDemoEventsIfEmpty(coachId, updatedTeams);
      await loadData();
    } catch (e) {
      console.error(e);
    } finally {
      setSeeding(false);
    }
  };

  // Stats calculation (Requirement 29)
  const totalExercises = exercises.length;
  const activeTeamsCount = teams.filter((t) => !t.archiviata).length;
  const scheduledWorkoutsCount = workouts.filter(
    (w) => w.stato !== 'Completato' && w.stato !== 'Annullato'
  ).length;
  const completedWorkouts = workouts.filter((w) => w.stato === 'Completato');

  // Next workout finder (first workout with date >= today, or latest if none)
  const todayStr = new Date().toISOString().split('T')[0];
  const upcomingWorkouts = workouts
    .filter((w) => w.data >= todayStr && w.stato !== 'Annullato')
    .sort((a, b) => a.data.localeCompare(b.data));
  const nextWorkout = upcomingWorkouts.length > 0 ? upcomingWorkouts[0] : null;

  const latestExercises = exercises.slice(0, 5);

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      
      {/* ROTATING BANNER SLIDER (Spazio Banner a rotazione gestito dall'amministratore) */}
      <RotatingBanner onNavigate={onNavigate} />

      {/* Banner if archive is completely empty */}
      {exercises.length === 0 && !loading && (
        <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white rounded-3xl p-6 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-blue-700/50">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-400 text-slate-950 mb-2">
              <Sparkles size={14} /> BENVENUTO COACH!
            </span>
            <h3 className="text-xl font-black">Inizia a Creare i Tuoi Esercizi</h3>
            <p className="text-sm text-blue-200 mt-1 max-w-xl">
              Disegna subito schemi con la lavagna tattica 9x18m o pianifica le tue prime sedute di allenamento.
            </p>
          </div>
          <button
            onClick={() => onNavigate('new_exercise')}
            className="px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-xl text-sm transition shadow-lg flex-shrink-0 flex items-center gap-2 cursor-pointer"
          >
            <PlusCircle size={16} />
            <span>Crea Primo Esercizio</span>
          </button>
        </div>
      )}

      {/* PROSSIMO ALLENAMENTO IN EVIDENZA (Requirement 29) */}
      {nextWorkout && (
        <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 text-white p-6 rounded-3xl shadow-xl border border-blue-800/40 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-amber-400 text-slate-950 flex items-center gap-1">
                <Clock size={13} /> PROSSIMO ALLENAMENTO
              </span>
              <span className="text-xs font-bold text-blue-200">
                {nextWorkout.data === todayStr ? 'OGGI IN PALESTRA' : nextWorkout.data}
              </span>
            </div>

            <h3
              onClick={() => onNavigate('edit_workout', nextWorkout.id)}
              className="text-xl sm:text-2xl font-black text-white cursor-pointer hover:text-amber-300 transition"
            >
              {nextWorkout.titolo}
            </h3>

            <div className="flex flex-wrap items-center gap-4 text-xs text-blue-200/90 pt-1">
              <span className="font-bold text-white bg-blue-600/40 px-2.5 py-1 rounded-lg">
                Squadra: {nextWorkout.squadra}
              </span>
              <span className="flex items-center gap-1">
                <Clock size={14} className="text-amber-400" />
                {nextWorkout.oraInizio} - {nextWorkout.oraFine}
              </span>
              {nextWorkout.palestra && (
                <span className="flex items-center gap-1">
                  <MapPin size={14} className="text-amber-400" />
                  {nextWorkout.palestra}
                </span>
              )}
              <span className="text-emerald-400 font-semibold">
                {nextWorkout.esercizi?.length || 0} esercizi preparati
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-start md:self-center flex-shrink-0">
            <button
              onClick={() => generaPdfAllenamentoCompleto(nextWorkout)}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5"
            >
              <Printer size={15} />
              <span>Stampa PDF</span>
            </button>

            <button
              onClick={() => onNavigate('edit_workout', nextWorkout.id)}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center gap-1.5"
            >
              <span>Apri Scheda</span>
              <ArrowRight size={15} />
            </button>
          </div>
        </div>
      )}

      {/* AZIONI RAPIDE */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Azioni Rapide
          </h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <button
            onClick={() => onNavigate('new_exercise')}
            className="flex items-center justify-between bg-gradient-to-r from-blue-700 to-blue-600 hover:from-blue-800 hover:to-blue-700 text-white p-5 rounded-2xl shadow-lg shadow-blue-900/10 transition transform hover:-translate-y-0.5 text-left group cursor-pointer"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center text-white group-hover:scale-110 transition">
                <PlusCircle size={26} />
              </div>
              <div>
                <span className="block text-base font-black tracking-tight">NUOVO ESERCIZIO</span>
                <span className="text-[11px] text-blue-100">
                  Lavagna tattica regolamentare
                </span>
              </div>
            </div>
            <ChevronRight className="text-blue-200 group-hover:translate-x-1 transition" />
          </button>

          <button
            onClick={() => onNavigate('new_workout')}
            className="flex items-center justify-between bg-gradient-to-r from-emerald-700 to-emerald-600 hover:from-emerald-800 hover:to-emerald-700 text-white p-5 rounded-2xl shadow-lg shadow-emerald-900/10 transition transform hover:-translate-y-0.5 text-left group cursor-pointer"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center text-white group-hover:scale-110 transition">
                <Dumbbell size={26} />
              </div>
              <div>
                <span className="block text-base font-black tracking-tight">NUOVO ALLENAMENTO</span>
                <span className="text-[11px] text-emerald-100">
                  Pianifica seduta e calcolo tempi
                </span>
              </div>
            </div>
            <ChevronRight className="text-emerald-200 group-hover:translate-x-1 transition" />
          </button>

          <button
            onClick={() => onNavigate('teams')}
            className="flex items-center justify-between bg-gradient-to-r from-purple-700 to-purple-600 hover:from-purple-800 hover:to-purple-700 text-white p-5 rounded-2xl shadow-lg shadow-purple-900/10 transition transform hover:-translate-y-0.5 text-left group cursor-pointer"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center text-white group-hover:scale-110 transition">
                <Users size={26} />
              </div>
              <div>
                <span className="block text-base font-black tracking-tight">LE TUE SQUADRE</span>
                <span className="text-[11px] text-purple-100">
                  Gestione gruppi e atleti
                </span>
              </div>
            </div>
            <ChevronRight className="text-purple-200 group-hover:translate-x-1 transition" />
          </button>
        </div>
      </section>

      {/* RIEPILOGO STATISTICHE (Requirement 29) */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Riepilogo Generale
          </h3>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Squadre Attive */}
          <div
            onClick={() => onNavigate('teams')}
            className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:border-purple-400 cursor-pointer transition flex items-center gap-3.5"
          >
            <div className="p-3 rounded-xl bg-purple-50 text-purple-600">
              <Users size={24} />
            </div>
            <div>
              <span className="block text-2xl font-black text-slate-900">{activeTeamsCount}</span>
              <span className="text-xs font-semibold text-slate-500">Squadre Attive</span>
            </div>
          </div>

          {/* Totale Esercizi */}
          <div
            onClick={() => onNavigate('exercises')}
            className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:border-blue-400 cursor-pointer transition flex items-center gap-3.5"
          >
            <div className="p-3 rounded-xl bg-blue-50 text-blue-600">
              <ClipboardList size={24} />
            </div>
            <div>
              <span className="block text-2xl font-black text-slate-900">{totalExercises}</span>
              <span className="text-xs font-semibold text-slate-500">Totale Esercizi</span>
            </div>
          </div>

          {/* Allenamenti Programmati */}
          <div
            onClick={() => onNavigate('workouts')}
            className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:border-emerald-400 cursor-pointer transition flex items-center gap-3.5"
          >
            <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600">
              <Dumbbell size={24} />
            </div>
            <div>
              <span className="block text-2xl font-black text-slate-900">{scheduledWorkoutsCount}</span>
              <span className="text-xs font-semibold text-slate-500">Programmati</span>
            </div>
          </div>

          {/* Storico Completati */}
          <div
            onClick={() => onNavigate('history')}
            className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:border-amber-400 cursor-pointer transition flex items-center gap-3.5"
          >
            <div className="p-3 rounded-xl bg-amber-50 text-amber-600">
              <History size={24} />
            </div>
            <div>
              <span className="block text-2xl font-black text-slate-900">{completedWorkouts.length}</span>
              <span className="text-xs font-semibold text-slate-500">Completati</span>
            </div>
          </div>
        </div>
      </section>

      {/* FEED: PROSSIMI ALLENAMENTI (Requirement 16) & ULTIMI ESERCIZI */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Prossimi Allenamenti (Requirement 16) */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar size={18} className="text-emerald-600" />
              <h4 className="font-bold text-slate-900 text-sm">Prossimi Allenamenti</h4>
            </div>
            <button
              onClick={() => onNavigate('workouts')}
              className="text-xs font-bold text-emerald-600 hover:text-emerald-800"
            >
              Vedi Tutti
            </button>
          </div>

          <div className="divide-y divide-slate-100 flex-1">
            {upcomingWorkouts.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                Nessun allenamento programmato per i prossimi giorni.
              </div>
            ) : (
              upcomingWorkouts.slice(0, 5).map((wk) => (
                <div
                  key={wk.id}
                  className="p-4 flex items-center justify-between hover:bg-slate-50 transition group"
                >
                  <div
                    onClick={() => onNavigate('edit_workout', wk.id)}
                    className="flex-1 cursor-pointer pr-3"
                  >
                    <span className="block font-bold text-sm text-slate-900 group-hover:text-emerald-600 transition">
                      {wk.titolo}
                    </span>
                    <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                      <span className="font-semibold text-slate-800">{wk.squadra}</span>
                      <span>•</span>
                      <span className="font-bold text-emerald-700">{wk.data}</span>
                      <span>•</span>
                      <span>{wk.oraInizio} - {wk.oraFine}</span>
                      <span>•</span>
                      <span className="text-emerald-600 font-semibold">
                        {wk.esercizi?.length || 0} es.
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => generaPdfAllenamentoCompleto(wk)}
                      title="Stampa PDF"
                      className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                    >
                      <Printer size={16} />
                    </button>
                    <button
                      onClick={() => onNavigate('edit_workout', wk.id)}
                      title="Modifica"
                      className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
                    >
                      <Edit size={16} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Ultimi Esercizi Creati */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ClipboardList size={18} className="text-blue-600" />
              <h4 className="font-bold text-slate-900 text-sm">Ultimi Esercizi Creati</h4>
            </div>
            <button
              onClick={() => onNavigate('exercises')}
              className="text-xs font-bold text-blue-600 hover:text-blue-800"
            >
              Vedi Archivio
            </button>
          </div>

          <div className="divide-y divide-slate-100 flex-1">
            {latestExercises.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                Nessun esercizio creato finora.
              </div>
            ) : (
              latestExercises.map((ex) => (
                <div
                  key={ex.id}
                  className="p-4 flex items-center justify-between hover:bg-slate-50 transition group"
                >
                  <div
                    onClick={() => onNavigate('edit_exercise', ex.id)}
                    className="flex-1 cursor-pointer pr-3"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900 group-hover:text-blue-600 transition">
                        {ex.titolo}
                      </span>
                      {ex.isFavorite && (
                        <Star size={13} className="text-amber-400 fill-amber-400" />
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                      <span className="font-medium text-slate-600">{ex.categoria}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock size={12} /> {ex.durata} min
                      </span>
                      <span>•</span>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          ex.difficolta === 'Base'
                            ? 'bg-emerald-50 text-emerald-700'
                            : ex.difficolta === 'Intermedio'
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-red-50 text-red-700'
                        }`}
                      >
                        {ex.difficolta}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => generaPdfSingoloEsercizio(ex)}
                      title="Stampa PDF"
                      className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                    >
                      <Printer size={16} />
                    </button>
                    <button
                      onClick={() => onNavigate('edit_exercise', ex.id)}
                      title="Modifica"
                      className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
                    >
                      <Edit size={16} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* SEZIONE STORICO: ULTIMI ALLENAMENTI COMPLETATI (Requirement 29) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <History size={18} />
            </div>
            <div>
              <h4 className="font-black text-slate-900 text-sm">
                Storico: Ultimi Allenamenti Svolti e Completati
              </h4>
              <p className="text-[11px] text-slate-500">
                Consulta le sessioni passate archiviate con note tecniche e tempi
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('history')}
            className="text-xs font-bold text-amber-600 hover:text-amber-800 flex items-center gap-1"
          >
            <span>Apri Storico Completo</span>
            <ArrowRight size={13} />
          </button>
        </div>

        <div className="divide-y divide-slate-100">
          {completedWorkouts.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              Nessun allenamento ancora segnato come "Completato". Quando una sessione viene svolta, puoi segnarla come completata da qui o dal calendario.
            </div>
          ) : (
            completedWorkouts.slice(0, 4).map((wk) => (
              <div
                key={wk.id}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 transition group"
              >
                <div
                  onClick={() => onNavigate('edit_workout', wk.id)}
                  className="flex-1 cursor-pointer pr-3"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900 group-hover:text-amber-600 transition">
                      {wk.titolo}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-100 text-emerald-800 flex items-center gap-1">
                      <CheckCircle2 size={11} /> Completato
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
                    <span className="font-semibold text-slate-800">{wk.squadra}</span>
                    <span>•</span>
                    <span className="font-bold text-slate-700">{wk.data}</span>
                    <span>•</span>
                    <span>{wk.oraInizio} - {wk.oraFine}</span>
                    <span>•</span>
                    <span className="text-blue-600 font-semibold">
                      {wk.esercizi?.length || 0} esercizi
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1 self-end sm:self-center">
                  <button
                    onClick={() => generaPdfAllenamentoCompleto(wk)}
                    title="Stampa PDF"
                    className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition"
                  >
                    <Printer size={16} />
                  </button>
                  <button
                    onClick={() => onNavigate('edit_workout', wk.id)}
                    title="Apri Scheda"
                    className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
                  >
                    <Edit size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
};
