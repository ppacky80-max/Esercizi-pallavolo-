import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  BoardItem,
  BoardElementType,
  TacticalBoardData,
  SistemaDiGioco,
  RuoloAtleta,
} from '../../types';
import {
  MousePointer,
  RotateCcw,
  Undo2,
  Trash2,
  MoveRight,
  Sparkles,
  Target,
  Circle,
  Triangle,
  ZoomIn,
  ZoomOut,
  Maximize2,
  X,
  Check,
} from 'lucide-react';

export type TacticalTool =
  | 'select'
  | 'player_s' // Schiacciatore
  | 'player_o' // Opposto
  | 'player_p' // Palleggiatore
  | 'player_c' // Centrale
  | 'player_l' // Libero
  | 'coach_t'  // Allenatore (T)
  | 'ball'     // Palla
  | 'cone'     // Cono
  | 'basket'   // Canestro / Cerchio bersaglio
  | 'arrow'    // Freccia
  | 'dashed_arrow' // Linea tratteggiata con freccia
  | 'curved_line'; // Linea curva

interface VolleyBoardProps {
  initialData?: string; // JSON string of TacticalBoardData
  externalItems?: BoardItem[]; // Directly controlled items (e.g. for volleyball rotations P1-P6 & phases)
  onChange?: (boardDataJson: string, previewDataUrl: string) => void;
  onBoardItemsChange?: (items: BoardItem[]) => void;
  readOnly?: boolean;
  teamRoster?: Array<{ id: string; nome: string; cognome: string; numeroMaglia: number; ruoloPrincipale: RuoloAtleta }>;
  initialSystem?: SistemaDiGioco;
}

const BOARD_WIDTH = 900;
const BOARD_HEIGHT = 500;

// Regulatory Court Dimensions in canvas coordinate system
const COURT_LEFT = 80;
const COURT_RIGHT = 820;
const COURT_TOP = 70;
const COURT_BOTTOM = 430;
const COURT_WIDTH = COURT_RIGHT - COURT_LEFT; // 740
const COURT_HEIGHT = COURT_BOTTOM - COURT_TOP; // 360
const NET_X = 450; // Center net
const ATTACK_LINE_LEFT = 330; // 3m line left side
const ATTACK_LINE_RIGHT = 570; // 3m line right side

const DEFAULT_COLORS = [
  { id: '#2563eb', label: 'Blu' },
  { id: '#ef4444', label: 'Rosso' },
  { id: '#f59e0b', label: 'Giallo' },
  { id: '#10b981', label: 'Verde' },
  { id: '#ffffff', label: 'Bianco' },
  { id: '#0f172a', label: 'Nero' },
];

export const VolleyBoard: React.FC<VolleyBoardProps> = ({
  initialData,
  externalItems,
  onChange,
  onBoardItemsChange,
  readOnly = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Core state
  const [items, setItems] = useState<BoardItem[]>(externalItems || []);
  const [history, setHistory] = useState<BoardItem[][]>([]);
  const [activeTool, setActiveTool] = useState<TacticalTool>('select');
  const [selectedColor, setSelectedColor] = useState<string>('#2563eb');
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Sync externalItems whenever they change
  useEffect(() => {
    if (externalItems) {
      setItems(externalItems);
      setSelectedItemId(null);
    }
  }, [externalItems]);

  // Interaction tracking state
  const [isInteracting, setIsInteracting] = useState(false);
  const [dragStartPos, setDragStartPos] = useState<{ x: number; y: number } | null>(null);
  const [tempLineItem, setTempLineItem] = useState<BoardItem | null>(null);
  const [draggedItemOffset, setDraggedItemOffset] = useState<{ offsetX: number; offsetY: number } | null>(null);
  const [dragHandle, setDragHandle] = useState<'start' | 'end' | 'control' | null>(null);

  // Load initial board data
  useEffect(() => {
    if (!initialData) return;
    try {
      const parsed: TacticalBoardData = JSON.parse(initialData);
      if (Array.isArray(parsed.items) && parsed.items.length > 0) {
        setItems(parsed.items);
      } else if (parsed.scenes && parsed.scenes.length > 0 && Array.isArray(parsed.scenes[0].items)) {
        setItems(parsed.scenes[0].items);
      }
    } catch (e) {
      console.warn('Errore parsing initialData VolleyBoard:', e);
    }
  }, [initialData]);

  // Push to history before mutating
  const pushHistory = useCallback((newItems: BoardItem[]) => {
    setHistory((prev) => [...prev.slice(-15), items]);
    setItems(newItems);
    onBoardItemsChange?.(newItems);
  }, [items, onBoardItemsChange]);

  // Undo action
  const handleUndo = useCallback(() => {
    if (history.length === 0) return;
    const last = history[history.length - 1];
    setHistory((prev) => prev.slice(0, prev.length - 1));
    setItems(last);
    onBoardItemsChange?.(last);
    setSelectedItemId(null);
  }, [history, onBoardItemsChange]);

  // Reset board
  const handleResetBoard = useCallback(() => {
    pushHistory([]);
    setSelectedItemId(null);
    setShowResetConfirm(false);
  }, [pushHistory]);

  // Quick Preset: 6 Giocatori Base (P, O, S1, S2, C1, L)
  const handleAddDefaultLineup = useCallback(() => {
    const baseLineup: BoardItem[] = [
      { id: 'p_p1', type: 'player', x: 200, y: 350, label: 'P', role: 'Palleggiatore', color: '#0284c7' },
      { id: 'p_o',  type: 'player', x: 380, y: 150, label: 'O', role: 'Opposto', color: '#7c3aed' },
      { id: 'p_s1', type: 'player', x: 380, y: 350, label: 'S1', role: 'Schiacciatore', color: '#2563eb' },
      { id: 'p_s2', type: 'player', x: 200, y: 150, label: 'S2', role: 'Schiacciatore', color: '#2563eb' },
      { id: 'p_c1', type: 'player', x: 380, y: 250, label: 'C1', role: 'Centrale', color: '#059669' },
      { id: 'p_l',  type: 'player', x: 200, y: 250, label: 'L', role: 'Libero', isLibero: true, color: '#facc15' },
    ];
    pushHistory([...items, ...baseLineup]);
    setActiveTool('select');
  }, [items, pushHistory]);

  // Export board data & preview URL to parent
  useEffect(() => {
    if (!onChange) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    let previewUrl = '';
    try {
      previewUrl = canvas.toDataURL('image/png', 0.85);
    } catch (err) {
      console.warn('Canvas toDataURL error:', err);
    }

    const payload: TacticalBoardData = {
      items,
      scenes: [
        {
          id: 'scene_main',
          name: 'Lavagna Tattica',
          durationSeconds: 2,
          items,
        },
      ],
      version: 2,
    };

    onChange(JSON.stringify(payload), previewUrl);
  }, [items, onChange]);

  // Convert client viewport coordinates to canvas coordinates (responsive scale)
  const getCanvasCoords = useCallback((e: React.MouseEvent | React.TouchEvent): { x: number; y: number } => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();

    let clientX = 0;
    let clientY = 0;

    if ('touches' in e && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else if ('changedTouches' in e && e.changedTouches.length > 0) {
      clientX = e.changedTouches[0].clientX;
      clientY = e.changedTouches[0].clientY;
    } else {
      const mouse = e as React.MouseEvent;
      clientX = mouse.clientX;
      clientY = mouse.clientY;
    }

    const scaleX = BOARD_WIDTH / rect.width;
    const scaleY = BOARD_HEIGHT / rect.height;

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  }, []);

  // Hit test to find element under cursor/touch
  const findItemAt = useCallback((x: number, y: number): { item: BoardItem | null; handle: 'start' | 'end' | 'control' | null } => {
    // Check backwards to select topmost item
    for (let i = items.length - 1; i >= 0; i--) {
      const item = items[i];

      // Lines & Arrows
      if (item.type === 'arrow' || item.type === 'dashed_line' || item.type === 'curved_arrow') {
        const startDist = Math.hypot(item.x - x, item.y - y);
        if (startDist <= 20) return { item, handle: 'start' };

        const endX = item.endX ?? item.x;
        const endY = item.endY ?? item.y;
        const endDist = Math.hypot(endX - x, endY - y);
        if (endDist <= 20) return { item, handle: 'end' };

        if (item.type === 'curved_arrow' && item.controlX !== undefined && item.controlY !== undefined) {
          const ctrlDist = Math.hypot(item.controlX - x, item.controlY - y);
          if (ctrlDist <= 20) return { item, handle: 'control' };
        }

        // Check proximity along segment
        const distToLine = distanceToSegment(x, y, item.x, item.y, endX, endY);
        if (distToLine <= 16) return { item, handle: null };
      } else {
        // Point tokens (players, coach, ball, cone, basket)
        const radius = item.type === 'ball' ? 16 : item.type === 'cone' ? 18 : 22;
        const dist = Math.hypot(item.x - x, item.y - y);
        if (dist <= radius + 5) {
          return { item, handle: null };
        }
      }
    }
    return { item: null, handle: null };
  }, [items]);

  // DRAW COURT & ITEMS ON CANVAS
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 1. Clear background
    ctx.clearRect(0, 0, BOARD_WIDTH, BOARD_HEIGHT);

    // 2. Out-of-bounds area (Surround Taraflex teal/blue)
    ctx.fillStyle = '#1e3a8a'; // Deep sports navy blue
    ctx.fillRect(0, 0, BOARD_WIDTH, BOARD_HEIGHT);

    // 3. Court Surface (Warm official volleyball Taraflex orange)
    ctx.fillStyle = '#df8338';
    ctx.fillRect(COURT_LEFT, COURT_TOP, COURT_WIDTH, COURT_HEIGHT);

    // 4. Boundary Lines (Crisp White, 3.5px width)
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3.5;
    ctx.lineJoin = 'miter';
    ctx.lineCap = 'butt';
    ctx.setLineDash([]);
    ctx.strokeRect(COURT_LEFT, COURT_TOP, COURT_WIDTH, COURT_HEIGHT);

    // 5. Center Line & Net Line (X = 450)
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(NET_X, COURT_TOP);
    ctx.lineTo(NET_X, COURT_BOTTOM);
    ctx.stroke();

    // 6. Attack Lines (3-meter lines)
    // Left side Attack line
    ctx.beginPath();
    ctx.moveTo(ATTACK_LINE_LEFT, COURT_TOP);
    ctx.lineTo(ATTACK_LINE_LEFT, COURT_BOTTOM);
    ctx.stroke();

    // Attack line dashed extensions beyond sidelines (FIVB rule 1.3.4)
    ctx.lineWidth = 2.5;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(ATTACK_LINE_LEFT, COURT_TOP);
    ctx.lineTo(ATTACK_LINE_LEFT, COURT_TOP - 20);
    ctx.moveTo(ATTACK_LINE_LEFT, COURT_BOTTOM);
    ctx.lineTo(ATTACK_LINE_LEFT, COURT_BOTTOM + 20);
    ctx.stroke();

    // Right side Attack line
    ctx.setLineDash([]);
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(ATTACK_LINE_RIGHT, COURT_TOP);
    ctx.lineTo(ATTACK_LINE_RIGHT, COURT_BOTTOM);
    ctx.stroke();

    // Right side extensions
    ctx.lineWidth = 2.5;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(ATTACK_LINE_RIGHT, COURT_TOP);
    ctx.lineTo(ATTACK_LINE_RIGHT, COURT_TOP - 20);
    ctx.moveTo(ATTACK_LINE_RIGHT, COURT_BOTTOM);
    ctx.lineTo(ATTACK_LINE_RIGHT, COURT_BOTTOM + 20);
    ctx.stroke();
    ctx.setLineDash([]);

    // 7. Subtle Court Zone Indicators (P1-P6)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.22)';
    ctx.font = 'bold 15px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('P4', 380, 130);
    ctx.fillText('P3', 380, 250);
    ctx.fillText('P2', 380, 370);
    ctx.fillText('P5', 200, 130);
    ctx.fillText('P6', 200, 250);
    ctx.fillText('P1', 200, 370);

    // 8. Net and Antennas
    // High-visibility Volleyball Net Mesh at center X = 450
    ctx.lineWidth = 6;
    ctx.strokeStyle = '#0f172a';
    ctx.beginPath();
    ctx.moveTo(NET_X, COURT_TOP - 12);
    ctx.lineTo(NET_X, COURT_BOTTOM + 12);
    ctx.stroke();

    // White Top Net Tape
    ctx.lineWidth = 3.5;
    ctx.strokeStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(NET_X - 1, COURT_TOP - 12);
    ctx.lineTo(NET_X - 1, COURT_BOTTOM + 12);
    ctx.stroke();

    // Net Antennas (Red & White stripes on top and bottom sidelines at X=450)
    drawAntenna(ctx, NET_X, COURT_TOP - 18, 18);
    drawAntenna(ctx, NET_X, COURT_BOTTOM, 18);

    // 9. DRAW BOARD ITEMS
    const allItemsToDraw = tempLineItem ? [...items, tempLineItem] : items;

    // Draw lines & arrows first (so players sit on top)
    allItemsToDraw.forEach((item) => {
      if (item.type === 'arrow' || item.type === 'dashed_line' || item.type === 'curved_arrow') {
        drawLineOrArrow(ctx, item, item.id === selectedItemId);
      }
    });

    // Draw tokens on top
    allItemsToDraw.forEach((item) => {
      if (item.type !== 'arrow' && item.type !== 'dashed_line' && item.type !== 'curved_arrow') {
        drawToken(ctx, item, item.id === selectedItemId);
      }
    });
  }, [items, tempLineItem, selectedItemId]);

  // START TOUCH / MOUSE INTERACTION
  const handlePointerDown = (e: React.MouseEvent | React.TouchEvent) => {
    if (readOnly) return;
    const { x, y } = getCanvasCoords(e);
    setIsInteracting(true);
    setDragStartPos({ x, y });

    // 1. SELECT MODE
    if (activeTool === 'select') {
      const hit = findItemAt(x, y);
      if (hit.item) {
        setSelectedItemId(hit.item.id);
        setDragHandle(hit.handle);
        setDraggedItemOffset({
          offsetX: x - hit.item.x,
          offsetY: y - hit.item.y,
        });
      } else {
        setSelectedItemId(null);
        setDragHandle(null);
        setDraggedItemOffset(null);
      }
      return;
    }

    // 2. LINE TOOLS (arrow, dashed_arrow, curved_line)
    if (activeTool === 'arrow' || activeTool === 'dashed_arrow' || activeTool === 'curved_line') {
      const lineType: BoardElementType =
        activeTool === 'arrow' ? 'arrow' : activeTool === 'dashed_arrow' ? 'dashed_line' : 'curved_arrow';

      const newLine: BoardItem = {
        id: 'line_' + Date.now(),
        type: lineType,
        x,
        y,
        endX: x,
        endY: y,
        controlX: x,
        controlY: y,
        color: selectedColor,
      };
      setTempLineItem(newLine);
      return;
    }

    // 3. TOKEN TOOLS (Player S, O, P, C, L, Coach T, Ball, Cone, Basket)
    let newItem: BoardItem | null = null;
    const id = 'item_' + Date.now();

    if (activeTool.startsWith('player_')) {
      const roleLetter = activeTool.replace('player_', '').toUpperCase();
      const isLibero = roleLetter === 'L';
      const roleMap: Record<string, RuoloAtleta> = {
        S: 'Schiacciatore',
        O: 'Opposto',
        P: 'Palleggiatore',
        C: 'Centrale',
        L: 'Libero',
      };

      newItem = {
        id,
        type: 'player',
        x,
        y,
        label: roleLetter,
        role: roleMap[roleLetter] || 'Schiacciatore',
        isLibero,
        color: isLibero ? '#facc15' : selectedColor,
      };
    } else if (activeTool === 'coach_t') {
      newItem = {
        id,
        type: 'coach',
        x,
        y,
        label: 'T',
        color: '#0f172a',
      };
    } else if (activeTool === 'ball') {
      newItem = {
        id,
        type: 'ball',
        x,
        y,
        color: '#facc15',
      };
    } else if (activeTool === 'cone') {
      newItem = {
        id,
        type: 'cone',
        x,
        y,
        color: '#f97316',
      };
    } else if (activeTool === 'basket') {
      newItem = {
        id,
        type: 'target_ring',
        x,
        y,
        color: '#ef4444',
      };
    }

    if (newItem) {
      pushHistory([...items, newItem]);
      setSelectedItemId(newItem.id);
      // Auto-switch to select mode so user can immediately reposition or place more
      setActiveTool('select');
      setIsInteracting(false);
    }
  };

  // MOVE TOUCH / MOUSE
  const handlePointerMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isInteracting || readOnly) return;
    const { x, y } = getCanvasCoords(e);

    // Drawing a new line/arrow
    if (tempLineItem) {
      const startX = tempLineItem.x;
      const startY = tempLineItem.y;

      let ctrlX = (startX + x) / 2;
      let ctrlY = (startY + y) / 2;

      // For curved line: compute default arc control point offset
      if (tempLineItem.type === 'curved_arrow') {
        const dx = x - startX;
        const dy = y - startY;
        const dist = Math.hypot(dx, dy);
        if (dist > 10) {
          // Perpendicular offset
          const perpX = -dy / dist;
          const perpY = dx / dist;
          const arcHeight = Math.min(60, dist * 0.35);
          ctrlX = (startX + x) / 2 + perpX * arcHeight;
          ctrlY = (startY + y) / 2 + perpY * arcHeight;
        }
      }

      setTempLineItem({
        ...tempLineItem,
        endX: x,
        endY: y,
        controlX: ctrlX,
        controlY: ctrlY,
      });
      return;
    }

    // Moving existing selected item
    if (selectedItemId) {
      setItems((prevItems) =>
        prevItems.map((item) => {
          if (item.id !== selectedItemId) return item;

          // Dragging line handles
          if (item.type === 'arrow' || item.type === 'dashed_line' || item.type === 'curved_arrow') {
            if (dragHandle === 'start') {
              return { ...item, x, y };
            } else if (dragHandle === 'end') {
              return { ...item, endX: x, endY: y };
            } else if (dragHandle === 'control') {
              return { ...item, controlX: x, controlY: y };
            }
          }

          // Dragging entire token or line
          if (draggedItemOffset) {
            const newX = Math.max(20, Math.min(BOARD_WIDTH - 20, x - draggedItemOffset.offsetX));
            const newY = Math.max(20, Math.min(BOARD_HEIGHT - 20, y - draggedItemOffset.offsetY));

            if (item.type === 'arrow' || item.type === 'dashed_line' || item.type === 'curved_arrow') {
              const dx = newX - item.x;
              const dy = newY - item.y;
              return {
                ...item,
                x: newX,
                y: newY,
                endX: (item.endX ?? item.x) + dx,
                endY: (item.endY ?? item.y) + dy,
                controlX: item.controlX !== undefined ? item.controlX + dx : undefined,
                controlY: item.controlY !== undefined ? item.controlY + dy : undefined,
              };
            }

            return {
              ...item,
              x: newX,
              y: newY,
            };
          }

          return item;
        })
      );
    }
  };

  // END TOUCH / MOUSE
  const handlePointerUp = () => {
    if (!isInteracting) return;
    setIsInteracting(false);
    setDragStartPos(null);
    setDraggedItemOffset(null);
    setDragHandle(null);

    // Finalize line if drawn
    if (tempLineItem) {
      const dist = Math.hypot(
        (tempLineItem.endX ?? tempLineItem.x) - tempLineItem.x,
        (tempLineItem.endY ?? tempLineItem.y) - tempLineItem.y
      );
      // Only keep if dragged for more than 15px
      if (dist > 15) {
        pushHistory([...items, tempLineItem]);
        setSelectedItemId(tempLineItem.id);
      }
      setTempLineItem(null);
      setActiveTool('select');
    }
  };

  // Delete selected item
  const handleDeleteSelected = () => {
    if (!selectedItemId) return;
    pushHistory(items.filter((it) => it.id !== selectedItemId));
    setSelectedItemId(null);
  };

  // Change color of selected item or future items
  const handleChangeColor = (color: string) => {
    setSelectedColor(color);
    if (selectedItemId) {
      setItems((prev) =>
        prev.map((it) => (it.id === selectedItemId ? { ...it, color } : it))
      );
    }
  };

  return (
    <div className="bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl p-3 sm:p-5 space-y-4 select-none">
      {/* RESPONSIVE TOUCH-FRIENDLY TOOLBAR */}
      <div className="flex flex-col gap-3">
        {/* Row 1: Giocatori (S, O, P, C, L) + Allenatore (T) */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
            <span className="text-[11px] font-black uppercase text-slate-400 mr-1 flex-shrink-0">
              Ruoli:
            </span>

            {/* S: Schiacciatore */}
            <button
              type="button"
              onClick={() => setActiveTool('player_s')}
              className={`min-w-[42px] h-10 px-2.5 rounded-xl font-black text-sm flex items-center justify-center gap-1.5 transition shadow-sm ${
                activeTool === 'player_s'
                  ? 'bg-blue-600 text-white ring-2 ring-blue-400 ring-offset-2 ring-offset-slate-900'
                  : 'bg-slate-800 hover:bg-slate-700 text-blue-400 border border-slate-700'
              }`}
              title="Schiacciatore (S)"
            >
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center">S</span>
              <span className="hidden sm:inline text-xs">Schiacciatore</span>
            </button>

            {/* O: Opposto */}
            <button
              type="button"
              onClick={() => setActiveTool('player_o')}
              className={`min-w-[42px] h-10 px-2.5 rounded-xl font-black text-sm flex items-center justify-center gap-1.5 transition shadow-sm ${
                activeTool === 'player_o'
                  ? 'bg-blue-600 text-white ring-2 ring-blue-400 ring-offset-2 ring-offset-slate-900'
                  : 'bg-slate-800 hover:bg-slate-700 text-indigo-400 border border-slate-700'
              }`}
              title="Opposto (O)"
            >
              <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-xs flex items-center justify-center">O</span>
              <span className="hidden sm:inline text-xs">Opposto</span>
            </button>

            {/* P: Palleggiatore */}
            <button
              type="button"
              onClick={() => setActiveTool('player_p')}
              className={`min-w-[42px] h-10 px-2.5 rounded-xl font-black text-sm flex items-center justify-center gap-1.5 transition shadow-sm ${
                activeTool === 'player_p'
                  ? 'bg-blue-600 text-white ring-2 ring-blue-400 ring-offset-2 ring-offset-slate-900'
                  : 'bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-slate-700'
              }`}
              title="Palleggiatore (P)"
            >
              <span className="w-5 h-5 rounded-full bg-cyan-600 text-white text-xs flex items-center justify-center">P</span>
              <span className="hidden sm:inline text-xs">Palleggiatore</span>
            </button>

            {/* C: Centrale */}
            <button
              type="button"
              onClick={() => setActiveTool('player_c')}
              className={`min-w-[42px] h-10 px-2.5 rounded-xl font-black text-sm flex items-center justify-center gap-1.5 transition shadow-sm ${
                activeTool === 'player_c'
                  ? 'bg-blue-600 text-white ring-2 ring-blue-400 ring-offset-2 ring-offset-slate-900'
                  : 'bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700'
              }`}
              title="Centrale (C)"
            >
              <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-xs flex items-center justify-center">C</span>
              <span className="hidden sm:inline text-xs">Centrale</span>
            </button>

            {/* L: Libero */}
            <button
              type="button"
              onClick={() => setActiveTool('player_l')}
              className={`min-w-[42px] h-10 px-2.5 rounded-xl font-black text-sm flex items-center justify-center gap-1.5 transition shadow-sm ${
                activeTool === 'player_l'
                  ? 'bg-amber-400 text-slate-950 ring-2 ring-amber-300 ring-offset-2 ring-offset-slate-900'
                  : 'bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700'
              }`}
              title="Libero (L) - Maglia contrastante"
            >
              <span className="w-5 h-5 rounded-full bg-amber-400 text-slate-950 text-xs font-black flex items-center justify-center">L</span>
              <span className="hidden sm:inline text-xs font-bold text-amber-300">Libero</span>
            </button>

            {/* T: Allenatore */}
            <button
              type="button"
              onClick={() => setActiveTool('coach_t')}
              className={`min-w-[42px] h-10 px-2.5 rounded-xl font-black text-sm flex items-center justify-center gap-1.5 transition shadow-sm ${
                activeTool === 'coach_t'
                  ? 'bg-amber-500 text-slate-950 ring-2 ring-amber-300 ring-offset-2 ring-offset-slate-900'
                  : 'bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700'
              }`}
              title="Allenatore (T)"
            >
              <span className="w-5 h-5 rounded-md bg-amber-500 text-slate-950 text-xs font-black flex items-center justify-center">T</span>
              <span className="hidden sm:inline text-xs">Allenatore</span>
            </button>
          </div>

          {/* Quick preset: 6 Giocatori Base */}
          <button
            type="button"
            onClick={handleAddDefaultLineup}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-slate-700 flex-shrink-0"
            title="Inserisci rapidamente 6 giocatori base"
          >
            <Sparkles size={14} className="text-amber-400" />
            <span className="hidden md:inline">Schiera 6 Base</span>
          </button>
        </div>

        {/* Row 2: Attrezzi (Palla, Cono, Canestro) + Frecce (Tratteggiata, Freccia, Curva) + Reset */}
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex flex-wrap items-center gap-1.5">
            {/* Strumento Seleziona / Sposta */}
            <button
              type="button"
              onClick={() => setActiveTool('select')}
              className={`h-10 px-3 rounded-xl font-bold text-xs flex items-center gap-1.5 transition ${
                activeTool === 'select'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
              }`}
              title="Sposta o seleziona elementi sulla lavagna"
            >
              <MousePointer size={16} />
              <span>Sposta</span>
            </button>

            <span className="w-px h-6 bg-slate-800 mx-1 hidden sm:block" />

            {/* Freccia */}
            <button
              type="button"
              onClick={() => setActiveTool('arrow')}
              className={`h-10 px-3 rounded-xl font-bold text-xs flex items-center gap-1.5 transition ${
                activeTool === 'arrow'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
              }`}
              title="Freccia continua"
            >
              <MoveRight size={16} />
              <span className="hidden xs:inline">Freccia</span>
            </button>

            {/* Linea tratteggiata con freccia */}
            <button
              type="button"
              onClick={() => setActiveTool('dashed_arrow')}
              className={`h-10 px-3 rounded-xl font-bold text-xs flex items-center gap-1.5 transition ${
                activeTool === 'dashed_arrow'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
              }`}
              title="Linea tratteggiata con freccia"
            >
              <span className="font-mono text-sm tracking-tighter">┄➔</span>
              <span className="hidden xs:inline">Tratteggiata</span>
            </button>

            {/* Linea curva */}
            <button
              type="button"
              onClick={() => setActiveTool('curved_line')}
              className={`h-10 px-3 rounded-xl font-bold text-xs flex items-center gap-1.5 transition ${
                activeTool === 'curved_line'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
              }`}
              title="Linea curva con freccia (traiettoria arcuata)"
            >
              <span className="font-mono text-sm">⤳</span>
              <span className="hidden xs:inline">Curva</span>
            </button>

            <span className="w-px h-6 bg-slate-800 mx-1 hidden sm:block" />

            {/* Palla */}
            <button
              type="button"
              onClick={() => setActiveTool('ball')}
              className={`h-10 px-3 rounded-xl font-bold text-xs flex items-center gap-1.5 transition ${
                activeTool === 'ball'
                  ? 'bg-amber-500 text-slate-950 ring-2 ring-amber-300'
                  : 'bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700'
              }`}
              title="Palla da pallavolo"
            >
              <span className="text-sm">🏐</span>
              <span className="hidden xs:inline">Palla</span>
            </button>

            {/* Cono */}
            <button
              type="button"
              onClick={() => setActiveTool('cone')}
              className={`h-10 px-3 rounded-xl font-bold text-xs flex items-center gap-1.5 transition ${
                activeTool === 'cone'
                  ? 'bg-orange-500 text-white ring-2 ring-orange-300'
                  : 'bg-slate-800 hover:bg-slate-700 text-orange-400 border border-slate-700'
              }`}
              title="Cono d'allenamento"
            >
              <Triangle size={15} className="fill-orange-400 text-orange-400" />
              <span className="hidden xs:inline">Cono</span>
            </button>

            {/* Canestro */}
            <button
              type="button"
              onClick={() => setActiveTool('basket')}
              className={`h-10 px-3 rounded-xl font-bold text-xs flex items-center gap-1.5 transition ${
                activeTool === 'basket'
                  ? 'bg-red-600 text-white ring-2 ring-red-400'
                  : 'bg-slate-800 hover:bg-slate-700 text-red-400 border border-slate-700'
              }`}
              title="Canestro / Cerchio bersaglio d'allenamento"
            >
              <Target size={16} />
              <span className="hidden xs:inline">Canestro</span>
            </button>
          </div>

          {/* Color palette & Actions (Undo, Delete, Reset) */}
          <div className="flex items-center gap-2">
            {/* Color Palette */}
            <div className="flex items-center gap-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700">
              {DEFAULT_COLORS.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => handleChangeColor(c.id)}
                  className={`w-6 h-6 rounded-full transition ${
                    selectedColor === c.id
                      ? 'ring-2 ring-white scale-110'
                      : 'opacity-70 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: c.id }}
                  title={`Colore ${c.label}`}
                />
              ))}
            </div>

            {/* Undo */}
            <button
              type="button"
              onClick={handleUndo}
              disabled={history.length === 0}
              className="w-10 h-10 bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30 rounded-xl flex items-center justify-center transition border border-slate-700"
              title="Annulla ultima azione"
            >
              <Undo2 size={16} />
            </button>

            {/* Delete selected item */}
            {selectedItemId && (
              <button
                type="button"
                onClick={handleDeleteSelected}
                className="w-10 h-10 bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white rounded-xl flex items-center justify-center transition border border-red-500/40"
                title="Elimina elemento selezionato"
              >
                <Trash2 size={16} />
              </button>
            )}

            {/* Bottone RESET */}
            <button
              type="button"
              onClick={() => setShowResetConfirm(true)}
              className="h-10 px-3.5 bg-red-600/90 hover:bg-red-600 text-white rounded-xl font-black text-xs transition flex items-center gap-1.5 shadow-md shadow-red-600/30 flex-shrink-0"
              title="Pulisci e resetta completamente la lavagna tattica"
            >
              <RotateCcw size={15} />
              <span>RESET</span>
            </button>
          </div>
        </div>
      </div>

      {/* CONFIRM RESET MODAL / DIALOG */}
      {showResetConfirm && (
        <div className="p-3 bg-red-950/70 border border-red-500/50 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-red-200 animate-in fade-in">
          <div className="text-xs">
            <strong className="text-white block font-bold">Resettare la lavagna tattica?</strong>
            Tutti i giocatori, le frecce e gli attrezzi posizionati verranno cancellati.
          </div>
          <div className="flex items-center gap-2 self-end sm:self-center">
            <button
              type="button"
              onClick={() => setShowResetConfirm(false)}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold"
            >
              Annulla
            </button>
            <button
              type="button"
              onClick={handleResetBoard}
              className="px-3.5 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-black shadow"
            >
              Sì, Resetta
            </button>
          </div>
        </div>
      )}

      {/* CANVAS CONTAINER (Touch & Tablet Responsive) */}
      <div className="relative w-full rounded-2xl overflow-hidden shadow-2xl border-2 border-slate-700/80 bg-slate-950 flex items-center justify-center">
        <canvas
          ref={canvasRef}
          width={BOARD_WIDTH}
          height={BOARD_HEIGHT}
          onMouseDown={handlePointerDown}
          onMouseMove={handlePointerMove}
          onMouseUp={handlePointerUp}
          onTouchStart={handlePointerDown}
          onTouchMove={handlePointerMove}
          onTouchEnd={handlePointerUp}
          className="w-full h-auto aspect-[18/10] max-h-[70vh] sm:max-h-[580px] cursor-crosshair touch-none select-none block"
          style={{ touchAction: 'none' }}
        />

        {/* Small Mobile Hint Overlay */}
        <div className="absolute bottom-2 left-3 pointer-events-none text-[10px] text-white/50 bg-slate-950/60 px-2 py-0.5 rounded-md backdrop-blur-sm hidden sm:block">
          Tocca per inserire • Trascina per disegnare frecce o spostare
        </div>
      </div>

      {/* ITEM EDIT HELPER (If item selected) */}
      {selectedItemId && (
        <div className="p-3 bg-slate-800/90 rounded-2xl border border-slate-700 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white">Elemento selezionato:</span>
            <span className="bg-blue-600/30 text-blue-300 px-2 py-0.5 rounded font-mono font-bold">
              {items.find((it) => it.id === selectedItemId)?.label || items.find((it) => it.id === selectedItemId)?.type}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDeleteSelected}
              className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1"
            >
              <Trash2 size={13} />
              <span>Elimina</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedItemId(null)}
              className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl text-xs font-bold transition"
            >
              Deseleziona
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ==========================================
// CANVAS DRAWING HELPER FUNCTIONS
// ==========================================

// Draw player, coach, ball, cone, basket tokens
function drawToken(ctx: CanvasRenderingContext2D, item: BoardItem, isSelected: boolean) {
  const { x, y } = item;

  // Selected Halo / Ring
  if (isSelected) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, 28, 0, Math.PI * 2);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 3;
    ctx.setLineDash([4, 4]);
    ctx.stroke();
    ctx.restore();
  }

  // 1. GIOCATORE (S, O, P, C, L)
  if (item.type === 'player') {
    const isLibero = item.isLibero || item.label === 'L';
    const radius = 20;

    // Drop shadow
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
    ctx.shadowBlur = 6;
    ctx.shadowOffsetY = 3;

    // Circle Body
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = isLibero ? '#facc15' : item.color || '#2563eb';
    ctx.fill();
    ctx.restore();

    // Border
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = isLibero ? '#0f172a' : '#ffffff';
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.stroke();

    // Role text (P, S1, S2, C1, C2, L, O)
    ctx.fillStyle = isLibero ? '#0f172a' : '#ffffff';
    const labelText = item.label || 'P';
    ctx.font = labelText.length > 2 ? '900 12px sans-serif' : labelText.length === 2 ? '900 13px sans-serif' : '900 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(labelText, x, y + 0.5);
    return;
  }

  // 2. ALLENATORE (T)
  if (item.type === 'coach') {
    const size = 20;

    // Drop shadow
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 6;
    ctx.shadowOffsetY = 3;

    // Hexagon / Rounded square badge
    ctx.beginPath();
    ctx.roundRect(x - size, y - size, size * 2, size * 2, 8);
    ctx.fillStyle = '#0f172a';
    ctx.fill();
    ctx.restore();

    // Gold / Amber border
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#f59e0b';
    ctx.beginPath();
    ctx.roundRect(x - size, y - size, size * 2, size * 2, 8);
    ctx.stroke();

    // Bold "T"
    ctx.fillStyle = '#f59e0b';
    ctx.font = '900 18px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('T', x, y);
    return;
  }

  // 3. PALLA (Volleyball)
  if (item.type === 'ball') {
    const radius = 14;

    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
    ctx.shadowBlur = 5;
    ctx.shadowOffsetY = 2;

    // Base circle
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.restore();

    // Blue & Yellow Volleyball swirl pattern
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = '#0284c7';
    ctx.fillStyle = '#0284c7';

    // Panel 1
    ctx.beginPath();
    ctx.arc(x, y, radius, 0.2, 1.8);
    ctx.lineTo(x, y);
    ctx.fill();

    // Panel 2
    ctx.fillStyle = '#eab308';
    ctx.beginPath();
    ctx.arc(x, y, radius, 2.3, 3.9);
    ctx.lineTo(x, y);
    ctx.fill();

    // Panel 3
    ctx.fillStyle = '#0284c7';
    ctx.beginPath();
    ctx.arc(x, y, radius, 4.4, 6.0);
    ctx.lineTo(x, y);
    ctx.fill();

    // Seams and outer ring
    ctx.lineWidth = 1.8;
    ctx.strokeStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.stroke();
    return;
  }

  // 4. CONO (Cone)
  if (item.type === 'cone') {
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.35)';
    ctx.shadowBlur = 5;
    ctx.shadowOffsetY = 2;

    // Orange Cone body
    ctx.beginPath();
    ctx.moveTo(x, y - 18);
    ctx.lineTo(x + 14, y + 12);
    ctx.lineTo(x - 14, y + 12);
    ctx.closePath();
    ctx.fillStyle = '#f97316';
    ctx.fill();
    ctx.restore();

    // Reflective white stripe across cone
    ctx.beginPath();
    ctx.moveTo(x - 6, y - 2);
    ctx.lineTo(x + 6, y - 2);
    ctx.lineTo(x + 9, y + 5);
    ctx.lineTo(x - 9, y + 5);
    ctx.closePath();
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    // Cone base ring
    ctx.beginPath();
    ctx.ellipse(x, y + 13, 16, 4, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#ea580c';
    ctx.fill();
    return;
  }

  // 5. CANESTRO (Target basket / cerchio bersaglio)
  if (item.type === 'target_ring') {
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
    ctx.shadowBlur = 6;
    ctx.shadowOffsetY = 3;

    // Target Base / Pole
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x, y + 5);
    ctx.lineTo(x, y + 20);
    ctx.moveTo(x - 12, y + 20);
    ctx.lineTo(x + 12, y + 20);
    ctx.stroke();

    // Basket Mesh (tapered grid)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x - 16, y);
    ctx.lineTo(x - 7, y + 14);
    ctx.lineTo(x + 7, y + 14);
    ctx.lineTo(x + 16, y);
    ctx.stroke();

    // Target Hoop Ring (Red / Orange)
    ctx.beginPath();
    ctx.ellipse(x, y, 18, 9, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(239, 68, 68, 0.25)';
    ctx.fill();
    ctx.lineWidth = 3.5;
    ctx.strokeStyle = '#ef4444';
    ctx.stroke();

    ctx.restore();
    return;
  }
}

// Draw line, arrow, dashed arrow, or curved trajectory
function drawLineOrArrow(ctx: CanvasRenderingContext2D, item: BoardItem, isSelected: boolean) {
  const startX = item.x;
  const startY = item.y;
  const endX = item.endX ?? item.x;
  const endY = item.endY ?? item.y;
  const color = item.color || '#ffffff';

  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = isSelected ? 4.5 : 3.5;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  if (item.type === 'dashed_line') {
    ctx.setLineDash([8, 6]);
  } else {
    ctx.setLineDash([]);
  }

  // Draw Path
  ctx.beginPath();
  ctx.moveTo(startX, startY);

  if (item.type === 'curved_arrow' && item.controlX !== undefined && item.controlY !== undefined) {
    ctx.quadraticCurveTo(item.controlX, item.controlY, endX, endY);
    ctx.stroke();

    // Arrowhead along tangent at end of bezier curve
    const tangentAngle = Math.atan2(endY - item.controlY, endX - item.controlX);
    ctx.setLineDash([]);
    drawArrowHead(ctx, endX, endY, tangentAngle, 14, color);

    // If selected, show control handle
    if (isSelected) {
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(item.controlX, item.controlY, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  } else {
    ctx.lineTo(endX, endY);
    ctx.stroke();

    // Arrowhead
    const angle = Math.atan2(endY - startY, endX - startX);
    ctx.setLineDash([]);
    drawArrowHead(ctx, endX, endY, angle, 14, color);
  }

  // Draw handles if selected
  if (isSelected) {
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(startX, startY, 5, 0, Math.PI * 2);
    ctx.arc(endX, endY, 5, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

// Arrowhead triangle helper
function drawArrowHead(ctx: CanvasRenderingContext2D, x: number, y: number, angle: number, size: number, color: string) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(-size, -size * 0.55);
  ctx.lineTo(-size * 0.7, 0);
  ctx.lineTo(-size, size * 0.55);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.restore();
}

// Net antenna with alternating red & white segments
function drawAntenna(ctx: CanvasRenderingContext2D, x: number, y: number, height: number) {
  const stripeH = height / 4;
  for (let i = 0; i < 4; i++) {
    ctx.fillStyle = i % 2 === 0 ? '#ef4444' : '#ffffff';
    ctx.fillRect(x - 2, y + i * stripeH, 4, stripeH);
  }
}

// Distance from point to line segment
function distanceToSegment(px: number, py: number, x1: number, y1: number, x2: number, y2: number): number {
  const l2 = (x2 - x1) ** 2 + (y2 - y1) ** 2;
  if (l2 === 0) return Math.hypot(px - x1, py - y1);
  let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (x1 + t * (x2 - x1)), py - (y1 + t * (y2 - y1)));
}
