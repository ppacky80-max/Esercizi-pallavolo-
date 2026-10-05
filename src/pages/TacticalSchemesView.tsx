import React, { useState, useEffect } from 'react';
import {
  SchemaTattico,
  CategoriaSchemaTattico,
  SistemaDiGioco,
  LivelloSchemaTattico,
  CATEGORIE_SCHEMA_TATTICO,
  SISTEMI_DI_GIOCO,
  LIVELLI_SCHEMA_TATTICO,
} from '../types';
import {
  fetchTacticalSchemes,
  fetchTacticalSchemeById,
  saveTacticalScheme,
  duplicateTacticalScheme,
  deleteTacticalScheme,
  seedDemoTacticalSchemesIfEmpty,
} from '../services/tacticalSchemeService';
import { useAuth } from '../context/AuthContext';
import { IntelligentTacticalBoard } from '../components/TacticalBoard/IntelligentTacticalBoard';
import { ConfirmModal } from '../components/ConfirmModal';
import { exportTacticalSchemeToPdf } from '../services/tacticalPdfService';
import {
  Sparkles,
  Search,
  Filter,
  Plus,
  Copy,
  Trash2,
  Edit,
  Download,
  Printer,
  ChevronRight,
  Layers,
  RotateCw,
  Zap,
  CheckCircle2,
  Eye,
  Calendar,
  Volleyball,
  ArrowRight,
  Maximize2,
} from 'lucide-react';
import { ActivePage } from '../components/Sidebar';

interface TacticalSchemesViewProps {
  onNavigate: (page: ActivePage, entityId?: string) => void;
}

export const TacticalSchemesView: React.FC<TacticalSchemesViewProps> = ({ onNavigate }) => {
  const { currentUser } = useAuth();
  const coachId = currentUser?.uid || 'local_coach';

  const [schemes, setSchemes] = useState<SchemaTattico[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [selectedSystem, setSelectedSystem] = useState<string>('all');
  const [selectedRotation, setSelectedRotation] = useState<string>('all');

  // Fullscreen Editor Mode
  const [isEditorOpen, setIsEditorOpen] = useState<boolean>(false);
  const [editingScheme, setEditingScheme] = useState<SchemaTattico | null>(null);

  // Delete modal
  const [deleteTarget, setDeleteTarget] = useState<SchemaTattico | null>(null);

  const loadSchemes = async () => {
    setLoading(true);
    try {
      await seedDemoTacticalSchemesIfEmpty(coachId);
      const list = await fetchTacticalSchemes(coachId);
      setSchemes(list);
    } catch (e) {
      console.warn('Errore caricamento schemi tattici:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSchemes();
  }, [coachId]);

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingScheme(null);
    setIsEditorOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (sc: SchemaTattico) => {
    setEditingScheme(sc);
    setIsEditorOpen(true);
  };

  // Save handler from IntelligentTacticalBoard
  const handleSaveBoard = async (
    boardDataJson: string,
    previewDataUrl: string,
    metadata: {
      title: string;
      category: CategoriaSchemaTattico;
      level: LivelloSchemaTattico;
      phasesCount: number;
    }
  ) => {
    try {
      await saveTacticalScheme({
        id: editingScheme?.id,
        coachId,
        titolo: metadata.title.trim(),
        categoria: metadata.category,
        livello: metadata.level,
        sistemaDiGioco: editingScheme?.sistemaDiGioco || '5-1',
        rotazione: editingScheme?.rotazione || 1,
        descrizione: editingScheme?.descrizione || '',
        boardData: boardDataJson,
        previewUrl: previewDataUrl,
        fasiCount: metadata.phasesCount,
      });

      setIsEditorOpen(false);
      loadSchemes();
    } catch (err) {
      console.warn('Errore salvataggio schema tattico:', err);
    }
  };

  // Duplicate Scheme
  const handleDuplicate = async (schemeId: string) => {
    try {
      await duplicateTacticalScheme(schemeId, coachId);
      loadSchemes();
    } catch (err) {
      console.warn('Errore duplicazione schema:', err);
    }
  };

  // Delete Scheme
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteTacticalScheme(deleteTarget.id, coachId);
      setDeleteTarget(null);
      loadSchemes();
    } catch (err) {
      console.warn('Errore eliminazione schema:', err);
    }
  };

  // Filter schemes
  const filteredSchemes = schemes.filter((s) => {
    const matchSearch =
      s.titolo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.descrizione && s.descrizione.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (s.tags && s.tags.some((t) => t.toLowerCase().includes(searchTerm.toLowerCase())));
    const matchCat = selectedCategory === 'all' || s.categoria === selectedCategory;
    const matchLev = selectedLevel === 'all' || s.livello === selectedLevel;
    const matchSys = selectedSystem === 'all' || s.sistemaDiGioco === selectedSystem;
    const matchRot = selectedRotation === 'all' || s.rotazione === Number(selectedRotation);
    return matchSearch && matchCat && matchLev && matchSys && matchRot;
  });

  // Export Scheme directly to PDF
  const handleExportPDF = async (s: SchemaTattico) => {
    try {
      const parsed = JSON.parse(s.boardData || '{}');
      const phases = (parsed.scenes || []).map((sc: any, idx: number) => ({
        phaseName: sc.name || `Fase ${idx + 1}`,
        description: sc.description || '',
        dataUrl: s.previewUrl || '',
      }));
      await exportTacticalSchemeToPdf(
        {
          title: s.titolo,
          description: s.descrizione,
          category: s.categoria,
          level: s.livello || 'Intermedio',
          sistemaDiGioco: s.sistemaDiGioco,
          rotazione: s.rotazione,
          items: parsed.items || [],
          scenes: parsed.scenes || [],
          version: 2,
        },
        phases.length > 0 ? phases : [{ phaseName: 'Schema Generale', description: s.descrizione || '', dataUrl: s.previewUrl || '' }]
      );
    } catch (err) {
      console.warn('Export PDF error:', err);
    }
  };

  // If Fullscreen Intelligent Tactical Board is open:
  if (isEditorOpen) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col">
        <IntelligentTacticalBoard
          initialData={editingScheme ? editingScheme.boardData : undefined}
          title={editingScheme ? editingScheme.titolo : 'Nuovo Schema Tattico'}
          category={editingScheme ? editingScheme.categoria : 'Attacco'}
          level={editingScheme ? editingScheme.livello || 'Intermedio' : 'Intermedio'}
          onSave={handleSaveBoard}
          onClose={() => setIsEditorOpen(false)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white border border-blue-800/50 shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/20 text-blue-300 border border-blue-400/30 rounded-full text-xs font-black tracking-wider uppercase">
              <Sparkles size={14} className="text-amber-400" />
              <span>Modulo Professionale FIPAV</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              LAVAGNA TATTICA INTELLIGENTE
            </h1>
            <p className="text-xs sm:text-sm text-blue-100/90 max-w-2xl leading-relaxed">
              Crea schemi di gioco, rotazioni, esercizi tattici e sequenze di movimento con giocatori, palla, frecce, zone e animazione per PC, tablet e smartphone.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleOpenCreate}
              className="px-5 py-3.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 hover:from-blue-400 hover:to-purple-500 text-white rounded-2xl font-black text-xs sm:text-sm shadow-xl shadow-indigo-600/30 transition flex items-center gap-2.5 shrink-0"
            >
              <Plus size={18} />
              <span>+ NUOVA LAVAGNA TATTICA</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Cerca schemi per titolo, descrizione o parole chiave (es. pipe, W, muro)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm outline-none focus:ring-2 focus:ring-blue-600 transition"
            />
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500 font-bold shrink-0">
            <span>{filteredSchemes.length}</span>
            <span>schemi trovati</span>
          </div>
        </div>

        {/* Dropdown Filters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-100 text-xs">
          {/* Categoria */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Categoria
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium outline-none focus:border-blue-600"
            >
              <option value="all">Tutte le Categorie</option>
              {CATEGORIE_SCHEMA_TATTICO.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Livello */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Livello
            </label>
            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium outline-none focus:border-blue-600"
            >
              <option value="all">Tutti i Livelli</option>
              {LIVELLI_SCHEMA_TATTICO.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </div>

          {/* Sistema */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Sistema di Gioco
            </label>
            <select
              value={selectedSystem}
              onChange={(e) => setSelectedSystem(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium outline-none focus:border-blue-600"
            >
              <option value="all">Tutti i Sistemi</option>
              {SISTEMI_DI_GIOCO.map((s) => (
                <option key={s} value={s}>
                  Sistema {s}
                </option>
              ))}
            </select>
          </div>

          {/* Rotazione */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Rotazione
            </label>
            <select
              value={selectedRotation}
              onChange={(e) => setSelectedRotation(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium outline-none focus:border-blue-600"
            >
              <option value="all">Tutte le Rotazioni</option>
              {[1, 2, 3, 4, 5, 6].map((r) => (
                <option key={r} value={r}>
                  Rotazione P{r}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Cards Grid of Saved Tactical Boards */}
      {loading ? (
        <div className="py-20 text-center font-bold text-slate-400 text-sm">
          Caricamento archivio lavagne tattiche...
        </div>
      ) : filteredSchemes.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-3">
          <Volleyball size={44} className="mx-auto text-blue-500 opacity-60" />
          <h3 className="text-base font-black text-slate-800">Nessuna lavagna tattica trovata</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Non ci sono schemi che corrispondono ai filtri selezionati. Crea subito una nuova lavagna o azzera i filtri.
          </p>
          <button
            type="button"
            onClick={handleOpenCreate}
            className="mt-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition inline-flex items-center gap-2"
          >
            <Plus size={16} />
            <span>Crea Nuova Lavagna</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredSchemes.map((s) => (
            <div
              key={s.id}
              className="bg-white rounded-3xl border border-slate-200/80 shadow-sm hover:shadow-md hover:border-blue-400 transition overflow-hidden flex flex-col justify-between group"
            >
              {/* Card Preview Image */}
              <div
                onClick={() => handleOpenEdit(s)}
                className="h-44 bg-slate-900 border-b border-slate-100 relative cursor-pointer overflow-hidden flex items-center justify-center p-2"
              >
                {s.previewUrl ? (
                  <img
                    src={s.previewUrl}
                    alt={s.titolo}
                    className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="text-slate-600 flex flex-col items-center gap-2">
                    <Volleyball size={32} />
                    <span className="text-xs font-mono">Campo da Pallavolo</span>
                  </div>
                )}

                <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                  <span className="bg-blue-600 text-white text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full shadow-sm">
                    {s.categoria}
                  </span>
                  {s.livello && (
                    <span className="bg-slate-950/80 text-white text-[9px] font-bold px-2 py-0.5 rounded-full border border-white/20">
                      {s.livello}
                    </span>
                  )}
                </div>

                <div className="absolute bottom-3 right-3 bg-slate-950/80 text-white text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border border-white/20">
                  {s.fasiCount ? `${s.fasiCount} Fasi` : '1 Fase'} • R{s.rotazione || 1}
                </div>
              </div>

              {/* Card Content */}
              <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
                <div className="space-y-1">
                  <h3
                    onClick={() => handleOpenEdit(s)}
                    className="font-black text-slate-900 text-base group-hover:text-blue-600 transition cursor-pointer line-clamp-1"
                  >
                    {s.titolo}
                  </h3>
                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                    {s.descrizione || 'Nessuna nota tattica specificata.'}
                  </p>
                </div>

                {/* Card Actions */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(s)}
                    className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                  >
                    <Edit size={14} />
                    <span>Apri nella Lavagna</span>
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleExportPDF(s)}
                      title="Esporta in PDF"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                    >
                      <Printer size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDuplicate(s.id)}
                      title="Duplica schema"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                    >
                      <Copy size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(s)}
                      title="Elimina schema"
                      className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteTarget !== null}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        title="Elimina Schema Tattico"
        message={`Sei sicuro di voler eliminare definitivamente lo schema tattico "${deleteTarget?.titolo}"? L'operazione non è reversibile.`}
        confirmLabel="Elimina definitivamente"
        isDestructive={true}
      />
    </div>
  );
};
