import React, { useState, useEffect, useRef } from 'react';
import {
  TacticalScene,
  BoardItem,
} from '../../types';
import {
  Play,
  Pause,
  Square,
  SkipBack,
  SkipForward,
  Plus,
  Copy,
  Trash2,
  Edit2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Sparkles,
} from 'lucide-react';

interface TimelineBottomProps {
  scenes: TacticalScene[];
  currentSceneIndex: number;
  onSelectScene: (index: number) => void;
  onAddScene: () => void;
  onDuplicateScene: (index: number) => void;
  onDeleteScene: (index: number) => void;
  onRenameScene: (index: number, newName: string) => void;
  onMoveScene: (fromIndex: number, toIndex: number) => void;
  onAnimateItems?: (interpolatedItems: BoardItem[]) => void;
  readOnly?: boolean;
}

export const TimelineBottom: React.FC<TimelineBottomProps> = ({
  scenes,
  currentSceneIndex,
  onSelectScene,
  onAddScene,
  onDuplicateScene,
  onDeleteScene,
  onRenameScene,
  onMoveScene,
  onAnimateItems,
  readOnly = false,
}) => {
  // Animation state
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1); // 0.5, 1, 1.5, 2
  const [editingSceneIndex, setEditingSceneIndex] = useState<number | null>(null);
  const [editNameText, setEditNameText] = useState('');

  const animFrameRef = useRef<number | null>(null);
  const animStartTimeRef = useRef<number>(0);
  const animPhaseIdxRef = useRef<number>(0);

  // Stop animation when unmounted or paused
  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  // Animation Loop with smooth player position interpolation between Phase N and Phase N+1
  const startAnimation = () => {
    if (scenes.length <= 1) return;
    setIsPlaying(true);
    animPhaseIdxRef.current = currentSceneIndex;
    animStartTimeRef.current = performance.now();

    const loop = (currentTime: number) => {
      const currentIdx = animPhaseIdxRef.current;
      const nextIdx = (currentIdx + 1) % scenes.length;

      const fromScene = scenes[currentIdx];
      const toScene = scenes[nextIdx];
      const durationMs = ((fromScene.durationSeconds || 2) * 1000) / playbackSpeed;
      const elapsed = currentTime - animStartTimeRef.current;
      const progress = Math.min(1, Math.max(0, elapsed / durationMs));

      // Ease in-out cubic interpolation
      const ease = progress < 0.5 ? 4 * progress * progress * progress : 1 - Math.pow(-2 * progress + 2, 3) / 2;

      // Interpolate items matching by ID
      if (onAnimateItems && fromScene && toScene) {
        const interpolated = fromScene.items.map((fromItem) => {
          const toItem = toScene.items.find((it) => it.id === fromItem.id);
          if (!toItem) return fromItem;

          const interX = fromItem.x + (toItem.x - fromItem.x) * ease;
          const interY = fromItem.y + (toItem.y - fromItem.y) * ease;
          const interEndX =
            fromItem.endX !== undefined && toItem.endX !== undefined
              ? fromItem.endX + (toItem.endX - fromItem.endX) * ease
              : toItem.endX;
          const interEndY =
            fromItem.endY !== undefined && toItem.endY !== undefined
              ? fromItem.endY + (toItem.endY - fromItem.endY) * ease
              : toItem.endY;

          return {
            ...toItem,
            x: Math.round(interX),
            y: Math.round(interY),
            endX: interEndX !== undefined ? Math.round(interEndX) : undefined,
            endY: interEndY !== undefined ? Math.round(interEndY) : undefined,
          };
        });

        onAnimateItems(interpolated);
      }

      if (progress >= 1) {
        // Step to next phase
        animPhaseIdxRef.current = nextIdx;
        animStartTimeRef.current = performance.now();
        onSelectScene(nextIdx);
      }

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);
  };

  const pauseAnimation = () => {
    setIsPlaying(false);
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
  };

  const stopAnimation = () => {
    pauseAnimation();
    onSelectScene(0);
  };

  const handlePrev = () => {
    pauseAnimation();
    const prev = (currentSceneIndex - 1 + scenes.length) % scenes.length;
    onSelectScene(prev);
  };

  const handleNext = () => {
    pauseAnimation();
    const next = (currentSceneIndex + 1) % scenes.length;
    onSelectScene(next);
  };

  const handleSaveRename = (index: number) => {
    if (editNameText.trim()) {
      onRenameScene(index, editNameText.trim());
    }
    setEditingSceneIndex(null);
  };

  return (
    <div className="bg-slate-900 border-t border-slate-800 text-white p-3 flex flex-col md:flex-row md:items-center justify-between gap-3 select-none flex-shrink-0">
      {/* Animation Controls (Play, Pause, Stop, Prev, Next, Speed) */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center bg-slate-950/70 p-1 rounded-xl border border-slate-800">
          <button
            type="button"
            onClick={handlePrev}
            disabled={scenes.length <= 1}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-30 transition"
            title="Fase precedente"
          >
            <SkipBack size={16} />
          </button>

          {!isPlaying ? (
            <button
              type="button"
              onClick={startAnimation}
              disabled={scenes.length <= 1}
              className="p-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-30 transition shadow-sm mx-1 flex items-center gap-1.5 font-bold text-xs"
              title="Avvia animazione sequenza"
            >
              <Play size={16} />
              <span className="hidden sm:inline">PLAY</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={pauseAnimation}
              className="p-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 transition shadow-sm mx-1 flex items-center gap-1.5 font-black text-xs"
              title="Metti in pausa"
            >
              <Pause size={16} />
              <span className="hidden sm:inline">PAUSA</span>
            </button>
          )}

          <button
            type="button"
            onClick={stopAnimation}
            disabled={scenes.length <= 1}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-30 transition"
            title="Stop animazione e torna a inizio"
          >
            <Square size={16} />
          </button>

          <button
            type="button"
            onClick={handleNext}
            disabled={scenes.length <= 1}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-30 transition"
            title="Fase successiva"
          >
            <SkipForward size={16} />
          </button>
        </div>

        {/* Speed Selector (0.5x, 1x, 1.5x, 2x) */}
        <div className="flex items-center bg-slate-950/70 p-1 rounded-xl border border-slate-800 gap-1 text-[11px] font-bold">
          {[0.5, 1, 1.5, 2].map((spd) => (
            <button
              key={spd}
              type="button"
              onClick={() => setPlaybackSpeed(spd)}
              className={`px-2 py-1 rounded-lg transition ${
                playbackSpeed === spd
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {spd}x
            </button>
          ))}
        </div>
      </div>

      {/* Phases Timeline Cards (1 -> 2 -> 3 -> 4 ...) */}
      <div className="flex-1 flex items-center gap-2 overflow-x-auto py-1 px-1 max-w-full">
        {scenes.map((scene, idx) => {
          const isActive = idx === currentSceneIndex;
          const isEditing = editingSceneIndex === idx;

          return (
            <div
              key={scene.id || idx}
              className={`flex-shrink-0 group flex items-center gap-2 p-2 rounded-xl border transition cursor-pointer ${
                isActive
                  ? 'bg-blue-600/30 border-blue-500 shadow-md text-white'
                  : 'bg-slate-800/80 border-slate-750 text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
              onClick={() => {
                pauseAnimation();
                onSelectScene(idx);
              }}
            >
              {/* Phase Badge */}
              <div
                className={`w-6 h-6 rounded-lg flex items-center justify-center font-black text-xs ${
                  isActive ? 'bg-blue-600 text-white' : 'bg-slate-900 text-slate-400'
                }`}
              >
                {idx + 1}
              </div>

              {/* Title / Rename input */}
              {isEditing ? (
                <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="text"
                    value={editNameText}
                    onChange={(e) => setEditNameText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveRename(idx);
                      if (e.key === 'Escape') setEditingSceneIndex(null);
                    }}
                    autoFocus
                    className="w-28 px-1.5 py-0.5 bg-slate-950 border border-blue-500 rounded text-xs text-white"
                  />
                  <button
                    type="button"
                    onClick={() => handleSaveRename(idx)}
                    className="px-1.5 py-0.5 bg-blue-600 text-white rounded text-[10px] font-bold"
                  >
                    OK
                  </button>
                </div>
              ) : (
                <div className="flex flex-col text-left max-w-[120px]">
                  <span className="font-bold text-xs truncate leading-tight">
                    {scene.name || `Fase ${idx + 1}`}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {scene.items?.length || 0} el.
                  </span>
                </div>
              )}

              {/* Actions on Phase (Rename, Duplicate, Move, Delete) */}
              {!readOnly && (
                <div className="flex items-center gap-0.5 opacity-80 group-hover:opacity-100">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingSceneIndex(idx);
                      setEditNameText(scene.name || `Fase ${idx + 1}`);
                    }}
                    className="p-1 hover:bg-white/10 rounded text-slate-400 hover:text-white"
                    title="Rinomina fase"
                  >
                    <Edit2 size={12} />
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDuplicateScene(idx);
                    }}
                    className="p-1 hover:bg-white/10 rounded text-slate-400 hover:text-white"
                    title="Duplica fase"
                  >
                    <Copy size={12} />
                  </button>

                  {idx > 0 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onMoveScene(idx, idx - 1);
                      }}
                      className="p-1 hover:bg-white/10 rounded text-slate-400 hover:text-white"
                      title="Sposta prima"
                    >
                      <ChevronLeft size={12} />
                    </button>
                  )}

                  {idx < scenes.length - 1 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onMoveScene(idx, idx + 1);
                      }}
                      className="p-1 hover:bg-white/10 rounded text-slate-400 hover:text-white"
                      title="Sposta dopo"
                    >
                      <ChevronRight size={12} />
                    </button>
                  )}

                  {scenes.length > 1 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteScene(idx);
                      }}
                      className="p-1 hover:bg-red-500/20 rounded text-slate-400 hover:text-red-400"
                      title="Elimina fase"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* Add New Phase Button */}
        {!readOnly && (
          <button
            type="button"
            onClick={onAddScene}
            className="flex-shrink-0 px-3 py-2 bg-slate-800 hover:bg-slate-750 text-blue-400 hover:text-blue-300 border border-slate-700 hover:border-blue-500/50 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
            title="Aggiungi una nuova fase alla sequenza"
          >
            <Plus size={15} />
            <span>Nuova Fase</span>
          </button>
        )}
      </div>
    </div>
  );
};
