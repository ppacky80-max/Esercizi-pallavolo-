import React, { useEffect, useState, useMemo } from 'react';
import { Allenamento, Squadra } from '../types';
import {
  fetchWorkouts,
  deleteWorkout,
  duplicateWorkout,
} from '../services/workoutService';
import { fetchTeams } from '../services/teamService';
import { useAuth } from '../context/AuthContext';
import { generaPdfAllenamentoCompleto } from '../utils/pdfGenerator';
import { ConfirmModal } from '../components/ConfirmModal';
import {
  Search,
  PlusCircle,
  Dumbbell,
  Calendar,
  Clock,
  Printer,
  Edit,
  Copy,
  Trash2,
  Users,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

interface WorkoutsListProps {
  onNavigate: (page: any, entityId?: string) => void;
}

export const WorkoutsList: React.FC<WorkoutsListProps> = ({ onNavigate }) => {
  const { currentUser } = useAuth();
  const coachId = currentUser?.uid || 'local_coach';

  const [workouts, setWorkouts] = useState<Allenamento[]>([]);
  const [teams, setTeams] = useState<Squadra[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedTeam, setSelectedTeam] = useState('');
  const [dateFilter, setDateFilter] = useState<'all' | 'upcoming' | 'past'>('all');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  // Delete modal
  const [deleteTarget, setDeleteTarget] = useState<Allenamento | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [wks, tms] = await Promise.all([
        fetchWorkouts(coachId),
        fetchTeams(coachId),
      ]);
      setWorkouts(wks);
      setTeams(tms);
    } catch (err) {
      console.warn('Errore recupero allenamenti:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [coachId]);

  const handleDuplicate = async (e: React.MouseEvent, wk: Allenamento) => {
    e.stopPropagation();
    try {
      await duplicateWorkout(wk);
      await loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteWorkout(deleteTarget.id);
      setWorkouts((prev) => prev.filter((w) => w.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      console.error(err);
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];

  const filteredWorkouts = useMemo(() => {
    return workouts
      .filter((w) => {
        // Search
        if (search.trim()) {
          const q = search.toLowerCase();
          const matchesTitle = w.titolo.toLowerCase().includes(q);
          const matchesTeam = w.squadra.toLowerCase().includes(q);
          const matchesObj = w.obiettivo?.toLowerCase().includes(q);
          if (!matchesTitle && !matchesTeam && !matchesObj) return false;
        }

        // Team filter
        if (selectedTeam && w.squadra !== selectedTeam) return false;

        // Date filter
        if (dateFilter === 'upcoming' && w.data < todayStr) return false;
        if (dateFilter === 'past' && w.data >= todayStr) return false;

        return true;
      })
      .sort((a, b) => {
        if (sortOrder === 'asc') return a.data.localeCompare(b.data);
        return b.data.localeCompare(a.data);
      });
  }, [workouts, search, selectedTeam, dateFilter, sortOrder, todayStr]);

  return (
    <div className="space-y-6">
      {/* Top Search & Filter Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Cerca allenamento per titolo, squadra o obiettivo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition"
            />
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => onNavigate('history')}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition border border-slate-200"
            >
              <span>Vedi Storico</span>
            </button>
            <button
              onClick={() => onNavigate('new_workout')}
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-md shadow-emerald-600/20"
            >
              <PlusCircle size={16} />
              <span>Nuovo Allenamento</span>
            </button>
          </div>
        </div>

        {/* Filter Selects */}
        <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-2.5 items-center">
          {/* Squadra */}
          <select
            value={selectedTeam}
            onChange={(e) => setSelectedTeam(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="">Tutte le squadre</option>
            {teams.map((t) => (
              <option key={t.id} value={t.nome}>
                {t.nome}
              </option>
            ))}
          </select>

          {/* Filtro Data */}
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value as any)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">Tutte le date</option>
            <option value="upcoming">Solo prossimi allenamenti</option>
            <option value="past">Solo allenamenti passati</option>
          </select>

          {/* Ordinamento */}
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as any)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="desc">Data decrescente (più recenti prima)</option>
            <option value="asc">Data crescente</option>
          </select>

          {(search || selectedTeam || dateFilter !== 'all') && (
            <button
              onClick={() => {
                setSearch('');
                setSelectedTeam('');
                setDateFilter('all');
              }}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-red-600 hover:bg-red-50 border border-red-200 ml-auto"
            >
              <RotateCcw size={13} />
              <span>Azzera</span>
            </button>
          )}
        </div>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between text-xs font-bold text-slate-500 px-1">
        <span>
          Trovati {filteredWorkouts.length} allenamenti{' '}
          {workouts.length > 0 && `su un totale di ${workouts.length}`}
        </span>
      </div>

      {/* List Content */}
      {loading ? (
        <div className="py-20 text-center font-bold text-slate-400">
          Caricamento archivio allenamenti...
        </div>
      ) : filteredWorkouts.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center">
          <Dumbbell size={40} className="mx-auto text-slate-300 mb-3" />
          <h4 className="text-base font-bold text-slate-800">
            Nessun allenamento trovato
          </h4>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Non ci sono allenamenti corrispondenti ai filtri oppure non ne hai ancora pianificato alcuno.
          </p>
          <button
            onClick={() => onNavigate('new_workout')}
            className="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition"
          >
            Pianifica Nuovo Allenamento
          </button>
        </div>
      ) : (
        <div className="space-y-3.5">
          {filteredWorkouts.map((wk) => {
            const isUpcoming = wk.data >= todayStr;
            const totalMin = wk.esercizi.reduce(
              (sum, ex) => sum + (Number(ex.durata) || 0),
              0
            );

            return (
              <div
                key={wk.id}
                onClick={() => onNavigate('edit_workout', wk.id)}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md hover:border-emerald-400 p-5 transition cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 group"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200/60">
                      {wk.squadra || 'Squadra non assegnata'}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                        wk.stato === 'Completato'
                          ? 'bg-emerald-100 text-emerald-800'
                          : wk.stato === 'Annullato'
                          ? 'bg-red-100 text-red-800'
                          : isUpcoming
                          ? 'bg-blue-50 text-blue-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {wk.stato || (isUpcoming ? 'Programmato' : 'Concluso')}
                    </span>
                  </div>

                  <h3 className="font-black text-slate-900 text-lg group-hover:text-emerald-700 transition">
                    {wk.titolo}
                  </h3>

                  {wk.obiettivo && (
                    <p className="text-xs text-slate-500 line-clamp-1">
                      <strong>Obiettivo:</strong> {wk.obiettivo}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
                    <span className="flex items-center gap-1 font-semibold text-slate-700">
                      <Calendar size={14} className="text-slate-400" />
                      {wk.data}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={14} className="text-slate-400" />
                      {wk.oraInizio} - {wk.oraFine}
                    </span>
                    <span className="font-bold text-emerald-600">
                      {wk.esercizi.length} esercizi ({totalMin} min)
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 self-end md:self-center border-t md:border-t-0 pt-3 md:pt-0">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      generaPdfAllenamentoCompleto(wk);
                    }}
                    title="Stampa Scheda PDF"
                    className="p-2.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition"
                  >
                    <Printer size={18} />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleDuplicate(e, wk)}
                    title="Duplica Allenamento"
                    className="p-2.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition"
                  >
                    <Copy size={18} />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onNavigate('edit_workout', wk.id);
                    }}
                    title="Modifica"
                    className="p-2.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition"
                  >
                    <Edit size={18} />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteTarget(wk);
                    }}
                    title="Elimina"
                    className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        title="Elimina Allenamento"
        message={`Sei sicuro di voler eliminare la seduta di allenamento "${deleteTarget?.titolo}" del ${deleteTarget?.data}?`}
        confirmLabel="Elimina definitivamente"
        cancelLabel="Annulla"
        isDestructive={true}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};
