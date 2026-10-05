import React, { useState } from 'react';
import {
  BoardItem,
  TacticalLayer,
  RuoloAtleta,
  ArrowTacticalType,
  BallTacticalAction,
  ZoneTacticalType,
  ZoneShape,
} from '../../types';
import {
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Sliders,
  Layers,
  User,
  Trash2,
  Copy,
  ChevronDown,
  X,
  Type,
  Square,
  ArrowRight,
  Volleyball,
  RotateCw,
} from 'lucide-react';

interface PropertiesPanelRightProps {
  selectedItem: BoardItem | null;
  onUpdateSelectedItem: (item: BoardItem) => void;
  onDeleteSelectedItem: () => void;
  onDuplicateSelectedItem: () => void;
  layersState: Record<TacticalLayer, { visible: boolean; locked: boolean }>;
  onToggleLayerVisibility: (layer: TacticalLayer) => void;
  onToggleLayerLock: (layer: TacticalLayer) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

const ROLES: RuoloAtleta[] = [
  'Palleggiatore',
  'Opposto',
  'Schiacciatore',
  'Centrale',
  'Libero',
  'Universale',
];

const ARROW_TYPES: { id: ArrowTacticalType; label: string }[] = [
  { id: 'movimento', label: 'Movimento Atleta' },
  { id: 'movimento_previsto', label: 'Movimento Previsto' },
  { id: 'traiettoria_palla', label: 'Traiettoria Palla' },
  { id: 'copertura', label: 'Copertura' },
  { id: 'spostamento_difensivo', label: 'Spostamento Difensivo' },
];

const BALL_ACTIONS: { id: BallTacticalAction; label: string }[] = [
  { id: 'posizione', label: 'Posizione Statica' },
  { id: 'passaggio', label: 'Passaggio / Appoggio' },
  { id: 'ricezione', label: 'Ricezione' },
  { id: 'alzata', label: 'Alzata' },
  { id: 'attacco', label: 'Attacco / Schiacciata' },
  { id: 'battuta', label: 'Battuta / Servizio' },
];

const ZONE_TYPES: { id: ZoneTacticalType; label: string }[] = [
  { id: 'battuta', label: 'Zona Battuta' },
  { id: 'attacco', label: 'Zona Attacco' },
  { id: 'difesa', label: 'Zona Difesa' },
  { id: 'copertura', label: 'Zona Copertura' },
  { id: 'obiettivo', label: 'Zona Bersaglio / Obiettivo' },
];

export const PropertiesPanelRight: React.FC<PropertiesPanelRightProps> = ({
  selectedItem,
  onUpdateSelectedItem,
  onDeleteSelectedItem,
  onDuplicateSelectedItem,
  layersState,
  onToggleLayerVisibility,
  onToggleLayerLock,
  isOpenMobile,
  onCloseMobile,
}) => {
  const [activeTab, setActiveTab] = useState<'properties' | 'layers'>('properties');

  const content = (
    <div className="flex flex-col h-full bg-slate-900 border-l border-slate-800 text-white w-72 select-none">
      {/* Header Tabs */}
      <div className="p-2 border-b border-slate-800 flex items-center justify-between gap-1 bg-slate-950/40">
        <div className="flex rounded-xl bg-slate-800/80 p-1 flex-1 gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('properties')}
            className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              activeTab === 'properties'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sliders size={14} />
            <span>Proprietà</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('layers')}
            className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              activeTab === 'layers'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers size={14} />
            <span>Livelli</span>
          </button>
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

      {/* Main Tab Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
        {/* TAB 1: PROPERTIES */}
        {activeTab === 'properties' && (
          <>
            {!selectedItem ? (
              <div className="py-16 text-center text-slate-500 space-y-2">
                <Sliders size={32} className="mx-auto text-slate-700 opacity-60" />
                <p className="font-semibold text-xs text-slate-400">Nessun elemento selezionato</p>
                <p className="text-[11px] text-slate-600 max-w-[200px] mx-auto">
                  Clicca su un giocatore, una palla, una freccia o una zona per modificarne le proprietà.
                </p>
              </div>
            ) : (
              <div className="space-y-4 animate-in fade-in">
                {/* Element Type Banner */}
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-blue-600/30 text-blue-400 border border-blue-500/40 flex items-center justify-center">
                      {selectedItem.type === 'player' ? (
                        <User size={14} />
                      ) : selectedItem.type === 'ball' ? (
                        <Volleyball size={14} />
                      ) : selectedItem.type === 'arrow' || selectedItem.type === 'curved_arrow' ? (
                        <ArrowRight size={14} />
                      ) : selectedItem.type === 'tactical_label' ? (
                        <Type size={14} />
                      ) : (
                        <Square size={14} />
                      )}
                    </div>
                    <span className="font-bold text-slate-200 capitalize">
                      {selectedItem.type.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={onDuplicateSelectedItem}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                      title="Duplica"
                    >
                      <Copy size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={onDeleteSelectedItem}
                      className="p-1.5 rounded-lg bg-red-950/60 hover:bg-red-900 text-red-300"
                      title="Elimina"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                {/* PROPRIETÀ GIOCATORE */}
                {(selectedItem.type === 'player' || selectedItem.type === 'opponent_player') && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                          Numero Maglia
                        </label>
                        <input
                          type="text"
                          value={selectedItem.number !== undefined ? String(selectedItem.number) : selectedItem.label || ''}
                          onChange={(e) =>
                            onUpdateSelectedItem({
                              ...selectedItem,
                              number: e.target.value,
                              label: e.target.value,
                            })
                          }
                          className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono font-bold text-center outline-none focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                          Dimensione (px)
                        </label>
                        <input
                          type="number"
                          min={14}
                          max={35}
                          value={selectedItem.size || 20}
                          onChange={(e) =>
                            onUpdateSelectedItem({
                              ...selectedItem,
                              size: Number(e.target.value) || 20,
                            })
                          }
                          className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono text-center outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                        Nome Atleta
                      </label>
                      <input
                        type="text"
                        placeholder="Es. Mario Rossi"
                        value={selectedItem.playerName || ''}
                        onChange={(e) =>
                          onUpdateSelectedItem({
                            ...selectedItem,
                            playerName: e.target.value,
                          })
                        }
                        className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white outline-none focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                        Ruolo Tattico
                      </label>
                      <select
                        value={selectedItem.role || 'Schiacciatore'}
                        onChange={(e) =>
                          onUpdateSelectedItem({
                            ...selectedItem,
                            role: e.target.value as RuoloAtleta,
                            isLibero: e.target.value === 'Libero',
                            color: e.target.value === 'Libero' ? '#f59e0b' : selectedItem.color,
                          })
                        }
                        className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white outline-none focus:border-blue-500"
                      >
                        {ROLES.map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                        Orientamento Corpo ({selectedItem.facingAngle || 0}°)
                      </label>
                      <input
                        type="range"
                        min={0}
                        max={360}
                        step={15}
                        value={selectedItem.facingAngle || 0}
                        onChange={(e) =>
                          onUpdateSelectedItem({
                            ...selectedItem,
                            facingAngle: Number(e.target.value),
                          })
                        }
                        className="w-full accent-blue-500 cursor-pointer"
                      />
                      <div className="flex justify-between text-[9px] text-slate-500">
                        <span>Rete (0°)</span>
                        <span>Fondo (180°)</span>
                        <span>360°</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* PROPRIETÀ FRECCIA */}
                {(selectedItem.type === 'arrow' ||
                  selectedItem.type === 'curved_arrow' ||
                  selectedItem.type === 'dashed_line' ||
                  selectedItem.type === 'ball_trajectory') && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                        Tipologia Movimento
                      </label>
                      <select
                        value={selectedItem.arrowType || 'movimento'}
                        onChange={(e) =>
                          onUpdateSelectedItem({
                            ...selectedItem,
                            arrowType: e.target.value as ArrowTacticalType,
                          })
                        }
                        className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white outline-none focus:border-blue-500"
                      >
                        {ARROW_TYPES.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                          Spessore Tratto
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={10}
                          value={selectedItem.strokeWidth || 3.5}
                          onChange={(e) =>
                            onUpdateSelectedItem({
                              ...selectedItem,
                              strokeWidth: Number(e.target.value) || 3.5,
                            })
                          }
                          className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-center"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                          Tratteggio
                        </label>
                        <button
                          type="button"
                          onClick={() =>
                            onUpdateSelectedItem({
                              ...selectedItem,
                              dashed: !selectedItem.dashed,
                            })
                          }
                          className={`w-full py-1.5 rounded-lg border font-bold text-xs transition ${
                            selectedItem.dashed
                              ? 'bg-blue-600/30 border-blue-500 text-blue-300'
                              : 'bg-slate-800 border-slate-700 text-slate-400'
                          }`}
                        >
                          {selectedItem.dashed ? 'Tratteggiata' : 'Continua'}
                        </button>
                      </div>
                    </div>

                    <div>
                      <button
                        type="button"
                        onClick={() => {
                          if (selectedItem.controlX === undefined) {
                            // Turn into curved arrow
                            onUpdateSelectedItem({
                              ...selectedItem,
                              type: 'curved_arrow',
                              controlX: Math.round(selectedItem.x + ((selectedItem.endX || selectedItem.x + 60) - selectedItem.x) / 2),
                              controlY: Math.round(selectedItem.y - 30),
                            });
                          } else {
                            // Reset to straight
                            onUpdateSelectedItem({
                              ...selectedItem,
                              type: 'arrow',
                              controlX: undefined,
                              controlY: undefined,
                            });
                          }
                        }}
                        className="w-full py-2 bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 rounded-lg font-semibold text-[11px] transition flex items-center justify-center gap-1.5"
                      >
                        <RotateCw size={13} />
                        <span>{selectedItem.controlX !== undefined ? 'Converti in Freccia Retta' : 'Aggiungi Curvatura (Curva)'}</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* PROPRIETÀ PALLA */}
                {selectedItem.type === 'ball' && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                        Azione Palla
                      </label>
                      <select
                        value={selectedItem.ballAction || 'posizione'}
                        onChange={(e) =>
                          onUpdateSelectedItem({
                            ...selectedItem,
                            ballAction: e.target.value as BallTacticalAction,
                          })
                        }
                        className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white outline-none focus:border-blue-500"
                      >
                        {BALL_ACTIONS.map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {/* PROPRIETÀ ZONA */}
                {(selectedItem.type === 'attack_zone' ||
                  selectedItem.type === 'defense_zone' ||
                  selectedItem.type === 'coverage_area') && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                        Tipo Zona
                      </label>
                      <select
                        value={selectedItem.zoneType || 'attacco'}
                        onChange={(e) =>
                          onUpdateSelectedItem({
                            ...selectedItem,
                            zoneType: e.target.value as ZoneTacticalType,
                            text: e.target.value === 'battuta' ? 'Zona Battuta' : e.target.value === 'difesa' ? 'Zona Difesa' : 'Zona Attacco',
                          })
                        }
                        className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white"
                      >
                        {ZONE_TYPES.map((zt) => (
                          <option key={zt.id} value={zt.id}>
                            {zt.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                        Etichetta / Nome Zona
                      </label>
                      <input
                        type="text"
                        value={selectedItem.text || ''}
                        onChange={(e) =>
                          onUpdateSelectedItem({
                            ...selectedItem,
                            text: e.target.value,
                          })
                        }
                        className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                          Forma
                        </label>
                        <select
                          value={selectedItem.zoneShape || 'rettangolare'}
                          onChange={(e) =>
                            onUpdateSelectedItem({
                              ...selectedItem,
                              zoneShape: e.target.value as ZoneShape,
                            })
                          }
                          className="w-full px-2 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-[11px]"
                        >
                          <option value="rettangolare">Rettangolare</option>
                          <option value="circolare">Circolare</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                          Opacità ({Math.round((selectedItem.opacity !== undefined ? selectedItem.opacity : 0.3) * 100)}%)
                        </label>
                        <input
                          type="range"
                          min={0.1}
                          max={0.8}
                          step={0.05}
                          value={selectedItem.opacity !== undefined ? selectedItem.opacity : 0.3}
                          onChange={(e) =>
                            onUpdateSelectedItem({
                              ...selectedItem,
                              opacity: Number(e.target.value),
                            })
                          }
                          className="w-full accent-blue-500 cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* PROPRIETÀ TESTO */}
                {selectedItem.type === 'tactical_label' && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                        Testo Annotazione
                      </label>
                      <input
                        type="text"
                        value={selectedItem.text || ''}
                        onChange={(e) =>
                          onUpdateSelectedItem({
                            ...selectedItem,
                            text: e.target.value,
                          })
                        }
                        className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                          Dimensione Font
                        </label>
                        <input
                          type="number"
                          min={10}
                          max={36}
                          value={selectedItem.fontSize || 14}
                          onChange={(e) =>
                            onUpdateSelectedItem({
                              ...selectedItem,
                              fontSize: Number(e.target.value) || 14,
                            })
                          }
                          className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-center"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                          Grassetto
                        </label>
                        <button
                          type="button"
                          onClick={() =>
                            onUpdateSelectedItem({
                              ...selectedItem,
                              isBold: selectedItem.isBold === false ? true : false,
                            })
                          }
                          className={`w-full py-1.5 rounded-lg border font-bold text-xs ${
                            selectedItem.isBold !== false
                              ? 'bg-blue-600/30 border-blue-500 text-blue-300'
                              : 'bg-slate-800 border-slate-700 text-slate-400'
                          }`}
                        >
                          {selectedItem.isBold !== false ? 'Attivo' : 'Normale'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Coordinate Posizione X & Y */}
                <div className="pt-2 border-t border-slate-800 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Coordinate Campo (X, Y)
                  </span>
                  <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
                    <div className="bg-slate-800/80 px-2 py-1 rounded-lg text-slate-300">
                      X: <span className="font-bold text-white">{selectedItem.x}</span>
                    </div>
                    <div className="bg-slate-800/80 px-2 py-1 rounded-lg text-slate-300">
                      Y: <span className="font-bold text-white">{selectedItem.y}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* TAB 2: LAYERS (Point 13) */}
        {activeTab === 'layers' && (
          <div className="space-y-2 animate-in fade-in">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block px-1">
              Livelli di Visualizzazione
            </span>
            <p className="text-[11px] text-slate-500 px-1 pb-1">
              Gestisci la visibilità e il blocco dei vari elementi tattici della lavagna.
            </p>

            {(
              [
                { id: 'giocatori' as TacticalLayer, label: 'Giocatori e Atleti' },
                { id: 'palla' as TacticalLayer, label: 'Palloni da Pallavolo' },
                { id: 'movimenti' as TacticalLayer, label: 'Frecce di Movimento' },
                { id: 'traiettorie' as TacticalLayer, label: 'Traiettorie Palla' },
                { id: 'zone' as TacticalLayer, label: 'Zone Evidenziate' },
                { id: 'attrezzatura' as TacticalLayer, label: 'Attrezzatura (Muri, Coni)' },
                { id: 'testo' as TacticalLayer, label: 'Testi e Disegni Liberi' },
              ]
            ).map((layer) => {
              const state = layersState[layer.id] || { visible: true, locked: false };
              return (
                <div
                  key={layer.id}
                  className="p-2.5 rounded-xl bg-slate-800/70 border border-slate-750 flex items-center justify-between transition hover:bg-slate-800"
                >
                  <span className="font-semibold text-slate-200 text-xs">{layer.label}</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => onToggleLayerVisibility(layer.id)}
                      className={`p-1.5 rounded-lg transition ${
                        state.visible
                          ? 'text-blue-400 hover:bg-slate-700'
                          : 'text-slate-600 hover:bg-slate-700'
                      }`}
                      title={state.visible ? 'Nascondi livello' : 'Mostra livello'}
                    >
                      {state.visible ? <Eye size={15} /> : <EyeOff size={15} />}
                    </button>
                    <button
                      type="button"
                      onClick={() => onToggleLayerLock(layer.id)}
                      className={`p-1.5 rounded-lg transition ${
                        state.locked
                          ? 'text-amber-400 hover:bg-slate-700'
                          : 'text-slate-600 hover:bg-slate-700'
                      }`}
                      title={state.locked ? 'Sblocca livello' : 'Blocca livello'}
                    >
                      {state.locked ? <Lock size={15} /> : <Unlock size={15} />}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <div className="hidden lg:flex flex-shrink-0 h-full">{content}</div>

      {/* Mobile / Tablet Drawer Flyout */}
      {isOpenMobile && (
        <div className="lg:hidden fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm animate-in fade-in flex justify-end">
          <div className="w-80 max-w-[85vw] h-full shadow-2xl animate-in slide-in-from-right">
            {content}
          </div>
          <div className="flex-1" onClick={onCloseMobile} />
        </div>
      )}
    </>
  );
};
