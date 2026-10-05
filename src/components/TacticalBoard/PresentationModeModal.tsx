import React, { useState, useEffect, useRef } from 'react';
import {
  TacticalBoardData,
  TacticalScene,
  BoardItem,
  CourtTheme,
} from '../../types';
import {
  Play,
  Pause,
  Square,
  SkipBack,
  SkipForward,
  Maximize2,
  Minimize2,
  X,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { CourtCanvas } from './CourtCanvas';

interface PresentationModeModalProps {
  isOpen: boolean;
  onClose: () => void;
  boardData: TacticalBoardData;
  courtTheme: CourtTheme;
}

export const PresentationModeModal: React.FC<PresentationModeModalProps> = ({
  isOpen,
  onClose,
  boardData,
  courtTheme,
}) => {
  const [currentSceneIdx, setCurrentSceneIdx] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [animatedItems, setAnimatedItems] = useState<BoardItem[]>([]);

  const scenes = boardData.scenes && boardData.scenes.length > 0
    ? boardData.scenes
    : [{ id: 'sc_single', name: 'Schema Tattico', durationSeconds: 2, items: boardData.items }];

  const animFrameRef = useRef<number | null>(null);
  const animStartTimeRef = useRef<number>(0);
  const animPhaseIdxRef = useRef<number>(0);

  useEffect(() => {
    if (isOpen) {
      setCurrentSceneIdx(0);
      setIsPlaying(false);
      setAnimatedItems(scenes[0]?.items || []);
    }
  }, [isOpen]);

  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  const activeScene = scenes[currentSceneIdx] || scenes[0];
  const itemsToRender = animatedItems.length > 0 ? animatedItems : activeScene.items;

  // Animation Loop with smooth interpolation
  const startAnimation = () => {
    if (scenes.length <= 1) return;
    setIsPlaying(true);
    animPhaseIdxRef.current = currentSceneIdx;
    animStartTimeRef.current = performance.now();

    const loop = (currentTime: number) => {
      const currentIdx = animPhaseIdxRef.current;
      const nextIdx = (currentIdx + 1) % scenes.length;

      const fromScene = scenes[currentIdx];
      const toScene = scenes[nextIdx];
      const durationMs = ((fromScene.durationSeconds || 2) * 1000) / playbackSpeed;
      const elapsed = currentTime - animStartTimeRef.current;
      const progress = Math.min(1, Math.max(0, elapsed / durationMs));

      const ease = progress < 0.5 ? 4 * progress * progress * progress : 1 - Math.pow(-2 * progress + 2, 3) / 2;

      if (fromScene && toScene) {
        const interpolated = fromScene.items.map((fromItem) => {
          const toItem = toScene.items.find((it) => it.id === fromItem.id);
          if (!toItem) return fromItem;

          const interX = fromItem.x + (toItem.x - fromItem.x) * ease;
          const interY = fromItem.y + (toItem.y - fromItem.y) * ease;
          return {
            ...toItem,
            x: Math.round(interX),
            y: Math.round(interY),
            endX: fromItem.endX !== undefined && toItem.endX !== undefined ? Math.round(fromItem.endX + (toItem.endX - fromItem.endX) * ease) : toItem.endX,
            endY: fromItem.endY !== undefined && toItem.endY !== undefined ? Math.round(fromItem.endY + (toItem.endY - fromItem.endY) * ease) : toItem.endY,
          };
        });
        setAnimatedItems(interpolated);
      }

      if (progress >= 1) {
        animPhaseIdxRef.current = nextIdx;
        animStartTimeRef.current = performance.now();
        setCurrentSceneIdx(nextIdx);
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
    setCurrentSceneIdx(0);
    setAnimatedItems(scenes[0]?.items || []);
  };

  const handlePrev = () => {
    pauseAnimation();
    const prev = (currentSceneIdx - 1 + scenes.length) % scenes.length;
    setCurrentSceneIdx(prev);
    setAnimatedItems(scenes[prev]?.items || []);
  };

  const handleNext = () => {
    pauseAnimation();
    const next = (currentSceneIdx + 1) % scenes.length;
    setCurrentSceneIdx(next);
    setAnimatedItems(scenes[next]?.items || []);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950 flex flex-col justify-between text-white select-none animate-in fade-in">
      {/* Top Header */}
      <div className="p-4 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 flex items-center justify-between z-10">
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-blue-400 block">
            Modalità Presentazione per Atleti
          </span>
          <h2 className="text-lg sm:text-xl font-black text-white leading-tight">
            {boardData.title || 'Schema Tattico'}
          </h2>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-xs bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700 font-bold">
            Fase {currentSceneIdx + 1} di {scenes.length}: <span className="text-blue-400">{activeScene.name}</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
            title="Esci dalla modalità presentazione"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Main Big Court Area */}
      <div className="flex-1 w-full h-full p-2 sm:p-6 flex items-center justify-center overflow-hidden">
        <div className="w-full max-w-5xl h-full flex items-center justify-center">
          <CourtCanvas
            items={itemsToRender}
            selectedItemId={null}
            activeTool="select"
            selectedColor="#2563eb"
            courtView={boardData.courtView || 'intero'}
            courtTheme={courtTheme}
            showZoneNumbers={boardData.showZoneNumbers !== false}
            layersState={{
              giocatori: { visible: true, locked: true },
              palla: { visible: true, locked: true },
              movimenti: { visible: true, locked: true },
              traiettorie: { visible: true, locked: true },
              zone: { visible: true, locked: true },
              attrezzatura: { visible: true, locked: true },
              testo: { visible: true, locked: true },
            }}
            onSelectItem={() => {}}
            onUpdateItems={() => {}}
            onItemChange={() => {}}
            readOnly={true}
          />
        </div>
      </div>

      {/* Bottom Large Presentation Controls Bar */}
      <div className="p-4 bg-slate-900/90 backdrop-blur-md border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 z-10">
        {/* Phase Description Banner */}
        <div className="text-xs sm:text-sm text-slate-300 max-w-xl text-center sm:text-left">
          {activeScene.description ? (
            <p className="font-medium bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700/60 inline-block">
              {activeScene.description}
            </p>
          ) : (
            <p className="text-slate-500 italic">Nessuna nota descrittiva per questa fase.</p>
          )}
        </div>

        {/* Large Media Controls */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-950 p-1.5 rounded-2xl border border-slate-800 gap-1">
            <button
              type="button"
              onClick={handlePrev}
              disabled={scenes.length <= 1}
              className="p-2.5 rounded-xl hover:bg-slate-800 text-slate-300 disabled:opacity-30 transition"
              title="Fase precedente"
            >
              <SkipBack size={20} />
            </button>

            {!isPlaying ? (
              <button
                type="button"
                onClick={startAnimation}
                disabled={scenes.length <= 1}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm transition flex items-center gap-2 shadow-lg shadow-emerald-600/30"
              >
                <Play size={20} />
                <span>AVVIA</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={pauseAnimation}
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm transition flex items-center gap-2 shadow-lg shadow-amber-500/30"
              >
                <Pause size={20} />
                <span>PAUSA</span>
              </button>
            )}

            <button
              type="button"
              onClick={stopAnimation}
              disabled={scenes.length <= 1}
              className="p-2.5 rounded-xl hover:bg-slate-800 text-slate-300 disabled:opacity-30 transition"
              title="Stop"
            >
              <Square size={18} />
            </button>

            <button
              type="button"
              onClick={handleNext}
              disabled={scenes.length <= 1}
              className="p-2.5 rounded-xl hover:bg-slate-800 text-slate-300 disabled:opacity-30 transition"
              title="Fase successiva"
            >
              <SkipForward size={20} />
            </button>
          </div>

          {/* Speed Selector */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-bold">
            {[0.5, 1, 1.5, 2].map((spd) => (
              <button
                key={spd}
                type="button"
                onClick={() => setPlaybackSpeed(spd)}
                className={`px-2 py-1 rounded-lg transition ${
                  playbackSpeed === spd ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                {spd}x
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
