import React from 'react';
import {
  MousePointer,
  User,
  Shield,
  Volleyball,
  ArrowRight,
  TrendingUp,
  MoveRight,
  Square,
  Type,
  PenTool,
  Eraser,
  RotateCcw,
  RotateCw,
  Copy,
  ClipboardPaste,
  Trash2,
  Users,
  UserPlus,
  Target,
  Layers,
  ChevronDown,
  X,
} from 'lucide-react';
import { TacticalBoardTool } from '../../types';

interface ToolbarLeftProps {
  activeTool: TacticalBoardTool;
  setActiveTool: (tool: TacticalBoardTool) => void;
  selectedColor: string;
  setSelectedColor: (color: string) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  hasSelection: boolean;
  onDuplicate: () => void;
  onCopy: () => void;
  onPaste: () => void;
  onSelectAll: () => void;
  onDeleteSelected: () => void;
  onClearAll: () => void;
  onCreate6Players: () => void;
  onCreate6PlayersWithLibero: () => void;
  onOpenRotations: () => void;
  onOpenTemplates: () => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

const PALETTE_COLORS = [
  { id: '#2563eb', label: 'Blu' },
  { id: '#ef4444', label: 'Rosso' },
  { id: '#f59e0b', label: 'Giallo/Arancio' },
  { id: '#10b981', label: 'Verde' },
  { id: '#8b5cf6', label: 'Viola' },
  { id: '#ffffff', label: 'Bianco' },
  { id: '#0f172a', label: 'Nero' },
];

export const ToolbarLeft: React.FC<ToolbarLeftProps> = ({
  activeTool,
  setActiveTool,
  selectedColor,
  setSelectedColor,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  hasSelection,
  onDuplicate,
  onCopy,
  onPaste,
  onSelectAll,
  onDeleteSelected,
  onClearAll,
  onCreate6Players,
  onCreate6PlayersWithLibero,
  onOpenRotations,
  onOpenTemplates,
  isOpenMobile,
  onCloseMobile,
}) => {
  const tools: Array<{ id: TacticalBoardTool; label: string; icon: React.ReactNode; group: 'select' | 'players' | 'arrows' | 'equip' | 'draw' }> = [
    { id: 'select', label: 'Seleziona / Sposta (Puntatore)', icon: <MousePointer size={18} />, group: 'select' },
    { id: 'player', label: 'Giocatore', icon: <User size={18} />, group: 'players' },
    { id: 'libero', label: 'Libero', icon: <Shield size={18} className="text-amber-500" />, group: 'players' },
    { id: 'coach', label: 'Allenatore', icon: <span className="font-black text-xs">ALL</span>, group: 'players' },
    { id: 'ball', label: 'Palla da Pallavolo', icon: <Volleyball size={18} className="text-amber-400" />, group: 'players' },
    { id: 'arrow', label: 'Freccia Movimento', icon: <ArrowRight size={18} />, group: 'arrows' },
    { id: 'curved_arrow', label: 'Freccia Curva', icon: <TrendingUp size={18} />, group: 'arrows' },
    { id: 'dashed_arrow', label: 'Freccia Tratteggiata', icon: <MoveRight size={18} className="stroke-dashed" />, group: 'arrows' },
    { id: 'ball_trajectory', label: 'Traiettoria Palla', icon: <Target size={18} className="text-amber-500" />, group: 'arrows' },
    { id: 'highlight_zone', label: 'Zona Evidenziata', icon: <Square size={18} className="text-blue-500" />, group: 'equip' },
    { id: 'block', label: 'Muro a Rete', icon: <span className="font-bold text-[10px]">MURO</span>, group: 'equip' },
    { id: 'cone', label: 'Cono', icon: <span className="font-bold text-xs text-orange-500">▲</span>, group: 'equip' },
    { id: 'plinth', label: 'Plinto / Panca', icon: <span className="font-bold text-xs text-amber-700">■</span>, group: 'equip' },
    { id: 'text', label: 'Testo / Nota', icon: <Type size={18} />, group: 'draw' },
    { id: 'draw', label: 'Disegno Libero (Penna)', icon: <PenTool size={18} />, group: 'draw' },
    { id: 'eraser', label: 'Gomma per Cancellare', icon: <Eraser size={18} className="text-red-400" />, group: 'draw' },
  ];

  const content = (
    <div className="flex flex-col h-full bg-slate-900 border-r border-slate-800 text-white w-64 select-none">
      {/* Top Header */}
      <div className="p-3.5 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <Volleyball size={18} />
          </div>
          <div>
            <h3 className="font-black text-xs text-white uppercase tracking-wider leading-tight">Strumenti Tattici</h3>
            <span className="text-[10px] text-slate-400">Lavagna Intelligente</span>
          </div>
        </div>
        {isOpenMobile && (
          <button
            type="button"
            onClick={onCloseMobile}
            className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Main Tool Buttons Scrollable Area */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4 text-xs">
        {/* Undo / Redo & Clipboard Quick Actions */}
        <div className="grid grid-cols-4 gap-1.5 bg-slate-950/60 p-1.5 rounded-xl border border-slate-800">
          <button
            type="button"
            onClick={onUndo}
            disabled={!canUndo}
            className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-200 disabled:opacity-30 disabled:hover:bg-slate-800/80 flex items-center justify-center transition"
            title="Annulla (Ctrl+Z)"
          >
            <RotateCcw size={15} />
          </button>
          <button
            type="button"
            onClick={onRedo}
            disabled={!canRedo}
            className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-200 disabled:opacity-30 disabled:hover:bg-slate-800/80 flex items-center justify-center transition"
            title="Ripristina (Ctrl+Y)"
          >
            <RotateCw size={15} />
          </button>
          <button
            type="button"
            onClick={onCopy}
            disabled={!hasSelection}
            className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-200 disabled:opacity-30 disabled:hover:bg-slate-800/80 flex items-center justify-center transition"
            title="Copia elemento selezionato"
          >
            <Copy size={15} />
          </button>
          <button
            type="button"
            onClick={onPaste}
            className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-200 flex items-center justify-center transition"
            title="Incolla elemento"
          >
            <ClipboardPaste size={15} />
          </button>
        </div>

        {/* Automation & Templates */}
        <div className="space-y-1.5">
          <button
            type="button"
            onClick={onOpenTemplates}
            className="w-full py-2.5 px-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-600/20 transition flex items-center justify-center gap-2"
          >
            <Layers size={15} className="text-white" />
            <span>Schemi Preimpostati</span>
          </button>
        </div>

        {/* Quick Lineup Generators (Point 4) */}
        <div className="space-y-1.5 pt-1 border-t border-slate-800/80">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block px-1">
            Formazione Automatica
          </span>
          <div className="grid grid-cols-2 gap-1.5">
            <button
              type="button"
              onClick={onCreate6Players}
              className="py-1.5 px-2 bg-slate-800/90 hover:bg-slate-700 text-slate-300 rounded-lg text-[11px] font-semibold transition border border-slate-700/60 flex items-center justify-center gap-1.5"
              title="Disponi 6 giocatori in campo"
            >
              <Users size={13} />
              <span>6 Giocatori</span>
            </button>
            <button
              type="button"
              onClick={onCreate6PlayersWithLibero}
              className="py-1.5 px-2 bg-slate-800/90 hover:bg-slate-700 text-slate-300 rounded-lg text-[11px] font-semibold transition border border-slate-700/60 flex items-center justify-center gap-1.5"
              title="Disponi 6 giocatori + Libero"
            >
              <UserPlus size={13} className="text-amber-400" />
              <span>6 + Libero</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onOpenRotations}
            className="w-full py-2 px-2.5 bg-blue-950/70 hover:bg-blue-900/80 text-blue-200 border border-blue-800/80 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2"
          >
            <RotateCw size={14} className="text-blue-400" />
            <span>ROTAZIONE (P1 - P6)</span>
          </button>
        </div>

        {/* Palette Colori */}
        <div className="space-y-1.5 pt-1 border-t border-slate-800/80">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block px-1">
            Colore Elemento
          </span>
          <div className="flex items-center gap-1.5 flex-wrap px-1">
            {PALETTE_COLORS.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelectedColor(c.id)}
                style={{ backgroundColor: c.id }}
                className={`w-6 h-6 rounded-full border transition transform ${
                  selectedColor === c.id
                    ? 'scale-125 border-white ring-2 ring-blue-500 shadow-sm'
                    : 'border-slate-600 hover:scale-110 opacity-80 hover:opacity-100'
                }`}
                title={c.label}
              />
            ))}
          </div>
        </div>

        {/* Primary Interactive Tools */}
        <div className="space-y-1 pt-1 border-t border-slate-800/80">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block px-1 mb-1">
            Strumenti di Disegno
          </span>

          <div className="grid grid-cols-2 gap-1.5">
            {tools.map((t) => {
              const isActive = activeTool === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    setActiveTool(t.id);
                    if (isOpenMobile) onCloseMobile();
                  }}
                  className={`p-2 rounded-xl text-left font-medium text-xs transition flex items-center gap-2 border ${
                    isActive
                      ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-600/30'
                      : 'bg-slate-800/70 hover:bg-slate-750 text-slate-300 border-slate-800 hover:text-white'
                  }`}
                  title={t.label}
                >
                  <div className={`p-1 rounded-lg ${isActive ? 'bg-white/20' : 'bg-slate-900/60'}`}>
                    {t.icon}
                  </div>
                  <span className="truncate text-[11px]">{t.label.split(' ')[0]}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selection Actions & Delete */}
        <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
          <div className="grid grid-cols-2 gap-1.5">
            <button
              type="button"
              onClick={onDuplicate}
              disabled={!hasSelection}
              className="py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30 rounded-lg text-[11px] font-semibold transition"
            >
              Duplica
            </button>
            <button
              type="button"
              onClick={onSelectAll}
              className="py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[11px] font-semibold transition"
            >
              Seleziona Tutto
            </button>
          </div>

          <button
            type="button"
            onClick={onDeleteSelected}
            disabled={!hasSelection}
            className="w-full py-2 px-3 bg-red-950/60 hover:bg-red-900/70 text-red-300 border border-red-800/60 disabled:opacity-30 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
          >
            <Trash2 size={13} />
            <span>Elimina Selezione</span>
          </button>

          <button
            type="button"
            onClick={onClearAll}
            className="w-full py-1.5 px-3 text-slate-500 hover:text-red-400 text-[11px] font-semibold transition text-center"
          >
            Cancella Tutta la Lavagna
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <div className="hidden md:flex flex-shrink-0 h-full">{content}</div>

      {/* Mobile / Tablet Drawer Flyout */}
      {isOpenMobile && (
        <div className="md:hidden fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm animate-in fade-in flex">
          <div className="w-72 max-w-[85vw] h-full shadow-2xl animate-in slide-in-from-left">
            {content}
          </div>
          <div className="flex-1" onClick={onCloseMobile} />
        </div>
      )}
    </>
  );
};
