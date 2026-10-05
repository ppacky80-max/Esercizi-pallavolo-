import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  BoardItem,
  BoardElementType,
  CourtViewMode,
  CourtTheme,
  TacticalLayer,
  TacticalBoardTool,
} from '../../types';

interface CourtCanvasProps {
  items: BoardItem[];
  selectedItemId: string | null;
  activeTool: TacticalBoardTool;
  selectedColor: string;
  courtView: CourtViewMode;
  courtTheme: CourtTheme;
  showZoneNumbers: boolean;
  layersState: Record<TacticalLayer, { visible: boolean; locked: boolean }>;
  onSelectItem: (id: string | null) => void;
  onUpdateItems: (items: BoardItem[]) => void;
  onItemChange: (item: BoardItem) => void;
  readOnly?: boolean;
}

export const CANVAS_WIDTH = 900;
export const CANVAS_HEIGHT = 500;

// Court coordinates in the 900x500 space
export const COURT_LEFT = 80;
export const COURT_RIGHT = 820;
export const COURT_TOP = 70;
export const COURT_BOTTOM = 430;
export const COURT_WIDTH = COURT_RIGHT - COURT_LEFT; // 740
export const COURT_HEIGHT = COURT_BOTTOM - COURT_TOP; // 360
export const NET_X = 450;
export const ATTACK_LINE_LEFT = 330;
export const ATTACK_LINE_RIGHT = 570;

export const CourtCanvas: React.FC<CourtCanvasProps> = ({
  items,
  selectedItemId,
  activeTool,
  selectedColor,
  courtView,
  courtTheme,
  showZoneNumbers,
  layersState,
  onSelectItem,
  onUpdateItems,
  onItemChange,
  readOnly = false,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Dragging and interaction state
  const [dragState, setDragState] = useState<{
    itemId: string;
    startX: number;
    startY: number;
    itemStartX: number;
    itemStartY: number;
    handleType?: 'item' | 'end' | 'control' | 'resize';
    linkedArrowIds?: string[];
  } | null>(null);

  // Active freehand stroke currently being drawn
  const [freehandPoints, setFreehandPoints] = useState<Array<{ x: number; y: number }>>([]);
  const [isDrawing, setIsDrawing] = useState(false);

  // Helper to convert screen coordinates to Canvas coordinate system
  const getCanvasCoords = useCallback((e: React.PointerEvent<HTMLCanvasElement>): { x: number; y: number } => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = CANVAS_WIDTH / rect.width;
    const scaleY = CANVAS_HEIGHT / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }, []);

  // Check if item layer is visible and unlocked
  const isItemInteractable = useCallback((item: BoardItem): boolean => {
    if (item.visible === false || item.locked) return false;
    const layer = item.layer || (item.type === 'player' ? 'giocatori' : item.type === 'ball' ? 'palla' : 'movimenti');
    const layerConfig = layersState[layer];
    if (layerConfig && (!layerConfig.visible || layerConfig.locked)) return false;
    return true;
  }, [layersState]);

  // Main canvas render loop
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // High DPI crispness
    const dpr = window.devicePixelRatio || 1;
    if (canvas.width !== CANVAS_WIDTH * dpr || canvas.height !== CANVAS_HEIGHT * dpr) {
      canvas.width = CANVAS_WIDTH * dpr;
      canvas.height = CANVAS_HEIGHT * dpr;
    }
    ctx.resetTransform();
    ctx.scale(dpr, dpr);

    // Apply view transform if in half-court mode
    ctx.save();
    if (courtView === 'squadra') {
      // Zoom into left half court
      ctx.translate(-30, 0);
      ctx.scale(1.4, 1.4);
      ctx.translate(-40, -40);
    }

    // 1. Background Floor & Court
    drawVolleyballCourt(ctx, courtTheme, showZoneNumbers, courtView);

    // 2. Render Layers in Order
    // Order: Zones -> Arrows/Trajectories -> Freehand -> Equipment -> Players -> Ball -> Text
    const orderedItems = [...items].sort((a, b) => {
      const typeRank = (t: BoardElementType) => {
        if (t === 'attack_zone' || t === 'defense_zone' || t === 'coverage_area') return 1;
        if (t === 'arrow' || t === 'curved_arrow' || t === 'dashed_line' || t === 'ball_trajectory') return 2;
        if (t === 'freehand') return 3;
        if (t === 'cone' || t === 'plinth' || t === 'target_ring' || t === 'block_unit') return 4;
        if (t === 'coach') return 5;
        if (t === 'player' || t === 'opponent_player') return 6;
        if (t === 'ball') return 7;
        return 8; // text
      };
      return typeRank(a.type) - typeRank(b.type);
    });

    for (const item of orderedItems) {
      // Check layer visibility
      const layer = item.layer || (item.type === 'player' ? 'giocatori' : item.type === 'ball' ? 'palla' : 'movimenti');
      if (layersState[layer] && !layersState[layer].visible) continue;
      if (item.visible === false) continue;

      drawBoardItem(ctx, item, item.id === selectedItemId);
    }

    // 3. Render Active Freehand stroke
    if (isDrawing && freehandPoints.length > 1) {
      ctx.save();
      ctx.strokeStyle = selectedColor || '#ef4444';
      ctx.lineWidth = 3.5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(freehandPoints[0].x, freehandPoints[0].y);
      for (let i = 1; i < freehandPoints.length; i++) {
        ctx.lineTo(freehandPoints[i].x, freehandPoints[i].y);
      }
      ctx.stroke();
      ctx.restore();
    }

    ctx.restore();
  }, [items, selectedItemId, courtTheme, showZoneNumbers, courtView, layersState, isDrawing, freehandPoints, selectedColor]);

  useEffect(() => {
    renderCanvas();
  }, [renderCanvas]);

  // Pointer Down (Mouse, Touch, Pen)
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (readOnly) return;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    const { x, y } = getCanvasCoords(e);

    // Eraser Tool
    if (activeTool === 'eraser') {
      const hit = findHitItem(items, x, y);
      if (hit) {
        onUpdateItems(items.filter((it) => it.id !== hit.id));
        if (selectedItemId === hit.id) onSelectItem(null);
      }
      return;
    }

    // Freehand Drawing Tool
    if (activeTool === 'draw') {
      setIsDrawing(true);
      setFreehandPoints([{ x, y }]);
      return;
    }

    // If activeTool is a creation tool, create the new element on click/drag
    if (activeTool !== 'select') {
      const newItem = createNewBoardItem(activeTool, x, y, selectedColor, items);
      if (newItem) {
        const nextItems = [...items, newItem];
        onUpdateItems(nextItems);
        onSelectItem(newItem.id);

        // If it's an arrow, initiate dragging its endpoint immediately!
        if (newItem.type === 'arrow' || newItem.type === 'curved_arrow' || newItem.type === 'dashed_line' || newItem.type === 'ball_trajectory') {
          setDragState({
            itemId: newItem.id,
            startX: x,
            startY: y,
            itemStartX: newItem.x,
            itemStartY: newItem.y,
            handleType: 'end',
          });
        }
      }
      return;
    }

    // Tool is 'select': check for handles (control points for curved arrows or end points)
    const selectedItem = items.find((it) => it.id === selectedItemId);
    if (selectedItem) {
      // Check curve control handle
      if (selectedItem.controlX !== undefined && selectedItem.controlY !== undefined) {
        const distControl = Math.hypot(x - selectedItem.controlX, y - selectedItem.controlY);
        if (distControl < 16) {
          setDragState({
            itemId: selectedItem.id,
            startX: x,
            startY: y,
            itemStartX: selectedItem.controlX,
            itemStartY: selectedItem.controlY,
            handleType: 'control',
          });
          return;
        }
      }
      // Check arrow endpoint handle
      if (selectedItem.endX !== undefined && selectedItem.endY !== undefined) {
        const distEnd = Math.hypot(x - selectedItem.endX, y - selectedItem.endY);
        if (distEnd < 16) {
          setDragState({
            itemId: selectedItem.id,
            startX: x,
            startY: y,
            itemStartX: selectedItem.endX,
            itemStartY: selectedItem.endY,
            handleType: 'end',
          });
          return;
        }
      }
      // Check zone resize handle
      if (selectedItem.width !== undefined && selectedItem.height !== undefined) {
        const handleX = selectedItem.x + selectedItem.width;
        const handleY = selectedItem.y + selectedItem.height;
        if (Math.hypot(x - handleX, y - handleY) < 16) {
          setDragState({
            itemId: selectedItem.id,
            startX: x,
            startY: y,
            itemStartX: selectedItem.width,
            itemStartY: selectedItem.height,
            handleType: 'resize',
          });
          return;
        }
      }
    }

    // Check hit on existing items
    const hit = findHitItem(items, x, y);
    if (hit && isItemInteractable(hit)) {
      onSelectItem(hit.id);

      // Find arrows linked to this player so they follow along smoothly!
      const linkedArrows = items
        .filter((it) => it.linkedPlayerId === hit.id)
        .map((it) => it.id);

      setDragState({
        itemId: hit.id,
        startX: x,
        startY: y,
        itemStartX: hit.x,
        itemStartY: hit.y,
        handleType: 'item',
        linkedArrowIds: linkedArrows,
      });
    } else {
      onSelectItem(null);
    }
  };

  // Pointer Move
  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (readOnly) return;
    const { x, y } = getCanvasCoords(e);

    // Freehand drawing in progress
    if (isDrawing && activeTool === 'draw') {
      setFreehandPoints((prev) => [...prev, { x, y }]);
      return;
    }

    // Eraser while moving
    if (activeTool === 'eraser' && (e.buttons & 1) === 1) {
      const hit = findHitItem(items, x, y);
      if (hit) {
        onUpdateItems(items.filter((it) => it.id !== hit.id));
        if (selectedItemId === hit.id) onSelectItem(null);
      }
      return;
    }

    // Dragging an item or handle
    if (!dragState) return;

    const dx = x - dragState.startX;
    const dy = y - dragState.startY;

    const targetItem = items.find((it) => it.id === dragState.itemId);
    if (!targetItem) return;

    if (dragState.handleType === 'control') {
      const updated = {
        ...targetItem,
        controlX: Math.round(dragState.itemStartX + dx),
        controlY: Math.round(dragState.itemStartY + dy),
      };
      onItemChange(updated);
      return;
    }

    if (dragState.handleType === 'end') {
      const updated = {
        ...targetItem,
        endX: Math.round(dragState.itemStartX + dx),
        endY: Math.round(dragState.itemStartY + dy),
      };
      onItemChange(updated);
      return;
    }

    if (dragState.handleType === 'resize') {
      const updated = {
        ...targetItem,
        width: Math.max(30, Math.round(dragState.itemStartX + dx)),
        height: Math.max(30, Math.round(dragState.itemStartY + dy)),
      };
      onItemChange(updated);
      return;
    }

    // Default: Moving the entire item
    const newX = Math.round(Math.max(20, Math.min(CANVAS_WIDTH - 20, dragState.itemStartX + dx)));
    const newY = Math.round(Math.max(20, Math.min(CANVAS_HEIGHT - 20, dragState.itemStartY + dy)));

    const itemDx = newX - targetItem.x;
    const itemDy = newY - targetItem.y;

    let updatedList = items.map((it) => {
      if (it.id === targetItem.id) {
        const up = { ...it, x: newX, y: newY };
        // If it's an arrow, translate endpoint too
        if (it.endX !== undefined && it.endY !== undefined) {
          up.endX = it.endX + itemDx;
          up.endY = it.endY + itemDy;
        }
        if (it.controlX !== undefined && it.controlY !== undefined) {
          up.controlX = it.controlX + itemDx;
          up.controlY = it.controlY + itemDy;
        }
        return up;
      }
      // If arrow is linked to this moving player, move its start point
      if (dragState.linkedArrowIds?.includes(it.id)) {
        return {
          ...it,
          x: it.x + itemDx,
          y: it.y + itemDy,
          controlX: it.controlX !== undefined ? it.controlX + itemDx : undefined,
          controlY: it.controlY !== undefined ? it.controlY + itemDy : undefined,
        };
      }
      return it;
    });

    onUpdateItems(updatedList);
  };

  // Pointer Up
  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (readOnly) return;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}

    // Complete freehand drawing stroke into a new BoardItem
    if (isDrawing && freehandPoints.length > 1) {
      const freehandItem: BoardItem = {
        id: `pen_${Date.now()}`,
        type: 'freehand',
        x: freehandPoints[0].x,
        y: freehandPoints[0].y,
        color: selectedColor || '#ef4444',
        strokeWidth: 3.5,
        points: freehandPoints,
        visible: true,
        locked: false,
        layer: 'testo',
      };
      onUpdateItems([...items, freehandItem]);
      setIsDrawing(false);
      setFreehandPoints([]);
      return;
    }

    setIsDrawing(false);
    setDragState(null);
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full flex items-center justify-center select-none overflow-hidden touch-none"
    >
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: '100%',
          maxHeight: '100%',
          objectFit: 'contain',
          aspectRatio: '900 / 500',
        }}
        className={`rounded-2xl shadow-xl transition-shadow ${
          activeTool === 'eraser'
            ? 'cursor-not-allowed'
            : activeTool === 'draw'
            ? 'cursor-crosshair'
            : activeTool !== 'select'
            ? 'cursor-crosshair'
            : dragState
            ? 'cursor-grabbing'
            : 'cursor-grab'
        }`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      />
    </div>
  );
};

// ================= DRAWING FUNCTIONS =================

function drawVolleyballCourt(
  ctx: CanvasRenderingContext2D,
  theme: CourtTheme,
  showZoneNumbers: boolean,
  courtView: CourtViewMode
) {
  // Theme color maps
  let floorColor = '#1e3a8a';
  let outColor = '#0f172a';
  let lineColor = '#ffffff';

  if (theme === 'taraflex') {
    floorColor = '#f97316'; // Classic Taraflex Orange
    outColor = '#15803d'; // Green free zone
    lineColor = '#ffffff';
  } else if (theme === 'parquet') {
    floorColor = '#d97706'; // Wood parquet
    outColor = '#92400e';
    lineColor = '#ffffff';
  } else if (theme === 'blu_fivb') {
    floorColor = '#0284c7'; // FIVB Sky Blue
    outColor = '#f97316'; // Orange surround
    lineColor = '#ffffff';
  } else if (theme === 'stampa') {
    floorColor = '#ffffff';
    outColor = '#f1f5f9';
    lineColor = '#0f172a';
  }

  // 1. Surrounding Free Zone
  ctx.fillStyle = outColor;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // 2. Main Court Floor (18m x 9m regulation proportions -> 740 x 360 px)
  ctx.fillStyle = floorColor;
  ctx.shadowColor = 'rgba(0,0,0,0.15)';
  ctx.shadowBlur = 12;
  ctx.fillRect(COURT_LEFT, COURT_TOP, COURT_WIDTH, COURT_HEIGHT);
  ctx.shadowBlur = 0;

  // 3. Court Boundary Lines (5 cm regulation -> 3px)
  ctx.strokeStyle = lineColor;
  ctx.lineWidth = 3;
  ctx.strokeRect(COURT_LEFT, COURT_TOP, COURT_WIDTH, COURT_HEIGHT);

  // 4. Center Line (under the net)
  ctx.beginPath();
  ctx.moveTo(NET_X, COURT_TOP);
  ctx.lineTo(NET_X, COURT_BOTTOM);
  ctx.stroke();

  // 5. 3-Meter Attack Lines (at 3m from net on each side)
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  // Team A (left) 3m line
  ctx.moveTo(ATTACK_LINE_LEFT, COURT_TOP);
  ctx.lineTo(ATTACK_LINE_LEFT, COURT_BOTTOM);
  // Team B (right) 3m line
  ctx.moveTo(ATTACK_LINE_RIGHT, COURT_TOP);
  ctx.lineTo(ATTACK_LINE_RIGHT, COURT_BOTTOM);
  ctx.stroke();

  // FIPAV Attack Line Extension Dashes outside sidelines
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  // Left side extensions
  ctx.moveTo(ATTACK_LINE_LEFT, COURT_TOP - 22);
  ctx.lineTo(ATTACK_LINE_LEFT, COURT_TOP);
  ctx.moveTo(ATTACK_LINE_LEFT, COURT_BOTTOM);
  ctx.lineTo(ATTACK_LINE_LEFT, COURT_BOTTOM + 22);
  // Right side extensions
  ctx.moveTo(ATTACK_LINE_RIGHT, COURT_TOP - 22);
  ctx.lineTo(ATTACK_LINE_RIGHT, COURT_TOP);
  ctx.moveTo(ATTACK_LINE_RIGHT, COURT_BOTTOM);
  ctx.lineTo(ATTACK_LINE_RIGHT, COURT_BOTTOM + 22);
  ctx.stroke();
  ctx.setLineDash([]); // reset

  // 6. Service Zone Dashes behind Baselines (20 cm dashes)
  ctx.lineWidth = 2;
  ctx.beginPath();
  // Left baseline service marks
  ctx.moveTo(COURT_LEFT - 15, COURT_TOP);
  ctx.lineTo(COURT_LEFT, COURT_TOP);
  ctx.moveTo(COURT_LEFT - 15, COURT_BOTTOM);
  ctx.lineTo(COURT_LEFT, COURT_BOTTOM);
  // Right baseline service marks
  ctx.moveTo(COURT_RIGHT, COURT_TOP);
  ctx.lineTo(COURT_RIGHT + 15, COURT_TOP);
  ctx.moveTo(COURT_RIGHT, COURT_BOTTOM);
  ctx.lineTo(COURT_RIGHT + 15, COURT_BOTTOM);
  ctx.stroke();

  // 7. Zone Numbers (P1 to P6) watermarked on the floor
  if (showZoneNumbers) {
    ctx.save();
    ctx.fillStyle = theme === 'stampa' ? 'rgba(0,0,0,0.18)' : 'rgba(255,255,255,0.22)';
    ctx.font = '900 24px -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Left Team Court (Standard zones: P1, P6, P5 in back; P2, P3, P4 in front)
    ctx.fillText('1', 190, 350);
    ctx.fillText('6', 180, 250);
    ctx.fillText('5', 190, 150);
    ctx.fillText('4', 380, 150);
    ctx.fillText('3', 390, 250);
    ctx.fillText('2', 380, 350);

    // Right Opponent Court (Mirror zones)
    if (courtView !== 'squadra') {
      ctx.fillText('1', 710, 150);
      ctx.fillText('6', 720, 250);
      ctx.fillText('5', 710, 350);
      ctx.fillText('4', 520, 350);
      ctx.fillText('3', 510, 250);
      ctx.fillText('2', 520, 150);
    }
    ctx.restore();
  }

  // 8. The Net (Rete Regolamentare)
  // Drawn with white top band, dark mesh pattern, and red/white striped antennae (antenne)
  ctx.save();
  // Mesh body
  ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
  ctx.fillRect(NET_X - 3.5, COURT_TOP - 20, 7, COURT_HEIGHT + 40);

  // Mesh horizontal cross-threads
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.lineWidth = 1;
  for (let ny = COURT_TOP - 18; ny <= COURT_BOTTOM + 18; ny += 8) {
    ctx.beginPath();
    ctx.moveTo(NET_X - 3, ny);
    ctx.lineTo(NET_X + 3, ny);
    ctx.stroke();
  }

  // Net Top White Band
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(NET_X - 4.5, COURT_TOP - 22, 9, 5);
  ctx.fillRect(NET_X - 4.5, COURT_BOTTOM + 17, 9, 5);

  // Antennae (Antenne FIPAV): Red and white striped rods on both sidelines
  drawAntenna(ctx, NET_X, COURT_TOP);
  drawAntenna(ctx, NET_X, COURT_BOTTOM);

  ctx.restore();
}

function drawAntenna(ctx: CanvasRenderingContext2D, netX: number, sidelineY: number) {
  const isTop = sidelineY === COURT_TOP;
  const startY = isTop ? sidelineY - 35 : sidelineY + 5;
  const length = 30;
  const numStripes = 6;
  const stripeH = length / numStripes;

  for (let i = 0; i < numStripes; i++) {
    ctx.fillStyle = i % 2 === 0 ? '#ef4444' : '#ffffff';
    ctx.fillRect(netX - 2, startY + i * stripeH, 4, stripeH);
  }
}

// Draw individual board item (Player, Ball, Arrow, Zone, Cone, Text, etc.)
function drawBoardItem(ctx: CanvasRenderingContext2D, item: BoardItem, isSelected: boolean) {
  ctx.save();

  switch (item.type) {
    case 'player':
    case 'opponent_player':
      drawPlayer(ctx, item, isSelected);
      break;
    case 'coach':
      drawCoach(ctx, item, isSelected);
      break;
    case 'ball':
      drawBall(ctx, item, isSelected);
      break;
    case 'arrow':
    case 'curved_arrow':
    case 'dashed_line':
    case 'ball_trajectory':
      drawArrow(ctx, item, isSelected);
      break;
    case 'attack_zone':
    case 'defense_zone':
    case 'coverage_area':
      drawZone(ctx, item, isSelected);
      break;
    case 'cone':
      drawCone(ctx, item, isSelected);
      break;
    case 'plinth':
      drawPlinth(ctx, item, isSelected);
      break;
    case 'block_unit':
      drawBlockUnit(ctx, item, isSelected);
      break;
    case 'tactical_label':
      drawText(ctx, item, isSelected);
      break;
    case 'freehand':
      drawFreehand(ctx, item, isSelected);
      break;
    default:
      break;
  }

  // Draw Selection Halo and Handles
  if (isSelected) {
    drawSelectionRing(ctx, item);
  }

  ctx.restore();
}

function drawPlayer(ctx: CanvasRenderingContext2D, item: BoardItem, isSelected: boolean) {
  const radius = item.size || (item.isLibero ? 19 : 20);
  const color = item.color || (item.isLibero ? '#f59e0b' : '#2563eb');

  // Facing Angle Direction Pointer (small arrow showing body orientation)
  if (item.facingAngle !== undefined) {
    const angleRad = (item.facingAngle * Math.PI) / 180;
    const tipX = item.x + Math.cos(angleRad) * (radius + 8);
    const tipY = item.y + Math.sin(angleRad) * (radius + 8);
    ctx.beginPath();
    ctx.moveTo(tipX, tipY);
    ctx.lineTo(
      item.x + Math.cos(angleRad + 2.5) * (radius + 2),
      item.y + Math.sin(angleRad + 2.5) * (radius + 2)
    );
    ctx.lineTo(
      item.x + Math.cos(angleRad - 2.5) * (radius + 2),
      item.y + Math.sin(angleRad - 2.5) * (radius + 2)
    );
    ctx.closePath();
    ctx.fillStyle = '#ffffff';
    ctx.fill();
  }

  // Circular Badge Shadow
  ctx.shadowColor = 'rgba(0, 0, 0, 0.35)';
  ctx.shadowBlur = 8;
  ctx.shadowOffsetY = 3;

  // Circle Fill
  ctx.beginPath();
  ctx.arc(item.x, item.y, radius, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.shadowBlur = 0;

  // White Border
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = '#ffffff';
  ctx.stroke();

  // Number / Label in the center
  ctx.fillStyle = '#ffffff';
  ctx.font = '900 15px -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const labelText = item.number !== undefined ? String(item.number) : item.label || '1';
  ctx.fillText(labelText, item.x, item.y);

  // Role Pill below (P, O, S1, S2, C1, C2, L, U)
  if (item.role) {
    const roleLetter =
      item.role === 'Palleggiatore'
        ? 'P'
        : item.role === 'Opposto'
        ? 'O'
        : item.role === 'Centrale'
        ? 'C'
        : item.role === 'Libero'
        ? 'L'
        : item.role === 'Schiacciatore'
        ? 'S'
        : 'U';

    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(item.x + radius - 4, item.y - radius + 4, 7.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 9px sans-serif';
    ctx.fillText(roleLetter, item.x + radius - 4, item.y - radius + 4);
  }

  // Player Name Label under player if present
  if (item.playerName) {
    ctx.font = 'bold 10px sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(0,0,0,0.8)';
    ctx.shadowBlur = 4;
    ctx.fillText(item.playerName, item.x, item.y + radius + 11);
    ctx.shadowBlur = 0;
  }
}

function drawCoach(ctx: CanvasRenderingContext2D, item: BoardItem, isSelected: boolean) {
  const size = 18;
  ctx.shadowColor = 'rgba(0, 0, 0, 0.35)';
  ctx.shadowBlur = 6;
  ctx.fillStyle = item.color || '#0f172a';

  // Hexagon shape for Coach
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const angle = (i * Math.PI) / 3;
    const px = item.x + size * Math.cos(angle);
    const py = item.y + size * Math.sin(angle);
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
  ctx.shadowBlur = 0;

  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.stroke();

  // 'ALL' or 'T'
  ctx.fillStyle = '#ffffff';
  ctx.font = '900 12px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('ALL', item.x, item.y);
}

function drawBall(ctx: CanvasRenderingContext2D, item: BoardItem, isSelected: boolean) {
  const radius = 12;
  ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
  ctx.shadowBlur = 6;
  ctx.shadowOffsetY = 2;

  // Mikasa style volleyball: yellow background with blue curved wave patterns
  ctx.beginPath();
  ctx.arc(item.x, item.y, radius, 0, Math.PI * 2);
  ctx.fillStyle = '#fbbf24'; // Yellow
  ctx.fill();
  ctx.shadowBlur = 0;

  // Blue swirl
  ctx.beginPath();
  ctx.arc(item.x - 2, item.y, radius * 0.7, -0.6, 1.2);
  ctx.lineTo(item.x + 2, item.y + 4);
  ctx.fillStyle = '#1d4ed8'; // Blue
  ctx.fill();

  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1.8;
  ctx.stroke();
}

function drawArrow(ctx: CanvasRenderingContext2D, item: BoardItem, isSelected: boolean) {
  const startX = item.x;
  const startY = item.y;
  const endX = item.endX !== undefined ? item.endX : startX + 60;
  const endY = item.endY !== undefined ? item.endY : startY;
  const color = item.color || '#ef4444';
  const lineWidth = item.strokeWidth || 3.5;
  const isDashed = item.dashed || item.type === 'dashed_line' || item.type === 'ball_trajectory';

  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  if (isDashed) {
    ctx.setLineDash([7, 5]);
  } else {
    ctx.setLineDash([]);
  }

  // Draw arrow path: quadratic curve if control points exist, else straight line
  ctx.beginPath();
  ctx.moveTo(startX, startY);

  if (item.controlX !== undefined && item.controlY !== undefined) {
    ctx.quadraticCurveTo(item.controlX, item.controlY, endX, endY);
    ctx.stroke();

    // Arrow tip angle based on tangent at end of bezier curve
    const t = 0.98;
    const tangentX = 2 * (1 - t) * (item.controlX - startX) + 2 * t * (endX - item.controlX);
    const tangentY = 2 * (1 - t) * (item.controlY - startY) + 2 * t * (endY - item.controlY);
    drawArrowHead(ctx, endX, endY, Math.atan2(tangentY, tangentX), lineWidth);
  } else {
    ctx.lineTo(endX, endY);
    ctx.stroke();
    drawArrowHead(ctx, endX, endY, Math.atan2(endY - startY, endX - startX), lineWidth);
  }

  ctx.setLineDash([]); // reset

  // If selected, draw draggable control points
  if (isSelected) {
    // End handle
    ctx.beginPath();
    ctx.arc(endX, endY, 6, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.strokeStyle = '#2563eb';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Curve control handle
    if (item.controlX !== undefined && item.controlY !== undefined) {
      ctx.beginPath();
      ctx.arc(item.controlX, item.controlY, 6, 0, Math.PI * 2);
      ctx.fillStyle = '#f59e0b';
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Guide dashed lines to control handle
      ctx.setLineDash([3, 3]);
      ctx.strokeStyle = 'rgba(255,255,255,0.5)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(item.controlX, item.controlY);
      ctx.lineTo(endX, endY);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }
}

function drawArrowHead(ctx: CanvasRenderingContext2D, tipX: number, tipY: number, angle: number, lineWidth: number) {
  const headLength = Math.max(12, lineWidth * 3.2);
  ctx.save();
  ctx.translate(tipX, tipY);
  ctx.rotate(angle);

  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(-headLength, -headLength * 0.45);
  ctx.lineTo(-headLength * 0.75, 0);
  ctx.lineTo(-headLength, headLength * 0.45);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

function drawZone(ctx: CanvasRenderingContext2D, item: BoardItem, isSelected: boolean) {
  const width = item.width || 120;
  const height = item.height || 80;
  const color = item.color || '#3b82f6';
  const opacity = item.opacity !== undefined ? item.opacity : 0.28;

  ctx.save();
  ctx.fillStyle = hexToRgba(color, opacity);
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;

  if (item.zoneShape === 'circolare') {
    const radius = Math.min(width, height) / 2;
    ctx.beginPath();
    ctx.arc(item.x + radius, item.y + radius, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  } else {
    // Rounded rectangle
    const r = 8;
    ctx.beginPath();
    ctx.roundRect(item.x, item.y, width, height, r);
    ctx.fill();
    ctx.stroke();
  }

  // Label inside zone
  if (item.text || item.label) {
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(item.text || item.label || '', item.x + width / 2, item.y + height / 2);
  }

  // Resize handle if selected
  if (isSelected) {
    const rx = item.x + width;
    const ry = item.y + height;
    ctx.beginPath();
    ctx.arc(rx, ry, 6, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.strokeStyle = '#2563eb';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  ctx.restore();
}

function drawCone(ctx: CanvasRenderingContext2D, item: BoardItem, isSelected: boolean) {
  const size = 16;
  ctx.shadowColor = 'rgba(0, 0, 0, 0.35)';
  ctx.shadowBlur = 5;

  ctx.beginPath();
  ctx.moveTo(item.x, item.y - size);
  ctx.lineTo(item.x - size * 0.75, item.y + size * 0.75);
  ctx.lineTo(item.x + size * 0.75, item.y + size * 0.75);
  ctx.closePath();
  ctx.fillStyle = item.color || '#ea580c'; // Orange
  ctx.fill();
  ctx.shadowBlur = 0;

  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // White base stripe
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(item.x - size * 0.4, item.y + size * 0.1, size * 0.8, 4);
}

function drawPlinth(ctx: CanvasRenderingContext2D, item: BoardItem, isSelected: boolean) {
  const w = item.width || 44;
  const h = item.height || 26;
  ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
  ctx.shadowBlur = 6;
  ctx.fillStyle = item.color || '#78350f'; // Wood plinth
  ctx.fillRect(item.x, item.y, w, h);
  ctx.shadowBlur = 0;

  ctx.strokeStyle = '#d97706';
  ctx.lineWidth = 2;
  ctx.strokeRect(item.x, item.y, w, h);

  // Top cushion
  ctx.fillStyle = '#b45309';
  ctx.fillRect(item.x + 2, item.y + 2, w - 4, 6);
}

function drawBlockUnit(ctx: CanvasRenderingContext2D, item: BoardItem, isSelected: boolean) {
  // Two pairs of hands raised for blocking at the net
  const w = 48;
  const h = 24;
  ctx.fillStyle = '#ef4444';
  ctx.fillRect(item.x - w / 2, item.y - h / 2, w, h);
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.strokeRect(item.x - w / 2, item.y - h / 2, w, h);

  ctx.fillStyle = '#ffffff';
  ctx.font = '900 11px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('MURO', item.x, item.y);
}

function drawText(ctx: CanvasRenderingContext2D, item: BoardItem, isSelected: boolean) {
  const fontSize = item.fontSize || 14;
  const isBold = item.isBold !== false;
  ctx.font = `${isBold ? 'bold' : 'normal'} ${fontSize}px sans-serif`;
  ctx.fillStyle = item.color || '#ffffff';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
  ctx.shadowBlur = 4;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText(item.text || item.label || 'Nota', item.x, item.y);
  ctx.shadowBlur = 0;
}

function drawFreehand(ctx: CanvasRenderingContext2D, item: BoardItem, isSelected: boolean) {
  if (!item.points || item.points.length < 2) return;
  ctx.strokeStyle = item.color || '#ef4444';
  ctx.lineWidth = item.strokeWidth || 3.5;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  ctx.beginPath();
  ctx.moveTo(item.points[0].x, item.points[0].y);
  for (let i = 1; i < item.points.length; i++) {
    ctx.lineTo(item.points[i].x, item.points[i].y);
  }
  ctx.stroke();
}

function drawSelectionRing(ctx: CanvasRenderingContext2D, item: BoardItem) {
  ctx.save();
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 2.5;
  ctx.setLineDash([4, 4]);

  if (item.type === 'player' || item.type === 'opponent_player') {
    const r = (item.size || 20) + 6;
    ctx.beginPath();
    ctx.arc(item.x, item.y, r, 0, Math.PI * 2);
    ctx.stroke();
  } else if (item.type === 'ball') {
    ctx.beginPath();
    ctx.arc(item.x, item.y, 18, 0, Math.PI * 2);
    ctx.stroke();
  } else if (item.type === 'attack_zone' || item.type === 'defense_zone' || item.type === 'coverage_area') {
    const w = item.width || 120;
    const h = item.height || 80;
    ctx.strokeRect(item.x - 4, item.y - 4, w + 8, h + 8);
  } else if (item.type === 'cone' || item.type === 'coach' || item.type === 'plinth' || item.type === 'block_unit') {
    ctx.beginPath();
    ctx.arc(item.x, item.y, 24, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.restore();
}

// Hit-testing helper
function findHitItem(items: BoardItem[], x: number, y: number): BoardItem | null {
  // Test in reverse order (top items first)
  for (let i = items.length - 1; i >= 0; i--) {
    const item = items[i];
    if (item.visible === false) continue;

    // Players, coach, ball
    if (item.type === 'player' || item.type === 'opponent_player' || item.type === 'coach') {
      const radius = item.size || 20;
      if (Math.hypot(x - item.x, y - item.y) <= radius + 5) return item;
    } else if (item.type === 'ball') {
      if (Math.hypot(x - item.x, y - item.y) <= 18) return item;
    } else if (item.type === 'cone') {
      if (Math.hypot(x - item.x, y - item.y) <= 22) return item;
    } else if (item.type === 'plinth') {
      const w = item.width || 44;
      const h = item.height || 26;
      if (x >= item.x && x <= item.x + w && y >= item.y && y <= item.y + h) return item;
    } else if (item.type === 'block_unit') {
      if (Math.hypot(x - item.x, y - item.y) <= 28) return item;
    } else if (item.type === 'attack_zone' || item.type === 'defense_zone' || item.type === 'coverage_area') {
      const w = item.width || 120;
      const h = item.height || 80;
      if (x >= item.x && x <= item.x + w && y >= item.y && y <= item.y + h) return item;
    } else if (item.type === 'arrow' || item.type === 'curved_arrow' || item.type === 'dashed_line' || item.type === 'ball_trajectory') {
      const startX = item.x;
      const startY = item.y;
      const endX = item.endX !== undefined ? item.endX : startX + 60;
      const endY = item.endY !== undefined ? item.endY : startY;
      // Distance from point to segment
      const dist = distanceToSegment(x, y, startX, startY, endX, endY);
      if (dist < 14) return item;
      // Also check control handle if curved
      if (item.controlX !== undefined && item.controlY !== undefined) {
        if (Math.hypot(x - item.controlX, y - item.controlY) < 14) return item;
      }
    } else if (item.type === 'tactical_label') {
      if (Math.hypot(x - item.x, y - item.y) < 30) return item;
    } else if (item.type === 'freehand') {
      if (item.points) {
        for (const pt of item.points) {
          if (Math.hypot(x - pt.x, y - pt.y) < 12) return item;
        }
      }
    }
  }
  return null;
}

function distanceToSegment(px: number, py: number, x1: number, y1: number, x2: number, y2: number): number {
  const l2 = (x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1);
  if (l2 === 0) return Math.hypot(px - x1, py - y1);
  let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (x1 + t * (x2 - x1)), py - (y1 + t * (y2 - y1)));
}

function createNewBoardItem(
  tool: TacticalBoardTool,
  x: number,
  y: number,
  color: string,
  existingItems: BoardItem[]
): BoardItem | null {
  const id = `item_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

  switch (tool) {
    case 'player': {
      const playerCount = existingItems.filter((i) => i.type === 'player' && !i.isLibero).length + 1;
      return {
        id,
        type: 'player',
        x: Math.round(x),
        y: Math.round(y),
        color: color || '#2563eb',
        number: playerCount,
        label: String(playerCount),
        role: 'Schiacciatore',
        layer: 'giocatori',
        visible: true,
        locked: false,
      };
    }
    case 'libero': {
      return {
        id,
        type: 'player',
        x: Math.round(x),
        y: Math.round(y),
        color: '#f59e0b',
        number: 'L',
        label: 'L',
        role: 'Libero',
        isLibero: true,
        layer: 'giocatori',
        visible: true,
        locked: false,
      };
    }
    case 'coach': {
      return {
        id,
        type: 'coach',
        x: Math.round(x),
        y: Math.round(y),
        color: '#0f172a',
        label: 'ALL',
        layer: 'attrezzatura',
        visible: true,
        locked: false,
      };
    }
    case 'ball': {
      return {
        id,
        type: 'ball',
        x: Math.round(x),
        y: Math.round(y),
        color: '#ffffff',
        layer: 'palla',
        ballAction: 'posizione',
        visible: true,
        locked: false,
      };
    }
    case 'arrow': {
      return {
        id,
        type: 'arrow',
        x: Math.round(x),
        y: Math.round(y),
        endX: Math.round(x + 70),
        endY: Math.round(y),
        color: color || '#ef4444',
        strokeWidth: 3.5,
        arrowType: 'movimento',
        layer: 'movimenti',
        visible: true,
        locked: false,
      };
    }
    case 'curved_arrow': {
      return {
        id,
        type: 'curved_arrow',
        x: Math.round(x),
        y: Math.round(y),
        endX: Math.round(x + 80),
        endY: Math.round(y + 20),
        controlX: Math.round(x + 40),
        controlY: Math.round(y - 35),
        color: color || '#f59e0b',
        strokeWidth: 3.5,
        arrowType: 'movimento',
        layer: 'movimenti',
        visible: true,
        locked: false,
      };
    }
    case 'dashed_arrow': {
      return {
        id,
        type: 'dashed_line',
        x: Math.round(x),
        y: Math.round(y),
        endX: Math.round(x + 70),
        endY: Math.round(y),
        color: color || '#3b82f6',
        strokeWidth: 3,
        dashed: true,
        arrowType: 'movimento_previsto',
        layer: 'movimenti',
        visible: true,
        locked: false,
      };
    }
    case 'ball_trajectory': {
      return {
        id,
        type: 'ball_trajectory',
        x: Math.round(x),
        y: Math.round(y),
        endX: Math.round(x + 100),
        endY: Math.round(y),
        color: '#f59e0b',
        strokeWidth: 3.5,
        dashed: true,
        arrowType: 'traiettoria_palla',
        layer: 'traiettorie',
        visible: true,
        locked: false,
      };
    }
    case 'highlight_zone': {
      return {
        id,
        type: 'attack_zone',
        x: Math.round(x - 60),
        y: Math.round(y - 40),
        width: 120,
        height: 80,
        color: color || '#3b82f6',
        opacity: 0.3,
        zoneType: 'attacco',
        zoneShape: 'rettangolare',
        layer: 'zone',
        text: 'Zona Attacco',
        visible: true,
        locked: false,
      };
    }
    case 'cone': {
      return {
        id,
        type: 'cone',
        x: Math.round(x),
        y: Math.round(y),
        color: '#ea580c',
        layer: 'attrezzatura',
        visible: true,
        locked: false,
      };
    }
    case 'plinth': {
      return {
        id,
        type: 'plinth',
        x: Math.round(x - 22),
        y: Math.round(y - 13),
        width: 44,
        height: 26,
        color: '#78350f',
        layer: 'attrezzatura',
        visible: true,
        locked: false,
      };
    }
    case 'block': {
      return {
        id,
        type: 'block_unit',
        x: Math.round(x),
        y: Math.round(y),
        layer: 'attrezzatura',
        visible: true,
        locked: false,
      };
    }
    case 'text': {
      const promptText = window.prompt('Inserisci testo annotazione:', 'Nota tattica');
      if (!promptText) return null;
      return {
        id,
        type: 'tactical_label',
        x: Math.round(x),
        y: Math.round(y),
        text: promptText,
        color: color || '#ffffff',
        fontSize: 14,
        layer: 'testo',
        visible: true,
        locked: false,
      };
    }
    default:
      return null;
  }
}

function hexToRgba(hex: string, alpha: number): string {
  let c = hex.replace('#', '');
  if (c.length === 3) {
    c = c[0] + c[0] + c[1] + c[1] + c[2] + c[2];
  }
  const num = parseInt(c, 16);
  return `rgba(${(num >> 16) & 255}, ${(num >> 8) & 255}, ${num & 255}, ${alpha})`;
}
