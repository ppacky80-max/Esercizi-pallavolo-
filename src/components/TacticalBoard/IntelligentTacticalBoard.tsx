import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  TacticalBoardData,
  TacticalScene,
  BoardItem,
  TacticalBoardTool,
  CourtTheme,
  CourtViewMode,
  TacticalLayer,
  CategoriaSchemaTattico,
  LivelloSchemaTattico,
  CATEGORIE_SCHEMA_TATTICO,
  LIVELLI_SCHEMA_TATTICO,
  SistemaDiGioco,
} from '../../types';
import { CourtCanvas, CANVAS_WIDTH, CANVAS_HEIGHT } from './CourtCanvas';
import { ToolbarLeft } from './ToolbarLeft';
import { PropertiesPanelRight } from './PropertiesPanelRight';
import { TimelineBottom } from './TimelineBottom';
import { RotationsModal } from './RotationsModal';
import { PresetTemplatesModal } from './PresetTemplatesModal';
import { PresentationModeModal } from './PresentationModeModal';
import { exportTacticalSchemeToPdf, downloadImage } from '../../services/tacticalPdfService';
import { PresetTacticalTemplate } from '../../utils/presetTacticalTemplates';
import { getDefault51Lineup, get51PositionsForRotation, REGULATORY_ZONE_COORDS } from '../../utils/volleyballTactics';
import {
  Save,
  LogOut,
  Download,
  Printer,
  Maximize2,
  Minimize2,
  Sparkles,
  Layers,
  RotateCw,
  Eye,
  Sliders,
  Menu,
  CheckCircle2,
  AlertCircle,
  FileImage,
  FileText,
  Palette,
  Layout,
  Tag,
} from 'lucide-react';

interface IntelligentTacticalBoardProps {
  initialData?: string; // JSON string of TacticalBoardData
  title?: string;
  category?: CategoriaSchemaTattico;
  level?: LivelloSchemaTattico;
  onSave?: (boardDataJson: string, previewDataUrl: string, metadata: { title: string; category: CategoriaSchemaTattico; level: LivelloSchemaTattico; phasesCount: number }) => void;
  onClose?: () => void;
  readOnly?: boolean;
  className?: string;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
}

export const IntelligentTacticalBoard: React.FC<IntelligentTacticalBoardProps> = ({
  initialData,
  title: initialTitle = 'Nuovo Schema Tattico',
  category: initialCategory = 'Attacco',
  level: initialLevel = 'Intermedio',
  onSave,
  onClose,
  readOnly = false,
  className = 'h-[calc(100vh-4rem)] max-h-screen',
  isFullscreen = false,
  onToggleFullscreen,
}) => {
  // Title & Metadata
  const [title, setTitle] = useState<string>(initialTitle);
  const [category, setCategory] = useState<CategoriaSchemaTattico>(initialCategory);
  const [level, setLevel] = useState<LivelloSchemaTattico>(initialLevel);
  const [tags, setTags] = useState<string[]>(['Pallavolo', 'Tattica']);

  // Court Settings
  const [courtTheme, setCourtTheme] = useState<CourtTheme>('taraflex');
  const [courtView, setCourtView] = useState<CourtViewMode>('intero');
  const [showZoneNumbers, setShowZoneNumbers] = useState<boolean>(true);
  const [currentSystem, setCurrentSystem] = useState<SistemaDiGioco>('5-1');
  const [currentRotation, setCurrentRotation] = useState<number>(1);

  // Active Tool & Selection
  const [activeTool, setActiveTool] = useState<TacticalBoardTool>('select');
  const [selectedColor, setSelectedColor] = useState<string>('#2563eb');
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  // Layers Visibility & Lock
  const [layersState, setLayersState] = useState<Record<TacticalLayer, { visible: boolean; locked: boolean }>>({
    giocatori: { visible: true, locked: false },
    palla: { visible: true, locked: false },
    movimenti: { visible: true, locked: false },
    traiettorie: { visible: true, locked: false },
    zone: { visible: true, locked: false },
    attrezzatura: { visible: true, locked: false },
    testo: { visible: true, locked: false },
  });

  // Phases & Scenes State
  const [scenes, setScenes] = useState<TacticalScene[]>([
    {
      id: 'sc_init_1',
      name: 'Fase 1 - Posizionamento Iniziale',
      description: 'Disposizione tattica di partenza sul campo da gioco.',
      durationSeconds: 2,
      items: [],
    },
  ]);
  const [currentSceneIndex, setCurrentSceneIndex] = useState<number>(0);

  // Current Scene Items (actively rendered on the canvas)
  const [currentItems, setCurrentItems] = useState<BoardItem[]>([]);

  // Undo / Redo History Stacks
  const [history, setHistory] = useState<BoardItem[][]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  // Clipboard for copy-paste
  const [copiedItem, setCopiedItem] = useState<BoardItem | null>(null);

  // Modals state
  const [isRotationsOpen, setIsRotationsOpen] = useState(false);
  const [isTemplatesOpen, setIsTemplatesOpen] = useState(false);
  const [isPresentationOpen, setIsPresentationOpen] = useState(false);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);

  // Mobile Drawers
  const [isMobileLeftOpen, setIsMobileLeftOpen] = useState(false);
  const [isMobileRightOpen, setIsMobileRightOpen] = useState(false);

  // Status Feedback
  const [saveStatus, setSaveStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Initialize from initialData if provided
  useEffect(() => {
    if (initialData) {
      try {
        const parsed = JSON.parse(initialData);
        if (parsed.title) setTitle(parsed.title);
        if (parsed.category) setCategory(parsed.category);
        if (parsed.level) setLevel(parsed.level);
        if (parsed.tags) setTags(parsed.tags);
        if (parsed.courtTheme) setCourtTheme(parsed.courtTheme);
        if (parsed.courtView) setCourtView(parsed.courtView);
        if (parsed.showZoneNumbers !== undefined) setShowZoneNumbers(parsed.showZoneNumbers);
        if (parsed.sistemaDiGioco) setCurrentSystem(parsed.sistemaDiGioco);
        if (parsed.rotazione) setCurrentRotation(parsed.rotazione);
        if (parsed.layersState) setLayersState(parsed.layersState);

        if (parsed.scenes && parsed.scenes.length > 0) {
          setScenes(parsed.scenes);
          const initialScene = parsed.scenes[parsed.currentSceneIndex || 0] || parsed.scenes[0];
          setCurrentItems(initialScene.items || []);
          setCurrentSceneIndex(parsed.currentSceneIndex || 0);
        } else if (parsed.items) {
          setCurrentItems(parsed.items);
          setScenes([
            {
              id: 'sc_single',
              name: 'Fase 1 - Posizionamento',
              durationSeconds: 2,
              items: parsed.items,
            },
          ]);
        }
      } catch (err) {
        console.warn('Could not parse initial tactical board data:', err);
      }
    }
  }, [initialData]);

  // Sync current items into current scene
  const syncItemsToCurrentScene = useCallback((newItems: BoardItem[]) => {
    setCurrentItems(newItems);
    setScenes((prevScenes) =>
      prevScenes.map((sc, idx) => (idx === currentSceneIndex ? { ...sc, items: newItems } : sc))
    );
  }, [currentSceneIndex]);

  // Push to Undo history
  const pushHistory = useCallback((itemsState: BoardItem[]) => {
    setHistory((prev) => {
      const sliced = prev.slice(0, historyIndex + 1);
      return [...sliced, itemsState].slice(-25); // max 25 undos
    });
    setHistoryIndex((prev) => Math.min(24, prev + 1));
  }, [historyIndex]);

  // Update items handler
  const handleUpdateItems = useCallback((newItems: BoardItem[]) => {
    pushHistory(currentItems);
    syncItemsToCurrentScene(newItems);
  }, [currentItems, pushHistory, syncItemsToCurrentScene]);

  // Single Item Change
  const handleItemChange = useCallback((updatedItem: BoardItem) => {
    const next = currentItems.map((it) => (it.id === updatedItem.id ? updatedItem : it));
    syncItemsToCurrentScene(next);
  }, [currentItems, syncItemsToCurrentScene]);

  // Undo / Redo
  const handleUndo = () => {
    if (historyIndex > 0) {
      const prevItems = history[historyIndex - 1];
      setHistoryIndex((idx) => idx - 1);
      syncItemsToCurrentScene(prevItems);
      setSelectedItemId(null);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const nextItems = history[historyIndex + 1];
      setHistoryIndex((idx) => idx + 1);
      syncItemsToCurrentScene(nextItems);
      setSelectedItemId(null);
    }
  };

  // Copy / Paste / Duplicate
  const handleCopy = () => {
    const item = currentItems.find((it) => it.id === selectedItemId);
    if (item) setCopiedItem(item);
  };

  const handlePaste = () => {
    if (!copiedItem) return;
    const pasted: BoardItem = {
      ...copiedItem,
      id: `copy_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      x: copiedItem.x + 25,
      y: copiedItem.y + 25,
      endX: copiedItem.endX !== undefined ? copiedItem.endX + 25 : undefined,
      endY: copiedItem.endY !== undefined ? copiedItem.endY + 25 : undefined,
    };
    handleUpdateItems([...currentItems, pasted]);
    setSelectedItemId(pasted.id);
  };

  const handleDuplicate = () => {
    const item = currentItems.find((it) => it.id === selectedItemId);
    if (!item) return;
    const dup: BoardItem = {
      ...item,
      id: `dup_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      x: item.x + 30,
      y: item.y + 30,
      endX: item.endX !== undefined ? item.endX + 30 : undefined,
      endY: item.endY !== undefined ? item.endY + 30 : undefined,
    };
    handleUpdateItems([...currentItems, dup]);
    setSelectedItemId(dup.id);
  };

  const handleSelectAll = () => {
    // Select first item or toggle
    if (currentItems.length > 0) {
      setSelectedItemId(currentItems[0].id);
    }
  };

  const handleDeleteSelected = () => {
    if (!selectedItemId) return;
    handleUpdateItems(currentItems.filter((it) => it.id !== selectedItemId));
    setSelectedItemId(null);
  };

  const handleClearAll = () => {
    if (window.confirm('Sei sicuro di voler cancellare tutti gli elementi da questa fase della lavagna?')) {
      handleUpdateItems([]);
      setSelectedItemId(null);
    }
  };

  // Quick 6 Players Creators (Point 4)
  const handleCreate6Players = () => {
    const positions = get51PositionsForRotation(currentRotation || 1);
    const newPlayers: BoardItem[] = (
      [
        { zone: 'P1', pos: REGULATORY_ZONE_COORDS.P1 },
        { zone: 'P2', pos: REGULATORY_ZONE_COORDS.P2 },
        { zone: 'P3', pos: REGULATORY_ZONE_COORDS.P3 },
        { zone: 'P4', pos: REGULATORY_ZONE_COORDS.P4 },
        { zone: 'P5', pos: REGULATORY_ZONE_COORDS.P5 },
        { zone: 'P6', pos: REGULATORY_ZONE_COORDS.P6 },
      ] as const
    ).map((z, idx) => {
      const code = positions[z.zone] || `G${idx + 1}`;
      const role: any = code.startsWith('P')
        ? 'Palleggiatore'
        : code.startsWith('O')
        ? 'Opposto'
        : code.startsWith('C')
        ? 'Centrale'
        : 'Schiacciatore';

      return {
        id: `p_auto_${idx + 1}_${Date.now()}`,
        type: 'player',
        x: z.pos.x,
        y: z.pos.y,
        color: '#2563eb',
        number: idx + 1,
        label: code,
        role,
        visible: true,
        locked: false,
        layer: 'giocatori',
      };
    });

    handleUpdateItems([...currentItems.filter((it) => it.type !== 'player'), ...newPlayers]);
  };

  const handleCreate6PlayersWithLibero = () => {
    const positions = get51PositionsForRotation(currentRotation || 1);
    const newPlayers: BoardItem[] = (
      [
        { zone: 'P1', pos: REGULATORY_ZONE_COORDS.P1 },
        { zone: 'P2', pos: REGULATORY_ZONE_COORDS.P2 },
        { zone: 'P3', pos: REGULATORY_ZONE_COORDS.P3 },
        { zone: 'P4', pos: REGULATORY_ZONE_COORDS.P4 },
        { zone: 'P5', pos: REGULATORY_ZONE_COORDS.P5 },
        { zone: 'P6', pos: REGULATORY_ZONE_COORDS.P6 },
      ] as const
    ).map((z, idx) => {
      const isLib = z.zone === 'P6' || z.zone === 'P5';
      const code = isLib && z.zone === 'P6' ? 'L' : positions[z.zone] || `G${idx + 1}`;
      const role: any = code === 'L'
        ? 'Libero'
        : code.startsWith('P')
        ? 'Palleggiatore'
        : code.startsWith('O')
        ? 'Opposto'
        : code.startsWith('C')
        ? 'Centrale'
        : 'Schiacciatore';

      return {
        id: `p_auto_${idx + 1}_${Date.now()}`,
        type: 'player',
        x: z.pos.x,
        y: z.pos.y,
        color: code === 'L' ? '#f59e0b' : '#2563eb',
        number: code === 'L' ? 'L' : idx + 1,
        label: code,
        role,
        isLibero: code === 'L',
        visible: true,
        locked: false,
        layer: 'giocatori',
      };
    });

    handleUpdateItems([...currentItems.filter((it) => it.type !== 'player'), ...newPlayers]);
  };

  // Apply Rotation (Point 5)
  const handleApplyRotation = (newRot: number, newSys: SistemaDiGioco, mode: 'ricezione' | 'transizione') => {
    setCurrentRotation(newRot);
    setCurrentSystem(newSys);

    const positions = get51PositionsForRotation(newRot);
    const existingPlayers = currentItems.filter((it) => it.type === 'player');

    // Reposition players smoothly to regulation spots
    const zonesKeys: (keyof typeof REGULATORY_ZONE_COORDS)[] = ['P1', 'P2', 'P3', 'P4', 'P5', 'P6'];
    const updatedPlayers = existingPlayers.map((player, idx) => {
      const targetZone = zonesKeys[idx % 6];
      const coords = REGULATORY_ZONE_COORDS[targetZone];
      const offsetTransition = mode === 'transizione' ? (targetZone === 'P4' ? 30 : -20) : 0;

      return {
        ...player,
        x: coords.x + offsetTransition,
        y: coords.y,
        label: positions[targetZone] || player.label,
      };
    });

    const otherItems = currentItems.filter((it) => it.type !== 'player');
    handleUpdateItems([...otherItems, ...updatedPlayers]);
  };

  // Phase Timeline Management
  const handleSelectScene = (index: number) => {
    if (index >= 0 && index < scenes.length) {
      setCurrentSceneIndex(index);
      setCurrentItems(scenes[index].items || []);
      setSelectedItemId(null);
    }
  };

  const handleAddScene = () => {
    const newIdx = scenes.length + 1;
    const newScene: TacticalScene = {
      id: `sc_${Date.now()}`,
      name: `Fase ${newIdx} - Sviluppo`,
      description: '',
      durationSeconds: 2,
      // Inherit current scene items so coach can modify from the previous state!
      items: currentItems.map((it) => ({ ...it })),
    };
    const nextScenes = [...scenes, newScene];
    setScenes(nextScenes);
    setCurrentSceneIndex(nextScenes.length - 1);
  };

  const handleDuplicateScene = (index: number) => {
    const target = scenes[index];
    if (!target) return;
    const dup: TacticalScene = {
      ...target,
      id: `sc_dup_${Date.now()}`,
      name: `${target.name} (Copia)`,
      items: target.items.map((it) => ({ ...it })),
    };
    const nextScenes = [...scenes.slice(0, index + 1), dup, ...scenes.slice(index + 1)];
    setScenes(nextScenes);
    setCurrentSceneIndex(index + 1);
  };

  const handleDeleteScene = (index: number) => {
    if (scenes.length <= 1) return;
    const nextScenes = scenes.filter((_, idx) => idx !== index);
    setScenes(nextScenes);
    const newIdx = Math.max(0, Math.min(index, nextScenes.length - 1));
    setCurrentSceneIndex(newIdx);
    setCurrentItems(nextScenes[newIdx].items || []);
  };

  const handleRenameScene = (index: number, newName: string) => {
    setScenes((prev) =>
      prev.map((sc, idx) => (idx === index ? { ...sc, name: newName } : sc))
    );
  };

  const handleMoveScene = (fromIdx: number, toIdx: number) => {
    if (toIdx < 0 || toIdx >= scenes.length) return;
    const next = [...scenes];
    const [moved] = next.splice(fromIdx, 1);
    next.splice(toIdx, 0, moved);
    setScenes(next);
    setCurrentSceneIndex(toIdx);
  };

  // Layers Toggles
  const handleToggleLayerVisibility = (layer: TacticalLayer) => {
    setLayersState((prev) => ({
      ...prev,
      [layer]: { ...prev[layer], visible: !prev[layer].visible },
    }));
  };

  const handleToggleLayerLock = (layer: TacticalLayer) => {
    setLayersState((prev) => ({
      ...prev,
      [layer]: { ...prev[layer], locked: !prev[layer].locked },
    }));
  };

  // Capture canvas image thumbnail
  const captureCanvasPreview = (): string => {
    const canvas = document.querySelector('canvas');
    if (canvas) {
      try {
        return canvas.toDataURL('image/png', 0.9);
      } catch (err) {
        console.warn('Canvas capture error:', err);
      }
    }
    return '';
  };

  // Save Handler
  const handleSave = () => {
    const previewDataUrl = captureCanvasPreview();
    const boardObject: TacticalBoardData = {
      title,
      description: scenes[currentSceneIndex]?.description || '',
      category,
      level,
      tags,
      items: currentItems,
      scenes,
      currentSceneIndex,
      sistemaDiGioco: currentSystem,
      rotazione: currentRotation,
      courtView,
      courtTheme,
      showZoneNumbers,
      layersState,
      version: 2,
    };

    const jsonString = JSON.stringify(boardObject);

    if (onSave) {
      onSave(jsonString, previewDataUrl, {
        title,
        category,
        level,
        phasesCount: scenes.length,
      });
    }

    setSaveStatus({ type: 'success', message: 'Schema tattico salvato con successo!' });
    setTimeout(() => setSaveStatus(null), 3500);
  };

  // Export handlers
  const handleExportPng = () => {
    const preview = captureCanvasPreview();
    if (preview) {
      downloadImage(preview, `${title.replace(/\s+/g, '_')}_fase_${currentSceneIndex + 1}.png`);
    }
    setIsExportMenuOpen(false);
  };

  const handleExportPdf = async () => {
    const preview = captureCanvasPreview();
    const phaseImages = scenes.map((sc, i) => ({
      phaseName: sc.name,
      description: sc.description || '',
      dataUrl: i === currentSceneIndex ? preview : preview, // in live execution, captures current
    }));

    const boardObject: TacticalBoardData = {
      title,
      description: scenes[0]?.description || '',
      category,
      level,
      sistemaDiGioco: currentSystem,
      rotazione: currentRotation,
      items: currentItems,
      scenes,
      currentSceneIndex,
      version: 2,
    };

    await exportTacticalSchemeToPdf(boardObject, phaseImages);
    setIsExportMenuOpen(false);
  };

  const handlePrint = () => {
    window.print();
    setIsExportMenuOpen(false);
  };

  // Load Preset Template
  const handleLoadTemplate = (template: PresetTacticalTemplate) => {
    setTitle(template.titolo);
    setCategory(template.categoria);
    setLevel(template.livello);
    setCurrentRotation(template.rotazioneConsigliata);
    if (template.data.scenes && template.data.scenes.length > 0) {
      setScenes(template.data.scenes);
      setCurrentSceneIndex(0);
      setCurrentItems(template.data.scenes[0].items);
    } else {
      setCurrentItems(template.data.items);
      setScenes([
        {
          id: 'sc_tmpl',
          name: 'Fase 1 - Disposizione',
          durationSeconds: 2,
          items: template.data.items,
        },
      ]);
    }
  };

  const selectedItem = currentItems.find((it) => it.id === selectedItemId) || null;

  return (
    <div className={`flex flex-col bg-slate-950 text-white overflow-hidden relative select-none ${className}`}>
      {/* 1. TOP HEADER ACTION BAR */}
      <div className="bg-slate-900 border-b border-slate-800 px-3 sm:px-4 py-2.5 flex items-center justify-between gap-2 flex-shrink-0 z-20">
        {/* Left: Title & Metadata */}
        <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
          <button
            type="button"
            onClick={() => setIsMobileLeftOpen(true)}
            className="md:hidden p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white"
            title="Apri strumenti"
          >
            <Menu size={18} />
          </button>

          <div className="flex flex-col min-w-0 flex-1">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Nome dello schema tattico..."
              className="bg-transparent hover:bg-slate-800/80 focus:bg-slate-800 px-2 py-0.5 rounded-lg text-sm sm:text-base font-black text-white outline-none border border-transparent focus:border-blue-500 transition truncate max-w-sm"
            />
            <div className="flex items-center gap-2 text-[10px] text-slate-400 px-2">
              <span className="font-bold text-blue-400 uppercase">{category}</span>
              <span>•</span>
              <span>Livello: <strong>{level}</strong></span>
              <span>•</span>
              <span className="hidden sm:inline">Sistema {currentSystem} • R{currentRotation}</span>
            </div>
          </div>
        </div>

        {/* Center: Court Theme & View Mode Selector */}
        <div className="hidden xl:flex items-center gap-1.5 bg-slate-950/70 p-1 rounded-xl border border-slate-800 text-xs font-bold">
          {/* View: Full vs Half */}
          <button
            type="button"
            onClick={() => setCourtView('intero')}
            className={`px-2.5 py-1 rounded-lg transition ${
              courtView === 'intero' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Campo Intero
          </button>
          <button
            type="button"
            onClick={() => setCourtView('squadra')}
            className={`px-2.5 py-1 rounded-lg transition ${
              courtView === 'squadra' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Mezzo Campo
          </button>

          {/* Theme Dropdown */}
          <select
            value={courtTheme}
            onChange={(e) => setCourtTheme(e.target.value as CourtTheme)}
            className="bg-slate-800 text-slate-200 px-2 py-1 rounded-lg outline-none cursor-pointer border border-slate-700"
          >
            <option value="taraflex">Taraflex (Arancio/Verde)</option>
            <option value="parquet">Parquet Naturale</option>
            <option value="blu_fivb">FIVB Pro Azzurro</option>
            <option value="notte">Dark Mode Notte</option>
            <option value="stampa">Minimal per Stampa</option>
          </select>

          {/* Zones toggle */}
          <button
            type="button"
            onClick={() => setShowZoneNumbers(!showZoneNumbers)}
            className={`px-2 py-1 rounded-lg border text-[11px] transition ${
              showZoneNumbers
                ? 'bg-blue-600/30 border-blue-500 text-blue-300'
                : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}
          >
            Zone 1-6
          </button>
        </div>

        {/* Right: Actions (Presentation, Export, Save, Properties Drawer) */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Modalità Presentazione */}
          <button
            type="button"
            onClick={() => setIsPresentationOpen(true)}
            className="px-2.5 sm:px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-200 hover:text-white border border-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
            title="Modalità a tutto schermo per spiegare lo schema agli atleti"
          >
            <Maximize2 size={14} className="text-amber-400" />
            <span className="hidden sm:inline">Presentazione</span>
          </button>

          {/* Export Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
              className="px-2.5 sm:px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
            >
              <Download size={14} />
              <span className="hidden sm:inline">Esporta</span>
            </button>

            {isExportMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-44 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-1.5 z-50 text-xs space-y-1 animate-in fade-in">
                <button
                  type="button"
                  onClick={handleExportPng}
                  className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-800 text-slate-200 flex items-center gap-2 transition"
                >
                  <FileImage size={15} className="text-blue-400" />
                  <span>Immagine PNG</span>
                </button>
                <button
                  type="button"
                  onClick={handleExportPdf}
                  className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-800 text-slate-200 flex items-center gap-2 transition"
                >
                  <FileText size={15} className="text-red-400" />
                  <span>Documento PDF</span>
                </button>
                <button
                  type="button"
                  onClick={handlePrint}
                  className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-800 text-slate-200 flex items-center gap-2 transition"
                >
                  <Printer size={15} className="text-slate-400" />
                  <span>Stampa Scheda</span>
                </button>
              </div>
            )}
          </div>

          {/* Salva Schema Button */}
          {!readOnly && (
            <button
              type="button"
              onClick={handleSave}
              className="px-3.5 sm:px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black shadow-md shadow-blue-600/30 transition flex items-center gap-1.5"
              title="Salva modifiche allo schema"
            >
              <Save size={14} />
              <span>Salva</span>
            </button>
          )}

          {/* Tasto Uscire (esci senza salvare) */}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="px-3 sm:px-3.5 py-1.5 bg-slate-800 hover:bg-rose-500/20 text-slate-300 hover:text-rose-300 border border-slate-700 hover:border-rose-500/40 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
              title="Esci senza salvare le modifiche"
            >
              <LogOut size={14} className="text-slate-400 group-hover:text-rose-400" />
              <span>Uscire</span>
            </button>
          )}

          {/* Toggle Fullscreen se disponibile */}
          {onToggleFullscreen && (
            <button
              type="button"
              onClick={onToggleFullscreen}
              className="p-1.5 sm:px-2.5 sm:py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
              title={isFullscreen ? 'Riduci finestra' : 'A schermo intero'}
            >
              {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
              <span className="hidden sm:inline">{isFullscreen ? 'Riduci' : 'Schermo Intero'}</span>
            </button>
          )}

          {/* Properties Drawer Button on Mobile */}
          <button
            type="button"
            onClick={() => setIsMobileRightOpen(true)}
            className="lg:hidden p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white"
            title="Apri proprietà e livelli"
          >
            <Sliders size={18} />
          </button>
        </div>
      </div>

      {/* Save Status Banner */}
      {saveStatus && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-40 bg-emerald-500 text-slate-950 font-black text-xs px-4 py-2 rounded-2xl shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 size={16} />
          <span>{saveStatus.message}</span>
        </div>
      )}

      {/* 2. MAIN 3-COLUMN WORKSPACE */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* LEFT COLUMN: Vertical Toolbar */}
        <ToolbarLeft
          activeTool={activeTool}
          setActiveTool={setActiveTool}
          selectedColor={selectedColor}
          setSelectedColor={setSelectedColor}
          canUndo={historyIndex > 0}
          canRedo={historyIndex < history.length - 1}
          onUndo={handleUndo}
          onRedo={handleRedo}
          hasSelection={Boolean(selectedItemId)}
          onDuplicate={handleDuplicate}
          onCopy={handleCopy}
          onPaste={handlePaste}
          onSelectAll={handleSelectAll}
          onDeleteSelected={handleDeleteSelected}
          onClearAll={handleClearAll}
          onCreate6Players={handleCreate6Players}
          onCreate6PlayersWithLibero={handleCreate6PlayersWithLibero}
          onOpenRotations={() => setIsRotationsOpen(true)}
          onOpenTemplates={() => setIsTemplatesOpen(true)}
          isOpenMobile={isMobileLeftOpen}
          onCloseMobile={() => setIsMobileLeftOpen(false)}
        />

        {/* CENTER COLUMN: Volleyball Regulation Court */}
        <div className="flex-1 flex flex-col items-center justify-center p-2 sm:p-4 bg-slate-950 overflow-hidden relative">
          <CourtCanvas
            items={currentItems}
            selectedItemId={selectedItemId}
            activeTool={activeTool}
            selectedColor={selectedColor}
            courtView={courtView}
            courtTheme={courtTheme}
            showZoneNumbers={showZoneNumbers}
            layersState={layersState}
            onSelectItem={setSelectedItemId}
            onUpdateItems={handleUpdateItems}
            onItemChange={handleItemChange}
            readOnly={readOnly}
          />
        </div>

        {/* RIGHT COLUMN: Properties Panel & Layers */}
        <PropertiesPanelRight
          selectedItem={selectedItem}
          onUpdateSelectedItem={handleItemChange}
          onDeleteSelectedItem={handleDeleteSelected}
          onDuplicateSelectedItem={handleDuplicate}
          layersState={layersState}
          onToggleLayerVisibility={handleToggleLayerVisibility}
          onToggleLayerLock={handleToggleLayerLock}
          isOpenMobile={isMobileRightOpen}
          onCloseMobile={() => setIsMobileRightOpen(false)}
        />
      </div>

      {/* 3. IN BASSO: TIMELINE DELLE FASI & ANIMAZIONE */}
      <TimelineBottom
        scenes={scenes}
        currentSceneIndex={currentSceneIndex}
        onSelectScene={handleSelectScene}
        onAddScene={handleAddScene}
        onDuplicateScene={handleDuplicateScene}
        onDeleteScene={handleDeleteScene}
        onRenameScene={handleRenameScene}
        onMoveScene={handleMoveScene}
        onAnimateItems={(interpolated) => setCurrentItems(interpolated)}
        readOnly={readOnly}
      />

      {/* MODALS */}
      <RotationsModal
        isOpen={isRotationsOpen}
        onClose={() => setIsRotationsOpen(false)}
        currentRotation={currentRotation}
        currentSystem={currentSystem}
        currentItems={currentItems}
        onApplyRotation={handleApplyRotation}
      />

      <PresetTemplatesModal
        isOpen={isTemplatesOpen}
        onClose={() => setIsTemplatesOpen(false)}
        onLoadTemplate={handleLoadTemplate}
      />

      <PresentationModeModal
        isOpen={isPresentationOpen}
        onClose={() => setIsPresentationOpen(false)}
        boardData={{
          title,
          description: scenes[currentSceneIndex]?.description || '',
          category,
          level,
          items: currentItems,
          scenes,
          currentSceneIndex,
          courtView,
          showZoneNumbers,
          version: 2,
        }}
        courtTheme={courtTheme}
      />
    </div>
  );
};
