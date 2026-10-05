import React, { useEffect, useState, useMemo } from 'react';
import { Esercizio, CATEGORIE_ESERCIZIO, DIFFICOLTA_ESERCIZIO } from '../types';
import {
  fetchExercises,
  toggleFavorite,
  deleteExercise,
  duplicateExercise,
} from '../services/exerciseService';
import { useAuth } from '../context/AuthContext';
import { generaPdfSingoloEsercizio } from '../utils/pdfGenerator';
import { ConfirmModal } from '../components/ConfirmModal';
import {
  Search,
  Filter,
  Star,
  Clock,
  Users,
  Copy,
  Trash2,
  Edit,
  Printer,
  PlusCircle,
  LayoutGrid,
  List as ListIcon,
  RotateCcw,
  Sparkles,
  Layers,
  Image as ImageIcon,
  Eye,
  User,
  Shield,
  Lock,
  Globe,
} from 'lucide-react';
import { ExerciseDetailModal } from '../components/ExerciseDetailModal';

interface ExercisesListProps {
  onNavigate: (page: any, entityId?: string) => void;
}

export const ExercisesList: React.FC<ExercisesListProps> = ({ onNavigate }) => {
  const { currentUser } = useAuth();
  const coachId = currentUser?.uid || 'local_coach';

  const [exercises, setExercises] = useState<Esercizio[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Filters state
  const [authorFilter, setAuthorFilter] = useState<'all' | 'mine' | 'shared'>('all');
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('');
  const [selectedDuration, setSelectedDuration] = useState<string>('');
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [playersCount, setPlayersCount] = useState<string>('');

  // Modals state
  const [deleteTarget, setDeleteTarget] = useState<Esercizio | null>(null);
  const [viewingExerciseModal, setViewingExerciseModal] = useState<Esercizio | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await fetchExercises(coachId);
      setExercises(data);
    } catch (e) {
      console.warn('Errore recupero esercizi:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [coachId]);

  const handleToggleFav = async (e: React.MouseEvent, ex: Esercizio) => {
    e.stopPropagation();
    try {
      await toggleFavorite(ex.id, ex.isFavorite);
      setExercises((prev) =>
        prev.map((item) =>
          item.id === ex.id ? { ...item, isFavorite: !item.isFavorite } : item
        )
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleDuplicate = async (e: React.MouseEvent, ex: Esercizio) => {
    e.stopPropagation();
    try {
      await duplicateExercise(
        ex,
        coachId,
        currentUser?.displayName || currentUser?.email?.split('@')[0] || 'Tu'
      );
      await loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteExercise(deleteTarget.id);
      setExercises((prev) => prev.filter((item) => item.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      console.error(err);
    }
  };

  const resetFilters = () => {
    setSearch('');
    setSelectedCategory('');
    setSelectedDifficulty('');
    setSelectedDuration('');
    setOnlyFavorites(false);
    setPlayersCount('');
  };

  // Counts
  const myExercisesCount = useMemo(
    () => exercises.filter((e) => e.coachId === coachId).length,
    [exercises, coachId]
  );
  const sharedExercisesCount = useMemo(
    () => exercises.filter((e) => e.isShared !== false).length,
    [exercises]
  );

  // Filtered exercises
  const filteredExercises = useMemo(() => {
    return exercises.filter((ex) => {
      // Authorship filter (Shared archive)
      if (authorFilter === 'mine' && ex.coachId !== coachId) return false;
      // In 'shared' tab, show all community shared exercises (including author's own shared ones)
      if (authorFilter === 'shared' && ex.isShared === false) return false;

      // Search title, description, or objective
      if (search.trim()) {
        const query = search.toLowerCase();
        const matchesTitle = ex.titolo.toLowerCase().includes(query);
        const matchesDesc = ex.descrizione?.toLowerCase().includes(query);
        const matchesObj = ex.obiettivo?.toLowerCase().includes(query);
        if (!matchesTitle && !matchesDesc && !matchesObj) return false;
      }

      // Category
      if (selectedCategory && ex.categoria !== selectedCategory) return false;

      // Difficulty
      if (selectedDifficulty && ex.difficolta !== selectedDifficulty) return false;

      // Only favorites
      if (onlyFavorites && !ex.isFavorite) return false;

      // Duration
      if (selectedDuration) {
        if (selectedDuration === 'short' && ex.durata >= 15) return false;
        if (selectedDuration === 'medium' && (ex.durata < 15 || ex.durata > 25))
          return false;
        if (selectedDuration === 'long' && ex.durata <= 25) return false;
      }

      // Players count
      if (playersCount) {
        const count = Number(playersCount);
        if (count < ex.minPlayers || count > ex.maxPlayers) return false;
      }

      return true;
    });
  }, [
    exercises,
    coachId,
    authorFilter,
    search,
    selectedCategory,
    selectedDifficulty,
    selectedDuration,
    onlyFavorites,
    playersCount,
  ]);

  const activeFiltersCount = [
    Boolean(search),
    Boolean(selectedCategory),
    Boolean(selectedDifficulty),
    Boolean(selectedDuration),
    Boolean(onlyFavorites),
    Boolean(playersCount),
  ].filter(Boolean).length;

  return (
    <div className="space-y-6">
      {/* Top Bar with Search and View Mode */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Cerca per titolo, obiettivo o descrizione..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition"
            />
          </div>

          {/* Quick controls: View switch + New Exercise */}
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition ${
                  viewMode === 'grid'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Vista a Griglia"
              >
                <LayoutGrid size={18} />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition ${
                  viewMode === 'list'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Vista a Elenco"
              >
                <ListIcon size={18} />
              </button>
            </div>

            <button
              onClick={() => onNavigate('new_exercise')}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-md shadow-blue-600/20 flex-shrink-0"
            >
              <PlusCircle size={16} />
              <span>Nuovo Esercizio</span>
            </button>
          </div>
        </div>

        {/* Authorship Filter Tabs (Shared Archive) */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-slate-100">
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => setAuthorFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                authorFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tutti gli Esercizi ({exercises.length})
            </button>
            <button
              type="button"
              onClick={() => setAuthorFilter('mine')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                authorFilter === 'mine'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <User size={14} />
              <span>I Miei Esercizi ({myExercisesCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setAuthorFilter('shared')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                authorFilter === 'shared'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users size={14} />
              <span>Condivisi dalla Community ({sharedExercisesCount})</span>
            </button>
          </div>

          <div className="text-[11px] text-slate-500 flex items-center gap-1">
            <Shield size={13} className="text-blue-500" />
            <span>Gli esercizi altrui sono visibili in sola lettura</span>
          </div>
        </div>

        {/* Filters Grid */}
        <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-2.5 items-center">
          {/* Categoria */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Tutte le categorie</option>
            {CATEGORIE_ESERCIZIO.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          {/* Difficoltà */}
          <select
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Tutte le difficoltà</option>
            {DIFFICOLTA_ESERCIZIO.map((diff) => (
              <option key={diff} value={diff}>
                Difficoltà: {diff}
              </option>
            ))}
          </select>

          {/* Durata */}
          <select
            value={selectedDuration}
            onChange={(e) => setSelectedDuration(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Qualsiasi durata</option>
            <option value="short">Breve (&lt; 15 min)</option>
            <option value="medium">Media (15 - 25 min)</option>
            <option value="long">Lunga (&gt; 25 min)</option>
          </select>

          {/* Giocatori */}
          <select
            value={playersCount}
            onChange={(e) => setPlayersCount(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Qualsiasi n° atleti</option>
            <option value="4">Almeno 4 giocatori</option>
            <option value="6">Almeno 6 giocatori</option>
            <option value="8">Almeno 8 giocatori</option>
            <option value="12">12 giocatori (6v6)</option>
          </select>

          {/* Solo Preferiti Toggle */}
          <button
            type="button"
            onClick={() => setOnlyFavorites(!onlyFavorites)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
              onlyFavorites
                ? 'bg-amber-500 border-amber-500 text-white shadow-sm'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Star size={14} className={onlyFavorites ? 'fill-white' : ''} />
            <span>Solo preferiti</span>
          </button>

          {/* Reset Filters button */}
          {activeFiltersCount > 0 && (
            <button
              type="button"
              onClick={resetFilters}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-red-600 hover:bg-red-50 transition border border-red-200 ml-auto"
            >
              <RotateCcw size={13} />
              <span>AZZERA FILTRI</span>
            </button>
          )}
        </div>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between text-xs font-bold text-slate-500 px-1">
        <span>
          Trovati {filteredExercises.length} esercizi{' '}
          {exercises.length > 0 && `su un totale di ${exercises.length}`}
        </span>
      </div>

      {/* Content View */}
      {loading ? (
        <div className="py-20 text-center font-bold text-slate-400">
          Caricamento archivio esercizi...
        </div>
      ) : filteredExercises.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center">
          <Layers size={40} className="mx-auto text-slate-300 mb-3" />
          <h4 className="text-base font-bold text-slate-800">
            Nessun esercizio trovato
          </h4>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {activeFiltersCount > 0
              ? 'Prova ad azzerare i filtri per vedere tutti gli esercizi archiviati.'
              : 'Non hai ancora creato esercizi. Inizia cliccando su "Nuovo Esercizio".'}
          </p>
          {activeFiltersCount > 0 && (
            <button
              onClick={resetFilters}
              className="mt-4 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
            >
              Azzera Filtri
            </button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredExercises.map((ex) => {
            const hasBoard = Boolean(ex.boardData);
            const preview = ex.boardPreviewUrl || ex.imageUrl;
            const isAuthor = ex.coachId === coachId;

            return (
              <div
                key={ex.id}
                onClick={() => (isAuthor ? onNavigate('edit_exercise', ex.id) : setViewingExerciseModal(ex))}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md hover:border-blue-400 transition cursor-pointer flex flex-col overflow-hidden group"
              >
                {/* Visual Preview Header if board or image exists */}
                {preview ? (
                  <div className="w-full h-36 bg-slate-900 relative overflow-hidden flex items-center justify-center">
                    <img
                      src={preview}
                      alt={ex.titolo}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                    <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5">
                      {(hasBoard || ex.schemaTatticoId) && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-slate-950 shadow-md flex items-center gap-1">
                          <Sparkles size={11} />
                          <span>Schema tattico presente</span>
                        </span>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-16 bg-gradient-to-r from-blue-900 to-indigo-900 p-3 flex items-center justify-between text-white">
                    <span className="text-xs font-bold text-blue-200 tracking-wider uppercase">
                      {ex.categoria}
                    </span>
                    {(hasBoard || ex.schemaTatticoId) && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-slate-950 flex items-center gap-1">
                        <Sparkles size={11} />
                        <span>Schema tattico presente</span>
                      </span>
                    )}
                  </div>
                )}

                <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    {/* Top tags */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">
                        {ex.categoria}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => handleToggleFav(e, ex)}
                        className={`p-1.5 rounded-lg transition ${
                          ex.isFavorite
                            ? 'text-amber-500 bg-amber-50'
                            : 'text-slate-300 hover:text-amber-400 hover:bg-slate-50'
                        }`}
                        title={
                          ex.isFavorite
                            ? 'Rimuovi dai preferiti'
                            : 'Aggiungi ai preferiti'
                        }
                      >
                        <Star
                          size={18}
                          className={ex.isFavorite ? 'fill-amber-400' : ''}
                        />
                      </button>
                    </div>

                    {/* Title */}
                    <h3 className="font-black text-slate-900 text-base leading-snug group-hover:text-blue-600 transition">
                      {ex.titolo}
                    </h3>

                    {/* Objective preview */}
                    {ex.obiettivo && (
                      <p className="text-xs text-slate-500 mt-2 line-clamp-2">
                        {ex.obiettivo}
                      </p>
                    )}
                  </div>

                  {/* Metadata Row */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                    <div className="flex items-center gap-1 font-bold">
                      <Clock size={14} className="text-slate-400" />
                      <span>{ex.durata} min</span>
                    </div>

                    <div className="flex items-center gap-1 font-medium">
                      <Users size={14} className="text-slate-400" />
                      <span>
                        {ex.minPlayers}-{ex.maxPlayers}
                      </span>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
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

                  {/* Author & Read-only Info */}
                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
                    <div className="flex items-center gap-1">
                      <User size={12} className="text-slate-400" />
                      <span className="truncate max-w-[130px]">
                        {isAuthor ? 'Autore: Tu' : `Autore: ${ex.authorName || 'Altro Coach'}`}
                      </span>
                    </div>
                    {!isAuthor ? (
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                        Sola Lettura
                      </span>
                    ) : ex.isShared !== false ? (
                      <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 flex items-center gap-1">
                        <Globe size={10} /> Condiviso
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 flex items-center gap-1">
                        <Lock size={10} /> Privato
                      </span>
                    )}
                  </div>

                  {/* Action Buttons Toolbar */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setViewingExerciseModal(ex);
                      }}
                      title="Visualizza Scheda Completa"
                      className="px-2.5 py-1 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg text-xs font-semibold transition flex items-center gap-1"
                    >
                      <Eye size={14} />
                      <span>Visualizza</span>
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          generaPdfSingoloEsercizio(ex);
                        }}
                        title="Stampa PDF Esercizio"
                        className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                      >
                        <Printer size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleDuplicate(e, ex)}
                        title={isAuthor ? "Duplica Esercizio" : "Copia nei Miei Esercizi"}
                        className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                      >
                        <Copy size={16} />
                      </button>

                      {isAuthor && (
                        <>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onNavigate('edit_exercise', ex.id);
                            }}
                            title="Modifica Esercizio"
                            className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteTarget(ex);
                            }}
                            title="Elimina Esercizio"
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                          >
                            <Trash2 size={16} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* LIST VIEW */
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden divide-y divide-slate-100">
          {filteredExercises.map((ex) => {
            const isAuthor = ex.coachId === coachId;
            return (
              <div
                key={ex.id}
                onClick={() => (isAuthor ? onNavigate('edit_exercise', ex.id) : setViewingExerciseModal(ex))}
                className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50 transition cursor-pointer group"
              >
                <div className="flex items-start gap-3 flex-1">
                  <button
                    type="button"
                    onClick={(e) => handleToggleFav(e, ex)}
                    className={`mt-0.5 p-1 rounded-lg transition ${
                      ex.isFavorite ? 'text-amber-500' : 'text-slate-300 hover:text-amber-400'
                    }`}
                  >
                    <Star size={20} className={ex.isFavorite ? 'fill-amber-400' : ''} />
                  </button>

                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-slate-900 text-base group-hover:text-blue-600 transition">
                        {ex.titolo}
                      </h3>
                      {(ex.boardData || ex.schemaTatticoId) && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-slate-950 flex items-center gap-1 shadow-sm">
                          <Sparkles size={11} />
                          <span>Schema tattico presente</span>
                        </span>
                      )}
                      {!isAuthor && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                          Sola lettura ({ex.authorName || 'Altro Coach'})
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 mt-1">
                      <span className="font-bold text-slate-700">{ex.categoria}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1 font-medium">
                        <Clock size={12} /> {ex.durata} min
                      </span>
                      <span>•</span>
                      <span>
                        {ex.minPlayers}-{ex.maxPlayers} giocatori
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
                      <span>•</span>
                      <span className="text-slate-500 font-medium flex items-center gap-1">
                        <User size={11} />
                        <span>{isAuthor ? 'Tu' : ex.authorName || 'Coach'}</span>
                      </span>
                      <span>•</span>
                      {!isAuthor ? (
                        <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                          Sola Lettura
                        </span>
                      ) : ex.isShared !== false ? (
                        <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 flex items-center gap-1">
                          <Globe size={10} /> Condiviso
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 flex items-center gap-1">
                          <Lock size={10} /> Privato
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 sm:self-center border-t sm:border-t-0 pt-2 sm:pt-0">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setViewingExerciseModal(ex);
                    }}
                    className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                    title="Visualizza Scheda Completa"
                  >
                    <Eye size={18} />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      generaPdfSingoloEsercizio(ex);
                    }}
                    className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                    title="Stampa PDF"
                  >
                    <Printer size={18} />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleDuplicate(e, ex)}
                    className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                    title={isAuthor ? "Duplica" : "Copia nei Miei Esercizi"}
                  >
                    <Copy size={18} />
                  </button>

                  {isAuthor && (
                    <>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onNavigate('edit_exercise', ex.id);
                        }}
                        className="p-2 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                        title="Modifica"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteTarget(ex);
                        }}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                        title="Elimina"
                      >
                        <Trash2 size={18} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail Modal */}
      <ExerciseDetailModal
        exercise={viewingExerciseModal}
        isOpen={viewingExerciseModal !== null}
        onClose={() => setViewingExerciseModal(null)}
        currentUserId={coachId}
        onDuplicate={(ex) => handleDuplicate({ stopPropagation: () => {} } as any, ex)}
        onEdit={(ex) => onNavigate('edit_exercise', ex.id)}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        title="Elimina Esercizio"
        message={`Sei sicuro di voler eliminare definitivamente l'esercizio "${deleteTarget?.titolo}"? L'azione non potrà essere annullata.`}
        confirmLabel="Elimina definitivamente"
        cancelLabel="Annulla"
        isDestructive={true}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};
