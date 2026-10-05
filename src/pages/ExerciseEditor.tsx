import React, { useState, useEffect } from 'react';
import {
  CategoriaEsercizio,
  CATEGORIE_ESERCIZIO,
  DifficoltaEsercizio,
  DIFFICOLTA_ESERCIZIO,
  CategoriaSchemaTattico,
  LivelloSchemaTattico,
  Esercizio,
  Allenamento,
  EsercizioInAllenamento,
  SchemaTattico,
} from '../types';
import { fetchExerciseById, saveExercise } from '../services/exerciseService';
import { fetchWorkouts } from '../services/workoutService';
import { fetchTacticalSchemes, saveTacticalScheme } from '../services/tacticalSchemeService';
import { useAuth } from '../context/AuthContext';
import { IntelligentTacticalBoard } from '../components/TacticalBoard/IntelligentTacticalBoard';
import {
  Save,
  ArrowLeft,
  Upload,
  Trash2,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Sparkles,
  Link2,
  Layers,
  Plus,
  Shield,
  Copy,
  Lock,
  Globe,
  Users,
  X,
  Maximize2,
  Minimize2,
  LogOut,
} from 'lucide-react';

interface ExerciseEditorProps {
  exerciseId?: string; // if present, edit mode
  onNavigate: (page: any, entityId?: string) => void;
}

const mapExerciseCategoryToTactical = (cat: CategoriaEsercizio): CategoriaSchemaTattico => {
  switch (cat) {
    case 'Ricezione': return 'Ricezione';
    case 'Difesa': return 'Difesa';
    case 'Copertura': return 'Copertura';
    case 'Battuta': return 'Battuta';
    case 'Muro': return 'Muro';
    case 'Attacco e difesa': return 'Attacco';
    case 'Battuta e ricezione': return 'Ricezione';
    case 'Breakpoint': return 'Breakpoint';
    case 'Cambiopalla': return 'Cambio palla';
    default: return 'Altro';
  }
};

const mapDifficultyToTacticalLevel = (diff: DifficoltaEsercizio): LivelloSchemaTattico => {
  switch (diff) {
    case 'Base': return 'Base';
    case 'Avanzato': return 'Avanzato';
    default: return 'Intermedio';
  }
};

export const ExerciseEditor: React.FC<ExerciseEditorProps> = ({
  exerciseId,
  onNavigate,
}) => {
  const { currentUser } = useAuth();
  const coachId = currentUser?.uid || 'local_coach';

  // Form states
  const [titolo, setTitolo] = useState('');
  const [categoria, setCategoria] = useState<CategoriaEsercizio>('Riscaldamento');
  const [durata, setDurata] = useState<number>(15);
  const [difficolta, setDifficolta] = useState<DifficoltaEsercizio>('Base');
  const [obiettivo, setObiettivo] = useState('');
  const [minPlayers, setMinPlayers] = useState<number>(4);
  const [maxPlayers, setMaxPlayers] = useState<number>(12);
  const [materiale, setMateriale] = useState('');
  const [descrizione, setDescrizione] = useState('');
  const [note, setNote] = useState('');
  const [imageUrl, setImageUrl] = useState<string>('');
  const [boardData, setBoardData] = useState<string>('');
  const [boardPreviewUrl, setBoardPreviewUrl] = useState<string>('');
  const [isTacticalFullscreen, setIsTacticalFullscreen] = useState<boolean>(false);
  const [boardResetKey, setBoardResetKey] = useState<number>(0);
  const [schemaTatticoId, setSchemaTatticoId] = useState<string>('');
  const [availableSchemes, setAvailableSchemes] = useState<SchemaTattico[]>([]);
  const [isSchemeModalOpen, setIsSchemeModalOpen] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isShared, setIsShared] = useState<boolean>(true);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [usedInWorkouts, setUsedInWorkouts] = useState<{ id: string; data: string; squadra: string; titolo: string }[]>([]);
  const [authorInfo, setAuthorInfo] = useState<{
    coachId: string;
    authorName: string;
    isReadOnly: boolean;
  }>({
    coachId: '',
    authorName: '',
    isReadOnly: false,
  });

  // Status states
  const [loading, setLoading] = useState(Boolean(exerciseId));
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Load existing exercise or tactical schemes if new
  useEffect(() => {
    if (!exerciseId) {
      fetchTacticalSchemes(coachId).then(setAvailableSchemes).catch(console.warn);
      return;
    }

    const loadExercise = async () => {
      setLoading(true);
      try {
        const [data, allWorkouts] = await Promise.all([
          fetchExerciseById(exerciseId),
          fetchWorkouts(coachId),
        ]);
        if (data) {
          setTitolo(data.titolo);
          setCategoria(data.categoria);
          setDurata(data.durata);
          setDifficolta(data.difficolta);
          setObiettivo(data.obiettivo);
          setMinPlayers(data.minPlayers);
          setMaxPlayers(data.maxPlayers);
          setMateriale(data.materiale);
          setDescrizione(data.descrizione);
          setNote(data.note);
          setImageUrl(data.imageUrl || '');
          setBoardData(data.boardData || '');
          setBoardPreviewUrl(data.boardPreviewUrl || '');
          setSchemaTatticoId(data.schemaTatticoId || '');
          setIsFavorite(data.isFavorite);
          setIsShared(data.isShared !== undefined ? Boolean(data.isShared) : true);

          const isReadOnly = Boolean(
            data.coachId &&
            data.coachId !== coachId
          );
          setAuthorInfo({
            coachId: data.coachId,
            authorName: data.authorName || 'Altro Coach',
            isReadOnly,
          });
        }

        // Load available tactical schemes (Point 28)
        const scList = await fetchTacticalSchemes(coachId);
        setAvailableSchemes(scList);

        // Find workouts using this exercise (Requirement 22)
        const matched = allWorkouts.filter((w: Allenamento) =>
          (w.esercizi || []).some(
            (ex: EsercizioInAllenamento) => ex.originalExerciseId === exerciseId || ex.id === exerciseId
          )
        );
        setUsedInWorkouts(
          matched.map((w: Allenamento) => ({
            id: w.id,
            data: w.data,
            squadra: w.squadra,
            titolo: w.titolo,
          }))
        );
      } catch (e) {
        console.warn('Errore caricamento esercizio:', e);
      } finally {
        setLoading(false);
      }
    };

    loadExercise();
  }, [exerciseId, coachId]);

  // Handle image upload from device
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size & formats: JPG, JPEG, PNG, WEBP
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setStatusMessage({
        type: 'error',
        text: 'Formato immagine non supportato. Usa JPG, PNG o WEBP.',
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setStatusMessage({
        type: 'error',
        text: "L'immagine supera il limite di 5MB.",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setImageUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Callback from Tactical Board
  const handleBoardChange = React.useCallback((json: string, previewUrl: string) => {
    setBoardData(json);
    setBoardPreviewUrl(previewUrl);
  }, []);

  const handleClearForm = () => {
    setTitolo('');
    setCategoria('Riscaldamento');
    setDurata(15);
    setDifficolta('Base');
    setObiettivo('');
    setMinPlayers(4);
    setMaxPlayers(12);
    setMateriale('');
    setDescrizione('');
    setNote('');
    setImageUrl('');
    setBoardData('');
    setBoardPreviewUrl('');
    setIsFavorite(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!titolo.trim()) {
      setStatusMessage({
        type: 'error',
        text: "Inserisci un titolo per l'esercizio.",
      });
      return;
    }

    if (minPlayers > maxPlayers) {
      setStatusMessage({
        type: 'error',
        text: 'Il numero minimo di giocatori non può superare il massimo.',
      });
      return;
    }

    if (authorInfo.isReadOnly) {
      setStatusMessage({
        type: 'error',
        text: "Non puoi modificare questo esercizio perché creato da un altro autore. Clicca su 'Duplica come Mio Esercizio'.",
      });
      return;
    }

    // REQUIREMENT 3: "Nella scheda esercizio, quando si clicca salva esercizio chiedere se condividerlo nella community"
    setIsShareModalOpen(true);
  };

  const executeSave = async (shareWithCommunity: boolean) => {
    setIsShareModalOpen(false);
    setIsShared(shareWithCommunity);
    setSaving(true);
    setStatusMessage(null);

    try {
      await saveExercise(
        {
          coachId,
          authorName:
            currentUser?.displayName ||
            currentUser?.email?.split('@')[0] ||
            authorInfo.authorName ||
            'Allenatore',
          authorEmail: currentUser?.email || '',
          titolo: titolo.trim(),
          categoria,
          durata: Number(durata) || 15,
          difficolta,
          obiettivo: obiettivo.trim(),
          minPlayers: Number(minPlayers) || 1,
          maxPlayers: Number(maxPlayers) || 12,
          materiale: materiale.trim(),
          descrizione: descrizione.trim(),
          note: note.trim(),
          imageUrl,
          boardData,
          boardPreviewUrl,
          schemaTatticoId: schemaTatticoId || undefined,
          isFavorite,
          isShared: shareWithCommunity,
        },
        exerciseId
      );

      setStatusMessage({
        type: 'success',
        text: shareWithCommunity
          ? 'Esercizio salvato e condiviso nella Community con successo! Ritorno all’archivio...'
          : 'Esercizio salvato come privato con successo! Ritorno all’archivio...',
      });

      // Automatically return to exercises archive after brief confirmation
      setTimeout(() => {
        onNavigate('exercises');
      }, 1000);
    } catch (err: any) {
      console.error(err);
      setStatusMessage({
        type: 'error',
        text: 'Errore durante il salvataggio dell’esercizio.',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDuplicateAsMine = async () => {
    setSaving(true);
    setStatusMessage(null);
    try {
      const newExId = await saveExercise({
        coachId,
        authorName: currentUser?.displayName || currentUser?.email?.split('@')[0] || 'Allenatore',
        authorEmail: currentUser?.email || '',
        titolo: `${titolo} (Mia Copia)`,
        categoria,
        durata: Number(durata) || 15,
        difficolta,
        obiettivo: obiettivo.trim(),
        minPlayers: Number(minPlayers) || 1,
        maxPlayers: Number(maxPlayers) || 12,
        materiale: materiale.trim(),
        descrizione: descrizione.trim(),
        note: note.trim(),
        imageUrl,
        boardData,
        boardPreviewUrl,
        schemaTatticoId: schemaTatticoId || undefined,
        isFavorite: false,
      });

      setStatusMessage({
        type: 'success',
        text: 'Copia personale creata con successo! Ora puoi modificarla liberamente.',
      });

      setAuthorInfo({
        coachId,
        authorName: currentUser?.displayName || 'Tu',
        isReadOnly: false,
      });
      setTitolo(`${titolo} (Mia Copia)`);

      onNavigate('edit_exercise', newExId);
    } catch (err: any) {
      console.error(err);
      setStatusMessage({
        type: 'error',
        text: 'Errore durante la duplicazione dell’esercizio.',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center font-bold text-slate-500">
        Caricamento dati esercizio...
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-5xl mx-auto pb-16">
      {/* Top Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => onNavigate('exercises')}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 text-sm font-semibold transition"
        >
          <ArrowLeft size={18} />
          <span>Torna all'Archivio</span>
        </button>

        <div className="flex items-center gap-3">
          {!authorInfo.isReadOnly && (
            <button
              type="button"
              onClick={handleClearForm}
              className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
            >
              Azzera Campi
            </button>
          )}

          {authorInfo.isReadOnly ? (
            <button
              type="button"
              onClick={handleDuplicateAsMine}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-sm font-black rounded-xl shadow-lg shadow-amber-500/25 transition disabled:opacity-50"
            >
              <Copy size={18} />
              <span>{saving ? 'Duplicazione in corso...' : 'Duplica come Mio Esercizio'}</span>
            </button>
          ) : (
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl shadow-lg shadow-blue-600/25 transition disabled:opacity-50"
            >
              <Save size={18} />
              <span>{saving ? 'Salvataggio...' : 'Salva Esercizio'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Read-only Alert Banner */}
      {authorInfo.isReadOnly && (
        <div className="p-4 sm:p-5 bg-amber-50 border-2 border-amber-300/80 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-amber-950 shadow-sm animate-in fade-in">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold flex-shrink-0 mt-0.5">
              <Lock size={20} />
            </div>
            <div>
              <h4 className="font-black text-sm text-amber-950 flex items-center gap-1.5">
                <span>Esercizio in Sola Lettura</span>
                <span className="text-[10px] font-bold bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full">
                  Condiviso
                </span>
              </h4>
              <p className="text-xs text-amber-900 mt-1 leading-relaxed">
                Questo esercizio è stato creato da <strong>{authorInfo.authorName}</strong>. Secondo le regole della community,
                gli esercizi degli altri allenatori possono essere consultati e usati in sola lettura, ma non modificati o eliminati.
                Per apportare modifiche o adattarlo, clicca su <strong>"Duplica come Mio Esercizio"</strong>.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleDuplicateAsMine}
            disabled={saving}
            className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black rounded-xl transition flex items-center gap-2 shadow-sm flex-shrink-0 self-start sm:self-center"
          >
            <Copy size={15} />
            <span>Duplica Esercizio</span>
          </button>
        </div>
      )}

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

      {/* SECTION 1: INFORMAZIONI PRINCIPALI */}
      <div className="bg-white p-5 sm:p-7 rounded-2xl border border-slate-200/80 shadow-sm space-y-6">
        <h3 className="text-base font-black text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
          <span>1. Informazioni Principali</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Titolo */}
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Titolo Esercizio *
            </label>
            <input
              type="text"
              required
              value={titolo}
              onChange={(e) => setTitolo(e.target.value)}
              placeholder="es. Ricezione a tre con battuta mirata nei conflitti"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
            />
          </div>

          {/* Categoria */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Categoria *
            </label>
            <select
              required
              value={categoria}
              onChange={(e) => setCategoria(e.target.value as CategoriaEsercizio)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
            >
              {CATEGORIE_ESERCIZIO.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Difficoltà */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Difficoltà *
            </label>
            <select
              required
              value={difficolta}
              onChange={(e) => setDifficolta(e.target.value as DifficoltaEsercizio)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
            >
              {DIFFICOLTA_ESERCIZIO.map((diff) => (
                <option key={diff} value={diff}>
                  {diff}
                </option>
              ))}
            </select>
          </div>

          {/* Durata */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Durata Prevista (Minuti) *
            </label>
            <input
              type="number"
              required
              min={1}
              max={180}
              value={durata}
              onChange={(e) => setDurata(Number(e.target.value))}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
            />
          </div>

          {/* Numero Giocatori (Min - Max) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Numero Giocatori (Min - Max)
            </label>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="number"
                min={1}
                max={30}
                value={minPlayers}
                onChange={(e) => setMinPlayers(Number(e.target.value))}
                placeholder="Minimo"
                className="w-full px-3 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
              />
              <input
                type="number"
                min={1}
                max={30}
                value={maxPlayers}
                onChange={(e) => setMaxPlayers(Number(e.target.value))}
                placeholder="Massimo"
                className="w-full px-3 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
              />
            </div>
          </div>

          {/* Materiale Necessario */}
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Materiale Necessario (Campo libero)
            </label>
            <input
              type="text"
              value={materiale}
              onChange={(e) => setMateriale(e.target.value)}
              placeholder="es. 10 palloni da gara, 4 coni di delimitazione, 1 plinto"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
            />
          </div>

          {/* Obiettivo dell'esercizio */}
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Obiettivo dell'Esercizio
            </label>
            <textarea
              rows={2}
              value={obiettivo}
              onChange={(e) => setObiettivo(e.target.value)}
              placeholder="es. Migliorare la comunicazione in ricezione nei corridoi di conflitto e la stabilità del piano di rimbalzo."
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white resize-y"
            />
          </div>

          {/* Descrizione Svolgimento */}
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Descrizione Dettagliata dello Svolgimento
            </label>
            <textarea
              rows={4}
              value={descrizione}
              onChange={(e) => setDescrizione(e.target.value)}
              placeholder="Spiega lo svolgimento: posizionamento atleti, inizio dell'azione, rotazione, conteggio punti o criteri di riuscita..."
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white resize-y"
            />
          </div>

          {/* Note del Coach */}
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Note e Accorgimenti per l'Allenatore
            </label>
            <textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Consigli pratici: dove posizionarsi per osservare, correzioni tipiche degli errori..."
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white resize-y"
            />
          </div>
        </div>
      </div>

      {/* SECTION 2: LAVAGNA TATTICA INTELLIGENTE */}
      <div className="bg-white p-5 sm:p-7 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Layers size={18} className="text-blue-600" />
                <span>2. Lavagna Tattica Intelligente</span>
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-100 text-blue-800">
                PRO FIPAV
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Disegna posizioni giocatori, traiettorie, attrezzi e sequenze animate multi-fase oppure collega uno schema già salvato dalla libreria.
            </p>
          </div>

          {/* Tactical Scheme Linkage Buttons (Point 28) */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setIsTacticalFullscreen(true)}
              className="px-3.5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
              title="Apri la lavagna tattica a schermo intero"
            >
              <Maximize2 size={14} />
              <span>SCHERMO INTERO</span>
            </button>

            <button
              type="button"
              onClick={() => setIsSchemeModalOpen(true)}
              className="px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-blue-200"
            >
              <Link2 size={15} />
              <span>Collega schema tattico</span>
            </button>

            <button
              type="button"
              onClick={async () => {
                if (!boardData) {
                  setStatusMessage({ type: 'error', text: 'Disegna prima qualcosa sulla lavagna per creare uno schema.' });
                  return;
                }
                const title = window.prompt('Inserisci il nome per il nuovo schema tattico:', `Schema - ${titolo || 'Esercizio'}`);
                if (!title) return;
                const newSc = await saveTacticalScheme({
                  coachId,
                  titolo: title.trim(),
                  categoria: mapExerciseCategoryToTactical(categoria),
                  sistemaDiGioco: '5-1',
                  boardData,
                  previewUrl: boardPreviewUrl,
                });
                setSchemaTatticoId(newSc.id);
                setAvailableSchemes((prev) => [newSc, ...prev]);
                setStatusMessage({ type: 'success', text: `Nuovo schema "${title}" creato e collegato con successo!` });
              }}
              className="px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-amber-300"
            >
              <Plus size={15} />
              <span>CREA NUOVO SCHEMA</span>
            </button>
          </div>
        </div>

        {/* Linked Scheme Active Banner */}
        {schemaTatticoId && (
          <div className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-600" />
              <span>
                <strong>Schema tattico collegato:</strong>{' '}
                {availableSchemes.find((s) => s.id === schemaTatticoId)?.titolo || 'Schema salvato'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setSchemaTatticoId('')}
              className="text-xs font-semibold text-red-600 hover:text-red-700 underline"
            >
              Scollega
            </button>
          </div>
        )}

        {/* Intelligent Tactical Board Component Embedded */}
        <div className="rounded-2xl overflow-hidden border border-slate-800 shadow-xl bg-slate-950">
          <IntelligentTacticalBoard
            key={`inline-${boardResetKey}`}
            initialData={boardData}
            title={titolo || 'Esercizio Tattico'}
            category={mapExerciseCategoryToTactical(categoria)}
            level={mapDifficultyToTacticalLevel(difficolta)}
            className="h-[720px] w-full"
            isFullscreen={false}
            onToggleFullscreen={() => setIsTacticalFullscreen(true)}
            onSave={(json, previewUrl) => {
              setBoardData(json);
              setBoardPreviewUrl(previewUrl);
              setStatusMessage({
                type: 'success',
                text: 'Schema tattico salvato nella scheda esercizio!',
              });
            }}
            onClose={() => {
              // Esci senza salvare: ripristina la lavagna allo stato precedentemente salvato
              setBoardResetKey((prev) => prev + 1);
              setStatusMessage({
                type: 'success',
                text: 'Modifiche alla lavagna annullate. Ripristinato lo schema precedente.',
              });
            }}
          />
        </div>
      </div>

      {/* Fullscreen Intelligent Tactical Board Overlay */}
      {isTacticalFullscreen && (
        <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col">
          <IntelligentTacticalBoard
            key={`fs-${boardResetKey}`}
            initialData={boardData}
            title={titolo || 'Esercizio Tattico'}
            category={mapExerciseCategoryToTactical(categoria)}
            level={mapDifficultyToTacticalLevel(difficolta)}
            className="h-screen w-screen"
            isFullscreen={true}
            onToggleFullscreen={() => setIsTacticalFullscreen(false)}
            onSave={(json, previewUrl) => {
              setBoardData(json);
              setBoardPreviewUrl(previewUrl);
              setIsTacticalFullscreen(false);
              setStatusMessage({
                type: 'success',
                text: 'Schema tattico salvato con successo nella scheda esercizio!',
              });
            }}
            onClose={() => {
              setIsTacticalFullscreen(false);
              setStatusMessage({
                type: 'success',
                text: 'Chiusa la lavagna a schermo intero senza salvare le modifiche.',
              });
            }}
          />
        </div>
      )}

      {/* MODAL SELEZIONA SCHEMA TATTICO (Point 28) */}
      {isSchemeModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-xl w-full p-5 shadow-2xl text-white space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Link2 size={20} className="text-blue-400" />
                <h3 className="text-base font-bold text-white">Collega Schema Tattico Esistente</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsSchemeModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Seleziona uno schema salvato nel tuo archivio per caricarlo e collegarlo a questo esercizio:
            </p>

            {availableSchemes.length === 0 ? (
              <div className="py-8 text-center text-slate-500 text-xs">
                Nessuno schema tattico trovato nell'archivio. Crea prima uno schema nella sezione Schemi Tattici o Rotazioni.
              </div>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {availableSchemes.map((sc) => (
                  <div
                    key={sc.id}
                    onClick={() => {
                      setBoardData(sc.boardData);
                      setBoardPreviewUrl(sc.previewUrl || '');
                      setSchemaTatticoId(sc.id);
                      setBoardResetKey((prev) => prev + 1);
                      setIsSchemeModalOpen(false);
                      setStatusMessage({
                        type: 'success',
                        text: `Schema "${sc.titolo}" collegato correttamente!`,
                      });
                    }}
                    className={`p-3 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                      schemaTatticoId === sc.id
                        ? 'bg-blue-600/30 border-blue-500 text-white'
                        : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-750'
                    }`}
                  >
                    <div>
                      <h4 className="text-xs font-bold text-white">{sc.titolo}</h4>
                      <p className="text-[10px] text-slate-400">
                        {sc.categoria} • Sistema {sc.sistemaDiGioco} • Rotazione R{sc.rotazione || 1}
                      </p>
                    </div>

                    <span className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-[11px] font-bold">
                      Seleziona
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div className="pt-3 border-t border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setIsSchemeModalOpen(false)}
                className="px-4 py-2 bg-slate-800 text-slate-300 hover:bg-slate-700 rounded-xl text-xs font-bold"
              >
                Chiudi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 3: IMMAGINE CARICATA (OPZIONALE) */}
      <div className="bg-white p-5 sm:p-7 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
        <h3 className="text-base font-black text-slate-900 border-b border-slate-100 pb-3">
          3. Immagine Aggiuntiva (Opzionale)
        </h3>
        <p className="text-xs text-slate-500">
          Puoi caricare una foto dal dispositivo (JPG, PNG, WEBP) o un diagramma esterno.
        </p>

        {imageUrl ? (
          <div className="flex flex-col sm:flex-row items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="w-32 h-24 rounded-lg overflow-hidden border border-slate-300 bg-white">
              <img
                src={imageUrl}
                alt="Anteprima caricata"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 space-y-2">
              <span className="text-xs font-semibold text-slate-700 block">
                Immagine associata all'esercizio
              </span>
              <div className="flex items-center gap-3">
                <label className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-bold cursor-pointer transition">
                  Sostituisci
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={handleImageFileChange}
                    className="hidden"
                  />
                </label>
                <button
                  type="button"
                  onClick={() => setImageUrl('')}
                  className="px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-xs font-bold transition flex items-center gap-1"
                >
                  <Trash2 size={14} />
                  <span>Elimina</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <label className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-2xl p-6 text-center flex flex-col items-center justify-center cursor-pointer bg-slate-50/50 hover:bg-blue-50/20 transition">
            <Upload size={28} className="text-slate-400 mb-2" />
            <span className="text-xs font-bold text-slate-700">
              Trascina o clicca per caricare un'immagine dal dispositivo
            </span>
            <span className="text-[11px] text-slate-400 mt-1">
              Formati supportati: JPG, JPEG, PNG, WEBP (Max 5MB)
            </span>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={handleImageFileChange}
              className="hidden"
            />
          </label>
        )}
      </div>

      {/* SECTION 4: CRONOLOGIA ALLENAMENTI (Requirement 22) */}
      {exerciseId && (
        <div className="bg-white p-5 sm:p-7 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-base font-black text-slate-900">
              4. Cronologia Utilizzo negli Allenamenti
            </h3>
            <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full">
              Utilizzato in {usedInWorkouts.length} {usedInWorkouts.length === 1 ? 'allenamento' : 'allenamenti'}
            </span>
          </div>

          {usedInWorkouts.length === 0 ? (
            <p className="text-xs text-slate-400 py-2">
              Questo esercizio non è ancora stato inserito in nessun allenamento pianificato.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 pt-1">
              {usedInWorkouts.map((w) => (
                <div
                  key={w.id}
                  onClick={() => onNavigate('edit_workout', w.id)}
                  className="p-3 bg-slate-50 hover:bg-blue-50 rounded-xl border border-slate-200/70 hover:border-blue-300 cursor-pointer transition flex items-center justify-between group"
                >
                  <div className="truncate">
                    <span className="block text-xs font-bold text-slate-900 group-hover:text-blue-700 truncate">
                      {w.squadra ? `${w.squadra} • ` : ''}{w.titolo}
                    </span>
                    <span className="text-[11px] text-slate-500 font-semibold">
                      {w.data}
                    </span>
                  </div>
                  <span className="text-xs text-blue-600 font-bold opacity-0 group-hover:opacity-100 transition pl-2">
                    &rarr;
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Bottom Save Bar */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
        <button
          type="button"
          onClick={() => onNavigate('exercises')}
          className="px-5 py-2.5 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
        >
          {authorInfo.isReadOnly ? 'Torna Indietro' : 'Annulla'}
        </button>
        {authorInfo.isReadOnly ? (
          <button
            type="button"
            onClick={handleDuplicateAsMine}
            disabled={saving}
            className="flex items-center gap-2 px-8 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 text-sm font-black rounded-xl shadow-lg shadow-amber-500/30 transition disabled:opacity-50"
          >
            <Copy size={18} />
            <span>{saving ? 'Duplicazione in corso...' : 'Duplica come Mio Esercizio'}</span>
          </button>
        ) : (
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl shadow-lg shadow-blue-600/30 transition disabled:opacity-50"
          >
            <Save size={18} />
            <span>{saving ? 'Salvataggio in corso...' : 'Salva Esercizio'}</span>
          </button>
        )}
      </div>
      {/* MODALE CONFERMA CONDIVISIONE NELLA COMMUNITY (Requirement 3) */}
      {isShareModalOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200">
            {/* Modal Header */}
            <div className="p-6 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center border border-white/20">
                  <Globe size={22} className="text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-black leading-tight">Condivisione nella Community</h3>
                  <p className="text-xs text-blue-100 font-medium">VolleyCoach Community Hub</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsShareModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 hover:text-white transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5">
              <div className="text-center sm:text-left">
                <p className="text-base font-bold text-slate-900 mb-1">
                  Vuoi condividere questo esercizio con la community di allenatori?
                </p>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Puoi decidere se rendere la scheda consultabile dagli altri coach oppure mantenerla solo per uso personale.
                </p>
              </div>

              {/* Share Options Cards */}
              <div className="space-y-3">
                {/* Option 1: Shared with Community */}
                <div
                  onClick={() => executeSave(true)}
                  className="p-4 rounded-2xl border-2 border-blue-500 bg-blue-50/50 hover:bg-blue-100/50 cursor-pointer transition flex items-start gap-3.5 group shadow-sm hover:shadow"
                >
                  <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm group-hover:scale-105 transition">
                    <Globe size={18} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-black text-blue-950">
                        Sì, Condividi nella Community
                      </span>
                      <span className="text-[10px] font-black uppercase tracking-wider bg-blue-200/70 text-blue-800 px-2 py-0.5 rounded-full">
                        Consigliato
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      Visibile a tutti gli allenatori in <strong className="text-slate-800">sola lettura</strong>. Potranno consultarlo e duplicarlo. Tu rimarrai l'unico autore con facoltà di modifica ed eliminazione.
                    </p>
                  </div>
                </div>

                {/* Option 2: Private */}
                <div
                  onClick={() => executeSave(false)}
                  className="p-4 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-slate-100/80 cursor-pointer transition flex items-start gap-3.5 group"
                >
                  <div className="w-9 h-9 rounded-xl bg-slate-300 text-slate-700 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition">
                    <Lock size={18} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-slate-900">
                        No, Mantieni Privato
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full">
                        Solo Tu
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      L'esercizio rimarrà visibile esclusivamente a te nel tuo archivio privato e non apparirà alla community.
                    </p>
                  </div>
                </div>
              </div>

              {/* Notice */}
              <div className="bg-amber-50 border border-amber-200/80 rounded-xl p-3 flex items-start gap-2.5">
                <Shield size={16} className="text-amber-600 shrink-0 mt-0.5" />
                <p className="text-[11px] text-amber-800 leading-snug">
                  <strong>Protezione Autore:</strong> Gli esercizi condivisi rimangono sempre vincolati al tuo account autore. Gli altri coach non possono sovrascriverli o cancellarli.
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setIsShareModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition"
              >
                Annulla e Continua a Modificare
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => executeSave(false)}
                  disabled={saving}
                  className="px-4 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl transition"
                >
                  Salva Privato
                </button>
                <button
                  type="button"
                  onClick={() => executeSave(true)}
                  disabled={saving}
                  className="px-5 py-2 text-xs font-black text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md shadow-blue-600/20 transition"
                >
                  Condividi & Salva
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </form>
  );
};
