import React, { useState, useEffect, useMemo } from 'react';
import {
  Allenamento,
  Esercizio,
  EsercizioInAllenamento,
  Squadra,
  CATEGORIE_ESERCIZIO,
  SchemaTattico,
} from '../types';
import { fetchWorkoutById, saveWorkout } from '../services/workoutService';
import { fetchExercises, saveExercise } from '../services/exerciseService';
import { fetchTeams, saveTeam } from '../services/teamService';
import { fetchTacticalSchemes } from '../services/tacticalSchemeService';
import { useAuth } from '../context/AuthContext';
import {
  Save,
  ArrowLeft,
  Plus,
  Clock,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Trash2,
  Copy,
  ChevronUp,
  ChevronDown,
  Search,
  Filter,
  X,
  Layers,
  Sparkles,
  Calendar,
  Users,
  FileText,
  Eye,
} from 'lucide-react';
import { ExerciseDetailModal } from '../components/ExerciseDetailModal';

interface WorkoutEditorProps {
  workoutId?: string; // if present, edit mode
  onNavigate: (page: any, entityId?: string) => void;
}

const COMMON_BLOCKS = [
  'Riscaldamento',
  'Tecnica Analitica',
  'Fase Cambio Palla',
  'Fase Break Point',
  'Battuta e Ricezione',
  'Muro e Difesa',
  'Attacco',
  'Gioco Globale / 6v6',
  'Defaticamento',
];

export const WorkoutEditor: React.FC<WorkoutEditorProps> = ({
  workoutId,
  onNavigate,
}) => {
  const { currentUser } = useAuth();
  const coachId = currentUser?.uid || 'local_coach';

  // Form states
  const [titolo, setTitolo] = useState('');
  const [squadra, setSquadra] = useState('');
  const [teamId, setTeamId] = useState('');
  const [stagione, setStagione] = useState('');
  const [palestra, setPalestra] = useState('');
  const [stato, setStato] = useState<'Programmato' | 'Completato' | 'Annullato'>('Programmato');
  const [notePost, setNotePost] = useState({
    comeAndato: '',
    cosaHaFunzionato: '',
    cosaMigliorare: '',
    cosaRiprendere: '',
  });
  const [data, setData] = useState(new Date().toISOString().split('T')[0]);
  const [oraInizio, setOraInizio] = useState('18:30');
  const [oraFine, setOraFine] = useState('20:30');
  const [obiettivo, setObiettivo] = useState('');
  const [note, setNote] = useState('');
  const [selectedExercises, setSelectedExercises] = useState<EsercizioInAllenamento[]>([]);

  // Database resources
  const [availableExercises, setAvailableExercises] = useState<Esercizio[]>([]);
  const [teams, setTeams] = useState<Squadra[]>([]);
  const [loading, setLoading] = useState(Boolean(workoutId));
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Modals
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);
  const [archiveSearch, setArchiveSearch] = useState('');
  const [archiveCategory, setArchiveCategory] = useState('');
  const [isSchemeModalOpen, setIsSchemeModalOpen] = useState(false);
  const [schemeSearch, setSchemeSearch] = useState('');
  const [schemeCategory, setSchemeCategory] = useState('');
  const [availableSchemes, setAvailableSchemes] = useState<SchemaTattico[]>([]);
  const [previewingExercise, setPreviewingExercise] = useState<Esercizio | null>(null);
  const [toastMessage, setToastMessage] = useState<{
    id: number;
    text: string;
    ex: Esercizio;
  } | null>(null);

  // Quick Inline Create Exercise modal
  const [isQuickCreateOpen, setIsQuickCreateOpen] = useState(false);
  const [quickTitle, setQuickTitle] = useState('');
  const [quickCategory, setQuickCategory] = useState(CATEGORIE_ESERCIZIO[0]);
  const [quickDuration, setQuickDuration] = useState(15);
  const [quickDiff, setQuickDiff] = useState<'Base' | 'Intermedio' | 'Avanzato'>('Base');
  const [quickDesc, setQuickDesc] = useState('');

  // Quick Create Team inline modal
  const [isQuickTeamOpen, setIsQuickTeamOpen] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamCat, setNewTeamCat] = useState('U16');

  // Load existing workout or initial resources
  useEffect(() => {
    const loadResources = async () => {
      try {
        const [exList, teamList, scList] = await Promise.all([
          fetchExercises(coachId),
          fetchTeams(coachId),
          fetchTacticalSchemes(coachId),
        ]);
        setAvailableExercises(exList);
        setTeams(teamList);
        setAvailableSchemes(scList);

        if (workoutId) {
          const wk = await fetchWorkoutById(workoutId);
          if (wk) {
            setTitolo(wk.titolo);
            setSquadra(wk.squadra || 'Squadra non assegnata');
            setTeamId(wk.teamId || '');
            setStagione(wk.stagione || '');
            setPalestra(wk.palestra || '');
            setStato(wk.stato || 'Programmato');
            if (wk.notePost) {
              setNotePost({
                comeAndato: wk.notePost.comeAndato || '',
                cosaHaFunzionato: wk.notePost.cosaHaFunzionato || '',
                cosaMigliorare: wk.notePost.cosaMigliorare || '',
                cosaRiprendere: wk.notePost.cosaRiprendere || '',
              });
            }
            setData(wk.data);
            setOraInizio(wk.oraInizio);
            setOraFine(wk.oraFine);
            setObiettivo(wk.obiettivo || '');
            setNote(wk.note || '');
            setSelectedExercises(wk.esercizi || []);
          }
        } else if (teamList.length > 0 && !squadra) {
          const firstTeam = teamList[0];
          setSquadra(firstTeam.nome);
          setTeamId(firstTeam.id);
          setStagione(firstTeam.stagione || '');
          setPalestra(firstTeam.palestra || '');
          if (firstTeam.oraInizio) setOraInizio(firstTeam.oraInizio);
          if (firstTeam.oraFine) setOraFine(firstTeam.oraFine);
        }
      } catch (e) {
        console.warn('Errore inizializzazione allenamento:', e);
      } finally {
        setLoading(false);
      }
    };

    loadResources();
  }, [coachId, workoutId]);

  // Duration calculations (Section 19)
  const availableMinutes = useMemo(() => {
    try {
      const [sh, sm] = oraInizio.split(':').map(Number);
      const [eh, em] = oraFine.split(':').map(Number);
      const total = eh * 60 + em - (sh * 60 + sm);
      return total > 0 ? total : 0;
    } catch {
      return 120;
    }
  }, [oraInizio, oraFine]);

  const programmedMinutes = useMemo(() => {
    return selectedExercises.reduce(
      (sum, ex) => sum + (Number(ex.durata) || 0),
      0
    );
  }, [selectedExercises]);

  const remainingMinutes = availableMinutes - programmedMinutes;

  // Add exercise from archive modal (Snapshot created!)
  const handleAddFromArchive = (ex: Esercizio) => {
    const snapshot: EsercizioInAllenamento = {
      ...ex,
      originalExerciseId: ex.id,
      ordine: selectedExercises.length,
      blocco: 'Tecnica',
    };
    setSelectedExercises((prev) => [...prev, snapshot]);
    setToastMessage({
      id: Date.now(),
      text: `Esercizio "${ex.titolo}" caricato nella scheda!`,
      ex,
    });
    setTimeout(() => {
      setToastMessage((cur) => (cur && Date.now() - cur.id >= 3500 ? null : cur));
    }, 4000);
  };

  // Quick inline exercise creation
  const handleSaveQuickExercise = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim()) return;

    try {
      const newExId = await saveExercise({
        coachId,
        titolo: quickTitle.trim(),
        categoria: quickCategory,
        durata: Number(quickDuration) || 15,
        difficolta: quickDiff,
        obiettivo: '',
        minPlayers: 4,
        maxPlayers: 12,
        materiale: '',
        descrizione: quickDesc.trim(),
        note: '',
        isFavorite: false,
      });

      const newEx: Esercizio = {
        id: newExId,
        coachId,
        titolo: quickTitle.trim(),
        categoria: quickCategory,
        durata: Number(quickDuration) || 15,
        difficolta: quickDiff,
        obiettivo: '',
        minPlayers: 4,
        maxPlayers: 12,
        materiale: '',
        descrizione: quickDesc.trim(),
        note: '',
        isFavorite: false,
        createdAt: new Date().toISOString(),
      };

      setAvailableExercises((prev) => [newEx, ...prev]);

      // Add directly to workout!
      handleAddFromArchive(newEx);

      setIsQuickCreateOpen(false);
      setQuickTitle('');
      setQuickDesc('');
    } catch (err) {
      console.error(err);
    }
  };

  // Quick inline team creation
  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName.trim()) return;

    try {
      const tId = await saveTeam({
        coachId,
        nome: newTeamName.trim(),
        categoria: newTeamCat,
        stagione: '2026/2027',
        note: '',
      });

      const created: Squadra = {
        id: tId,
        coachId,
        nome: newTeamName.trim(),
        categoria: newTeamCat,
        stagione: '2026/2027',
        note: '',
        createdAt: new Date().toISOString(),
      };

      setTeams((prev) => [...prev, created]);
      setSquadra(created.nome);
      setTeamId(created.id);
      setIsQuickTeamOpen(false);
      setNewTeamName('');
    } catch (err) {
      console.error(err);
    }
  };

  // Reordering exercises (move up / down)
  const moveExercise = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === selectedExercises.length - 1)
    ) {
      return;
    }
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const reordered = [...selectedExercises];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(targetIndex, 0, moved);
    setSelectedExercises(
      reordered.map((item, idx) => ({ ...item, ordine: idx }))
    );
  };

  // Duplicate exercise inside workout
  const duplicateExerciseInWorkout = (index: number) => {
    const item = selectedExercises[index];
    const duplicated: EsercizioInAllenamento = {
      ...item,
      titolo: `${item.titolo} (Bis)`,
      ordine: index + 1,
    };
    const updated = [...selectedExercises];
    updated.splice(index + 1, 0, duplicated);
    setSelectedExercises(updated.map((it, idx) => ({ ...it, ordine: idx })));
  };

  // Remove exercise from workout
  const removeExercise = (index: number) => {
    setSelectedExercises((prev) =>
      prev.filter((_, i) => i !== index).map((it, idx) => ({ ...it, ordine: idx }))
    );
  };

  // Update specific exercise duration or block
  const updateExerciseField = (
    index: number,
    field: 'durata' | 'blocco' | 'noteSpecifiche',
    value: any
  ) => {
    setSelectedExercises((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  // Add tactical scheme directly to workout sequence (Point 29)
  const handleAddTacticalSchemeToWorkout = (sc: SchemaTattico) => {
    const newItem: EsercizioInAllenamento = {
      id: `scheme_wk_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      originalExerciseId: sc.id,
      coachId,
      titolo: `[SCHEMA TATTICO] ${sc.titolo}`,
      categoria: (sc.categoria as any) || 'Ricezione',
      durata: 15,
      difficolta: 'Intermedio',
      obiettivo: `Fase tattica: ${sc.categoria} - Sistema ${sc.sistemaDiGioco} (Rotazione R${sc.rotazione || 1})`,
      minPlayers: 6,
      maxPlayers: 14,
      materiale: 'Palloni, campo regolamentare con rete',
      descrizione: sc.descrizione || `Schema tattico ${sc.sistemaDiGioco} in rotazione ${sc.rotazione || 1}`,
      note: `Sistema: ${sc.sistemaDiGioco} | Rotazione: R${sc.rotazione || 1}`,
      boardData: sc.boardData,
      boardPreviewUrl: sc.previewUrl,
      schemaTatticoId: sc.id,
      isFavorite: false,
      ordine: selectedExercises.length,
      createdAt: new Date().toISOString(),
    };
    setSelectedExercises((prev) => [...prev, newItem]);
    setIsSchemeModalOpen(false);
  };

  // Submit Workout Save
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!titolo.trim()) {
      setStatusMessage({
        type: 'error',
        text: 'Inserisci un titolo per la seduta di allenamento.',
      });
      return;
    }

    if (!squadra.trim()) {
      setStatusMessage({
        type: 'error',
        text: 'Seleziona o specifica una squadra per questo allenamento.',
      });
      return;
    }

    setSaving(true);
    setStatusMessage(null);

    try {
      await saveWorkout(
        {
          coachId,
          titolo: titolo.trim(),
          squadra: squadra.trim(),
          teamId: teamId || undefined,
          stagione: stagione || undefined,
          palestra: palestra.trim() || undefined,
          data,
          oraInizio,
          oraFine,
          stato,
          notePost: (notePost.comeAndato || notePost.cosaHaFunzionato || notePost.cosaMigliorare || notePost.cosaRiprendere) ? notePost : undefined,
          obiettivo: obiettivo.trim(),
          note: note.trim(),
          esercizi: selectedExercises, // FULL SNAPSHOT!
        },
        workoutId
      );

      setStatusMessage({
        type: 'success',
        text: 'Allenamento salvato con successo! Ritorno all’archivio...',
      });

      setTimeout(() => {
        onNavigate('workouts');
      }, 1000);
    } catch (err) {
      console.error(err);
      setStatusMessage({
        type: 'error',
        text: 'Si è verificato un errore durante il salvataggio.',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center font-bold text-slate-500">
        Caricamento dati allenamento...
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-6xl mx-auto pb-20">
      {/* Top Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => onNavigate('workouts')}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 text-sm font-semibold transition"
        >
          <ArrowLeft size={18} />
          <span>Torna agli Allenamenti</span>
        </button>

        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 px-7 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl shadow-lg shadow-emerald-600/30 transition disabled:opacity-50"
        >
          <Save size={18} />
          <span>{saving ? 'Salvataggio...' : 'SALVA ALLENAMENTO'}</span>
        </button>
      </div>

      {/* Status banner */}
      {statusMessage && (
        <div
          className={`p-4 rounded-2xl flex items-center gap-3 text-sm font-semibold border ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-red-50 text-red-800 border-red-200'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 size={20} className="text-emerald-600 flex-shrink-0" />
          ) : (
            <AlertCircle size={20} className="text-red-600 flex-shrink-0" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* COLONNA SINISTRA: DETTAGLI SEDUTA & CONTATORE TEMPO */}
        <div className="lg:col-span-1 space-y-6">
          {/* Box Dettagli */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
            <h3 className="text-base font-black text-slate-900 border-b border-slate-100 pb-2">
              Dettagli Sessione
            </h3>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Titolo Allenamento *
              </label>
              <input
                type="text"
                required
                value={titolo}
                onChange={(e) => setTitolo(e.target.value)}
                placeholder="es. Transizione Difesa e Palleggio Rapido"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
              />
            </div>

            {/* Squadra */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Squadra *
                </label>
                <button
                  type="button"
                  onClick={() => setIsQuickTeamOpen(true)}
                  className="text-[11px] text-emerald-600 hover:text-emerald-800 font-bold"
                >
                  + Nuova Squadra
                </button>
              </div>

              {teams.length > 0 ? (
                <select
                  required
                  value={teamId || squadra}
                  onChange={(e) => {
                    const sel = teams.find((t) => t.id === e.target.value || t.nome === e.target.value);
                    if (sel) {
                      setTeamId(sel.id);
                      setSquadra(sel.nome);
                      setStagione(sel.stagione || '');
                      if (sel.palestra) setPalestra(sel.palestra);
                      if (!workoutId) {
                        if (sel.oraInizio) setOraInizio(sel.oraInizio);
                        if (sel.oraFine) setOraFine(sel.oraFine);
                      }
                    } else {
                      setTeamId('');
                      setSquadra(e.target.value);
                    }
                  }}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                >
                  <option value="">-- Seleziona Squadra --</option>
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.nome} ({t.categoria} - {t.stagione})
                    </option>
                  ))}
                  <option value="custom">Altra Squadra / Non in elenco</option>
                </select>
              ) : (
                <input
                  type="text"
                  required
                  value={squadra}
                  onChange={(e) => setSquadra(e.target.value)}
                  placeholder="es. Under 16 Femminile"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                />
              )}

              {/* Badges Squadra Selezionata (Requirement 11) */}
              {(() => {
                const curTeam = teams.find((t) => t.id === teamId || t.nome === squadra);
                if (!curTeam && !squadra) return null;
                return (
                  <div className="mt-2.5 p-3 bg-blue-50/80 border border-blue-200 rounded-xl text-xs space-y-1">
                    <div className="flex items-center justify-between font-bold text-slate-800">
                      <span>Squadra: <strong>{curTeam?.nome || squadra}</strong></span>
                      {curTeam?.categoria && (
                        <span className="px-2 py-0.5 rounded bg-blue-200/60 text-blue-900 text-[10px]">
                          {curTeam.categoria}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-600 pt-0.5">
                      <span>Stagione: <strong>{curTeam?.stagione || stagione || '2026/2027'}</strong></span>
                      <span>Palestra: <strong>{curTeam?.palestra || palestra || 'Non specificata'}</strong></span>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Stato dell'allenamento (Requirement 24 & 25) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Stato Seduta
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {(['Programmato', 'Completato', 'Annullato'] as const).map((st) => (
                  <button
                    type="button"
                    key={st}
                    onClick={() => setStato(st)}
                    className={`py-2 px-1 text-center rounded-xl text-xs font-bold transition ${
                      stato === st
                        ? st === 'Completato'
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : st === 'Annullato'
                          ? 'bg-red-600 text-white shadow-sm'
                          : 'bg-blue-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* Data */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Data Sessione *
              </label>
              <input
                type="date"
                required
                value={data}
                onChange={(e) => setData(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
              />
            </div>

            {/* Orari Inizio / Fine */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Ora Inizio *
                </label>
                <input
                  type="time"
                  required
                  value={oraInizio}
                  onChange={(e) => setOraInizio(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Ora Fine *
                </label>
                <input
                  type="time"
                  required
                  value={oraFine}
                  onChange={(e) => setOraFine(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                />
              </div>
            </div>

            {/* Obiettivo Principale */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Obiettivo Principale
              </label>
              <textarea
                rows={2}
                value={obiettivo}
                onChange={(e) => setObiettivo(e.target.value)}
                placeholder="es. Mantenere l'efficienza di ricezione sotto battuta aggressiva e gestire il contrattacco rapido."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white resize-y"
              />
            </div>

            {/* Note Generali */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Note Generali
              </label>
              <textarea
                rows={2}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Presenze, atleti in differenziato, materiale da palestra..."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white resize-y"
              />
            </div>
          </div>

          {/* BOX NOTE POST ALLENAMENTO (Requirement 23) */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <FileText size={16} className="text-blue-600" />
                <span>Note Post Allenamento</span>
              </h3>
              <span className="text-[10px] text-slate-400 font-semibold">Modificabile sempre</span>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                1. Come è andato l'allenamento?
              </label>
              <textarea
                rows={2}
                value={notePost.comeAndato}
                onChange={(e) => setNotePost({ ...notePost, comeAndato: e.target.value })}
                placeholder="Valutazione generale di intensità, concentrazione e ritmo..."
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                2. Cosa ha funzionato?
              </label>
              <textarea
                rows={2}
                value={notePost.cosaHaFunzionato}
                onChange={(e) => setNotePost({ ...notePost, cosaHaFunzionato: e.target.value })}
                placeholder="Obiettivi raggiunti, esercizi ben assimilati..."
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                3. Cosa migliorare?
              </label>
              <textarea
                rows={2}
                value={notePost.cosaMigliorare}
                onChange={(e) => setNotePost({ ...notePost, cosaMigliorare: e.target.value })}
                placeholder="Errori ricorrenti, cali di attenzione..."
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                4. Cosa riprendere nel prossimo allenamento?
              </label>
              <textarea
                rows={2}
                value={notePost.cosaRiprendere}
                onChange={(e) => setNotePost({ ...notePost, cosaRiprendere: e.target.value })}
                placeholder="Concetti da ribadire, varianti da inserire..."
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
            </div>
          </div>

          {/* BOX DURATA ALLENAMENTO (Section 19) */}
          <div
            className={`p-5 rounded-2xl border-2 shadow-sm transition ${
              remainingMinutes < 0
                ? 'bg-red-50/80 border-red-300'
                : 'bg-emerald-50/70 border-emerald-300'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5 text-slate-800">
                <Clock size={16} /> CALCOLO DURATA ALLENAMENTO
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Tempo Disponibile (Fine - Inizio):</span>
                <span className="font-bold text-slate-900">{availableMinutes} min</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Durata Programmata (Somma Esercizi):</span>
                <span className="font-bold text-slate-900">{programmedMinutes} min</span>
              </div>
              <div
                className={`pt-2 border-t flex justify-between text-sm font-black ${
                  remainingMinutes < 0 ? 'text-red-700' : 'text-emerald-800'
                }`}
              >
                <span>TEMPO RIMANENTE:</span>
                <span>{remainingMinutes} min</span>
              </div>
            </div>

            {remainingMinutes < 0 && (
              <div className="mt-3 p-2.5 bg-red-100 rounded-xl text-xs font-bold text-red-700 flex items-start gap-2">
                <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
                <span>
                  Attenzione: La durata programmata supera il tempo disponibile di{' '}
                  {Math.abs(remainingMinutes)} minuti!
                </span>
              </div>
            )}
          </div>
        </div>

        {/* COLONNA DESTRA: LISTA ESERCIZI NELL'ALLENAMENTO */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-xl font-black text-slate-900">
                Esercizi in Programma ({selectedExercises.length})
              </h3>
              <p className="text-xs text-slate-500">
                Riordina gli esercizi con i pulsanti o modifica la durata singola.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setIsSchemeModalOpen(true)}
                className="px-3.5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 rounded-xl text-xs font-black transition flex items-center gap-1.5 shadow-sm"
              >
                <Sparkles size={15} />
                <span>Aggiungi Schema Tattico</span>
              </button>

              <button
                type="button"
                onClick={() => setIsQuickCreateOpen(true)}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
              >
                <Plus size={15} />
                <span>Crea Esercizio</span>
              </button>

              <button
                type="button"
                onClick={() => setIsArchiveModalOpen(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-blue-600/20"
              >
                <Plus size={16} />
                <span>Aggiungi dall'Archivio</span>
              </button>
            </div>
          </div>

          {/* Lista Esercizi Aggiunti */}
          {selectedExercises.length === 0 ? (
            <div className="bg-white rounded-2xl border-2 border-dashed border-slate-300 p-12 text-center space-y-3">
              <Layers size={40} className="mx-auto text-slate-300" />
              <h4 className="font-bold text-slate-800 text-base">
                Nessun esercizio o schema aggiunto alla seduta
              </h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Clicca su "Aggiungi dall'Archivio" per scegliere tra i tuoi esercizi, oppure inserisci direttamente uno Schema Tattico.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsArchiveModalOpen(true)}
                  className="px-5 py-2.5 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 transition inline-flex items-center gap-2"
                >
                  <Plus size={16} />
                  <span>Sfoglia Archivio Esercizi</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsSchemeModalOpen(true)}
                  className="px-5 py-2.5 bg-amber-500 text-slate-950 text-xs font-black rounded-xl hover:bg-amber-400 transition inline-flex items-center gap-2 shadow-sm"
                >
                  <Sparkles size={16} />
                  <span>Inserisci Schema Tattico</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {selectedExercises.map((ex, index) => (
                <div
                  key={`${ex.originalExerciseId || ex.id}-${index}`}
                  className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-4 hover:border-slate-300 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  {/* Left: Reorder buttons & Progressive Number */}
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col gap-1 text-slate-400">
                      <button
                        type="button"
                        onClick={() => moveExercise(index, 'up')}
                        disabled={index === 0}
                        className="p-1 hover:text-slate-800 hover:bg-slate-100 rounded disabled:opacity-20 transition"
                        title="Sposta prima"
                      >
                        <ChevronUp size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveExercise(index, 'down')}
                        disabled={index === selectedExercises.length - 1}
                        className="p-1 hover:text-slate-800 hover:bg-slate-100 rounded disabled:opacity-20 transition"
                        title="Sposta dopo"
                      >
                        <ChevronDown size={16} />
                      </button>
                    </div>

                    <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-black text-sm flex-shrink-0">
                      {index + 1}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4
                          onClick={() => setPreviewingExercise(ex)}
                          className="font-bold text-slate-900 text-sm leading-snug hover:text-blue-600 cursor-pointer transition"
                          title="Clicca per visualizzare al momento l'esercizio"
                        >
                          {ex.titolo}
                        </h4>
                        {(ex.schemaTatticoId || ex.boardData) && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-400 text-slate-950 flex items-center gap-1 shadow-sm">
                            <Sparkles size={10} />
                            <span>Schema Tattico</span>
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        <span className="font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                          {ex.categoria}
                        </span>
                        <span>•</span>
                        <span className="text-[11px] font-bold text-slate-600">
                          Difficoltà: {ex.difficolta}
                        </span>
                        {ex.authorName && (
                          <>
                            <span>•</span>
                            <span className="text-[10px] text-slate-400 font-medium">
                              Autore: {ex.authorName}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Middle / Right: Duration, Block selector & Actions */}
                  <div className="flex flex-wrap items-center justify-between sm:justify-end gap-3 border-t sm:border-t-0 pt-2 sm:pt-0">
                    {/* Blocco (Section 20) */}
                    <select
                      value={ex.blocco || 'Tecnica'}
                      onChange={(e) =>
                        updateExerciseField(index, 'blocco', e.target.value)
                      }
                      className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 outline-none"
                      title="Struttura a blocchi allenamento"
                    >
                      {COMMON_BLOCKS.map((b) => (
                        <option key={b} value={b}>
                          {b}
                        </option>
                      ))}
                    </select>

                    {/* Durata input */}
                    <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
                      <Clock size={13} className="text-slate-400" />
                      <input
                        type="number"
                        min={1}
                        max={120}
                        value={ex.durata}
                        onChange={(e) =>
                          updateExerciseField(
                            index,
                            'durata',
                            Number(e.target.value)
                          )
                        }
                        className="w-10 bg-transparent text-xs font-bold text-slate-800 text-center outline-none"
                      />
                      <span className="text-xs text-slate-500">min</span>
                    </div>

                    {/* Action buttons with prominent Visualizza al momento */}
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setPreviewingExercise(ex)}
                        className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg text-xs transition flex items-center gap-1.5 border border-blue-200 shadow-sm"
                        title="Visualizza al momento l'esercizio completo con lavagna, obiettivi e svolgimento"
                      >
                        <Eye size={14} className="text-blue-600" />
                        <span>Visualizza</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => duplicateExerciseInWorkout(index)}
                        title="Duplica nell'allenamento"
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                      >
                        <Copy size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeExercise(index)}
                        title="Rimuovi dall'allenamento"
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* MODALE SELEZIONA DALL'ARCHIVIO (Section 17) */}
      {isArchiveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden border border-slate-200">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="text-lg font-black text-slate-900">
                  Aggiungi Esercizi all'Allenamento
                </h3>
                <p className="text-xs text-slate-500">
                  Seleziona gli esercizi dal tuo archivio master
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsArchiveModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Search & Category Filter */}
            <div className="p-4 border-b border-slate-100 bg-white flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search
                  className="absolute left-3.5 top-2.5 text-slate-400"
                  size={16}
                />
                <input
                  type="text"
                  placeholder="Cerca esercizio..."
                  value={archiveSearch}
                  onChange={(e) => setArchiveSearch(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <select
                value={archiveCategory}
                onChange={(e) => setArchiveCategory(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 outline-none"
              >
                <option value="">Tutte le categorie</option>
                {CATEGORIE_ESERCIZIO.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Modal Exercise List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
              {availableExercises
                .filter((ex) => {
                  if (
                    archiveSearch.trim() &&
                    !ex.titolo.toLowerCase().includes(archiveSearch.toLowerCase())
                  ) {
                    return false;
                  }
                  if (archiveCategory && ex.categoria !== archiveCategory) {
                    return false;
                  }
                  return true;
                })
                .map((ex) => (
                  <div
                    key={ex.id}
                    onClick={() => handleAddFromArchive(ex)}
                    className="p-3.5 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 cursor-pointer transition flex items-center justify-between group"
                  >
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm group-hover:text-blue-700">
                        {ex.titolo}
                      </h4>
                      <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                        <span className="font-semibold text-slate-700">
                          {ex.categoria}
                        </span>
                        <span>•</span>
                        <span>{ex.durata} min</span>
                        <span>•</span>
                        <span>{ex.difficolta}</span>
                        {ex.boardData && (
                          <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-bold">
                            Lavagna
                          </span>
                        )}
                        {ex.authorName && (
                          <span className="text-[10px] text-slate-400 font-medium">
                            • Autore: {ex.authorName}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPreviewingExercise(ex);
                        }}
                        className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg text-xs transition flex items-center gap-1.5 border border-blue-200 shadow-sm"
                        title="Visualizza al momento l'esercizio completo con lavagna tattica e dettagli"
                      >
                        <Eye size={14} className="text-blue-600" />
                        <span>Visualizza al momento</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleAddFromArchive(ex)}
                        className="px-3.5 py-1.5 bg-blue-600 group-hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-sm"
                      >
                        <Plus size={14} />
                        <span>Carica nella Scheda</span>
                      </button>
                    </div>
                  </div>
                ))}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setIsArchiveModalOpen(false)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition"
              >
                Fatto
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODALE SELEZIONA SCHEMA TATTICO (Point 29) */}
      {isSchemeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden border border-slate-200">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-amber-50/70">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black">
                  <Sparkles size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">
                    Aggiungi Schema Tattico all'Allenamento
                  </h3>
                  <p className="text-xs text-slate-500">
                    Seleziona uno schema salvato dalla libreria tattica (Sistemi 5-1, 4-2, 6-2 o Personalizzato)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsSchemeModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Search & Category Filter */}
            <div className="p-4 border-b border-slate-100 bg-white flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search
                  className="absolute left-3.5 top-2.5 text-slate-400"
                  size={16}
                />
                <input
                  type="text"
                  placeholder="Cerca per titolo, sistema o rotazione..."
                  value={schemeSearch}
                  onChange={(e) => setSchemeSearch(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <select
                value={schemeCategory}
                onChange={(e) => setSchemeCategory(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none"
              >
                <option value="">Tutte le categorie tattiche</option>
                {[
                  'Ricezione',
                  'Battuta',
                  'Attacco',
                  'Muro',
                  'Difesa',
                  'Copertura',
                  'Cambio palla',
                  'Breakpoint',
                  'Contrattacco',
                  'Altro',
                ].map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Modal Schemes List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
              {availableSchemes
                .filter((sc) => {
                  if (
                    schemeSearch.trim() &&
                    !sc.titolo.toLowerCase().includes(schemeSearch.toLowerCase()) &&
                    !sc.sistemaDiGioco.toLowerCase().includes(schemeSearch.toLowerCase())
                  ) {
                    return false;
                  }
                  if (schemeCategory && sc.categoria !== schemeCategory) {
                    return false;
                  }
                  return true;
                })
                .map((sc) => (
                  <div
                    key={sc.id}
                    onClick={() => handleAddTacticalSchemeToWorkout(sc)}
                    className="p-3.5 rounded-xl border border-slate-200 hover:border-amber-500 hover:bg-amber-50/40 cursor-pointer transition flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3">
                      {sc.previewUrl ? (
                        <img
                          src={sc.previewUrl}
                          alt={sc.titolo}
                          className="w-14 h-10 object-cover rounded-lg border border-slate-200 bg-white"
                        />
                      ) : (
                        <div className="w-14 h-10 bg-slate-800 rounded-lg flex items-center justify-center text-amber-400 font-bold text-xs">
                          {sc.sistemaDiGioco}
                        </div>
                      )}
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm group-hover:text-amber-800">
                          {sc.titolo}
                        </h4>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-1">
                          <span className="font-semibold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                            {sc.categoria}
                          </span>
                          <span>•</span>
                          <span className="font-medium text-slate-700">
                            Sistema: <strong>{sc.sistemaDiGioco}</strong>
                          </span>
                          <span>•</span>
                          <span className="font-medium text-slate-700">
                            Rotazione: <strong>R{sc.rotazione || 1}</strong>
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="px-3.5 py-1.5 bg-amber-500 group-hover:bg-amber-400 text-slate-950 rounded-lg text-xs font-black transition flex items-center gap-1 shadow-sm"
                    >
                      <Plus size={14} />
                      <span>Inserisci</span>
                    </button>
                  </div>
                ))}

              {availableSchemes.length === 0 && (
                <div className="text-center py-8 text-slate-400 text-xs">
                  Nessuno schema tattico salvato. Puoi crearne uno dalla sezione "Schemi Tattici" o dalla lavagna.
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setIsSchemeModalOpen(false)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition"
              >
                Chiudi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODALE CREAZIONE RAPIDA ESERCIZIO INLINE */}
      {isQuickCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="text-lg font-black text-slate-900">
                Crea Nuovo Esercizio al Volo
              </h3>
              <button
                type="button"
                onClick={() => setIsQuickCreateOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Titolo Esercizio *
                </label>
                <input
                  type="text"
                  required
                  value={quickTitle}
                  onChange={(e) => setQuickTitle(e.target.value)}
                  placeholder="es. Difesa corta e copertura a coppie"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Categoria
                  </label>
                  <select
                    value={quickCategory}
                    onChange={(e) => setQuickCategory(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none"
                  >
                    {CATEGORIE_ESERCIZIO.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Durata (min)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={120}
                    value={quickDuration}
                    onChange={(e) => setQuickDuration(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Breve Descrizione
                </label>
                <textarea
                  rows={3}
                  value={quickDesc}
                  onChange={(e) => setQuickDesc(e.target.value)}
                  placeholder="Note rapide sullo svolgimento..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsQuickCreateOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl"
                >
                  Annulla
                </button>
                <button
                  type="button"
                  onClick={handleSaveQuickExercise}
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md"
                >
                  Salva e Inserisci
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODALE CREAZIONE RAPIDA SQUADRA */}
      {isQuickTeamOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 border border-slate-200">
            <h3 className="text-base font-black text-slate-900 mb-4">
              Aggiungi Nuova Squadra
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nome Squadra
                </label>
                <input
                  type="text"
                  required
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  placeholder="es. Under 18 Femminile"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Categoria
                </label>
                <input
                  type="text"
                  value={newTeamCat}
                  onChange={(e) => setNewTeamCat(e.target.value)}
                  placeholder="es. U18"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsQuickTeamOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 rounded-xl"
                >
                  Annulla
                </button>
                <button
                  type="button"
                  onClick={handleCreateTeam}
                  className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 rounded-xl shadow-md"
                >
                  Crea Squadra
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FLOATING TOAST: ESERCIZIO CARICATO CON PULSANTE VISUALIZZA AL MOMENTO */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-[60] flex items-center gap-3 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl border border-slate-700/80 animate-in slide-in-from-bottom-5">
          <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0">
            <CheckCircle2 size={18} />
          </div>
          <div className="text-xs">
            <span className="font-bold block text-white">{toastMessage.text}</span>
            <span className="text-[11px] text-slate-400">Pronto nella scheda di allenamento</span>
          </div>
          <button
            type="button"
            onClick={() => {
              setPreviewingExercise(toastMessage.ex);
              setToastMessage(null);
            }}
            className="ml-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-blue-500/30 flex-shrink-0"
          >
            <Eye size={14} />
            <span>Visualizza al momento</span>
          </button>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-white p-1 rounded-lg"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* MODALE VISUALIZZA DETTAGLIO ESERCIZIO AL VOLO */}
      <ExerciseDetailModal
        exercise={previewingExercise}
        isOpen={previewingExercise !== null}
        onClose={() => setPreviewingExercise(null)}
        currentUserId={coachId}
        onAddToWorkout={(ex) => handleAddFromArchive(ex)}
      />
    </form>
  );
};
