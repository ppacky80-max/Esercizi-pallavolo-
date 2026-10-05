import React, { useState, useEffect, useMemo } from 'react';
import { Allenamento, Squadra, CATEGORIE_ESERCIZIO, CategoriaEsercizio } from '../types';
import { fetchWorkouts, deleteWorkout, duplicateWorkout, updateWorkoutStatus } from '../services/workoutService';
import { fetchTeams } from '../services/teamService';
import { fetchSeasons } from '../services/seasonService';
import { useAuth } from '../context/AuthContext';
import { ConfirmModal } from '../components/ConfirmModal';
import {
  History,
  Search,
  Filter,
  Calendar,
  Clock,
  Dumbbell,
  Users,
  Copy,
  Printer,
  Edit,
  Trash2,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Eye,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { ActivePage } from '../components/Sidebar';
import { generaPdfAllenamentoCompleto } from '../utils/pdfGenerator';

interface WorkoutsHistoryViewProps {
  onNavigate: (page: ActivePage, entityId?: string) => void;
}

export const WorkoutsHistoryView: React.FC<WorkoutsHistoryViewProps> = ({ onNavigate }) => {
  const { currentUser } = useAuth();
  const coachId = currentUser?.uid || 'local_coach';

  const [workouts, setWorkouts] = useState<Allenamento[]>([]);
  const [teams, setTeams] = useState<Squadra[]>([]);
  const [seasons, setSeasons] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters (Requirements 18 & 20)
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTeam, setSelectedTeam] = useState('all');
  const [selectedSeason, setSelectedSeason] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedExerciseCategory, setSelectedExerciseCategory] = useState<string>('all');

  // Modals
  const [deleteTarget, setDeleteTarget] = useState<Allenamento | null>(null);
  const [duplicateTarget, setDuplicateTarget] = useState<Allenamento | null>(null);
  const [dupTitle, setDupTitle] = useState('');
  const [dupDate, setDupDate] = useState(new Date().toISOString().split('T')[0]);
  const [dupOraInizio, setDupOraInizio] = useState('18:30');
  const [dupOraFine, setDupOraFine] = useState('20:30');
  const [dupObiettivo, setDupObiettivo] = useState('');
  const [dupTeamId, setDupTeamId] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [wList, tList, sList] = await Promise.all([
        fetchWorkouts(coachId),
        fetchTeams(coachId, true),
        fetchSeasons(coachId),
      ]);
      setWorkouts(wList);
      setTeams(tList);
      setSeasons(sList.map((s) => s.nome));
    } catch (e) {
      console.warn('Errore caricamento storico:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [coachId]);

  // Reset filters
  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedTeam('all');
    setSelectedSeason('all');
    setDateFrom('');
    setDateTo('');
    setSelectedExerciseCategory('all');
  };

  // Filtered workouts (Requirements 17, 18, 20)
  const filteredWorkouts = useMemo(() => {
    return workouts
      .filter((w) => {
        // Text Search in Titolo, Obiettivo, Note
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = (w.titolo || '').toLowerCase().includes(q);
          const matchObj = (w.obiettivo || '').toLowerCase().includes(q);
          const matchNotes = (w.note || '').toLowerCase().includes(q);
          if (!matchTitle && !matchObj && !matchNotes) return false;
        }

        // Team filter
        if (selectedTeam !== 'all') {
          if (w.teamId !== selectedTeam && w.squadra !== selectedTeam) return false;
        }

        // Season filter
        if (selectedSeason !== 'all') {
          if (w.stagione && w.stagione !== selectedSeason) return false;
        }

        // Date From
        if (dateFrom && w.data < dateFrom) return false;

        // Date To
        if (dateTo && w.data > dateTo) return false;

        // Exercise Category filter
        if (selectedExerciseCategory !== 'all') {
          const hasCat = (w.esercizi || []).some(
            (ex) => ex.categoria === selectedExerciseCategory
          );
          if (!hasCat) return false;
        }

        return true;
      })
      .sort((a, b) => b.data.localeCompare(a.data)); // Most recent to oldest (Requirement 17)
  }, [
    workouts,
    searchQuery,
    selectedTeam,
    selectedSeason,
    dateFrom,
    dateTo,
    selectedExerciseCategory,
  ]);

  // Open duplicate modal (Requirement 19)
  const openDuplicateModal = (w: Allenamento) => {
    setDuplicateTarget(w);
    setDupTitle(`${w.titolo} (Copia Storico)`);
    setDupDate(new Date().toISOString().split('T')[0]);
    setDupOraInizio(w.oraInizio || '18:30');
    setDupOraFine(w.oraFine || '20:30');
    setDupObiettivo(w.obiettivo || '');
    setDupTeamId(w.teamId || '');
  };

  const handleDuplicateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!duplicateTarget) return;

    const selTeam = teams.find((t) => t.id === dupTeamId);
    const newId = await duplicateWorkout(duplicateTarget, {
      titolo: dupTitle.trim(),
      data: dupDate,
      oraInizio: dupOraInizio,
      oraFine: dupOraFine,
      obiettivo: dupObiettivo.trim(),
      teamId: dupTeamId || undefined,
      squadra: selTeam ? selTeam.nome : duplicateTarget.squadra,
      stagione: selTeam?.stagione || duplicateTarget.stagione,
      palestra: selTeam?.palestra || duplicateTarget.palestra,
    });

    setDuplicateTarget(null);
    onNavigate('edit_workout', newId);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    await deleteWorkout(deleteTarget.id);
    setDeleteTarget(null);
    await loadData();
  };

  const handleToggleStatus = async (w: Allenamento) => {
    const nextStatus = w.stato === 'Completato' ? 'Programmato' : 'Completato';
    await updateWorkoutStatus(w.id, nextStatus, coachId);
    await loadData();
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 animate-in fade-in">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <History className="text-blue-600" size={26} />
            <span>Storico Allenamenti</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Archivio cronologico dal più recente al più vecchio con filtri avanzati e duplicazione sedute
          </p>
        </div>

        <button
          onClick={() => onNavigate('new_workout')}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Dumbbell size={16} />
          <span>Nuovo Allenamento</span>
        </button>
      </div>

      {/* FILTRI AVANZATI (Requirement 18 & 20) */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <span className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <Filter size={15} className="text-blue-600" />
            <span>Filtri di Ricerca</span>
          </span>

          <button
            onClick={handleResetFilters}
            className="text-xs text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 transition"
          >
            <RotateCcw size={13} />
            <span>AZZERA FILTRI</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {/* Testo di ricerca */}
          <div className="relative">
            <Search className="absolute left-3.5 top-3 text-slate-400" size={16} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cerca in titolo, obiettivo, note..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
            />
          </div>

          {/* Squadra */}
          <select
            value={selectedTeam}
            onChange={(e) => setSelectedTeam(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none"
          >
            <option value="all">Tutte le Squadre</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.nome} ({t.categoria})
              </option>
            ))}
          </select>

          {/* Stagione */}
          <select
            value={selectedSeason}
            onChange={(e) => setSelectedSeason(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none"
          >
            <option value="all">Tutte le Stagioni</option>
            {seasons.map((s) => (
              <option key={s} value={s}>
                Stagione {s}
              </option>
            ))}
          </select>

          {/* Data Da */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-400 w-14">Data Da:</span>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none text-slate-700"
            />
          </div>

          {/* Data A */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-400 w-14">Data A:</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none text-slate-700"
            />
          </div>

          {/* Categoria Esercizio contenuta */}
          <select
            value={selectedExerciseCategory}
            onChange={(e) => setSelectedExerciseCategory(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none"
          >
            <option value="all">Qualsiasi Categoria di Esercizio</option>
            {CATEGORIE_ESERCIZIO.map((c) => (
              <option key={c} value={c}>
                Con esercizio di: {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* RISULTATI (Requirement 17) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-500 font-semibold px-1">
          <span>Trovati {filteredWorkouts.length} allenamenti nello storico</span>
          <span>Ordinamento: dal più recente al più vecchio</span>
        </div>

        {filteredWorkouts.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm space-y-3">
            <History size={40} className="mx-auto text-slate-300" />
            <h3 className="text-base font-bold text-slate-800">
              Nessun allenamento corrisponde ai filtri selezionati
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Prova a reimpostare i filtri per vedere tutti gli allenamenti passati registrati.
            </p>
            <button
              onClick={handleResetFilters}
              className="px-4 py-2 bg-blue-600 text-white font-bold text-xs rounded-xl shadow-md transition"
            >
              Azzera Filtri
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredWorkouts.map((wk) => {
              const totalDuration = (wk.esercizi || []).reduce(
                (acc, ex) => acc + (ex.durata || 0),
                0
              );
              const exerciseCount = wk.esercizi?.length || 0;

              return (
                <div
                  key={wk.id}
                  className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm hover:border-blue-400 transition group flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  {/* Left Column: Info */}
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-xs text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded-lg flex items-center gap-1.5">
                        <Calendar size={13} className="text-blue-600" />
                        {wk.data}
                      </span>

                      <span className="font-black text-xs text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-lg">
                        {wk.squadra || 'Squadra non assegnata'}
                      </span>

                      <span
                        className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                          wk.stato === 'Completato'
                            ? 'bg-emerald-100 text-emerald-800'
                            : wk.stato === 'Annullato'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {wk.stato || 'Programmato'}
                      </span>

                      {wk.stagione && (
                        <span className="text-[11px] text-slate-400 font-semibold">
                          ({wk.stagione})
                        </span>
                      )}
                    </div>

                    <h3
                      onClick={() => onNavigate('edit_workout', wk.id)}
                      className="font-black text-base text-slate-900 group-hover:text-blue-600 cursor-pointer transition line-clamp-1"
                    >
                      {wk.titolo}
                    </h3>

                    {wk.obiettivo && (
                      <p className="text-xs text-slate-500 line-clamp-1">
                        <strong>Obiettivo:</strong> {wk.obiettivo}
                      </p>
                    )}

                    {/* Stats Pill */}
                    <div className="flex items-center gap-4 text-xs text-slate-600 pt-1">
                      <span className="flex items-center gap-1 font-semibold">
                        <Clock size={13} className="text-amber-500" />
                        Durata Esercizi: <strong>{totalDuration} min</strong>
                      </span>
                      <span>•</span>
                      <span className="font-semibold text-blue-600">
                        {exerciseCount} {exerciseCount === 1 ? 'esercizio' : 'esercizi'}
                      </span>
                      {wk.palestra && (
                        <>
                          <span>•</span>
                          <span className="text-slate-400 truncate max-w-xs">{wk.palestra}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Actions */}
                  <div className="flex flex-wrap items-center gap-2 self-start md:self-center border-t md:border-t-0 pt-3 md:pt-0 border-slate-100 flex-shrink-0">
                    <button
                      onClick={() => handleToggleStatus(wk)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
                        wk.stato === 'Completato'
                          ? 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                          : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700'
                      }`}
                    >
                      <CheckCircle2 size={14} />
                      <span>{wk.stato === 'Completato' ? 'Riapri' : 'Completato'}</span>
                    </button>

                    <button
                      onClick={() => openDuplicateModal(wk)}
                      className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-bold transition flex items-center gap-1"
                      title="Duplica questo allenamento per una nuova data o squadra"
                    >
                      <Copy size={14} />
                      <span>DUPLICA</span>
                    </button>

                    <button
                      onClick={() => generaPdfAllenamentoCompleto(wk)}
                      title="Stampa Scheda PDF"
                      className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition"
                    >
                      <Printer size={16} />
                    </button>

                    <button
                      onClick={() => onNavigate('edit_workout', wk.id)}
                      title="Modifica allenamento"
                      className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition"
                    >
                      <Edit size={16} />
                    </button>

                    <button
                      onClick={() => setDeleteTarget(wk)}
                      title="Elimina allenamento"
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODALE DUPLICA DA STORICO (Requirement 19) */}
      {duplicateTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 sm:p-8 border border-slate-200">
            <h3 className="text-base font-black text-slate-900 mb-2">
              Duplica Allenamento da Storico
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Crea una nuova sessione riutilizzando gli esercizi congelati, con possibilità di impostare nuova data e squadra.
            </p>

            <form onSubmit={handleDuplicateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Nuovo Titolo Allenamento
                </label>
                <input
                  type="text"
                  required
                  value={dupTitle}
                  onChange={(e) => setDupTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-600 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Nuova Data
                  </label>
                  <input
                    type="date"
                    required
                    value={dupDate}
                    onChange={(e) => setDupDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Squadra Destinataria
                  </label>
                  <select
                    value={dupTeamId}
                    onChange={(e) => setDupTeamId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none"
                  >
                    <option value="">Mantieni {duplicateTarget.squadra}</option>
                    {teams.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.nome} ({t.categoria})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Ora Inizio
                  </label>
                  <input
                    type="time"
                    required
                    value={dupOraInizio}
                    onChange={(e) => setDupOraInizio(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Ora Fine
                  </label>
                  <input
                    type="time"
                    required
                    value={dupOraFine}
                    onChange={(e) => setDupOraFine(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Obiettivo Principale Seduta
                </label>
                <input
                  type="text"
                  value={dupObiettivo}
                  onChange={(e) => setDupObiettivo(e.target.value)}
                  placeholder="Es. Cambio palla con ricezione a 3..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none"
                />
              </div>

              <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl text-xs text-blue-900">
                <span>Verranno duplicati <strong>{duplicateTarget.esercizi?.length || 0} esercizi</strong> con la lavagna tattica impostata.</span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setDuplicateTarget(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 rounded-xl"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md"
                >
                  Duplica e Apri
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE MODAL */}
      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        title="Elimina Allenamento"
        message={`Sei sicuro di voler eliminare definitivamente "${deleteTarget?.titolo}"? L'azione non può essere annullata.`}
        confirmText="Elimina Allenamento"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />

    </div>
  );
};
