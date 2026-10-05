import React, { useState } from 'react';
import {
  SistemaDiGioco,
  PosizioneCampo,
  RuoloAtleta,
  BoardItem,
} from '../../types';
import {
  RotateCw,
  X,
  Check,
  Shield,
  Users,
  ChevronRight,
  Info,
} from 'lucide-react';
import {
  get51PositionsForRotation,
  get42PositionsForRotation,
  REGULATORY_ZONE_COORDS,
} from '../../utils/volleyballTactics';

interface RotationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentRotation: number; // 1 - 6
  currentSystem: SistemaDiGioco; // '5-1' | '6-2' | '4-2'
  currentItems: BoardItem[];
  onApplyRotation: (newRotation: number, system: SistemaDiGioco, mode: 'ricezione' | 'transizione') => void;
}

export const RotationsModal: React.FC<RotationsModalProps> = ({
  isOpen,
  onClose,
  currentRotation,
  currentSystem,
  currentItems,
  onApplyRotation,
}) => {
  const [selectedRotation, setSelectedRotation] = useState<number>(currentRotation || 1);
  const [selectedSystem, setSelectedSystem] = useState<SistemaDiGioco>(currentSystem || '5-1');
  const [phaseMode, setPhaseMode] = useState<'ricezione' | 'transizione'>('ricezione');

  if (!isOpen) return null;

  const positionsMap =
    selectedSystem === '4-2'
      ? get42PositionsForRotation(selectedRotation)
      : get51PositionsForRotation(selectedRotation);

  const handleApply = () => {
    onApplyRotation(selectedRotation, selectedSystem, phaseMode);
    onClose();
  };

  const handleNextRotation = () => {
    const next = (selectedRotation % 6) + 1;
    setSelectedRotation(next);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full text-white shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600/30 text-blue-400 border border-blue-500/40 flex items-center justify-center">
              <RotateCw size={20} />
            </div>
            <div>
              <h3 className="font-black text-base text-white">Sistema di Rotazione (P1 - P6)</h3>
              <p className="text-xs text-slate-400">Disposizione automatica regolamentare sul campo</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 overflow-y-auto">
          {/* Sistema di Gioco Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Sistema di Gioco
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['5-1', '6-2', '4-2'] as SistemaDiGioco[]).map((sys) => (
                <button
                  key={sys}
                  type="button"
                  onClick={() => setSelectedSystem(sys)}
                  className={`py-2 px-3 rounded-xl border text-xs font-black transition ${
                    selectedSystem === sys
                      ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-600/30'
                      : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750'
                  }`}
                >
                  Sistema {sys}
                </button>
              ))}
            </div>
          </div>

          {/* Rotazione 1 to 6 Buttons */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Rotazione Attiva: <span className="text-blue-400">P{selectedRotation}</span>
              </label>
              <button
                type="button"
                onClick={handleNextRotation}
                className="text-xs text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1 underline"
              >
                <span>Passa alla successiva</span>
                <ChevronRight size={14} />
              </button>
            </div>

            <div className="grid grid-cols-6 gap-2">
              {[1, 2, 3, 4, 5, 6].map((rot) => (
                <button
                  key={rot}
                  type="button"
                  onClick={() => setSelectedRotation(rot)}
                  className={`py-3 rounded-2xl border font-black text-sm transition flex flex-col items-center justify-center gap-0.5 ${
                    selectedRotation === rot
                      ? 'bg-gradient-to-tr from-blue-600 to-indigo-600 text-white border-blue-400 shadow-lg shadow-blue-600/30 scale-105'
                      : 'bg-slate-800/80 hover:bg-slate-750 text-slate-300 border-slate-700'
                  }`}
                >
                  <span className="text-xs text-slate-400 font-normal">Rotaz.</span>
                  <span>P{rot}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Phase Mode: Ricezione vs Transizione / Post-battuta */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Fase di Gioco
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPhaseMode('ricezione')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-2 ${
                  phaseMode === 'ricezione'
                    ? 'bg-blue-600 text-white border-blue-500'
                    : 'bg-slate-800 border-slate-700 text-slate-300'
                }`}
              >
                <span>Fase Ricezione (Pre-Battuta)</span>
              </button>
              <button
                type="button"
                onClick={() => setPhaseMode('transizione')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-2 ${
                  phaseMode === 'transizione'
                    ? 'bg-emerald-600 text-white border-emerald-500'
                    : 'bg-slate-800 border-slate-700 text-slate-300'
                }`}
              >
                <span>Transizione / Cambio Post-Battuta</span>
              </button>
            </div>
          </div>

          {/* Live Zone Map Preview of this rotation */}
          <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 space-y-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Disposizione Giocatori in Campo per P{selectedRotation}
            </span>
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2 bg-slate-800/80 rounded-xl border border-slate-700">
                <span className="text-[10px] text-slate-400 block font-bold">Posto 4 (Attacco Sx)</span>
                <strong className="text-blue-400 text-sm">{positionsMap.P4}</strong>
              </div>
              <div className="p-2 bg-slate-800/80 rounded-xl border border-slate-700">
                <span className="text-[10px] text-slate-400 block font-bold">Posto 3 (Centro)</span>
                <strong className="text-emerald-400 text-sm">{positionsMap.P3}</strong>
              </div>
              <div className="p-2 bg-slate-800/80 rounded-xl border border-slate-700">
                <span className="text-[10px] text-slate-400 block font-bold">Posto 2 (Attacco Dx)</span>
                <strong className="text-purple-400 text-sm">{positionsMap.P2}</strong>
              </div>
              <div className="p-2 bg-slate-800/80 rounded-xl border border-slate-700">
                <span className="text-[10px] text-slate-400 block font-bold">Posto 5 (Difesa Sx)</span>
                <strong className="text-blue-400 text-sm">{positionsMap.P5}</strong>
              </div>
              <div className="p-2 bg-slate-800/80 rounded-xl border border-slate-700">
                <span className="text-[10px] text-slate-400 block font-bold">Posto 6 (Centro Dietro)</span>
                <strong className="text-amber-400 text-sm">{positionsMap.P6}</strong>
              </div>
              <div className="p-2 bg-slate-800/80 rounded-xl border border-slate-700">
                <span className="text-[10px] text-slate-400 block font-bold">Posto 1 (Battuta / Dx)</span>
                <strong className="text-indigo-400 text-sm">{positionsMap.P1}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-800 flex items-center justify-end gap-2 bg-slate-950/60">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold text-xs transition"
          >
            Annulla
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-xs shadow-md shadow-blue-600/30 transition flex items-center gap-1.5"
          >
            <Check size={16} />
            <span>Applica Rotazione P{selectedRotation}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
